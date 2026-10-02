import { Helmet } from 'react-helmet-async';
import { taskPrice } from '../../utils/taskPrice';

const SITE = {
  name: 'Taskeeu',
  url: 'https://taskeeu.com',
  twitterHandle: '@taskeeung',
  logo: 'https://taskeeu.com/logo.svg',
  // Default description — errand-service-first, Nigeria + Africa signals
  description:
    "Need someone to run an errand for you? Taskeeu is Nigeria's #1 errand service marketplace. Hire a verified errand runner in Lagos, Abuja, Port Harcourt and across Africa. Grocery runs, NIMC queuing, pharmacy pickups, bill payments & more, with escrow payment protection.",
  // Default OG tagline — shown on link previews when no page-specific value is set
  ogTagline:
    "Nigeria's #1 errand marketplace. Post any errand and get bids from verified local runners in Lagos, Abuja, PH & across Africa. Escrow-protected, real-time tracking.",
};

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = 'website',
  noindex = false,
  structuredData,
  keywords,
  breadcrumbs,
  children,
}) {
  const fullTitle = title
    ? `${title} | Taskeeu`
    : "Hire Someone to Run Errands for You in Nigeria & Africa | Taskeeu";
  const metaDesc = description || SITE.description;
  // OG description: prefer explicit description, else use the dedicated OG tagline
  const ogDesc = description || SITE.ogTagline;
  const canonicalUrl = canonical || SITE.url;
  const ogImg = ogImage || `${SITE.url}/og-default.png`;

  const breadcrumbLD =
    breadcrumbs?.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((b, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: b.name,
            item: b.url,
          })),
        }
      : null;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      {!noindex && (
        <meta
          name="robots"
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
        />
      )}

      {/* Open Graph — errand-service-first taglines */}
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={ogDesc} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title ? `${title} | Taskeeu Errand Service Nigeria` : 'Taskeeu | Errand Service Nigeria & Africa'} />
      <meta property="og:locale" content="en_NG" />
      <meta property="og:locale:alternate" content="en_GB" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={SITE.twitterHandle} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={ogDesc} />
      <meta name="twitter:image" content={ogImg} />

      {/* Geo signals — Lagos primary, Africa coverage */}
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Lagos, Nigeria" />
      <meta name="geo.position" content="6.5244;3.3792" />
      <meta name="ICBM" content="6.5244, 3.3792" />
      <meta name="language" content="English" />
      <meta name="content-language" content="en-NG" />
      <meta name="target_region" content="Africa" />
      <meta name="distribution" content="global" />
      <meta name="coverage" content="Nigeria, Ghana, Kenya, South Africa, Africa" />
      <meta name="rating" content="general" />
      <meta name="author" content="Taskeeu Technologies Ltd" />

      {structuredData && (
        Array.isArray(structuredData)
          ? structuredData.map((sd, i) => (
              <script key={i} type="application/ld+json">
                {JSON.stringify(sd)}
              </script>
            ))
          : (
            <script type="application/ld+json">
              {JSON.stringify(structuredData)}
            </script>
          )
      )}
      {breadcrumbLD && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbLD)}
        </script>
      )}

      {children}
    </Helmet>
  );
}

// ── Structured data helpers ────────────────────────────────────────

