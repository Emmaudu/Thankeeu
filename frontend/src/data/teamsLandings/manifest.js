/**
 * Thankeeu for Teams landing pages: employee recognition and celebration for
 * HR teams, two pages per country with different search intent.
 *
 *   a = recognition platform / software (commercial head and mid tail terms)
 *   b = automated birthday, work anniversary and leaving cards for staff
 *       (the occasion led terms a small brand can win)
 * Germany 'b' is written in German.
 *
 * Plain data only (imported by prerender and sitemap scripts).
 */
// [key, path, lang, anchor]
const ROWS = [
  ['teams-us-a', '/employee-recognition-platform-us', 'en', 'Employee recognition platform US'],
  ['teams-us-b', '/automated-employee-birthday-cards-us', 'en', 'Automated employee birthday cards US'],
  ['teams-uk-a', '/staff-recognition-platform-uk', 'en', 'Staff recognition platform UK'],
  ['teams-uk-b', '/staff-birthday-and-leaving-cards-uk', 'en', 'Staff birthday and leaving cards UK'],
  ['teams-canada-a', '/employee-recognition-software-canada', 'en', 'Employee recognition software Canada'],
  ['teams-canada-b', '/work-anniversary-and-birthday-automation-canada', 'en', 'Work anniversary and birthday automation Canada'],
  ['teams-germany-a', '/employee-recognition-software-germany', 'en', 'Employee recognition software Germany'],
  ['teams-germany-b', '/mitarbeiter-wertschaetzung-tool', 'de', 'Mitarbeiterwertschätzungstool'],
  ['teams-mauritius-a', '/employee-recognition-mauritius', 'en', 'Employee recognition Mauritius'],
  ['teams-mauritius-b', '/staff-celebration-software-mauritius', 'en', 'Staff celebration software Mauritius'],
];

export const TEAMS_MANIFEST = ROWS.map(([key, path, lang, anchor]) => {
  const [, country, variant] = key.split('-');
  return { key, path, lang, anchor, country, variant, occasion: 'teams' };
});
export const teamsByKey = Object.fromEntries(TEAMS_MANIFEST.map(m => [m.key, m]));

const REGION = { us: 'US', uk: 'GB', canada: 'CA', germany: 'DE', mauritius: 'MU' };
export const teamsHreflang = (m) => TEAMS_MANIFEST
  .filter(x => x.variant === m.variant)
  .map(x => ({ hreflang: `${x.lang}-${REGION[x.country]}`, path: x.path }));
