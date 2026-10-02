import { Helmet } from 'react-helmet-async';
import { MARKETS } from '../../utils/market';

const SITE = 'https://taskeeu.com';
const OG_LOCALE = { NG: 'en_NG', US: 'en_US', GB: 'en_GB', IE: 'en_IE', AU: 'en_AU', NZ: 'en_NZ', CA: 'en_CA', SG: 'en_SG' };

/**
 * Head tags for country pages. Titles are used exactly as written in the
 * content files. `alternatesPath` (e.g. '' or '/tasks') adds hreflang links
 * to the same page on every country site; pages that exist only in one
 * country get a self-referencing hreflang instead.
 */
export default function CountrySEO({ market, title, description, path, alternatesPath, faqs, breadcrumbs, extraLD, noindex = false }) {
  const url = `${SITE}${path}`;
  const ld = [];
  if (faqs?.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
  }
  if (breadcrumbs?.length) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((b, i) => ({ '@type': 'ListItem', position: i + 1, name: b.name, item: `${SITE}${b.path}` })),
    });
  }
  if (extraLD) ld.push(...[].concat(extraLD));
  const lang = `en-${market.code === 'GB' ? 'GB' : market.code}`;
  return (
    <Helmet>
      <html lang={lang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large'} />
      <meta property="og:site_name" content="Taskeeu" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={`${SITE}/og-default.png`} />
      <meta property="og:locale" content={OG_LOCALE[market.code]} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {alternatesPath !== undefined
        ? MARKETS.map((m) => (
          <link key={m.code} rel="alternate" hrefLang={`en-${m.code}`} href={`${SITE}${m.slug ? `/${m.slug}` : ''}${alternatesPath || (m.slug ? '' : '/')}`} />
        ))
        : <link rel="alternate" hrefLang={lang} href={url} />}
      {alternatesPath !== undefined && <link rel="alternate" hrefLang="x-default" href={`${SITE}${alternatesPath || '/'}`} />}
      {ld.map((o, i) => <script key={i} type="application/ld+json">{JSON.stringify(o)}</script>)}
    </Helmet>
  );
}
