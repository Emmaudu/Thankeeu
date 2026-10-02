/**
 * Occasion × country landing pages: the light index.
 *
 * Every page's URL, language and link text lives here, so routes, the
 * sitemap, prerendering and internal links can be built without loading the
 * page copy (pages/*.js, loaded per occasion when a page opens).
 *
 * Variant 'a' and 'b' of the same occasion target different searches:
 *   group:       a = group ecard / online group card,  b = office card for colleagues
 *   farewell:    a = online farewell card,             b = leaving or goodbye card for a colleague
 *   birthday:    a = online birthday card,             b = birthday card for a colleague
 *   babyshower:  a = online baby shower card,          b = baby shower card for a colleague
 *   anniversary: a = wedding anniversary card,         b = work anniversary card
 * In Germany, the Netherlands, Colombia and France the 'b' page is written in the
 * local language; Australia and France only have farewell and birthday pages; everything else is in English.
 *
 * Plain data only (imported by scripts/prerender.js and generate-sitemap.js).
 */

export const LANDING_COUNTRIES = ['uk', 'us', 'canada', 'germany', 'netherlands', 'colombia', 'mauritius', 'philippines', 'australia', 'france'];
export const LANDING_OCCASIONS = ['group', 'farewell', 'birthday', 'babyshower', 'anniversary'];

