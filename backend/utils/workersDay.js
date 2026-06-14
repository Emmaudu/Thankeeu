// Workers' Day (International Workers' Day / Labour Day) by country.
// May 1st is observed as Workers'/Labour Day in the vast majority of countries,
// including all of Thankeeu's primary African markets (Nigeria, Kenya, Ghana,
// South Africa, Egypt, Ethiopia, etc).
//
// A small number of countries observe Labour Day on a different date —
// override those here. Anything not listed defaults to May 1st.
const WORKERS_DAY_OVERRIDES = {
  'United States': { month: 9, dayOfWeek: 1, occurrence: 1 }, // 1st Monday of September
  'Canada':        { month: 9, dayOfWeek: 1, occurrence: 1 }, // 1st Monday of September
  'United Kingdom':{ month: 5, dayOfWeek: 1, occurrence: 1 }, // Early May Bank Holiday (1st Monday of May)
};

/**
 * Returns the YYYY-MM-DD date of Workers'/Labour Day for the given country and year.
 * Defaults to May 1st for countries not in the overrides list.
 */
function getWorkersDayDate(country, year = new Date().getFullYear()) {
  const override = WORKERS_DAY_OVERRIDES[country];
  if (!override) {
    return `${year}-05-01`;
  }

  // Calculate Nth weekday of the month (e.g. 1st Monday of September)
  const { month, dayOfWeek, occurrence } = override;
  const firstOfMonth = new Date(year, month - 1, 1);
  const firstWeekday = firstOfMonth.getDay();
  let day = 1 + ((dayOfWeek - firstWeekday + 7) % 7) + (occurrence - 1) * 7;
  const d = new Date(year, month - 1, day);
  return d.toISOString().split('T')[0];
}

module.exports = { getWorkersDayDate, WORKERS_DAY_OVERRIDES };