export const globalStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://taskeeu.com/#organization',
      name: 'Taskeeu Technologies Ltd',
      url: 'https://taskeeu.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://taskeeu.com/logo.svg',
        width: 200,
        height: 200,
      },
      description:
        "Nigeria and Africa's #1 errand service marketplace. Hire a verified errand runner for grocery runs, NIMC queuing, pharmacy pickups, bill payments, and any errand in Lagos, Abuja, Port Harcourt, and across all 36 Nigerian states and Africa.",
      foundingDate: '2024',
      foundingLocation: {
        '@type': 'Place',
        addressLocality: 'Lagos',
        addressCountry: 'NG',
      },
      areaServed: [
        { '@type': 'City', name: 'Lagos' },
        { '@type': 'City', name: 'Abuja' },
        { '@type': 'City', name: 'Port Harcourt' },
        { '@type': 'City', name: 'Ibadan' },
        { '@type': 'City', name: 'Kano' },
        { '@type': 'City', name: 'Enugu' },
        { '@type': 'City', name: 'Benin City' },
        { '@type': 'Country', name: 'Nigeria' },
        { '@type': 'Continent', name: 'Africa' },
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'contact@taskeeu.com',
        availableLanguage: 'English',
      },
      sameAs: [
        'https://twitter.com/taskeeung',
        'https://linkedin.com/company/taskeeu',
        'https://instagram.com/taskeeung',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://taskeeu.com/#website',
      url: 'https://taskeeu.com',
      name: 'Taskeeu',
      description: "Nigeria & Africa's #1 Errand Service: Hire Someone to Run Errands for You",
      publisher: { '@id': 'https://taskeeu.com/#organization' },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://taskeeu.com/tasks?search={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export function makeLocalBusinessSchema({ city = 'Lagos', serviceType = 'Errand Service', url = 'https://taskeeu.com/errands' } = {}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${url}#localbusiness`,
    name: `Taskeeu ${serviceType} in ${city}`,
    url,
    image: 'https://taskeeu.com/logo.svg',
    description: `Hire a verified ${serviceType.toLowerCase()} in ${city} and across Nigeria on Taskeeu. Post any task and receive competitive bids from identity-verified local Taskers.`,
    priceRange: '₦₦',
    currenciesAccepted: 'NGN',
    paymentAccepted: 'Credit Card, Bank Transfer, Mobile Money',
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'NG',
    },
    geo: city === 'Lagos'
      ? { '@type': 'GeoCoordinates', latitude: 6.5244, longitude: 3.3792 }
      : city === 'Abuja'
      ? { '@type': 'GeoCoordinates', latitude: 9.0765, longitude: 7.3986 }
      : undefined,
    areaServed: [
      { '@type': 'Country', name: 'Nigeria' },
      { '@type': 'City', name: 'Lagos' },
      { '@type': 'City', name: 'Abuja' },
      { '@type': 'City', name: 'Port Harcourt' },
      { '@type': 'City', name: 'Ibadan' },
      { '@type': 'City', name: 'Kano' },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      worstRating: '1',
      reviewCount: '1200',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
      opens: '06:00',
      closes: '22:00',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `${serviceType} Tasks in Nigeria`,
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Grocery & Market Runs' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Government Office Queuing (NIMC, FRSC, NIS)' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Bill Payments (NEPA, DSTV, School Fees)' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Pharmacy & Hospital Runs' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Document Pickup & Delivery' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Personal Shopping' } },
      ],
    },
  };
}

export function makeTaskSchema(task) {
  if (!task) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: task.title,
    description: task.description,
    serviceType: task.task_type?.replace(/_/g, ' '),
    areaServed: {
      '@type': 'City',
      name: task.task_city,
      containedInPlace: {
        '@type': 'State',
        name: task.task_state,
        containedInPlace: { '@type': 'Country', name: 'Nigeria' },
      },
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      ...(taskPrice(task) && { price: taskPrice(task) }),
      availability: task.status === 'open'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
    },
  };
}

export function makeTaskerSchema(tasker) {
  if (!tasker) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: tasker.user?.full_name,
    description: tasker.bio,
    knowsAbout: tasker.skills || [],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Verified Field Tasker',
      occupationLocation: {
        '@type': 'City',
        name: tasker.task_city,
        containedInPlace: {
          '@type': 'State',
          name: tasker.task_state,
          containedInPlace: { '@type': 'Country', name: 'Nigeria' },
        },
      },
    },
    aggregateRating: tasker.total_ratings > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: parseFloat(tasker.rating_average || 0).toFixed(1),
      reviewCount: tasker.total_ratings,
      bestRating: 5,
      worstRating: 1,
    } : undefined,
  };
}

export function makeFAQSchema(faqs) {
  if (!faqs?.length) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

export function makeItemListSchema(items, type = 'tasks') {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: type === 'tasks'
      ? 'Available Errand & Task Listings on Taskeeu Nigeria'
      : 'Verified Errand Runners & Taskers on Taskeeu Nigeria',
    numberOfItems: items.length,
    itemListElement: items.slice(0, 10).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: type === 'tasks'
        ? `https://taskeeu.com/tasks/${item.id}`
        : (item.user?.profile_slug ? `https://taskeeu.com/tasker/${item.user.profile_slug}` : `https://taskeeu.com/taskers/${item.user_id}`),
      name: type === 'tasks' ? item.title : item.user?.full_name,
    })),
  };
}

export const teamsStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Taskeeu for Teams',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: 'https://taskeeu.com/teams',
  description:
    "Nigeria's enterprise field operations and errand management platform. Deploy verified field agents and errand runners across all 36 states with GPS proof, SLA tracking, and escrow payments.",
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'NGN',
    lowPrice: 200000,
    highPrice: 2400000,
    offerCount: 2,
  },
  featureList: [
    'GPS timestamp proof system',
    'Department budget management',
    'Auto-generated authorization letters',
    'Line manager approval workflow',
    '44 fixed-price task types',
    'Enterprise tasker certification',
    'Multi-state deployment',
    'Integrated video meetings',
  ],
  publisher: {
    '@type': 'Organization',
    name: 'Taskeeu Technologies Ltd',
    url: 'https://taskeeu.com',
  },
};
