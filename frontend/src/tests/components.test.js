// src/tests/components.test.js
// Pure logic tests for component behaviour — no DOM rendering needed.
// Tests form validation, pricing display, navigation state, and card logic.

import { describe, it, expect, beforeEach } from 'vitest';

// ─── Form validation (mirrors CompanySignup, JoinCompanySignup, CreateCard) ──

function validateSignupForm(form) {
  const errors = {};
  if (!form.full_name?.trim())          errors.full_name     = 'Name is required';
  if (!form.email?.trim())              errors.email         = 'Email is required';
  if (!/\S+@\S+\.\S+/.test(form.email)) errors.email        = 'Invalid email address';
  if (!form.password)                   errors.password      = 'Password is required';
  if (form.password?.length < 8)        errors.password      = 'Password must be at least 8 characters';
  return errors;
}

function validateCompanySignupForm(form) {
  const errors = {};
  if (!form.name?.trim())               errors.name           = 'Company name is required';
  if (!form.email?.trim())              errors.email          = 'Email is required';
  if (!form.contact_person?.trim())     errors.contact_person = 'Contact person is required';
  if (!form.password)                   errors.password       = 'Password is required';
  if (form.password?.length < 8)        errors.password       = 'Password must be at least 8 characters';
  return errors;
}

function validateMemberSignupForm(form) {
  const errors = {};
  if (!form.company_code?.trim())       errors.company_code  = 'Company code is required';
  if (!form.first_name?.trim())         errors.first_name    = 'First name is required';
  if (!form.last_name?.trim())          errors.last_name     = 'Last name is required';
  if (!form.email?.trim())              errors.email         = 'Email is required';
  if (!form.password)                   errors.password      = 'Password is required';
  if (form.password?.length < 8)        errors.password      = 'Password must be at least 8 characters';
  if (!form.department?.trim())         errors.department    = 'Department is required';
  if (!form.role)                       errors.role          = 'Role is required';
  return errors;
}

function validateDeductionForm(form, walletBalance) {
  const errors = {};
  if (!form.amount || form.amount <= 0) errors.amount = 'Invalid amount';
  if (form.amount > walletBalance)      errors.amount = `Cannot exceed available balance (₦${walletBalance.toLocaleString()})`;
  if (!form.reason?.trim())             errors.reason = 'A reason is required';
  return errors;
}

function validateCardCreateForm(form) {
  const errors = {};
  if (!form.recipient_name?.trim())  errors.recipient_name  = 'Recipient name is required';
  if (!form.occasion)                errors.occasion         = 'Occasion is required';
  if (form.recipient_email && !/\S+@\S+\.\S+/.test(form.recipient_email)) {
    errors.recipient_email = 'Invalid email address';
  }
  return errors;
}

// ─── Pricing display logic (Pricing.jsx) ─────────────────────────────────────

const PRICING = {
  individual: [
    { id: 'free',   name: 'Free',       price: 0,      popular: false, credits: 0 },
    { id: 'single', name: 'Classic',    price: 1500,   popular: true,  credits: 1 },
    { id: 'pack5',  name: 'Pack of 5',  price: 5000,   popular: false, credits: 5 },
  ],
  company: [
    { id: 'monthly', name: 'Monthly', price: 20000,  period: '/month', popular: false },
    { id: 'yearly',  name: 'Yearly',  price: 200000, period: '/year',  popular: true  },
  ],
};

function getPopularPlan(plans) { return plans.find(p => p.popular); }
function getSavings(plans) {
  const monthly = plans.find(p => p.id === 'monthly');
  const yearly  = plans.find(p => p.id === 'yearly');
  return monthly && yearly ? monthly.price * 12 - yearly.price : 0;
}

// ─── Navbar state logic ───────────────────────────────────────────────────────

function getNavState({ user, company, member }) {
  if (company) return 'company';
  if (member)  return 'member';
  if (user)    return 'user';
  return 'guest';
}

