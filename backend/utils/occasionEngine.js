// ─────────────────────────────────────────────────────────────────────────────
// Occasion Engine — computes occasion dates directly from company_members
// (the Team Members page table), which is the single source of truth for
// Thankeeu's automation. Replaces the old occasion_members-driven cron logic.
// ─────────────────────────────────────────────────────────────────────────────
const { getWorkersDayDate } = require('./workersDay');

// Returns this year's MM-DD recurrence of a stored date (DOB, hire date, etc.)
// e.g. date_of_birth = '1992-05-15' → this year's '2026-05-15'
// Leap day (Feb 29) → skipped in non-leap years to avoid rolling to Mar 1
function recurringThisYear(dateStr, year) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d)) return null;
  const month = d.getMonth() + 1; // 1-based
  const day   = d.getDate();
  // Skip Feb 29 in non-leap years — otherwise JS rolls it to Mar 1
  if (month === 2 && day === 29) {
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (!isLeap) return null; // person's birthday doesn't exist this year
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
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
