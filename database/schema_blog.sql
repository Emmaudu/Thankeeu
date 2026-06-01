-- ============================================
-- THANKEEU BLOG SCHEMA
-- Run after schema.sql
-- ============================================

CREATE TABLE blog_posts (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  excerpt      TEXT,                       -- 150-200 char summary for listing + SEO
  content      TEXT NOT NULL DEFAULT '',   -- full HTML content
  cover_image  TEXT,                       -- Cloudinary URL or external URL
  cover_alt    TEXT,                       -- Alt text for cover image (SEO)
  author_name  TEXT NOT NULL DEFAULT 'Thankeeu Team',
  author_avatar TEXT,
  category     TEXT NOT NULL DEFAULT 'General',
  tags         TEXT[] DEFAULT '{}',        -- e.g. {nigeria, gifting, teams}
  status       TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','published','archived')),
  is_featured  BOOLEAN DEFAULT FALSE,
  read_time    INTEGER DEFAULT 3,          -- minutes
  views        INTEGER DEFAULT 0,
  meta_title       TEXT,                   -- SEO override title (optional)
  meta_description TEXT,                   -- SEO override description (optional)
  og_image         TEXT,                   -- SEO override OG image (optional)
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_blog_posts_slug       ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status     ON blog_posts(status);
CREATE INDEX idx_blog_posts_category   ON blog_posts(category);
CREATE INDEX idx_blog_posts_published  ON blog_posts(published_at DESC)
  WHERE status = 'published';
CREATE INDEX idx_blog_posts_featured   ON blog_posts(is_featured)
  WHERE is_featured = TRUE;

-- Auto-update updated_at
CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed: 3 starter posts ────────────────────────────────────────────────────
INSERT INTO blog_posts (title, slug, excerpt, content, category, tags, status, is_featured, read_time, published_at, author_name)
VALUES
(
  'How to Plan the Perfect Office Birthday Surprise in Nigeria',
  'how-to-plan-office-birthday-surprise-nigeria',
  'Organising a birthday surprise for a colleague in a Nigerian office is an art. Here is a step-by-step guide to making it memorable without the last-minute chaos.',
  '<h2>Why office birthdays matter more than you think</h2>
<p>Employee recognition is directly linked to retention. A 2024 Gallup study found that employees who feel appreciated are <strong>56% less likely</strong> to look for a new job. Yet most Nigerian companies still treat birthdays as an afterthought.</p>
<p>Here is how to change that — without spending hours coordinating on WhatsApp.</p>
<h2>Step 1: Know the birthday in advance</h2>
<p>The biggest mistake is finding out about a birthday <em>on the day itself</em>. Build a simple birthday tracker for your team. Even better — connect your HRIS to a platform like Thankeeu, which automatically detects upcoming birthdays and notifies the team 2 days in advance.</p>
<h2>Step 2: Create a group card</h2>
<p>A physical card with 6 signatures feels cheap when you have a team of 50. A digital group card lets <strong>everyone</strong> leave a personal message, a photo, or even a voice note. It takes 30 seconds per person and the result is genuinely moving.</p>
<h2>Step 3: Open a shared gift pot</h2>
<p>Chasing colleagues for ₦2,000 each via bank transfer is exhausting. Use a Paystack-powered gift pot where anyone can chip in from ₦500. Fully transparent, no awkward conversations.</p>
<h2>Step 4: Schedule the delivery</h2>
<p>Time it right. Set the card to arrive at 9 AM on the birthday — before the person even opens Slack. The element of surprise is everything.</p>
<h2>Step 5: Make it a tradition</h2>
<p>Teams that celebrate consistently have better morale. Once you automate the process with a tool like Thankeeu for Teams, birthdays happen without anyone having to remember — the system does it for you.</p>',
  'Workplace Culture',
  ARRAY['birthday', 'office', 'nigeria', 'hr', 'team'],
  'published', TRUE, 5,
  NOW() - INTERVAL '10 days',
  'Thankeeu Team'
),
(
  'The Complete Guide to HRIS Integration for Nigerian Companies',
  'hris-integration-guide-nigerian-companies',
  'SeamlessHR, BambooHR, Zoho People, WorkPay and SAP SuccessFactors — how to connect your HR software to automate employee celebrations. A practical guide for Nigerian HR teams.',
  '<h2>What is HRIS integration and why does it matter?</h2>
<p>A Human Resource Information System (HRIS) holds all your employee data — names, emails, birthdays, hire dates, departments, genders. When that data is siloed in your HR software and your celebration tools have no access to it, your team misses birthdays, forgets farewells, and fails to welcome new hires properly.</p>
<p>HRIS integration solves this by creating a single connection that keeps all your celebration data in sync automatically.</p>
<h2>Popular HRIS platforms in Nigeria</h2>
<h3>SeamlessHR</h3>
<p>SeamlessHR is Nigeria''s most popular HRIS, used by companies like Access Bank, MTN, and Dangote Group. It offers a REST API that makes integration straightforward with an API key from your account settings.</p>
<h3>BambooHR</h3>
<p>Used by over 30,000 companies globally, BambooHR has a strong presence among Nigerian tech companies and multinationals. Integration requires your company subdomain and an API key.</p>
<h3>Zoho People</h3>
<p>Part of the broader Zoho ecosystem, Zoho People is popular with mid-market companies that already use Zoho CRM or Books. Integration uses OAuth 2.0.</p>
<h3>WorkPay</h3>
<p>A pan-African payroll and HR platform built specifically for Nigeria, Kenya, and Ghana. WorkPay''s API is straightforward and designed with African business contexts in mind.</p>
<h3>SAP SuccessFactors</h3>
<p>The enterprise choice for large Nigerian corporations and multinationals. Integration uses the OData API with Basic authentication.</p>
<h2>What data gets synced?</h2>
<p>When you connect your HRIS to Thankeeu, a single sync automatically populates 10 occasion tables:</p>
<ul>
<li><strong>Birthday table</strong> — from date_of_birth field</li>
<li><strong>Work anniversary table</strong> — from hire_date (yearly celebration)</li>
<li><strong>Women''s Day (March 8)</strong> — female employees only</li>
<li><strong>Men''s Day (November 19)</strong> — male employees only</li>
<li><strong>Valentine''s Day, Workers'' Day</strong> — all active employees</li>
<li><strong>New Hire Welcome table</strong> — employees starting in the next 30 days</li>
<li><strong>Farewell/Leaving table</strong> — employees with upcoming termination dates</li>
</ul>
<h2>Getting started</h2>
<p>In your Thankeeu for Teams dashboard, navigate to <strong>HRIS Sync</strong> in the sidebar. Select your provider, enter your credentials, and click Test Connection. Once verified, click Sync Now — and every occasion table is populated within seconds.</p>',
  'HR & Technology',
  ARRAY['hris', 'seamlesshr', 'bamboohr', 'automation', 'nigeria', 'hr'],
  'published', FALSE, 7,
  NOW() - INTERVAL '5 days',
  'Thankeeu Team'
),
(
  '5 Reasons Why Group Gift Pots Work Better Than Individual Gifts',
  'group-gift-pots-better-than-individual-gifts',
  'Collecting money for a colleague''s gift should not be stressful. Here''s why pooled group gift pots via Paystack are transforming how Nigerian teams celebrate each other.',
  '<h2>The problem with individual gifts in Nigerian workplaces</h2>
<p>Ask any Nigerian HR manager and they will tell you the same story: someone remembers a colleague''s birthday at 11 AM, sends a WhatsApp blast asking for "small contributions", spends the afternoon chasing people for money, and by end of day has collected ₦24,000 but spent ₦30,000 on a cake.</p>
<p>It is exhausting, opaque, and nobody really enjoys it — including the person being celebrated.</p>
<h2>1. Everyone contributes what they can</h2>
<p>A group gift pot removes the social pressure of a fixed contribution. Someone can give ₦500, someone else ₦5,000, and neither person feels judged. The total is what matters, and the total is usually much higher than any individual could give alone.</p>
<h2>2. Transparency builds trust</h2>
<p>With Thankeeu''s gift pot, every contributor can see the total amount collected. No more suspicions about where the money went. The HR manager never has to handle cash at all — Paystack processes everything and the amount is displayed directly on the card.</p>
<h2>3. The recipient actually chooses</h2>
<p>Instead of receiving a generic item that three other people also received from the same market, a gift pot lets the recipient spend the money on exactly what they want. They might buy groceries, save it, or treat their family — their choice.</p>
<h2>4. It scales perfectly</h2>
<p>A team of 5 and a company of 5,000 can both run a gift pot. The mechanics are identical. When your company grows from 50 to 500 employees, the celebration system does not need to change.</p>
<h2>5. Paystack makes it seamless</h2>
<p>Every contributor uses the payment method they prefer — card, bank transfer, USSD (*737#), or mobile money. No account required. The whole process takes 60 seconds per contributor.</p>
<h2>Try it today</h2>
<p>Create a free group card on Thankeeu and enable the gift pot. Your first card is free to create — you only pay ₦1,500 to send it to the recipient.</p>',
  'Gifting',
  ARRAY['gift', 'paystack', 'nigeria', 'workplace', 'team'],
  'published', FALSE, 4,
  NOW() - INTERVAL '2 days',
  'Thankeeu Team'
);
