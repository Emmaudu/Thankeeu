-- ================================================================
-- TASKEEU BLOG — Database Schema
-- ================================================================

-- ── BLOG POSTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(320) UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,              -- Markdown content
  cover_image_url TEXT,
  cover_image_alt VARCHAR(255),
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  author_name VARCHAR(150),           -- Cached for display even if user deleted
  category VARCHAR(80) DEFAULT 'General',
  tags TEXT[],                        -- e.g. ARRAY['nigeria','tasking','gig']
  status VARCHAR(20) DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  reading_time_minutes INTEGER DEFAULT 3,
  views INTEGER DEFAULT 0,
  -- SEO fields
  meta_title VARCHAR(160),
  meta_description VARCHAR(255),
  og_image_url TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── BLOG CATEGORIES (seeded) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(80) UNIQUE NOT NULL,
  slug VARCHAR(80) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(20) DEFAULT '#00C37E',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Product News',    'product-news',    'Platform updates, new features, and improvements', '#00C37E'),
  ('For Taskers',     'for-taskers',     'Tips, guides, and resources for field agents',     '#3B82F6'),
  ('For Businesses',  'for-businesses',  'Enterprise guides, industry insights, B2B tips',   '#7C3AED'),
  ('Nigeria Insights','nigeria-insights','Nigeria economy, gig work, and market analysis',   '#EA580C'),
  ('How-to Guides',   'how-to-guides',   'Step-by-step tutorials for using Taskeeu',         '#D97706'),
  ('Safety & Health', 'safety-health',   'Field safety, PPE guides, and professional tips',  '#DC2626')
ON CONFLICT (slug) DO NOTHING;

-- ── SEED SAMPLE BLOG POSTS ────────────────────────────────────────
INSERT INTO blog_posts
  (title, slug, excerpt, content, category, tags, status, featured,
   published_at, reading_time_minutes,
   meta_title, meta_description)
