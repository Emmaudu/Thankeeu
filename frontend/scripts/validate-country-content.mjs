// Validates a country content file against SCHEMA.md.
// Usage: node scripts/validate-country-content.mjs us
import { pathToFileURL } from 'url';
import { resolve } from 'path';
const slug = process.argv[2];
const mod = await import(pathToFileURL(resolve(`src/content/countries/${slug}.js`)).href);
const c = mod.default; const errs = [];
const need = (cond, msg) => { if (!cond) errs.push(msg); };
const str = (v, min = 1) => typeof v === 'string' && v.trim().length >= min;
const BAD = /[—–]|[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{2705}\u{274C}\u{2728}]/u;
const walk = (v, path) => { if (typeof v === 'string') { if (BAD.test(v)) errs.push(`dash/emoji at ${path}: ${v.slice(0, 60)}`); } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`)); else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, `${path}.${k}`)); };
walk(c, slug);
need(c.slug === slug, 'slug mismatch');
const h = c.home || {};
need(str(h.metaTitle) && h.metaTitle.length <= 65, 'home.metaTitle <= 65');
need(str(h.metaDescription) && h.metaDescription.length <= 165, 'home.metaDescription <= 165');
need(str(h.h1) && Array.isArray(h.intro) && h.intro.length >= 2, 'home h1/intro');
need(h.steps?.length === 3, 'home.steps x3'); need(h.popularTasks?.length >= 8, 'home.popularTasks >= 8');
need(h.whyTaskeeu?.length >= 4, 'home.whyTaskeeu >= 4'); need(h.faqs?.length >= 8, 'home.faqs >= 8');
const sv = c.services || []; need(sv.length >= 8, 'services >= 8');
const ct = c.cities || []; need(ct.length >= 12, 'cities >= 12');
const cityS = new Set(ct.map(x => x.slug)); const svcS = new Set(sv.map(x => x.slug));
const RESERVED = new Set(['tasks','post-task','requester','tasker','services','compare','how-it-works','signup','login','become-a-tasker','payment','auth']);
const slugOk = s => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s || '');
for (const s of sv) { need(slugOk(s.slug), `service slug ${s.slug}`); need(str(s.metaTitle) && s.metaTitle.length <= 65, `service ${s.slug} metaTitle`); need(str(s.metaDescription) && s.metaDescription.length <= 165, `service ${s.slug} metaDescription`); need(s.typicalJobs?.length >= 6 && s.faqs?.length >= 5 && s.intro?.length >= 2 && s.tips?.length >= 3 && str(s.consider), `service ${s.slug} content`); (s.cities || []).forEach(x => need(cityS.has(x), `service ${s.slug} unknown city ${x}`)); }
for (const x of ct) { need(slugOk(x.slug) && !RESERVED.has(x.slug), `city slug ${x.slug}`); need(str(x.metaTitle) && x.metaTitle.length <= 65, `city ${x.slug} metaTitle`); need(str(x.metaDescription) && x.metaDescription.length <= 165, `city ${x.slug} metaDescription`); need(x.neighbourhoods?.length >= 8 && x.faqs?.length >= 4 && x.intro?.length >= 2 && str(x.localNote) && str(x.region), `city ${x.slug} content`); (x.popularServices || []).forEach(y => need(svcS.has(y), `city ${x.slug} unknown service ${y}`)); }
const cp = c.compare || []; need(cp.length >= 4, 'compare >= 4');
for (const x of cp) { need(slugOk(x.slug), `compare slug ${x.slug}`); need(str(x.metaTitle) && x.metaTitle.length <= 65, `compare ${x.slug} metaTitle`); need(str(x.metaDescription) && x.metaDescription.length <= 165, `compare ${x.slug} metaDescription`); need(x.rows?.length >= 8 && x.faqs?.length >= 5 && x.sources?.length >= 1 && x.chooseTaskeeu?.length >= 3 && x.chooseThem?.length >= 2 && str(x.cityNote), `compare ${x.slug} content`); }
for (const p of h.popularTasks || []) need(p.service === null || svcS.has(p.service), `popularTask unknown service ${p.service}`);
const r = c.remote || {};
need(str(r.metaTitle) && r.metaTitle.length <= 65 && str(r.metaDescription) && r.metaDescription.length <= 165, 'remote meta');
need(str(r.h1) && r.intro?.length >= 2 && r.typicalJobs?.length >= 8 && r.howItWorks?.length === 3 && r.tips?.length >= 3 && r.faqs?.length >= 6, 'remote content');
// Uniqueness: no 9-word run may appear in 3+ different city pages.
const grams = new Map();
for (const x of ct) {
  const text = [...(x.intro || []), x.localNote, ...(x.faqs || []).map(f => f.a)].join(' ').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const seen = new Set();
  for (let i = 0; i + 9 <= text.length; i++) { const g = text.slice(i, i + 9).join(' '); if (seen.has(g)) continue; seen.add(g); grams.set(g, (grams.get(g) || 0) + 1); }
}
const repeated = [...grams.entries()].filter(([, n]) => n >= 3);
need(repeated.length <= 3, `city copy is templated: ${repeated.length} phrases repeat across 3+ cities, e.g. "${repeated[0]?.[0] || ''}"`);
const t = c.tasker || {}; const KEYS = new Set(['id_document','proof_of_address','right_to_work','police_check']);
need(t.documents?.length >= 2 && t.documents.every(d => KEYS.has(d.key) && str(d.label) && str(d.help) && typeof d.required === 'boolean'), 'tasker.documents');
need(t.documents?.some(d => d.key === 'id_document' && d.required), 'tasker id_document required');
need(Array.isArray(c.regions) && c.regions.length >= 3, 'regions');
const dupTitles = [h.metaTitle, r.metaTitle, ...sv.map(s => s.metaTitle), ...ct.map(s => s.metaTitle), ...cp.map(s => s.metaTitle)];
need(new Set(dupTitles).size === dupTitles.length, 'meta titles must be unique');
if (errs.length) { console.log(`INVALID ${slug}:\n- ` + errs.join('\n- ')); process.exit(1); }
console.log(`VALID ${slug}: ${sv.length} services, ${ct.length} cities, ${cp.length} comparisons, ${h.faqs.length} home FAQs`);