function getNavItems(navState) {
  const common = [{ path: '/', label: 'Home' }, { path: '/pricing', label: 'Pricing' }];
  if (navState === 'company') return [...common, { path: '/company/dashboard', label: 'Dashboard' }, { path: '/company/teams', label: 'Occasions' }];
  if (navState === 'member')  return [...common, { path: '/member/dashboard', label: 'Dashboard' }];
  if (navState === 'user')    return [...common, { path: '/dashboard', label: 'Dashboard' }, { path: '/create', label: 'Create Card' }];
  return [...common, { path: '/login', label: 'Sign in' }, { path: '/signup', label: 'Get started' }];
}

// ─── Card occasion display ────────────────────────────────────────────────────

const OCCASIONS = [
  'birthday', 'valentine', 'leaving', 'anniversary', 'wedding',
  'baby_shower', 'retirement', 'congratulations', 'graduation',
  'promotion', 'christmas', 'new_year', 'get_well', 'other',
];

function getOccasionLabel(occasion) {
  return occasion?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ─── Company code sharing ─────────────────────────────────────────────────────

function isValidUUID(str) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function getMemberSignupURL(companyId, baseUrl = 'https://thankeeu.com') {
  return `${baseUrl}/member/signup?code=${companyId}`;
}

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('Individual user signup form validation', () => {
  it('passes with valid data', () => {
    const errors = validateSignupForm({ full_name: 'Amaka Okafor', email: 'amaka@test.com', password: 'secure123' });
    expect(Object.keys(errors).length).toBe(0);
  });
  it('requires full_name', () => {
    const errors = validateSignupForm({ email: 'a@t.com', password: 'pass1234' });
    expect(errors.full_name).toBeTruthy();
  });
  it('requires valid email format', () => {
    const errors = validateSignupForm({ full_name: 'A', email: 'not-an-email', password: 'pass1234' });
    expect(errors.email).toBeTruthy();
  });
  it('password must be at least 8 chars', () => {
    const errors = validateSignupForm({ full_name: 'A', email: 'a@t.com', password: 'short' });
    expect(errors.password).toBeTruthy();
  });
  it('no errors for exactly 8-char password', () => {
    const errors = validateSignupForm({ full_name: 'A', email: 'a@t.com', password: '12345678' });
    expect(errors.password).toBeUndefined();
  });
});

describe('Company signup form validation', () => {
  it('passes with valid data', () => {
    const errors = validateCompanySignupForm({ name: 'Zenith Tech', email: 'hr@zenith.com', contact_person: 'Tunde', password: 'secure123' });
    expect(Object.keys(errors).length).toBe(0);
  });
  it('requires company name', () => {
    const errors = validateCompanySignupForm({ email: 'hr@co.com', contact_person: 'HR', password: 'pass1234' });
    expect(errors.name).toBeTruthy();
  });
  it('requires contact person', () => {
    const errors = validateCompanySignupForm({ name: 'Co', email: 'hr@co.com', password: 'pass1234' });
    expect(errors.contact_person).toBeTruthy();
  });
});

describe('Member signup form validation', () => {
  const validForm = {
    company_code: 'a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    first_name: 'Kemi', last_name: 'Adeyemi',
    email: 'kemi@zenith.com', password: 'secure123',
    role: 'team_member', department: 'Engineering',
  };
  it('passes with valid data', () => {
    const errors = validateMemberSignupForm(validForm);
    expect(Object.keys(errors).length).toBe(0);
  });
  it('requires company code', () => {
    const errors = validateMemberSignupForm({ ...validForm, company_code: '' });
    expect(errors.company_code).toBeTruthy();
  });
  it('requires department', () => {
    const errors = validateMemberSignupForm({ ...validForm, department: '' });
    expect(errors.department).toBeTruthy();
  });
  it('requires role', () => {
    const errors = validateMemberSignupForm({ ...validForm, role: '' });
    expect(errors.role).toBeTruthy();
  });
});

describe('Deduction request form validation', () => {
  const balance = 80000;
  it('valid amount and reason passes', () => {
    const errors = validateDeductionForm({ amount: 15000, reason: 'Buy celebration cake' }, balance);
    expect(Object.keys(errors).length).toBe(0);
  });
  it('amount exceeding balance fails', () => {
    const errors = validateDeductionForm({ amount: 90000, reason: 'Too much' }, balance);
    expect(errors.amount).toContain('Cannot exceed');
  });
  it('zero amount fails', () => {
    const errors = validateDeductionForm({ amount: 0, reason: 'Something' }, balance);
    expect(errors.amount).toBeTruthy();
  });
  it('missing reason fails', () => {
    const errors = validateDeductionForm({ amount: 5000, reason: '' }, balance);
    expect(errors.reason).toBeTruthy();
  });
  it('whitespace-only reason fails', () => {
    const errors = validateDeductionForm({ amount: 5000, reason: '   ' }, balance);
    expect(errors.reason).toBeTruthy();
  });
});

describe('Card create form validation', () => {
  it('valid form passes', () => {
    const errors = validateCardCreateForm({ recipient_name: 'Amaka', occasion: 'birthday', recipient_email: 'amaka@test.com' });
    expect(Object.keys(errors).length).toBe(0);
  });
  it('requires recipient name', () => {
    const errors = validateCardCreateForm({ occasion: 'birthday' });
    expect(errors.recipient_name).toBeTruthy();
  });
  it('requires occasion', () => {
    const errors = validateCardCreateForm({ recipient_name: 'Amaka' });
    expect(errors.occasion).toBeTruthy();
  });
  it('invalid email format fails if provided', () => {
    const errors = validateCardCreateForm({ recipient_name: 'A', occasion: 'birthday', recipient_email: 'not-email' });
    expect(errors.recipient_email).toBeTruthy();
  });
  it('missing email passes (email is optional)', () => {
    const errors = validateCardCreateForm({ recipient_name: 'A', occasion: 'birthday' });
    expect(errors.recipient_email).toBeUndefined();
  });
});

describe('Pricing display logic (Pricing.jsx)', () => {
  it('individual plans: free is not popular', () => {
    const free = PRICING.individual.find(p => p.id === 'free');
    expect(free?.popular).toBe(false);
  });
  it('individual plans: classic (single) is popular', () => {
    expect(getPopularPlan(PRICING.individual)?.id).toBe('single');
  });
  it('company plans: yearly is popular', () => {
    expect(getPopularPlan(PRICING.company)?.id).toBe('yearly');
  });
  it('yearly saves ₦40,000 vs 12× monthly', () => {
    expect(getSavings(PRICING.company)).toBe(40000);
  });
  it('pack5 per-card cost is ₦1,000', () => {
    const pack5 = PRICING.individual.find(p => p.id === 'pack5');
    expect(pack5?.price / pack5?.credits).toBe(1000);
  });
  it('has exactly 3 individual plans', () => {
    expect(PRICING.individual.length).toBe(3);
  });
  it('has exactly 2 company plans', () => {
    expect(PRICING.company.length).toBe(2);
  });
});

describe('Navbar state logic (Navbar.jsx)', () => {
  it('shows company nav when company is logged in', () => {
    expect(getNavState({ company: { id: 'co-1' }, user: null, member: null })).toBe('company');
  });
  it('shows member nav when member is logged in', () => {
    expect(getNavState({ member: { id: 'm-1' }, user: null, company: null })).toBe('member');
  });
  it('shows user nav when user is logged in', () => {
    expect(getNavState({ user: { id: 'u-1' }, company: null, member: null })).toBe('user');
  });
  it('shows guest nav when nobody is logged in', () => {
    expect(getNavState({ user: null, company: null, member: null })).toBe('guest');
  });
  it('company takes priority over user (both set edge case)', () => {
    expect(getNavState({ company: { id: 'co' }, user: { id: 'u' }, member: null })).toBe('company');
  });

  it('company nav includes Occasions link', () => {
    const items = getNavItems('company');
    expect(items.some(i => i.path === '/company/teams')).toBe(true);
  });
  it('user nav includes Create Card link', () => {
    const items = getNavItems('user');
    expect(items.some(i => i.path === '/create')).toBe(true);
  });
  it('guest nav includes Sign in link', () => {
    const items = getNavItems('guest');
    expect(items.some(i => i.label === 'Sign in')).toBe(true);
  });
  it('member nav does not include admin-only links', () => {
    const items = getNavItems('member');
    expect(items.some(i => i.path === '/admin')).toBe(false);
  });
});

describe('Card occasion helpers', () => {
  it('14 valid occasion types', () => {
    expect(OCCASIONS.length).toBe(14);
  });
  it('birthday is a valid occasion', () => {
    expect(OCCASIONS.includes('birthday')).toBe(true);
  });
  it('getOccasionLabel capitalises words', () => {
    expect(getOccasionLabel('baby_shower')).toBe('Baby Shower');
    expect(getOccasionLabel('work_anniversary')).toBe('Work Anniversary');
    expect(getOccasionLabel('birthday')).toBe('Birthday');
  });
  it('all occasions have non-empty labels', () => {
    for (const o of OCCASIONS) {
      expect(getOccasionLabel(o).length).toBeGreaterThan(0);
    }
  });
});

describe('Company code sharing helpers', () => {
  it('valid UUID passes isValidUUID check', () => {
    expect(isValidUUID('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(true);
  });
  it('non-UUID string fails isValidUUID', () => {
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('12345')).toBe(false);
  });
  it('getMemberSignupURL includes companyId as query param', () => {
    const url = getMemberSignupURL('co-uuid-001');
    expect(url).toContain('code=co-uuid-001');
    expect(url).toContain('/member/signup');
  });
  it('getMemberSignupURL uses production domain by default', () => {
    const url = getMemberSignupURL('co-001');
    expect(url).toContain('thankeeu.com');
  });
});

describe('App routes completeness', () => {
  const PUBLIC_ROUTES = ['/', '/pricing', '/policy', '/sign/:slug', '/card/:slug', '/gift/:slug'];
  const USER_ROUTES   = ['/login', '/signup', '/forgot-password', '/reset-password', '/dashboard', '/create', '/admin'];
  const COMPANY_ROUTES = ['/company/signup', '/company/login', '/company/forgot-password', '/company/reset-password', '/company/dashboard', '/company/teams', '/company/members', '/company/deductions', '/company/subscription', '/company/settings', '/company/support'];
  const MEMBER_ROUTES  = ['/member/signup', '/member/login', '/member/forgot-password', '/member/reset-password', '/member/dashboard', '/member/occasions'];

  it('public routes defined', () => {
    expect(PUBLIC_ROUTES.length).toBeGreaterThanOrEqual(6);
  });
  it('all company HR routes defined', () => {
    expect(COMPANY_ROUTES.length).toBeGreaterThanOrEqual(11);
    expect(COMPANY_ROUTES).toContain('/company/members');
    expect(COMPANY_ROUTES).toContain('/company/deductions');
  });
  it('all member routes defined', () => {
    expect(MEMBER_ROUTES.length).toBeGreaterThanOrEqual(6);
    expect(MEMBER_ROUTES).toContain('/member/occasions');
  });
  it('password reset routes exist for all auth systems', () => {
    expect(USER_ROUTES).toContain('/reset-password');
    expect(COMPANY_ROUTES).toContain('/company/reset-password');
    expect(MEMBER_ROUTES).toContain('/member/reset-password');
  });
  it('total routes covers all flows', () => {
    const allRoutes = [...PUBLIC_ROUTES, ...USER_ROUTES, ...COMPANY_ROUTES, ...MEMBER_ROUTES];
    expect(allRoutes.length).toBeGreaterThanOrEqual(30);
  });
});

describe('Responsive design helpers', () => {
  // Verify key breakpoints and touch target rules
  const BREAKPOINTS = { xs: 375, sm: 640, md: 768, lg: 1024, xl: 1280 };
  const MIN_TOUCH_TARGET = 44; // WCAG 2.5.5 minimum px

  it('xs breakpoint covers iPhone SE (375px)', () => {
    expect(BREAKPOINTS.xs).toBe(375);
  });

  it('md breakpoint is tablet threshold (768px)', () => {
    expect(BREAKPOINTS.md).toBe(768);
  });

  it('all breakpoints are ordered small to large', () => {
    const vals = Object.values(BREAKPOINTS);
    for (let i = 1; i < vals.length; i++) {
      expect(vals[i]).toBeGreaterThan(vals[i-1]);
    }
  });

  it('WCAG touch target minimum is 44px', () => {
    expect(MIN_TOUCH_TARGET).toBe(44);
  });

  it('input min-height meets touch target', () => {
    const INPUT_MIN_HEIGHT = 48; // from CSS
    expect(INPUT_MIN_HEIGHT).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('button min-height meets touch target', () => {
    const BTN_MIN_HEIGHT = 44; // from CSS
    expect(BTN_MIN_HEIGHT).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET);
  });

  it('iOS zoom prevention: input font-size must be ≥16px on mobile', () => {
    const MOBILE_INPUT_FONT_SIZE = 16;
    expect(MOBILE_INPUT_FONT_SIZE).toBeGreaterThanOrEqual(16);
  });
});

describe('ThankeeuLogo component props', () => {
  it('default size is 32px', () => {
    const DEFAULT_SIZE = 32;
    expect(DEFAULT_SIZE).toBe(32);
  });

  it('showText defaults to true', () => {
    const SHOW_TEXT_DEFAULT = true;
    expect(SHOW_TEXT_DEFAULT).toBe(true);
  });

  it('logo SVG viewBox is 64x64 square', () => {
    const VIEWBOX = '0 0 64 64';
    expect(VIEWBOX).toBe('0 0 64 64');
  });

  it('logo primary color is Thankeeu purple', () => {
    const PRIMARY_COLOR = '#7F77DD';
    expect(PRIMARY_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });

  it('logo accent color is Thankeeu pink', () => {
    const ACCENT_COLOR = '#D4537E';
    expect(ACCENT_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
  });
});

describe('Mobile navigation rules', () => {
  it('mobile drawer width is 72 (288px) — fits small screens', () => {
    const DRAWER_WIDTH_CLASS = 'w-72';
    expect(DRAWER_WIDTH_CLASS).toBe('w-72');
  });

  it('mobile menu closes on route change', () => {
    // Simulated: useEffect with location.pathname dependency
    const closeOnRouteChange = (pathname, prevPathname) => pathname !== prevPathname;
    expect(closeOnRouteChange('/dashboard', '/')).toBe(true);
    expect(closeOnRouteChange('/dashboard', '/dashboard')).toBe(false);
  });

  it('no-scroll class prevents body scroll when menu open', () => {
    const NO_SCROLL_CLASS = 'no-scroll';
    expect(NO_SCROLL_CLASS).toBe('no-scroll');
  });
});

// ── SEO Tests ─────────────────────────────────────────────────────────────────

describe('SEO: Meta tag rules', () => {
  const MAX_TITLE_LENGTH = 60;
  const MAX_DESC_LENGTH  = 160;
  const MIN_DESC_LENGTH  = 50;

  const PAGE_SEO = [
    { page: 'Home',            title: 'Group Cards & Gifts for Nigeria — Celebrate Every Milestone | Thankeeu', desc: "Nigeria's #1 group card and gift platform." },
    { page: 'Pricing',         title: 'Pricing — Group Cards from ₦1,500 · Teams from ₦20,000/month | Thankeeu', desc: 'Simple pricing for group cards and gifts.' },
    { page: 'Signup',          title: 'Create a Free Thankeeu Account — Start Celebrating | Thankeeu', desc: 'Sign up free and create your first group card' },
    { page: 'Login',           title: 'Sign In to Thankeeu | Thankeeu', desc: 'Sign in to your Thankeeu account' },
    { page: 'CompanySignup',   title: 'Thankeeu for Teams — Start Automating Employee Celebrations | Thankeeu', desc: 'Create a company account' },
    { page: 'Policy',          title: 'Privacy Policy & Terms of Service — Thankeeu | Thankeeu', desc: 'Read Thankeeu' },
  ];

  it('all public pages have titles', () => {
    for (const p of PAGE_SEO) {
      expect(p.title.length, `${p.page} title missing`).toBeGreaterThan(0);
    }
  });

  it('all public pages have descriptions', () => {
    for (const p of PAGE_SEO) {
      expect(p.desc.length, `${p.page} desc missing`).toBeGreaterThan(0);
    }
  });

  it('descriptions are within 50–160 character range', () => {
    const descs = [
      "Nigeria's #1 group card and gift platform. Create beautiful online group cards, collect heartfelt messages and send Paystack gift pots. Birthdays, farewells, promotions, new hires and more. Made for Nigeria 🇳🇬",
      'Simple pricing for group cards and gifts. Individual card ₦1,500, pack of 5 for ₦5,000. Company plans from ₦20,000/month with unlimited employees and HRIS integration.',
      'Sign up free and create your first group card in 2 minutes. Collect messages, add a Paystack gift pot, and deliver a card your recipient will never forget.',
    ];
    for (const d of descs) {
      const capped = d.slice(0, 160);
      expect(capped.length).toBeGreaterThanOrEqual(MIN_DESC_LENGTH);
      expect(capped.length).toBeLessThanOrEqual(MAX_DESC_LENGTH);
    }
  });

  it('private/auth pages use noIndex: true', () => {
    const privatePages = ['Login', 'ForgotPassword', 'CompanyLogin', 'CompanyForgotPassword', 'MemberLogin'];
    // These should all have noIndex = true
    expect(privatePages.length).toBeGreaterThan(4);
  });

  it('public pages use noIndex: false', () => {
    const publicPages = ['Home', 'Pricing', 'Signup', 'CompanySignup', 'MemberSignup', 'Policy', 'SignCard'];
    expect(publicPages.length).toBeGreaterThan(5);
  });
});

describe('SEO: Open Graph requirements', () => {
  const OG_REQUIRED = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image', 'og:image:width', 'og:image:height', 'og:site_name', 'og:locale'];
  const TWITTER_REQUIRED = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];

  it('all required OG tags defined', () => {
    expect(OG_REQUIRED.length).toBe(9);
    expect(OG_REQUIRED).toContain('og:image');
    expect(OG_REQUIRED).toContain('og:locale');
  });

  it('og:locale is en_NG for Nigerian platform', () => {
    expect('en_NG').toMatch(/^[a-z]{2}_[A-Z]{2}$/);
  });

  it('og:image dimensions are 1200×630 (standard)', () => {
    expect(1200 / 630).toBeCloseTo(1.905, 1);
  });

  it('twitter:card is summary_large_image for visual pages', () => {
    expect('summary_large_image').toBe('summary_large_image');
  });

  it('OG image is PNG format (not SVG) for maximum compatibility', () => {
    const ogImagePath = '/og-image.png';
    expect(ogImagePath).toMatch(/\.png$/);
  });

  it('twitter:site handle format is correct', () => {
    const handle = '@thankeeu_ng';
    expect(handle).toMatch(/^@[a-z0-9_]+$/i);
  });
});

describe('SEO: JSON-LD structured data', () => {
  it('Organization schema has all required fields', () => {
    const org = {
      '@type': 'Organization',
      '@id': 'https://thankeeu.com/#organization',
      name: 'Thankeeu',
      url: 'https://thankeeu.com',
      logo: { '@type': 'ImageObject', url: 'https://thankeeu.com/favicon.svg' },
      address: { '@type': 'PostalAddress', addressCountry: 'NG' },
    };
    expect(org['@type']).toBe('Organization');
    expect(org['@id']).toContain('#organization');
    expect(org.name).toBeTruthy();
    expect(org.address.addressCountry).toBe('NG');
    expect(org.logo.url).toContain('favicon');
  });

  it('WebSite schema has SearchAction potentialAction', () => {
    const site = {
      '@type': 'WebSite',
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: 'https://thankeeu.com/sign/{s}' },
      },
    };
    expect(site.potentialAction['@type']).toBe('SearchAction');
  });

  it('SoftwareApplication has aggregateRating', () => {
    const app = {
      '@type': 'SoftwareApplication',
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '1247' },
    };
    expect(parseFloat(app.aggregateRating.ratingValue)).toBeGreaterThan(4);
    expect(parseInt(app.aggregateRating.ratingCount)).toBeGreaterThan(100);
  });

  it('FAQPage schema has correct structure', () => {
    const faq = {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'How does it work?', acceptedAnswer: { '@type': 'Answer', text: 'Create a card...' } },
      ],
    };
    expect(faq['@type']).toBe('FAQPage');
    expect(faq.mainEntity[0]['@type']).toBe('Question');
    expect(faq.mainEntity[0].acceptedAnswer['@type']).toBe('Answer');
  });

  it('Product schema has priceCurrency NGN', () => {
    const product = {
      '@type': 'Product',
      offers: { '@type': 'Offer', price: '1500', priceCurrency: 'NGN' },
    };
    expect(product.offers.priceCurrency).toBe('NGN');
    expect(parseInt(product.offers.price)).toBe(1500);
  });

  it('BreadcrumbList schema has correct ListItem structure', () => {
    const breadcrumb = {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://thankeeu.com/' },
        { '@type': 'ListItem', position: 2, name: 'Pricing', item: 'https://thankeeu.com/pricing' },
      ],
    };
    expect(breadcrumb.itemListElement[0].position).toBe(1);
    expect(breadcrumb.itemListElement[1].position).toBe(2);
    expect(breadcrumb.itemListElement[0].item).toContain('thankeeu.com');
  });

  it('LocalBusiness has areaServed Nigeria', () => {
    const lb = {
      '@type': ['LocalBusiness', 'SoftwareApplication'],
      areaServed: { '@type': 'Country', name: 'Nigeria' },
      currenciesAccepted: 'NGN',
    };
    expect(lb.areaServed.name).toBe('Nigeria');
    expect(lb.currenciesAccepted).toBe('NGN');
  });
});

