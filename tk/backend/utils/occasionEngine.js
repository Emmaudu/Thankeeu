// ─────────────────────────────────────────────────────────────────────────────
// Occasion Engine — computes occasion dates directly from company_members
// (the Team Members page table), which is the single source of truth for
// Thankeeu's automation. Replaces the old occasion_members-driven cron logic.
// ─────────────────────────────────────────────────────────────────────────────
const { getWorkersDayDate } = require('./workersDay');

// Returns this year's MM-DD recurrence of a stored date (DOB, hire date, etc.)
// e.g. date_of_birth = '1992-05-15' → this year's '2026-05-15'
//
// Special case: Feb 29 (leap day). new Date('2026-02-29T00:00:00') silently
// rolls over to March 1 in non-leap years — so without this guard, someone
// born on Feb 29 would get notified/delivered on March 1 every non-leap
// year, which is incorrect. Instead, we observe Feb 29 birthdays on Feb 28
// in non-leap years (the conventional approach), and on Feb 29 itself in
// leap years.
function isLeapYear(y) {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

function recurringThisYear(dateStr, year) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  if (mm === 2 && dd === 29 && !isLeapYear(year)) {
    return `${year}-02-28`;
  }
  return `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

// Builds the list of occasions a member is eligible for THIS YEAR, with the
// computed occasion_date. Each entry has: { occasionName, occasionDate, isRecurring }
// occasionName matches occasion_types.name (birthday, work_anniversary, etc.)
function getMemberOccasions(member, company, year = new Date().getFullYear()) {
  const occasions = [];
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ── Birthday — recurring yearly from date_of_birth ──
  if (member.date_of_birth) {
    const d = recurringThisYear(member.date_of_birth, year);
    if (d) occasions.push({ occasionName: 'birthday', occasionDate: d, isRecurring: true });
  }

  // ── Work Anniversary — recurring yearly from resumption_date ──
  if (member.resumption_date) {
    const d = recurringThisYear(member.resumption_date, year);
    if (d) occasions.push({ occasionName: 'work_anniversary', occasionDate: d, isRecurring: true });

    // ── New Hire — one-time, only if resumption_date is today or in the future ──
    const startDate = new Date(member.resumption_date + 'T00:00:00');
    if (!isNaN(startDate) && startDate >= today) {
      occasions.push({ occasionName: 'new_hire', occasionDate: member.resumption_date, isRecurring: false });
    }
  }

  // ── Women's Day / Men's Day — recurring, gender-filtered ──
  if (member.gender === 'female') {
    occasions.push({ occasionName: 'womens_day', occasionDate: `${year}-03-08`, isRecurring: true });
    occasions.push({ occasionName: 'mothers_day', occasionDate: mothersDay(year), isRecurring: true });
  }
  if (member.gender === 'male') {
    occasions.push({ occasionName: 'mens_day', occasionDate: `${year}-11-19`, isRecurring: true });
    occasions.push({ occasionName: 'fathers_day', occasionDate: fathersDay(year), isRecurring: true });
  }

  // ── Valentine's Day — recurring, everyone ──
  occasions.push({ occasionName: 'valentines_day', occasionDate: `${year}-02-14`, isRecurring: true });

  // ── Workers' Day — recurring, everyone, country-aware ──
  occasions.push({ occasionName: 'workers_day', occasionDate: getWorkersDayDate(company?.country, year), isRecurring: true });

  // ── Promotion — one-time, from promotion_date ──
  if (member.promotion_date) {
    occasions.push({ occasionName: 'promotion', occasionDate: member.promotion_date, isRecurring: false });
  }

  // ── Leaving / Farewell — one-time, from leaving_date ──
  if (member.leaving_date) {
    occasions.push({ occasionName: 'leaving', occasionDate: member.leaving_date, isRecurring: false });
  }

  return occasions;
}

// 2nd Sunday of May (Mother's Day, US/Nigeria convention)
function mothersDay(year) {
  return nthWeekdayOfMonth(year, 5, 0, 2); // May, Sunday(0), 2nd occurrence
}
// 3rd Sunday of June (Father's Day)
function fathersDay(year) {
  return nthWeekdayOfMonth(year, 6, 0, 3); // June, Sunday(0), 3rd occurrence
}

function nthWeekdayOfMonth(year, month, dayOfWeek, occurrence) {
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = firstOfMonth.getDay();
  const day = 1 + ((dayOfWeek - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  const d = new Date(year, month - 1, day);
  return d.toISOString().split('T')[0];
}

module.exports = { getMemberOccasions, recurringThisYear, mothersDay, fathersDay };