// [key, path, lang, anchor text]
const ROWS = [
  // ── Group cards ────────────────────────────────────────────────────────
  ['group-uk-a', '/group-ecard-uk', 'en', 'Group ecards UK'],
  ['group-uk-b', '/office-group-card-uk', 'en', 'Office group cards UK'],
  ['group-us-a', '/group-ecard-us', 'en', 'Group ecards US'],
  ['group-us-b', '/office-group-card-us', 'en', 'Office group cards for coworkers US'],
  ['group-canada-a', '/group-ecard-canada', 'en', 'Group ecards Canada'],
  ['group-canada-b', '/office-group-card-canada', 'en', 'Office group cards Canada'],
  ['group-germany-a', '/online-group-card-germany', 'en', 'Online group cards Germany'],
  ['group-germany-b', '/gruppenkarte-online', 'de', 'Gruppenkarte online'],
  ['group-netherlands-a', '/online-group-card-netherlands', 'en', 'Online group cards Netherlands'],
  ['group-netherlands-b', '/groepskaart-online', 'nl', 'Groepskaart online'],
  ['group-colombia-a', '/online-group-card-colombia', 'en', 'Online group cards Colombia'],
  ['group-colombia-b', '/tarjeta-grupal-online', 'es', 'Tarjeta grupal online'],
  ['group-mauritius-a', '/online-group-card-mauritius', 'en', 'Online group cards Mauritius'],
  ['group-mauritius-b', '/office-group-card-mauritius', 'en', 'Office group cards Mauritius'],
  ['group-philippines-a', '/online-group-card-philippines', 'en', 'Online group cards Philippines'],
  ['group-philippines-b', '/office-group-card-philippines', 'en', 'Office group cards Philippines'],

  // ── Farewell and leaving ───────────────────────────────────────────────
  ['farewell-uk-a', '/online-farewell-card-uk', 'en', 'Online farewell cards UK'],
  ['farewell-uk-b', '/leaving-card-for-colleague-uk', 'en', 'Leaving cards for a colleague UK'],
  ['farewell-us-a', '/online-farewell-card-us', 'en', 'Online farewell cards US'],
  ['farewell-us-b', '/goodbye-card-for-coworker-us', 'en', 'Goodbye cards for a coworker US'],
  ['farewell-canada-a', '/online-farewell-card-canada', 'en', 'Online farewell cards Canada'],
  ['farewell-canada-b', '/going-away-card-canada', 'en', 'Going away cards Canada'],
  ['farewell-germany-a', '/online-farewell-card-germany', 'en', 'Online farewell cards Germany'],
  ['farewell-germany-b', '/abschiedskarte-online', 'de', 'Abschiedskarte online'],
  ['farewell-netherlands-a', '/online-farewell-card-netherlands', 'en', 'Online farewell cards Netherlands'],
  ['farewell-netherlands-b', '/afscheidskaart-online', 'nl', 'Afscheidskaart online'],
  ['farewell-colombia-a', '/online-farewell-card-colombia', 'en', 'Online farewell cards Colombia'],
  ['farewell-colombia-b', '/tarjeta-de-despedida-online', 'es', 'Tarjeta de despedida online'],
  ['farewell-mauritius-a', '/online-farewell-card-mauritius', 'en', 'Online farewell cards Mauritius'],
  ['farewell-mauritius-b', '/leaving-card-for-colleague-mauritius', 'en', 'Leaving cards for a colleague Mauritius'],
  ['farewell-philippines-a', '/online-farewell-card-philippines', 'en', 'Online farewell cards Philippines'],
  ['farewell-philippines-b', '/despedida-card-philippines', 'en', 'Despedida cards Philippines'],
  ['farewell-australia-a', '/online-farewell-card-australia', 'en', 'Online farewell cards Australia'],
  ['farewell-australia-b', '/farewell-card-for-workmate-australia', 'en', 'Farewell cards for a workmate Australia'],
  ['farewell-france-a', '/online-farewell-card-france', 'en', 'Online farewell cards France'],
  ['farewell-france-b', '/carte-de-depart-en-ligne', 'fr', 'Carte de départ en ligne'],

  // ── Birthday ──────────────────────────────────────────────────────────
  ['birthday-uk-a', '/birthday-ecard-uk', 'en', 'Birthday ecards UK'],
  ['birthday-uk-b', '/birthday-card-for-colleague-uk', 'en', 'Birthday cards for a colleague UK'],
  ['birthday-us-a', '/online-birthday-card-us', 'en', 'Online birthday cards US'],
  ['birthday-us-b', '/birthday-card-for-coworker-us', 'en', 'Birthday cards for a coworker US'],
  ['birthday-canada-a', '/online-birthday-card-canada', 'en', 'Online birthday cards Canada'],
  ['birthday-canada-b', '/birthday-card-for-coworker-canada', 'en', 'Birthday cards for a coworker Canada'],
  ['birthday-germany-a', '/online-birthday-card-germany', 'en', 'Online birthday cards Germany'],
  ['birthday-germany-b', '/geburtstagskarte-online', 'de', 'Geburtstagskarte online'],
  ['birthday-netherlands-a', '/online-birthday-card-netherlands', 'en', 'Online birthday cards Netherlands'],
  ['birthday-netherlands-b', '/verjaardagskaart-online', 'nl', 'Verjaardagskaart online'],
  ['birthday-colombia-a', '/online-birthday-card-colombia', 'en', 'Online birthday cards Colombia'],
  ['birthday-colombia-b', '/tarjeta-de-cumpleanos-online', 'es', 'Tarjeta de cumpleaños online'],
  ['birthday-mauritius-a', '/online-birthday-card-mauritius', 'en', 'Online birthday cards Mauritius'],
  ['birthday-mauritius-b', '/birthday-card-for-colleague-mauritius', 'en', 'Birthday cards for a colleague Mauritius'],
  ['birthday-philippines-a', '/online-birthday-card-philippines', 'en', 'Online birthday cards Philippines'],
  ['birthday-philippines-b', '/birthday-card-for-officemate-philippines', 'en', 'Birthday cards for an officemate Philippines'],
  ['birthday-australia-a', '/online-birthday-card-australia', 'en', 'Online birthday cards Australia'],
  ['birthday-australia-b', '/birthday-card-for-workmate-australia', 'en', 'Birthday cards for a workmate Australia'],
  ['birthday-france-a', '/online-birthday-card-france', 'en', 'Online birthday cards France'],
  ['birthday-france-b', '/carte-anniversaire-en-ligne', 'fr', 'Carte d’anniversaire en ligne'],

  // ── Baby shower ───────────────────────────────────────────────────────
  ['babyshower-uk-a', '/online-baby-shower-card-uk', 'en', 'Online baby shower cards UK'],
  ['babyshower-uk-b', '/baby-shower-card-for-colleague-uk', 'en', 'Baby shower cards for a colleague UK'],
  ['babyshower-us-a', '/online-baby-shower-card-us', 'en', 'Online baby shower cards US'],
  ['babyshower-us-b', '/baby-shower-card-for-coworker-us', 'en', 'Baby shower cards for a coworker US'],
  ['babyshower-canada-a', '/online-baby-shower-card-canada', 'en', 'Online baby shower cards Canada'],
  ['babyshower-canada-b', '/baby-shower-card-for-coworker-canada', 'en', 'Baby shower cards for a coworker Canada'],
  ['babyshower-germany-a', '/online-baby-shower-card-germany', 'en', 'Online baby shower cards Germany'],
  ['babyshower-germany-b', '/babyparty-karte-online', 'de', 'Babyparty Karte online'],
  ['babyshower-netherlands-a', '/online-baby-shower-card-netherlands', 'en', 'Online baby shower cards Netherlands'],
  ['babyshower-netherlands-b', '/babyshower-kaart-online', 'nl', 'Babyshower kaart online'],
  ['babyshower-colombia-a', '/online-baby-shower-card-colombia', 'en', 'Online baby shower cards Colombia'],
  ['babyshower-colombia-b', '/tarjeta-baby-shower-online', 'es', 'Tarjeta de baby shower online'],
  ['babyshower-mauritius-a', '/online-baby-shower-card-mauritius', 'en', 'Online baby shower cards Mauritius'],
  ['babyshower-mauritius-b', '/baby-shower-card-for-colleague-mauritius', 'en', 'Baby shower cards for a colleague Mauritius'],
  ['babyshower-philippines-a', '/online-baby-shower-card-philippines', 'en', 'Online baby shower cards Philippines'],
  ['babyshower-philippines-b', '/baby-shower-card-for-officemate-philippines', 'en', 'Baby shower cards for an officemate Philippines'],

  // ── Anniversary (a: couples, b: work) ─────────────────────────────────
  ['anniversary-uk-a', '/online-anniversary-card-uk', 'en', 'Online anniversary cards UK'],
  ['anniversary-uk-b', '/work-anniversary-card-uk', 'en', 'Work anniversary cards UK'],
  ['anniversary-us-a', '/online-anniversary-card-us', 'en', 'Online anniversary cards US'],
  ['anniversary-us-b', '/work-anniversary-card-us', 'en', 'Work anniversary cards US'],
  ['anniversary-canada-a', '/online-anniversary-card-canada', 'en', 'Online anniversary cards Canada'],
  ['anniversary-canada-b', '/work-anniversary-card-canada', 'en', 'Work anniversary cards Canada'],
  ['anniversary-germany-a', '/online-anniversary-card-germany', 'en', 'Online anniversary cards Germany'],
  ['anniversary-germany-b', '/dienstjubilaeum-karte-online', 'de', 'Dienstjubiläum Karte online'],
  ['anniversary-netherlands-a', '/online-anniversary-card-netherlands', 'en', 'Online anniversary cards Netherlands'],
  ['anniversary-netherlands-b', '/jubileumkaart-online', 'nl', 'Jubileumkaart online'],
  ['anniversary-colombia-a', '/online-anniversary-card-colombia', 'en', 'Online anniversary cards Colombia'],
  ['anniversary-colombia-b', '/tarjeta-aniversario-laboral-online', 'es', 'Tarjeta de aniversario laboral online'],
  ['anniversary-mauritius-a', '/online-anniversary-card-mauritius', 'en', 'Online anniversary cards Mauritius'],
  ['anniversary-mauritius-b', '/work-anniversary-card-mauritius', 'en', 'Work anniversary cards Mauritius'],
  ['anniversary-philippines-a', '/online-anniversary-card-philippines', 'en', 'Online anniversary cards Philippines'],
  ['anniversary-philippines-b', '/work-anniversary-card-philippines', 'en', 'Work anniversary cards Philippines'],
];

export const LANDING_MANIFEST = ROWS.map(([key, path, lang, anchor]) => {
  const [occasion, country, variant] = key.split('-');
  return { key, path, lang, anchor, occasion, country, variant };
});

export const manifestByKey = Object.fromEntries(LANDING_MANIFEST.map(m => [m.key, m]));
export const manifestByPath = Object.fromEntries(LANDING_MANIFEST.map(m => [m.path, m]));

/** hreflang code for a page: language plus country. */
export const HREFLANG_REGION = {
  uk: 'GB', us: 'US', canada: 'CA', germany: 'DE', netherlands: 'NL', colombia: 'CO', mauritius: 'MU', philippines: 'PH', australia: 'AU', france: 'FR',
};
export const hreflangOf = (m) => `${m.lang}-${HREFLANG_REGION[m.country]}`;

/**
 * The same page in other countries (same occasion and variant): these are
 * each other's hreflang alternates. Every page lists every page in its
 * cluster, itself included, so the annotations are reciprocal.
 */
export const hreflangCluster = (m) => LANDING_MANIFEST
  .filter(x => x.occasion === m.occasion && x.variant === m.variant)
  .map(x => ({ hreflang: hreflangOf(x), path: x.path }));