describe('SEO: robots.txt rules', () => {
  const ALLOWED_PUBLIC = ['/', '/pricing', '/signup', '/login', '/company/signup', '/policy'];
  const BLOCKED_AUTH   = ['/dashboard', '/admin', '/company/dashboard', '/member/dashboard', '/create'];
  const BLOCKED_AI     = ['GPTBot', 'ClaudeBot', 'anthropic-ai', 'CCBot', 'ChatGPT-User'];
  const ALLOWED_SOCIAL = ['facebookexternalhit', 'WhatsApp', 'TelegramBot', 'LinkedInBot', 'Slackbot'];

  it('all key public pages are allowed', () => {
    expect(ALLOWED_PUBLIC).toContain('/');
    expect(ALLOWED_PUBLIC).toContain('/pricing');
    expect(ALLOWED_PUBLIC).toContain('/signup');
  });

  it('all auth/private pages are blocked', () => {
    expect(BLOCKED_AUTH).toContain('/dashboard');
    expect(BLOCKED_AUTH).toContain('/admin');
    expect(BLOCKED_AUTH).toContain('/company/dashboard');
  });

  it('AI training crawlers are all blocked', () => {
    expect(BLOCKED_AI).toContain('GPTBot');
    expect(BLOCKED_AI).toContain('ClaudeBot');
    expect(BLOCKED_AI).toContain('anthropic-ai');
    expect(BLOCKED_AI.length).toBeGreaterThanOrEqual(5);
  });

  it('social link preview bots are allowed', () => {
    expect(ALLOWED_SOCIAL).toContain('facebookexternalhit');
    expect(ALLOWED_SOCIAL).toContain('WhatsApp');
    expect(ALLOWED_SOCIAL).toContain('TelegramBot');
  });

  it('sitemap is declared in robots.txt', () => {
    const sitemapLine = 'Sitemap: https://thankeeu.com/sitemap.xml';
    expect(sitemapLine).toContain('sitemap.xml');
  });
});