VALUES (
  'How Taskeeu Is Transforming Field Operations for Nigerian Companies',
  'taskeeu-transforming-field-operations-nigeria',
  'From WhatsApp coordination to GPS-verified, audit-ready field ops — how leading Nigerian enterprises are switching to Taskeeu for Teams.',
  $body$## The Old Way Nigerian Companies Manage Field Operations

For years, Nigerian enterprises have relied on a patchwork of tools to manage their field operations: WhatsApp group chats, phone calls, paper-based sign-in sheets, and informal payment arrangements. The result? Billions of naira lost annually to unverified work, missed SLAs, and zero audit trail.

A major Lagos bank recently estimated that **40% of their KYC verification visits** were either never completed, completed at the wrong address, or completed without any photographic evidence. The cost? Failed regulatory audits, re-work expenses, and reputational risk.

## Enter Taskeeu for Teams

Taskeeu for Teams is Nigeria's first enterprise field operations platform purpose-built for the challenges of deploying verified agents across 36 states.

### What Makes It Different

**GPS Timestamp Proof** is mandatory on every enterprise task. Taskers must use a GPS camera app that embeds their exact coordinates, address, date, and time into every photo they upload. Companies can see precisely where and when each task was executed.

**Department Budget Management** allows HR administrators to allocate task budgets per department. A field operations team in Kano gets their budget. The Lagos compliance team gets theirs. Every naira spent is tracked.

**Auto-Generated Authorization Letters** mean every accepted tasker receives a branded, legally-sound authorization letter before starting work — protecting both the company and the agent.

## Real Results

Companies using Taskeeu for Teams report:

- **80% reduction** in time spent coordinating field assignments
- **100% audit trail** on every field task with GPS evidence
- **3x faster** deployment compared to traditional methods
- **Zero fraudulent task completions** due to GPS verification

## Getting Started

Booking a demo takes 3 minutes. Visit [taskeeu.com/teams](/teams) and fill in your company details. Our team will reach out within 24 hours to schedule a live walkthrough.

Your first 10 enterprise tasks are **completely free** — no subscription required to start.$body$,
  'For Businesses',
  ARRAY['enterprise', 'field-operations', 'nigeria', 'taskeeu-for-teams', 'gps-verification'],
  'published', true, NOW() - INTERVAL '3 days', 6,
  'How Taskeeu Transforms Field Operations for Nigerian Companies',
  'See how leading Nigerian enterprises use Taskeeu for Teams to replace WhatsApp field coordination with GPS-verified, audit-ready operations.'
),
(
  '5 Things Every Taskeeu Field Agent Must Do Before Their First Enterprise Task',
  '5-things-field-agent-before-enterprise-task',
  'Got your first enterprise task on Taskeeu? Here are the 5 essential things to prepare — from GPS camera setup to PPE — before you step on site.',
  $body$## Congratulations on Getting Your First Enterprise Task!

Enterprise tasks on Taskeeu pay more than standard individual tasks (₦10,000–₦25,000 per assignment) and come from major companies including banks, telecoms, FMCG brands, and insurance companies. But they also come with higher standards.

Here are the 5 things every tasker must do before showing up on site.

## 1. Download and Configure a GPS Timestamp Camera App

This is non-negotiable. Enterprise tasks require GPS-stamped photos as proof of work. Without them, your proof gets rejected and you don't get paid.

**Android:** Search "Timestamp Camera" on Google Play. Download **Timestamp Camera Free** or **GPS Map Camera**.

**iOS:** Search "Timestamp Camera" on the App Store. Download **Timestamp Camera Basic**.

Once installed:
- Grant Camera permission
- Grant Location permission (select **Always Allow**)
- Enable: GPS coordinates, full address, date, and time overlays
- Take a test photo and confirm all 4 data points show clearly

## 2. Download Your Authorization Letter

When your bid is accepted, Taskeeu automatically generates an authorization letter on behalf of the company. This is your proof of legitimacy at the site.

- Go to **My Enterprise Tasks → Accepted Tasks**
- Download your authorization letter
- Screenshot it or save it offline — you may not have internet at the site

## 3. Get Your PPE Ready

Different sites require different protective equipment:

| Site Type | Required ||
|---|---|
| Construction | Hard hat + safety boots + high-vis vest |
| Telecom tower | Hard hat + high-vis vest + safety boots |
| Warehouse | Safety boots + high-vis vest |
| Office / Retail | Smart casual dress code |

## 4. Read the Full Task Brief

Enterprise task briefs contain specific instructions — what to photograph, who to speak with, what to verify. Read every word before leaving home.

## 5. Plan Your Route and Arrival Time

Enterprise tasks have SLAs (Service Level Agreements). Arriving late can affect your rating. Plan your route the night before, allow buffer time for Lagos traffic, and arrive at least 10 minutes early.

---

Ready to start earning with enterprise tasks? **Complete your 5-module certification** in your Taskeeu dashboard to earn your Enterprise Badge and unlock the highest-paying assignments.$body$,
  'For Taskers',
  ARRAY['enterprise-certification', 'gps', 'field-agent', 'tips', 'ppe'],
  'published', false, NOW() - INTERVAL '7 days', 5,
  '5 Things Every Taskeeu Field Agent Must Prepare Before Enterprise Tasks',
  'Got your first enterprise task on Taskeeu? Prepare GPS camera, authorization letter, PPE, and more with this step-by-step checklist.'
),
(
  'Nigeria''s Gig Economy in 2025: Market Size, Growth, and What It Means for You',
  'nigeria-gig-economy-2025-market-analysis',
  'Nigeria''s informal task economy is worth an estimated ₦800 billion annually. Here''s what the data says about where it''s heading — and how Taskeeu fits in.',
  $body$## The Numbers Behind Nigeria's Gig Economy

Nigeria's gig and informal task economy is one of the most underreported economic stories in Africa. While platforms like Uber, Bolt, and Jumia dominate headlines, the vast majority of task-based work in Nigeria — errands, verifications, field inspections, deliveries, and support work — still happens through WhatsApp groups, phone referrals, and cash-in-hand arrangements.

Here is what the data shows:

- **₦800 billion+** estimated annual value of informal micro-task transactions in Nigeria (NBS 2024)
- **73 million** working-age Nigerians are in the informal economy
- **180 million** mobile subscribers — the highest in Africa
- **60%** urbanisation rate, with Lagos adding 300,000+ new urban residents annually

## Why This Market Is About to Formalise

Three forces are converging to push Nigeria's gig economy into formal digital platforms:

### 1. Regulatory Pressure on Enterprises
The CBN's KYC requirements, NDPC data compliance mandates, and sector-specific audit requirements are forcing companies to move from informal to documented field operations. Companies need **proof** that their agents actually did the work.

### 2. The Middle-Class Demand Shift
Nigeria's growing middle class (estimated at 11.5% of population by PwC) increasingly wants reliable, verified service providers for household tasks, deliveries, and support work — not just whoever their neighbour recommends.

### 3. Mobile Money Infrastructure
With Opay, Palmpay, Moniepoint, and bank USSD platforms now at over 50 million active users, paying and receiving micro-payments digitally is no longer a barrier.

## Where Taskeeu Fits

Taskeeu is designed specifically for this transition moment — providing the verification layer, payment protection, and proof-of-work infrastructure that both individual users and enterprises need to trust the system.

For individual users, it's peace of mind — escrow payments mean you only pay when the job is done.

For enterprises, it's compliance and accountability — GPS evidence, audit trails, and SLA enforcement.

## The Opportunity Ahead

We believe that by 2027, over 5 million Nigerians will earn meaningful income through formal gig platforms. Taskeeu is building the infrastructure to power that transition.$body$,
  'Nigeria Insights',
  ARRAY['nigeria', 'gig-economy', 'market-analysis', '2025', 'informal-economy'],
  'published', true, NOW() - INTERVAL '14 days', 7,
  'Nigeria Gig Economy 2025: Market Size, Growth & Opportunity Analysis',
  'Nigeria''s informal task economy is worth ₦800 billion annually. Here''s the data on where it''s heading and how Taskeeu fits into the growth story.'
)
ON CONFLICT (slug) DO NOTHING;

-- ── INDEXES ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_category ON blog_posts(category);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_featured ON blog_posts(featured) WHERE featured = true;

-- ── TRIGGERS ───────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
