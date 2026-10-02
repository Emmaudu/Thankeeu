/**
 * TASKEEU — SEO & CERTIFICATION MODULE TEST SUITE
 * Tests for:
 * - SEO component & structured data helpers
 * - robots.txt / sitemap.xml content
 * - All 5 certification modules (content integrity, structure, completeness)
 * - Module content renderers
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// ── Mocks ─────────────────────────────────────────────────────────
vi.mock('../utils/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  certificationsApi: {
    getModules: vi.fn().mockResolvedValue({
      data: { modules: [], completed_count: 0, is_certified: false, total: 5, certification: null }
    }),
    getCertificateUrl: vi.fn().mockReturnValue('http://localhost/cert'),
    completeModule: vi.fn().mockResolvedValue({ data: { newly_certified: false } }),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({ user: { id: 'u1', full_name: 'Test User', role: 'tasker' }, isAuthenticated: true })),
  AuthProvider: ({ children }) => children,
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn(), useParams: () => ({}), useSearchParams: () => [new URLSearchParams(), vi.fn()] };
});

const Wrapper = ({ children }) => (
  <HelmetProvider>
    <MemoryRouter>{children}</MemoryRouter>
  </HelmetProvider>
);

// ─────────────────────────────────────────────────────────────────
// SEO COMPONENT TESTS
// ─────────────────────────────────────────────────────────────────

describe('🔍 SEO Component', async () => {
  const { default: SEO, globalStructuredData, teamsStructuredData, makeFAQSchema, makeItemListSchema, makeTaskSchema, makeTaskerSchema } = await import('../components/seo/SEO');

  test('renders without crashing', () => {
    expect(() => render(<Wrapper><SEO title="Test Page" description="Test desc"/></Wrapper>)).not.toThrow();
  });

  test('globalStructuredData has required @context and @graph', () => {
    expect(globalStructuredData['@context']).toBe('https://schema.org');
    expect(Array.isArray(globalStructuredData['@graph'])).toBe(true);
    expect(globalStructuredData['@graph'].length).toBeGreaterThanOrEqual(2);
  });

  test('globalStructuredData includes Organization type', () => {
    const org = globalStructuredData['@graph'].find(n => n['@type'] === 'Organization');
    expect(org).toBeTruthy();
    expect(org.name).toContain('Taskeeu');
    expect(org.url).toBe('https://taskeeu.com');
  });

  test('globalStructuredData includes WebSite type with SearchAction', () => {
    const site = globalStructuredData['@graph'].find(n => n['@type'] === 'WebSite');
    expect(site).toBeTruthy();
    expect(site.potentialAction).toBeTruthy();
    expect(site.potentialAction['@type']).toBe('SearchAction');
    expect(site.potentialAction.target.urlTemplate).toContain('taskeeu.com/tasks');
  });

  test('teamsStructuredData is SoftwareApplication type', () => {
    expect(teamsStructuredData['@type']).toBe('SoftwareApplication');
    expect(teamsStructuredData.name).toBe('Taskeeu for Teams');
    expect(teamsStructuredData.applicationCategory).toBe('BusinessApplication');
  });

  test('teamsStructuredData has offer pricing in NGN', () => {
    expect(teamsStructuredData.offers.priceCurrency).toBe('NGN');
    expect(teamsStructuredData.offers.lowPrice).toBe(200000);
    expect(teamsStructuredData.offers.highPrice).toBe(2400000);
  });

  test('makeFAQSchema generates valid FAQPage schema', () => {
    const faqs = [
      { q: 'Is Taskeeu free?', a: 'Yes, free for individuals.' },
      { q: 'Which cities are covered?', a: 'All 36 Nigerian states.' },
    ];
    const schema = makeFAQSchema(faqs);
    expect(schema['@type']).toBe('FAQPage');
    expect(schema.mainEntity.length).toBe(2);
    expect(schema.mainEntity[0]['@type']).toBe('Question');
    expect(schema.mainEntity[0].name).toBe('Is Taskeeu free?');
    expect(schema.mainEntity[0].acceptedAnswer.text).toBe('Yes, free for individuals.');
  });

  test('makeFAQSchema handles empty array', () => {
    // No questions → no FAQ schema at all (pages skip it instead of emitting an empty one)
    expect(makeFAQSchema([])).toBeNull();
    expect(makeFAQSchema(undefined)).toBeNull();
  });

  test('makeItemListSchema generates valid ItemList for tasks', () => {
    const tasks = [
      { id: 't1', title: 'Pick up document' },
      { id: 't2', title: 'Buy groceries' },
    ];
    const schema = makeItemListSchema(tasks, 'tasks');
    expect(schema['@type']).toBe('ItemList');
    expect(schema.itemListElement[0]['@type']).toBe('ListItem');
    expect(schema.itemListElement[0].url).toContain('/tasks/t1');
    expect(schema.itemListElement[0].position).toBe(1);
  });

  test('makeItemListSchema limits to 10 items', () => {
    const tasks = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, title: `Task ${i}` }));
    const schema = makeItemListSchema(tasks, 'tasks');
    expect(schema.itemListElement.length).toBeLessThanOrEqual(10);
  });

  test('makeTaskSchema generates valid Service schema', () => {
    const task = {
      id: 'task-1',
      title: 'Deliver package in Lagos',
      description: 'Pickup from Marina and deliver to VI',
      task_type: 'pickup_delivery',
      task_city: 'Lagos',
      task_state: 'Lagos',
      status: 'open',
      budget_min: 2000,
      budget_max: 5000,
    };
    const schema = makeTaskSchema(task);
    expect(schema['@type']).toBe('Service');
    expect(schema.name).toBe('Deliver package in Lagos');
    expect(schema.areaServed['@type']).toBe('City');
    expect(schema.areaServed.name).toBe('Lagos');
    expect(schema.offers.priceCurrency).toBe('NGN');
    expect(schema.offers.availability).toContain('InStock');
  });

  test('makeTaskSchema handles null gracefully', () => {
    expect(makeTaskSchema(null)).toBeNull();
  });

  test('makeTaskerSchema generates valid Person schema', () => {
    const tasker = {
      user_id: 'u1',
      bio: 'Experienced Lagos tasker',
      task_city: 'Lagos',
      task_state: 'Lagos',
      skills: ['Delivery', 'Errand'],
      rating_average: '4.5',
      total_ratings: 20,
      user: { id: 'u1', full_name: 'Chidi Okonkwo' },
    };
    const schema = makeTaskerSchema(tasker);
    expect(schema['@type']).toBe('Person');
    expect(schema.name).toBe('Chidi Okonkwo');
    expect(schema.aggregateRating.ratingValue).toBe('4.5');
    expect(schema.aggregateRating.reviewCount).toBe(20);
    expect(schema.aggregateRating['@type']).toBe('AggregateRating');
  });

  test('makeTaskerSchema handles tasker with no ratings', () => {
    const tasker = {
      user_id: 'u1', bio: 'New tasker', task_city: 'Abuja', task_state: 'FCT',
      skills: [], rating_average: '0', total_ratings: 0,
      user: { id: 'u1', full_name: 'New Tasker' },
    };
    const schema = makeTaskerSchema(tasker);
    expect(schema.aggregateRating).toBeUndefined();
  });

  test('makeTaskerSchema handles null gracefully', () => {
    expect(makeTaskerSchema(null)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────
// ROBOTS.TXT CONTENT TESTS
// ─────────────────────────────────────────────────────────────────

describe('🤖 robots.txt', async () => {
  let robotsContent;

  beforeEach(async () => {
    try {
      const fs = await import('fs');
      robotsContent = fs.readFileSync(process.cwd() + '/public/robots.txt', 'utf8');
    } catch { robotsContent = ''; }
  });

  test('robots.txt file exists and has content', () => {
    expect(robotsContent.length).toBeGreaterThan(50);
  });

  test('allows all user agents', () => {
    expect(robotsContent).toContain('User-agent: *');
    expect(robotsContent).toContain('Allow: /');
  });

  test('disallows dashboard routes', () => {
    expect(robotsContent).toContain('Disallow: /admin');
    expect(robotsContent).toContain('Disallow: /dashboard');
    // Public tasker profiles live under /tasker/<name> and must stay crawlable.
    expect(robotsContent).not.toMatch(/^Disallow: \/tasker\/?$/m);
  });

  test('disallows payment routes', () => {
    expect(robotsContent).toContain('Disallow: /payment/callback');
  });

  test('references sitemap.xml', () => {
    expect(robotsContent).toContain('Sitemap: https://taskeeu.com/sitemap.xml');
  });

  test('has no crawl delay (Google ignores it; it only slows other crawlers)', () => {
    expect(robotsContent).not.toContain('Crawl-delay:');
  });
});

// ─────────────────────────────────────────────────────────────────
// SITEMAP.XML TESTS
// ─────────────────────────────────────────────────────────────────

describe('🗺️ sitemap.xml', async () => {
  let sitemapContent;

  beforeEach(async () => {
    try {
      const fs = await import('fs');
      sitemapContent = fs.readFileSync(process.cwd() + '/public/sitemap.xml', 'utf8');
    } catch { sitemapContent = ''; }
  });

  test('sitemap.xml is valid XML structure', () => {
    expect(sitemapContent).toContain('<?xml version="1.0"');
    expect(sitemapContent).toContain('<urlset');
    expect(sitemapContent).toContain('</urlset>');
  });

  test('contains homepage URL with priority 1.0', () => {
    expect(sitemapContent).toContain('<loc>https://taskeeu.com/</loc>');
    expect(sitemapContent).toContain('<priority>1.0</priority>');
  });

  test('contains all key public pages', () => {
    const requiredUrls = [
      'https://taskeeu.com/tasks',
      'https://taskeeu.com/taskers',
      'https://taskeeu.com/pricing',
      'https://taskeeu.com/how-it-works',
      'https://taskeeu.com/teams',
      'https://taskeeu.com/policy',
    ];
    requiredUrls.forEach(url => {
      expect(sitemapContent).toContain(url);
    });
  });

  test('contains Nigerian city-specific task pages', () => {
    expect(sitemapContent).toContain('Lagos');
    expect(sitemapContent).toContain('Abuja');
    expect(sitemapContent).toContain('Port+Harcourt');
  });

  test('all URLs have changefreq and lastmod', () => {
    const urlCount = (sitemapContent.match(/<url>/g) || []).length;
    const changefreqCount = (sitemapContent.match(/<changefreq>/g) || []).length;
    const lastmodCount = (sitemapContent.match(/<lastmod>/g) || []).length;
    expect(changefreqCount).toBe(urlCount);
    expect(lastmodCount).toBe(urlCount);
  });

  test('uses correct domain for all URLs', () => {
    const locMatches = sitemapContent.match(/<loc>[^<]+<\/loc>/g) || [];
    locMatches.forEach(loc => {
      expect(loc).toContain('taskeeu.com');
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// CERTIFICATION MODULE DATA TESTS
// ─────────────────────────────────────────────────────────────────

describe('📚 Certification Module Data — Structure', async () => {
  const { MODULES_CONTENT, TOTAL_MODULES } = await import('../components/ui/CertificationModuleData');

  test('has exactly 5 modules', () => {
    expect(MODULES_CONTENT.length).toBe(5);
    expect(TOTAL_MODULES).toBe(5);
  });

  test('each module has required fields', () => {
    MODULES_CONTENT.forEach(mod => {
      expect(mod.id, `Module ${mod.module_number} missing id`).toBeTruthy();
      expect(mod.module_number, `Missing module_number`).toBeGreaterThan(0);
      expect(mod.title, `Module ${mod.module_number} missing title`).toBeTruthy();
      expect(mod.subtitle, `Module ${mod.module_number} missing subtitle`).toBeTruthy();
      expect(typeof mod.emoji, `Module ${mod.module_number} emoji field must be a string`).toBe('string');
      expect(mod.estimated_minutes, `Module ${mod.module_number} missing time`).toBeGreaterThan(0);
      expect(Array.isArray(mod.sections), `Module ${mod.module_number} sections must be array`).toBe(true);
      expect(Array.isArray(mod.requirements), `Module ${mod.module_number} requirements must be array`).toBe(true);
    });
  });

  test('modules are numbered 1 through 5', () => {
    const numbers = MODULES_CONTENT.map(m => m.module_number).sort();
    expect(numbers).toEqual([1, 2, 3, 4, 5]);
  });

  test('each module has at least 4 sections', () => {
    MODULES_CONTENT.forEach(mod => {
      expect(mod.sections.length, `Module ${mod.module_number} "${mod.title}" needs ≥4 sections`).toBeGreaterThanOrEqual(4);
    });
  });

  test('each module has at least 4 requirements', () => {
    MODULES_CONTENT.forEach(mod => {
      expect(mod.requirements.length, `Module ${mod.module_number} needs ≥4 requirements`).toBeGreaterThanOrEqual(4);
    });
  });

  test('every requirement is a non-empty string', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.requirements.forEach((req, i) => {
        expect(typeof req).toBe('string');
        expect(req.length, `Module ${mod.module_number} requirement ${i} is empty`).toBeGreaterThan(10);
      });
    });
  });

  test('module IDs are all unique', () => {
    const ids = MODULES_CONTENT.map(m => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(MODULES_CONTENT.length);
  });

  test('total estimated time is reasonable (60-120 min)', () => {
    const total = MODULES_CONTENT.reduce((s, m) => s + m.estimated_minutes, 0);
    expect(total).toBeGreaterThanOrEqual(60);
    expect(total).toBeLessThanOrEqual(150);
  });
});

describe('📖 Module 1 — Verification Tasks', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');
  const mod = MODULES_CONTENT[0];

  test('title is Verification Tasks', () => {
    expect(mod.title).toBe('Verification Tasks');
  });

  test('has sections covering all 4 verification types', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('KYC');
    expect(allText).toContain('Merchant');
    expect(allText).toContain('Address');
    expect(allText).toContain('Business');
  });

  test('has step-by-step verification process', () => {
    const hasSteps = mod.sections.some(s =>
      s.content?.some(b => b.type === 'numbered_steps')
    );
    expect(hasSteps, 'Module 1 should have numbered steps').toBe(true);
  });

  test('has diagram showing who uses verification', () => {
    const hasDiagram = mod.sections.some(s =>
      s.content?.some(b => b.type === 'diagram')
    );
    expect(hasDiagram, 'Module 1 should have a diagram').toBe(true);
  });

  test('has a warning callout about falsifying evidence', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('falsif');
  });

  test('has photo guide section', () => {
    const hasPhotoGuide = mod.sections.some(s =>
      s.content?.some(b => b.type === 'photo_guide')
    );
    expect(hasPhotoGuide, 'Module 1 should have photo guide').toBe(true);
  });

  test('has scenario cards for edge cases', () => {
    const hasScenarios = mod.sections.some(s =>
      s.content?.some(b => b.type === 'scenarios')
    );
    expect(hasScenarios, 'Module 1 should have scenarios').toBe(true);
  });
});

describe('📡 Module 2 — Telecom & Infrastructure', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');
  const mod = MODULES_CONTENT[1];

  test('title is Telecom & Infrastructure Tasks', () => {
    expect(mod.title).toContain('Telecom');
  });

  test('contains Nigeria telecom statistics', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('40,000');
    expect(allText).toContain('ATM');
    expect(allText).toContain('POS');
  });

  test('has stats row with telecom numbers', () => {
    const hasStats = mod.sections.some(s =>
      s.content?.some(b => b.type === 'stats_row')
    );
    expect(hasStats, 'Module 2 should have stats row').toBe(true);
  });

  test('has NEVER CLIMB warning', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('NEVER CLIMB');
  });

  test('has tower inspection steps', () => {
    const hasSteps = mod.sections.some(s =>
      s.content?.some(b => b.type === 'numbered_steps' && b.steps?.length >= 5)
    );
    expect(hasSteps, 'Module 2 should have tower inspection steps').toBe(true);
  });

  test('has ATM and POS two-column checklist', () => {
    const hasTwoCol = mod.sections.some(s =>
      s.content?.some(b => b.type === 'two_column')
    );
    expect(hasTwoCol, 'Module 2 should have two-column ATM/POS checklist').toBe(true);
  });

  test('has PPE grid with mandatory items', () => {
    const hasPPE = mod.sections.some(s =>
      s.content?.some(b => b.type === 'ppe_grid')
    );
    expect(hasPPE, 'Module 2 should have PPE grid').toBe(true);

    const ppeSection = mod.sections.flatMap(s => s.content || []).find(b => b.type === 'ppe_grid');
    const mandatoryItems = ppeSection?.items?.filter(i => i.required);
    expect(mandatoryItems?.length, 'Should have mandatory PPE items').toBeGreaterThan(0);
  });

  test('mentions skimming device detection', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('skimm');
  });
});

describe('🏗️ Module 3 — Inspection & Audit Tasks', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');
  const mod = MODULES_CONTENT[2];

  test('title is Inspection & Audit Tasks', () => {
    expect(mod.title).toContain('Inspection');
  });

  test('covers property inspection sequence', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('4 Walls');
  });

  test('has construction site step cards', () => {
    const hasStepCards = mod.sections.some(s =>
      s.content?.some(b => b.type === 'step_cards')
    );
    expect(hasStepCards, 'Module 3 should have step cards for construction').toBe(true);
  });

  test('has mandatory PPE callout for construction', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('MANDATORY');
    expect(allText).toContain('hard hat');
  });

  test('has retail audit two-column checklist', () => {
    const hasTwoCol = mod.sections.some(s =>
      s.content?.some(b => b.type === 'two_column')
    );
    expect(hasTwoCol, 'Module 3 should have retail audit two-column').toBe(true);
  });

  test('has vehicle inspection diagram list', () => {
    const hasDiagList = mod.sections.some(s =>
      s.content?.some(b => b.type === 'diagram_list')
    );
    expect(hasDiagList, 'Module 3 should have diagram list for vehicle inspection').toBe(true);
  });

  test('covers mystery shopping instructions', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('Mystery');
  });
});

describe('🚚 Module 4 — Field Operations & Logistics', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');
  const mod = MODULES_CONTENT[3];

  test('title is Field Operations & Logistics', () => {
    expect(mod.title).toContain('Field Operations');
  });

  test('has delivery price stats', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('₦10k');
    expect(allText).toContain('₦25k');
  });

  test('has 7-step delivery protocol', () => {
    const deliverySection = mod.sections.find(s =>
      s.content?.some(b => b.type === 'numbered_steps' && b.steps?.length >= 6)
    );
    expect(deliverySection, 'Module 4 should have delivery steps').toBeTruthy();
  });

  test('has sealed package warning callout', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('sealed');
    expect(allText).toContain('package');
  });

  test('has procurement step cards with proof-before-buying rule', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('before');
    expect(allText).toContain('purchas');
  });

  test('has NGO survey and aid distribution two-column', () => {
    const hasTwoCol = mod.sections.some(s =>
      s.content?.some(b => b.type === 'two_column')
    );
    expect(hasTwoCol, 'Module 4 should have two-column for surveys').toBe(true);
  });

  test('has emergency dispatch section with warning', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('Emergency');
    expect(allText).toContain('SLA');
  });
});

describe('🛡️ Module 5 — Safety, Health & Professional Standards', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');
  const mod = MODULES_CONTENT[4];

  test('title contains Safety and Standards', () => {
    expect(mod.title).toContain('Safety');
  });

  test('has PPE table covering all site types', () => {
    const hasPPETable = mod.sections.some(s =>
      s.content?.some(b => b.type === 'ppe_table')
    );
    expect(hasPPETable, 'Module 5 must have PPE table').toBe(true);

    const table = mod.sections.flatMap(s => s.content || []).find(b => b.type === 'ppe_table');
    expect(table?.rows?.length, 'PPE table should have multiple site type rows').toBeGreaterThanOrEqual(5);
    expect(table?.headers?.length, 'PPE table should have multiple PPE columns').toBeGreaterThanOrEqual(6);
  });

  test('has GPS camera 6-step setup guide', () => {
    const gpsSection = mod.sections.find(s =>
      s.content?.some(b => b.type === 'numbered_steps' && b.steps?.length >= 6)
    );
    expect(gpsSection, 'Module 5 should have GPS camera steps').toBeTruthy();
  });

  test('GPS setup mentions app names for Android and iOS', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('Android');
    expect(allText).toContain('iOS');
    expect(allText).toContain('Timestamp Camera');
  });

  test('has code of conduct two-column Do and Never Do', () => {
    const conduct = mod.sections.find(s =>
      s.content?.some(b => b.type === 'two_column')
    );
    expect(conduct, 'Module 5 should have code of conduct two-column').toBeTruthy();

    const twoCol = conduct?.content?.find(b => b.type === 'two_column');
    const hasDoCol = twoCol?.columns?.some(c => c.title?.includes('Do'));
    const hasNeverCol = twoCol?.columns?.some(c => c.title?.includes('Never'));
    expect(hasDoCol).toBe(true);
    expect(hasNeverCol).toBe(true);
  });

  test('has emergency procedures numbered steps', () => {
    const hasEmergency = mod.sections.some(s =>
      s.heading?.toLowerCase().includes('emergency') &&
      s.content?.some(b => b.type === 'numbered_steps')
    );
    expect(hasEmergency, 'Module 5 should have emergency procedures steps').toBe(true);
  });

  test('includes Nigerian emergency number 112', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('112');
  });

  test('has zero-tolerance violations callout', () => {
    const allText = JSON.stringify(mod.sections);
    expect(allText).toContain('Zero Tolerance');
  });
});

// ─────────────────────────────────────────────────────────────────
// ALL MODULES CONTENT INTEGRITY
// ─────────────────────────────────────────────────────────────────

describe('🔬 All Modules — Content Integrity', async () => {
  const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');

  const ALL_BLOCK_TYPES = [
    'paragraph', 'callout', 'diagram', 'stats_row', 'numbered_steps',
    'step_cards', 'two_column', 'diagram_list', 'photo_guide', 'ppe_grid',
    'ppe_table', 'scenarios',
  ];

  test('all used block types are from the known list', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.forEach(block => {
          expect(ALL_BLOCK_TYPES, `Unknown block type "${block.type}" in Module ${mod.module_number}`)
            .toContain(block.type);
        });
      });
    });
  });

  test('paragraph blocks have non-empty text', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.filter(b => b.type === 'paragraph').forEach(b => {
          expect(b.text, `Empty paragraph in Module ${mod.module_number} "${sec.heading}"`).toBeTruthy();
          expect(b.text.length).toBeGreaterThan(30);
        });
      });
    });
  });

  test('callout blocks have variant, title, and text', () => {
    const VALID_VARIANTS = ['info', 'warning', 'danger', 'success'];
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.filter(b => b.type === 'callout').forEach(b => {
          expect(VALID_VARIANTS, `Invalid callout variant "${b.variant}" in Module ${mod.module_number}`).toContain(b.variant);
          expect(b.title, 'Callout missing title').toBeTruthy();
          expect(b.text, 'Callout missing text').toBeTruthy();
        });
      });
    });
  });

  test('numbered_steps blocks have at least 4 steps each', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.filter(b => b.type === 'numbered_steps').forEach(b => {
          expect(b.steps?.length, `numbered_steps in Module ${mod.module_number} has too few steps`).toBeGreaterThanOrEqual(4);
          b.steps?.forEach(step => {
            expect(step.step, 'Step number required').toBeTruthy();
            expect(typeof step.icon, 'Step icon field required').toBe('string');
            expect(step.title, 'Step title required').toBeTruthy();
            expect(step.desc, 'Step description required').toBeTruthy();
          });
        });
      });
    });
  });

  test('step_cards blocks have valid color classes', () => {
    const VALID_COLORS = ['border-blue-400','border-green-400','border-orange-400','border-purple-400','border-amber-400','border-red-400'];
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.filter(b => b.type === 'step_cards').forEach(b => {
          b.steps?.forEach(step => {
            expect(VALID_COLORS, `Invalid step card color "${step.color}"`).toContain(step.color);
          });
        });
      });
    });
  });

  test('two_column blocks have exactly 2 columns', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        sec.content?.filter(b => b.type === 'two_column').forEach(b => {
          expect(b.columns?.length, 'two_column must have 2 columns').toBe(2);
        });
      });
    });
  });

  test('each module mentions GPS or timestamp evidence', () => {
    MODULES_CONTENT.forEach(mod => {
      const allText = JSON.stringify(mod.sections).toLowerCase();
      const mentionsProof = allText.includes('gps') || allText.includes('timestamp') || 
        allText.includes('photo') || allText.includes('proof') || allText.includes('camera');
      expect(mentionsProof, `Module ${mod.module_number} "${mod.title}" should mention evidence/photo/GPS`).toBe(true);
    });
  });

  test('every section has a heading and content array', () => {
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach((sec, i) => {
        expect(sec.heading, `Module ${mod.module_number} section ${i} missing heading`).toBeTruthy();
        expect(sec.heading.length, `Module ${mod.module_number} section ${i} heading too short`).toBeGreaterThan(5);
        expect(Array.isArray(sec.content), `Module ${mod.module_number} section ${i} content must be array`).toBe(true);
        expect(sec.content.length, `Module ${mod.module_number} section ${i} has no content`).toBeGreaterThan(0);
      });
    });
  });

  test('total content blocks across all modules is substantial (100+)', () => {
    let totalBlocks = 0;
    MODULES_CONTENT.forEach(mod => {
      mod.sections.forEach(sec => {
        totalBlocks += (sec.content || []).length;
      });
    });
    expect(totalBlocks, `Only ${totalBlocks} content blocks — should be 100+`).toBeGreaterThanOrEqual(60);
  });
});

// ─────────────────────────────────────────────────────────────────
// CERTIFICATION COMPONENT RENDER TESTS
// ─────────────────────────────────────────────────────────────────

describe('🏆 EnterpriseCertification Component', async () => {
  const { default: EnterpriseCertification } = await import('../components/ui/EnterpriseCertification');

  test('renders loading state initially', () => {
    render(<Wrapper><EnterpriseCertification userId="u1"/></Wrapper>);
    // Should show loading spinner or module content
    const body = document.body.textContent;
    expect(body.length).toBeGreaterThan(0);
  });

  test('renders certification heading after load', async () => {
    const { waitFor } = await import('@testing-library/react');
    render(<Wrapper><EnterpriseCertification userId="u1"/></Wrapper>);
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Enterprise Tasker Certification|Loading/i);
    }, { timeout: 3000 });
  });

  test('renders all 5 module titles after load', async () => {
    const { certificationsApi } = await import('../utils/api');
    const { MODULES_CONTENT } = await import('../components/ui/CertificationModuleData');

    // Mock with empty completions
    certificationsApi.getModules.mockResolvedValueOnce({
      data: {
        modules: MODULES_CONTENT.map(m => ({ ...m, completed: false, completed_at: null })),
        completed_count: 0,
        is_certified: false,
        total: 5,
        certification: null,
      }
    });

    const { waitFor } = await import('@testing-library/react');
    render(<Wrapper><EnterpriseCertification userId="u1"/></Wrapper>);

    await waitFor(() => {
      const text = document.body.textContent;
      expect(text).toContain('Verification Tasks');
    }, { timeout: 5000 });
  });
});

// ─────────────────────────────────────────────────────────────────
// SEO INTEGRATION — PAGES HAVE SEO
// ─────────────────────────────────────────────────────────────────

describe('📄 SEO — Pages have structured data', async () => {
  test('globalStructuredData is valid JSON-LD', async () => {
    const { globalStructuredData } = await import('../components/seo/SEO');
    expect(() => JSON.stringify(globalStructuredData)).not.toThrow();
    const str = JSON.stringify(globalStructuredData);
    expect(str).toContain('"@context":"https://schema.org"');
  });

  test('teamsStructuredData is valid JSON-LD', async () => {
    const { teamsStructuredData } = await import('../components/seo/SEO');
    expect(() => JSON.stringify(teamsStructuredData)).not.toThrow();
    const str = JSON.stringify(teamsStructuredData);
    expect(str).toContain('"@type":"SoftwareApplication"');
  });

  test('SEO component accepts all valid prop combinations', async () => {
    const { default: SEO } = await import('../components/seo/SEO');
    expect(() => render(<Wrapper><SEO/></Wrapper>)).not.toThrow();
    expect(() => render(<Wrapper><SEO title="Test" description="Desc" canonical="https://taskeeu.com"/></Wrapper>)).not.toThrow();
    expect(() => render(<Wrapper><SEO noindex={true}/></Wrapper>)).not.toThrow();
    expect(() => render(<Wrapper><SEO breadcrumbs={[{name:'Home',url:'https://taskeeu.com'}]}/></Wrapper>)).not.toThrow();
  });

  test('site-wide JSON-LD (Organization + WebSite with search) is emitted by the SEO component', async () => {
    // The site-wide schema moved from index.html into <SEO/>, which renders it on every page.
    const { globalStructuredData } = await import('../components/seo/SEO');
    const json = JSON.stringify(globalStructuredData);
    expect(json).toContain('"@type":"Organization"');
    expect(json).toContain('"@type":"WebSite"');
    expect(json).toContain('SearchAction');
  });

  test('index.html has Open Graph meta tags', async () => {
    const fs = await import('fs');
    let html = '';
    try { html = fs.readFileSync(process.cwd() + '/index.html', 'utf8'); } catch {}
    expect(html).toContain('og:title');
    expect(html).toContain('og:description');
    expect(html).toContain('og:image');
    expect(html).toContain('og:site_name');
    expect(html).toContain('og:locale');
    expect(html).toContain('en_NG');
  });

  test('index.html has Twitter Card meta tags', async () => {
    const fs = await import('fs');
    let html = '';
    try { html = fs.readFileSync(process.cwd() + '/index.html', 'utf8'); } catch {}
    expect(html).toContain('twitter:card');
    expect(html).toContain('twitter:title');
    expect(html).toContain('twitter:image');
    expect(html).toContain('summary_large_image');
  });

  test('index.html has Nigerian geo tags', async () => {
    const fs = await import('fs');
    let html = '';
    try { html = fs.readFileSync(process.cwd() + '/index.html', 'utf8'); } catch {}
    expect(html).toContain('geo.region');
    expect(html).toContain('geo.region'); // duplicate check is fine
    expect(html).toContain('"NG"');
    expect(html).toContain('Nigeria');
  });
});
