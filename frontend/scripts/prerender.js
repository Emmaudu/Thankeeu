/**
 * Taskeeu static prerender script
 * Runs after `vite build` — stamps each public route with real HTML
 * so Google (and users with JS disabled) get content, not a blank page.
 *
 * Usage: node scripts/prerender.js
 * Or via package.json: "build": "vite build && node scripts/prerender.js"
 *
 * Strategy: inject per-route <title> and <meta description> into index.html
 * and write each route as its own HTML file in dist/.
 * Full SSR is not available here, so we stamp static meta and leave React to
 * hydrate on the client. Google renders JS too, but static meta ensures
 * crawlers that don't execute JS (OG scrapers, link previews) get correct data.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir   = join(__dirname, '../dist');
const indexHtml = readFileSync(join(distDir, 'index.html'), 'utf8');

const BASE  = 'https://taskeeu.com';
const BRAND = 'Taskeeu | Nigeria\'s #1 Errand Service';

const routes = [
  // Core
  { path: '/',            title: `Hire Someone to Run Errands for You in Nigeria | ${BRAND}`, desc: 'Nigeria\'s #1 errand marketplace. Post any errand and hire a verified runner in Lagos, Abuja, Port Harcourt & across Africa. Escrow-protected, real-time tracking.' },
  { path: '/tasks',       title: `Browse Tasks | ${BRAND}`,        desc: 'Browse open tasks posted by requesters across Nigeria and Africa. Bid on tasks that match your skills and location.' },
  { path: '/taskers',     title: `Find Verified Taskers | ${BRAND}`, desc: 'Hire KYC-verified, background-checked taskers across Africa. Trusted field agents for deliveries, errands, inspections & more.' },
  { path: '/post-task',   title: `Post a Task | ${BRAND}`,          desc: 'Post any task in 2 minutes. Describe your errand, set your budget, and get bids from verified taskers near you.' },
  { path: '/how-it-works',title: `How Taskeeu Works | ${BRAND}`,    desc: 'Learn how Taskeeu connects you with verified errand runners in Nigeria and Africa. Post a task, get bids, pay safely with escrow.' },
  { path: '/pricing',     title: `Pricing | ${BRAND}`,              desc: 'Transparent pricing for posting tasks and hiring errand runners on Taskeeu. No hidden fees. Escrow-protected payments.' },
  { path: '/blog',        title: `Blog: Errand Service Guides & Tips | ${BRAND}`, desc: 'Errand service guides, how-to articles, and insights from Taskeeu | Nigeria\'s #1 errand marketplace.' },
  { path: '/about',       title: `About Taskeeu | ${BRAND}`,        desc: 'Taskeeu is Nigeria\'s leading errand service marketplace, connecting requesters with verified taskers across Africa.' },
  { path: '/contact',     title: `Contact Us | ${BRAND}`,           desc: 'Get in touch with the Taskeeu team. We\'re here to help with any questions about posting tasks, hiring taskers, or your account.' },
  { path: '/faq',         title: `FAQ | ${BRAND}`,                  desc: 'Frequently asked questions about using Taskeeu: how to post a task, how escrow works, how taskers are verified, and more.' },
  { path: '/teams',       title: `Taskeeu for Teams: Enterprise Errand & Field Operations`, desc: 'Deploy verified field agents across Nigeria for your business. GPS-verified proof of work, escrow payments, and real-time dashboards.' },
  { path: '/vooom',       title: `Vooom by Taskeeu | Nigeria's Peer Logistics Network`, desc: 'Find verified carriers already travelling your route. Lagos to Abuja. UK to Nigeria. US to Nigeria. Cheaper than DHL, escrow-protected. Vooom by Taskeeu.' },
  { path: '/vooom/browse', title: `Browse Vooom Logistics Requests | Taskeeu`, desc: 'Browse live Vooom logistics requests across Nigeria and internationally. Find carriers going your way. Bid and earn or find a carrier for your parcel.' },
  { path: '/vooom/vs-uber-bolt', title: `Vooom vs Uber / Bolt for Deliveries in Nigeria`, desc: 'Uber and Bolt move people. Vooom moves things. Escrow-protected, identity-verified, international routes. Vooom by Taskeeu.' },
  { path: '/vooom/nigeria-diaspora-delivery', title: `Send Items from UK, US, Canada to Nigeria Without DHL | Vooom`, desc: 'Nigerian diaspora: send parcels, documents, food, and clothing to Nigeria for a fraction of DHL or FedEx costs using Vooom by Taskeeu.' },
  { path: '/vooom/uk-nigeria-delivery', title: `UK to Nigeria Parcel Delivery: Cheaper Than DHL | Vooom`, desc: 'Send parcels from the UK to Nigeria without DHL. Find verified carriers flying London to Lagos. Escrow-protected. Vooom by Taskeeu.' },
  { path: '/vooom/us-nigeria-delivery', title: `US to Nigeria Parcel Delivery: Cheaper Than FedEx | Vooom`, desc: 'Send parcels from the US to Nigeria without FedEx. Houston to Lagos, New York to Abuja. Verified carriers, escrow payment. Vooom by Taskeeu.' },
  { path: '/vooom/local-delivery-nigeria', title: `Local Delivery Across Nigeria: Cheaper Than Courier | Vooom`, desc: 'Lagos to Abuja, Port Harcourt to Lagos, Kano to Lagos. Find verified carriers already making the journey. Vooom by Taskeeu.' },

  // Service pages
  { path: '/errands',            title: `Errand Service in Nigeria: Hire a Verified Errand Runner | ${BRAND}`, desc: 'Nigeria\'s trusted errand service. Post any errand and hire a KYC-verified runner in Lagos, Abuja, Port Harcourt & 30+ cities. Escrow-protected.' },
  { path: '/errands/lagos',      title: `Errand Service in Lagos: Hire a Verified Errand Runner in Lagos`, desc: 'Lagos errand service on Taskeeu. Hire a trusted, verified errand runner in Lekki, VI, Ikeja, Surulere & all Lagos areas. Escrow-protected.' },
  { path: '/errands/abuja',      title: `Errand Service in Abuja: Hire a Verified Errand Runner in Abuja`, desc: 'Abuja errand service on Taskeeu. Hire a trusted, verified errand runner in Wuse, Garki, Maitama, Gwarinpa & all Abuja areas.' },
  { path: '/errands/port-harcourt', title: `Errand Service in Port Harcourt: Hire a Verified Errand Runner in PH`, desc: 'Port Harcourt errand service on Taskeeu. Hire a trusted runner in GRA, Trans-Amadi, D-Line & all PH areas. Escrow-protected.' },
  { path: '/errands/ibadan',     title: `Errand Service in Ibadan: Hire a Verified Errand Runner in Ibadan`, desc: 'Ibadan errand service on Taskeeu. Hire a trusted runner in Bodija, Ring Road, Dugbe & all Ibadan areas. Escrow-protected.' },
  { path: '/errands/kano',       title: `Errand Service in Kano: Hire a Verified Errand Runner in Kano`,   desc: 'Kano errand service on Taskeeu. Hire a trusted runner in Sabon Gari, Nassarawa, Kurmi & all Kano areas. Escrow-protected.' },
  { path: '/errands/benin-city', title: `Errand Service in Benin City: Hire a Verified Errand Runner in Benin City`, desc: 'Benin City errand service on Taskeeu. Hire a trusted runner in Ring Road, GRA, Sapele Road, Ugbowo & all Benin City areas. Escrow-protected.' },
  { path: '/errands/enugu',      title: `Errand Service in Enugu: Hire a Verified Errand Runner in Enugu`, desc: 'Enugu errand service on Taskeeu. Hire a trusted runner in Independence Layout, GRA, New Market & all Enugu areas. Escrow-protected.' },
  { path: '/errands/warri',      title: `Errand Service in Warri: Hire a Verified Errand Runner in Warri`, desc: 'Warri errand service on Taskeeu. Hire a trusted runner in Effurun, DSC Roundabout & all Warri areas. Escrow-protected.' },
  { path: '/errands/owerri',     title: `Errand Service in Owerri: Hire a Verified Errand Runner in Owerri`, desc: 'Owerri errand service on Taskeeu. Hire a trusted runner in New Owerri, Relief Market & all Owerri areas. Escrow-protected.' },
  { path: '/errands/calabar',    title: `Errand Service in Calabar: Hire a Verified Errand Runner in Calabar`, desc: 'Calabar errand service on Taskeeu. Hire a trusted runner near Watt Market, Marina & all Calabar areas. Escrow-protected.' },
  { path: '/errands/uyo',        title: `Errand Service in Uyo: Hire a Verified Errand Runner in Uyo`, desc: 'Uyo errand service on Taskeeu. Hire a trusted runner near Akpan Andem Market, Itam & all Uyo areas. Escrow-protected.' },
  { path: '/errands/ilorin',     title: `Errand Service in Ilorin: Hire a Verified Errand Runner in Ilorin`, desc: 'Ilorin errand service on Taskeeu. Hire a trusted runner near Ipata Market, Tanke & all Ilorin areas. Escrow-protected.' },
  { path: '/errands/abeokuta',   title: `Errand Service in Abeokuta: Hire a Verified Errand Runner in Abeokuta`, desc: 'Abeokuta errand service on Taskeeu. Hire a trusted runner near Kuto Market, Lafenwa & all Abeokuta areas. Escrow-protected.' },
  { path: '/errands/onitsha',    title: `Errand Service in Onitsha: Hire a Verified Errand Runner in Onitsha`, desc: 'Onitsha errand service on Taskeeu. Hire a trusted runner near Onitsha Main Market, Upper Iweka & all Onitsha areas. Escrow-protected.' },
  { path: '/errands/jos',        title: `Errand Service in Jos: Hire a Verified Errand Runner in Jos`, desc: 'Jos errand service on Taskeeu. Hire a trusted runner near Rayfield, Terminus & all Jos areas. Escrow-protected.' },
  { path: '/grocery-shopping',   title: `Grocery Shopping Service in Nigeria: Hire a Personal Market Runner`, desc: 'Grocery shopping and market runs across Nigeria. Hire a verified personal shopper for Mile 12, Balogun, Wuse Market & supermarkets.' },
  { path: '/diaspora',           title: `Errand Service for Nigerians Abroad: Run Errands in Nigeria From Anywhere`, desc: 'Taskeeu runs your errands in Nigeria while you\'re in the US, UK, Canada or anywhere. Escrow-protected, with photo proof.' },
  { path: '/diaspora/uk',        title: `Errand Service for Nigerians in the UK: Run Errands in Nigeria From Anywhere`, desc: 'Living in the UK? Taskeeu runs your errands in Nigeria: groceries, transcripts, bill payments, property checks. Escrow-protected.' },
  { path: '/diaspora/usa',       title: `Errand Service for Nigerians in the USA: Run Errands in Nigeria From Anywhere`, desc: 'Living in the USA? Taskeeu runs your errands in Nigeria: groceries, transcripts, bill payments, property checks. Escrow-protected.' },
  { path: '/diaspora/canada',    title: `Errand Service for Nigerians in Canada: Run Errands in Nigeria From Anywhere`, desc: 'Living in Canada? Taskeeu runs your errands in Nigeria: groceries, transcripts, bill payments, property checks. Escrow-protected.' },
  { path: '/vs/jiji',            title: `Taskeeu vs Jiji: The Safer Way to Hire an Errand Runner in Nigeria`, desc: 'Thinking of using Jiji to find an errand runner? See how Taskeeu compares: verified Taskers, escrow payments, and real tracking.' },
  { path: '/errand-runner-near-me', title: `Errand Runner Near Me: Find a Verified Errand Runner in Your City`, desc: 'Looking for an errand runner near you in Nigeria? Taskeeu matches you with identity-verified, escrow-protected Taskers in your exact city.' },
  { path: '/house-land-inspection', title: `House & Land Inspection & Property Verification in Nigeria: Send a Verified Local to Check It`, desc: "Verify land or a house before you pay, without travelling. A verified tasker in that area physically inspects it: boundaries, condition, GPS-tagged photos and video. Escrow-protected. Ideal for diaspora buyers avoiding Omo Onile and land scams." },
  { path: '/delivery',           title: `Delivery Service in Nigeria: Same-Day Courier | ${BRAND}`,         desc: 'Same-day delivery and courier service across Lagos, Abuja, Port Harcourt & Nigeria. Verified delivery riders. Escrow-protected.' },
  { path: '/document-pickup',    title: `Document Pickup & Delivery Service in Nigeria | ${BRAND}`,          desc: 'Professional document pickup and delivery service in Nigeria. Certificates, contracts, NIN slips collected and delivered same-day.' },
  { path: '/property-inspection',title: `Property Inspection Service in Nigeria | ${BRAND}`,                 desc: 'Independent property inspection service in Nigeria. Timestamped photos and video reports before you buy or invest remotely.' },
  { path: '/asset-verification', title: `Asset Verification Service in Nigeria | ${BRAND}`,                  desc: 'Independent asset and property verification service in Nigeria. Verify vehicles, land, property & equipment with photo evidence.' },
  { path: '/field-engineers',    title: `Field Engineers & Technical Agents in Nigeria | ${BRAND}`,          desc: 'Hire verified field engineers and technical agents in Nigeria for installations, inspections, and maintenance across all states.' },
  { path: '/installations',      title: `Installation Service in Nigeria | ${BRAND}`,                        desc: 'Professional installation service in Nigeria. Hire verified technicians for appliance, equipment & tech installations.' },
  { path: '/office-support',     title: `Office Support Service in Nigeria | ${BRAND}`,                      desc: 'Hire verified office support staff in Nigeria for admin tasks, filing, banking errands, and business support.' },
  { path: '/business-support',   title: `Business Support Service in Nigeria | ${BRAND}`,                    desc: 'Business support services in Nigeria. Hire verified field agents for market surveys, supplier visits, and B2B errands.' },
  { path: '/merchandising',      title: `Merchandising & Field Sales Support in Nigeria | ${BRAND}`,         desc: 'Hire verified merchandising agents in Nigeria for product placement, shelf checks, and field sales support.' },
];

let written = 0;
for (const route of routes) {
  const routePath = route.path === '/' ? '' : route.path;
  const dir = join(distDir, routePath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const canonical = `${BASE}${route.path}`;
  let html = indexHtml;

  // Replace title
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`);

  // Replace/inject description
  if (html.includes('<meta name="description"')) {
    html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${route.desc.replace(/"/g, '&quot;')}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="description" content="${route.desc.replace(/"/g, '&quot;')}" />\n</head>`);
  }

  // Replace canonical
  if (html.includes('<link rel="canonical"')) {
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${canonical}" />`);
  } else {
    html = html.replace('</head>', `  <link rel="canonical" href="${canonical}" />\n</head>`);
  }

  // OG url + title
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${route.title}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${route.desc.replace(/"/g, '&quot;')}" />`);

  writeFileSync(join(dir, 'index.html'), html);
  written++;
}


// ═══════════════════════════════════════════════════════════════════════
// International country sites: full static HTML (title, meta, canonical,
// hreflang, JSON-LD and the real page text with internal links) for every
// country home, service, city, comparison, remote, browse and post page,
// plus one sitemap per country and a sitemap index.
// ═══════════════════════════════════════════════════════════════════════
const COUNTRY_SLUGS = ['us', 'uk', 'ireland', 'australia', 'new-zealand', 'canada', 'singapore'];
const HREFLANG = { '': 'en-NG', us: 'en-US', uk: 'en-GB', ireland: 'en-IE', australia: 'en-AU', 'new-zealand': 'en-NZ', canada: 'en-CA', singapore: 'en-SG' };
const CURRENCY = { us: 'USD', uk: 'GBP', ireland: 'EUR', australia: 'AUD', 'new-zealand': 'NZD', canada: 'CAD', singapore: 'SGD' };
const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const today = new Date().toISOString().slice(0, 10);

function stamp({ path, title, desc, lang, alternates, ld = [], body }) {
  const canonical = `${BASE}${path}`;
  let html = indexHtml;
  html = html.replace(/<html([^>]*)lang="[^"]*"/, `<html$1lang="${lang}"`);
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  const tags = [
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    ...(alternates || [`<link rel="alternate" hreflang="${lang}" href="${canonical}" />`]),
    ...ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`),
  ].join('\n  ');
  html = html.replace(/<meta name="description"[^>]*>\s*/g, '').replace(/<link rel="canonical"[^>]*>\s*/g, '');
  // Nigeria-specific location tags do not belong on other countries' pages.
  html = html.replace(/\s*<meta name="geo\.[^"]*"[^>]*>/g, '').replace(/\s*<meta property="og:locale:alternate"[^>]*>/g, '');
  html = html.replace('</head>', `  ${tags}\n</head>`);
  html = html.replace(/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${canonical}" />`);
  html = html.replace(/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(title)}" />`);
  html = html.replace(/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(desc)}" />`);
  html = html.replace(/<meta property="og:locale"[^>]*>/, `<meta property="og:locale" content="${lang.replace('-', '_')}" />`);
  if (body) html = html.replace(/<div id="root">\s*<\/div>/, `<div id="root">${body}</div>`);
  const dir = join(distDir, path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  written++;
}

const faqLD = (faqs) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
const crumbLD = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BASE}${path}` })) });
const altSet = (rest) => [
  ...['', ...COUNTRY_SLUGS].map((sl) => `<link rel="alternate" hreflang="${HREFLANG[sl]}" href="${BASE}${sl ? `/${sl}` : ''}${rest || (sl ? '' : '/')}" />`),
  `<link rel="alternate" hreflang="x-default" href="${BASE}${rest || '/'}" />`,
];
const ul = (items) => `<ul>${items.map((t) => `<li>${t}</li>`).join('')}</ul>`;
const a = (href, text) => `<a href="${href}">${esc(text)}</a>`;
const faqHtml = (faqs) => `<h2>Frequently asked questions</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}`;
const paras = (ps) => ps.map((t) => `<p>${esc(t)}</p>`).join('');

const sitemapIndex = [];
for (const slug of COUNTRY_SLUGS) {
  const c = (await import(join(__dirname, '../src/content/countries', `${slug}.js`))).default;
  const p = `/${slug}`;
  const lang = HREFLANG[slug];
  const urls = [];
  const nav = `<nav>${ul([a(p, `Taskeeu ${c.name}`), a(`${p}/tasks`, 'Browse tasks'), a(`${p}/post-task`, 'Post a task'), a(`${p}/remote`, 'Remote tasks'), a(`${p}/tasker/signup`, 'Become a tasker')])}</nav>`;
  const footer = `<footer><h2>Services</h2>${ul(c.services.map((s) => a(`${p}/services/${s.slug}`, s.name)))}<h2>Cities</h2>${ul(c.cities.map((ci) => a(`${p}/${ci.slug}`, ci.name)))}<h2>Compare</h2>${ul(c.compare.map((x) => a(`${p}/compare/${x.slug}`, `Taskeeu vs ${x.competitor}`)))}<h2>Taskeeu worldwide</h2>${ul([a('/', 'Taskeeu Nigeria'), ...COUNTRY_SLUGS.map((sl) => a(`/${sl}`, `Taskeeu ${sl}`))])}</footer>`;
  const page = (inner) => `${nav}<main>${inner}</main>${footer}`;

  // Home
  const h = c.home;
  stamp({ path: p, title: h.metaTitle, desc: h.metaDescription, lang, alternates: altSet(''),
    ld: [faqLD(h.faqs), crumbLD([['Taskeeu', '/'], [c.name, p]]), { '@context': 'https://schema.org', '@type': 'Organization', name: `Taskeeu ${c.name}`, url: `${BASE}${p}`, logo: `${BASE}/logo.svg`, areaServed: c.name }],
    body: page(`<h1>${esc(h.h1)}</h1><p>${esc(h.subhead)}</p>${paras(h.intro)}<h2>How it works</h2>${ul(h.steps.map((s) => `<strong>${esc(s.title)}</strong> ${esc(s.text)}`))}<h2>Popular tasks</h2>${ul(h.popularTasks.map((t) => t.service ? a(`${p}/services/${t.service}`, t.name) : esc(t.name)))}<h2>Why Taskeeu</h2>${ul(h.whyTaskeeu.map((w) => `<strong>${esc(w.title)}</strong> ${esc(w.text)}`))}<p>${esc(h.safety)}</p>${faqHtml(h.faqs)}`) });
  urls.push([p, '1.0', 'daily']);

  for (const s of c.services) {
    const path = `${p}/services/${s.slug}`;
    stamp({ path, title: s.metaTitle, desc: s.metaDescription, lang,
      ld: [faqLD(s.faqs), crumbLD([[c.name, p], [s.name, path]]), { '@context': 'https://schema.org', '@type': 'Service', name: s.name, areaServed: c.name, provider: { '@type': 'Organization', name: 'Taskeeu', url: BASE } }],
      body: page(`<h1>${esc(s.h1)}</h1>${paras(s.intro)}<h2>Typical jobs</h2>${ul(s.typicalJobs.map(esc))}<h2>Tips</h2>${ul(s.tips.map(esc))}<p>${esc(s.consider)}</p><h2>By city</h2>${ul(s.cities.map((cs) => c.cities.find((x) => x.slug === cs)).filter(Boolean).map((ci) => a(`${p}/${ci.slug}`, `${s.name} in ${ci.name}`)))}${faqHtml(s.faqs)}`) });
    urls.push([path, '0.9', 'weekly']);
  }
  for (const ci of c.cities) {
    const path = `${p}/${ci.slug}`;
    stamp({ path, title: ci.metaTitle, desc: ci.metaDescription, lang,
      ld: [faqLD(ci.faqs), crumbLD([[c.name, p], [ci.name, path]])],
      body: page(`<h1>${esc(ci.h1)}</h1>${paras(ci.intro)}<h2>Popular services in ${esc(ci.name)}</h2>${ul(ci.popularServices.map((ss) => c.services.find((x) => x.slug === ss)).filter(Boolean).map((sv) => a(`${p}/services/${sv.slug}`, sv.name)))}<h2>Areas</h2>${ul(ci.neighbourhoods.map(esc))}<p>${esc(ci.localNote)}</p>${faqHtml(ci.faqs)}`) });
    urls.push([path, '0.8', 'weekly']);
  }
  for (const x of c.compare) {
    const path = `${p}/compare/${x.slug}`;
    stamp({ path, title: x.metaTitle, desc: x.metaDescription, lang,
      ld: [faqLD(x.faqs), crumbLD([[c.name, p], [`Taskeeu vs ${x.competitor}`, path]])],
      body: page(`<h1>${esc(x.h1)}</h1>${paras(x.intro)}<table><thead><tr><th>Feature</th><th>Taskeeu</th><th>${esc(x.competitor)}</th></tr></thead><tbody>${x.rows.map((r) => `<tr><th>${esc(r.feature)}</th><td>${esc(r.taskeeu)}</td><td>${esc(r.them)}</td></tr>`).join('')}</tbody></table><p>Checked ${esc(x.checked)}.</p>${faqHtml(x.faqs)}`) });
    urls.push([path, '0.7', 'monthly']);
  }
  const r = c.remote;
  stamp({ path: `${p}/remote`, title: r.metaTitle, desc: r.metaDescription, lang,
    ld: [faqLD(r.faqs), crumbLD([[c.name, p], ['Remote tasks', `${p}/remote`]])],
    body: page(`<h1>${esc(r.h1)}</h1>${paras(r.intro)}<h2>Remote tasks people post</h2>${ul(r.typicalJobs.map(esc))}<h2>How it works</h2>${ul(r.howItWorks.map((s) => `<strong>${esc(s.title)}</strong> ${esc(s.text)}`))}${faqHtml(r.faqs)}`) });
  urls.push([`${p}/remote`, '0.9', 'weekly']);

  stamp({ path: `${p}/tasks`, title: `Browse Open Tasks in ${c.name} | Taskeeu`, desc: `See tasks posted by people in ${c.name}: moving help, cleaning, assembly, gardening, errands and remote work. Bid free and get paid in ${CURRENCY[slug]}.`, lang, alternates: altSet('/tasks') });
  stamp({ path: `${p}/post-task`, title: `Post a Task for Free in ${c.name} | Taskeeu`, desc: `Describe your task, set a price in ${CURRENCY[slug]} and get bids from verified local taskers in ${c.name}. In person or remote. Free to post.`, lang, alternates: altSet('/post-task') });
  stamp({ path: `${p}/tasker/signup`, title: `Become a Tasker in ${c.name} | Taskeeu`, desc: `Earn money on your own schedule in ${c.name}. Sign up free, verify your ID and right to work, and bid on local and remote tasks paid in ${CURRENCY[slug]}.`, lang });
  urls.push([`${p}/tasks`, '0.9', 'hourly'], [`${p}/post-task`, '0.8', 'monthly'], [`${p}/tasker/signup`, '0.7', 'monthly']);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, pr, f]) => `  <url><loc>${BASE}${u}</loc><lastmod>${today}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join('\n')}\n</urlset>\n`;
  writeFileSync(join(distDir, `sitemap-${slug}.xml`), xml);
  sitemapIndex.push(`sitemap-${slug}.xml`);
}
writeFileSync(join(distDir, 'sitemap-countries.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${['sitemap.xml', ...sitemapIndex].map((f) => `  <sitemap><loc>${BASE}/${f}</loc><lastmod>${today}</lastmod></sitemap>`).join('\n')}\n</sitemapindex>\n`);
console.log(`Country sitemaps written: ${sitemapIndex.join(', ')} + sitemap-countries.xml`);

console.log(`Prerendered ${written} routes into dist/`);