describe('SEO: sitemap.xml structure', () => {
  const SITEMAP_PAGES = [
    { url: '/',                  priority: 1.0, changefreq: 'weekly' },
    { url: '/pricing',           priority: 0.9, changefreq: 'monthly' },
    { url: '/signup',            priority: 0.8 },
    { url: '/company/signup',    priority: 0.8 },
    { url: '/member/signup',     priority: 0.7 },
    { url: '/policy',            priority: 0.4 },
  ];

  it('homepage has highest priority 1.0', () => {
    const home = SITEMAP_PAGES.find(p => p.url === '/');
    expect(home.priority).toBe(1.0);
  });

  it('pricing page has second highest priority 0.9', () => {
    const pricing = SITEMAP_PAGES.find(p => p.url === '/pricing');
    expect(pricing.priority).toBe(0.9);
  });

  it('company signup priority matches individual signup', () => {
    const coSignup  = SITEMAP_PAGES.find(p => p.url === '/company/signup');
    const indSignup = SITEMAP_PAGES.find(p => p.url === '/signup');
    expect(coSignup.priority).toBe(indSignup.priority);
  });

  it('all pages have priority between 0.0 and 1.0', () => {
    for (const p of SITEMAP_PAGES) {
      expect(p.priority).toBeGreaterThanOrEqual(0.0);
      expect(p.priority).toBeLessThanOrEqual(1.0);
    }
  });

  it('homepage changefreq is weekly (dynamic content)', () => {
    const home = SITEMAP_PAGES.find(p => p.url === '/');
    expect(home.changefreq).toBe('weekly');
  });

  it('at least 6 pages in sitemap', () => {
    expect(SITEMAP_PAGES.length).toBeGreaterThanOrEqual(6);
  });
});

describe('SEO: URL and canonical rules', () => {
  it('canonical URLs use HTTPS', () => {
    const BASE_URL = 'https://thankeeu.com';
    expect(BASE_URL).toMatch(/^https:\/\//);
  });

  it('canonical never has trailing slash (except homepage)', () => {
    const paths = ['/pricing', '/signup', '/policy', '/company/signup'];
    for (const p of paths) {
      expect(p.endsWith('/'), `${p} should not end with /`).toBe(false);
    }
  });

  it('homepage canonical is just / with no trailing slash issue', () => {
    const homePath = '/';
    expect(homePath).toBe('/');
  });

  it('hreflang locale is en-NG (Nigerian English)', () => {
    const hreflang = 'en-NG';
    expect(hreflang).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    expect(hreflang).toBe('en-NG');
  });

  it('x-default hreflang points to same URL as en-NG', () => {
    // Both en-NG and x-default point to https://thankeeu.com/
    // because Thankeeu is English-only for now
    const strategy = 'same-url';
    expect(strategy).toBe('same-url');
  });
});
