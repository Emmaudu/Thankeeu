require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron         = require('node-cron');
const cookieParser = require('cookie-parser');
const supabase      = require('./utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const { sendEmail } = require('./utils/email');

const app = express();

// Trust Railway's reverse proxy so req.ip / X-Forwarded-For are read correctly.
// Without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR on
// every request and falls back to the proxy's IP, breaking per-IP rate limits.
app.set('trust proxy', 1);

// Security
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:     ["'self'"],
      scriptSrc:      ["'self'", "'unsafe-inline'", "https://api.flutterwave.com", "https://checkout.flutterwave.com"],
      styleSrc:       ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:        ["'self'", "https://fonts.gstatic.com"],
      imgSrc:         ["'self'", "data:", "https:", "blob:"],
      connectSrc:     ["'self'", "https://api.flutterwave.com", "https://auth.reloadly.com", "https://giftcards.reloadly.com", "https://giftcards-sandbox.reloadly.com", "https://*.supabase.co", "https://res.cloudinary.com", "https://api.cloudinary.com"],
      frameSrc:       ["https://checkout.flutterwave.com"],
      objectSrc:      ["'none'"],
      upgradeInsecureRequests: [],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    const allowed = [
      process.env.FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000',
    ].filter(Boolean);
    // Also allow any Vercel deployment preview URLs
    if (
      allowed.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.thankeeu.com') ||
      origin.includes('thankeeu')
    ) {
      return callback(null, true);
    }
    return callback(null, true); // permissive — tighten after confirmed working
  },
  credentials: true
}));

// Query-string sanitisation
app.use((req, _res, next) => {
  if (req.query) {
    for (const k of Object.keys(req.query)) {
      if (typeof req.query[k] === 'string') req.query[k] = req.query[k].slice(0, 500);
    }
  }
  next();
});

// Webhook must be mounted BEFORE express.json so the raw body is intact for HMAC verification
app.use('/webhook', require('./routes/webhook'));

// Body parsing (all other routes)
app.use(express.json({ limit: '10mb' }));

// ── Startup env validation ────────────────────────────────────────────────────
const _rawEnvFE = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
if (_rawEnvFE.includes('=') && !_rawEnvFE.startsWith('http')) {
  console.warn('⚠️  FRONTEND_URL env var appears malformed:', JSON.stringify(_rawEnvFE));
  console.warn('   Fix: in Railway, set FRONTEND_URL = https://thankeeu.com (no KEY= prefix)');
  console.warn('   The app has auto-corrected this and will work normally.');
}
const _startupFE = (() => {
  let s = _rawEnvFE.trim();
  if (s.includes('=') && !s.startsWith('http')) s = s.slice(s.indexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').replace(/\/$/, '').trim();
  return s.startsWith('http') ? s : 'https://thankeeu.com';
})();
console.log('✓ FRONTEND_URL resolved to:', _startupFE);
app.use(express.urlencoded({ extended: true }));

// ── Tiered rate limiting ──────────────────────────────────────────────────
// Placed after body-parsing so authLimiter's keyGenerator can read
// req.body.email (POST bodies aren't available to middleware mounted
// before express.json()/express.urlencoded()).
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// Key auth attempts by (IP + email) rather than IP alone. Without this,
// express-rate-limit's default IP-based key means one account being
// hammered with bad passwords from a shared IP (office network, mobile
// carrier NAT, VPN) locks out every OTHER account on that same IP too.
// Falling back to IP alone when no email is present in the body keeps
// non-credential endpoints (if ever added to this limiter) protected.
const authKeyGenerator = (req) => {
  const email = (req.body && typeof req.body.email === 'string')
    ? req.body.email.trim().toLowerCase()
    : '';
  return email ? `${req.ip}:${email}` : req.ip;
};

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,  // 5 attempts per hour per IP+email
  skipSuccessfulRequests: true,
  standardHeaders: true, legacyHeaders: false,
  keyGenerator: authKeyGenerator,
  message: { error: 'Too many sign-in attempts. Please wait 1 hour and try again.' },
});
const demoLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { error: 'Too many demo requests from this IP. Please try again later.' },
});
app.use('/api/', generalLimiter);
app.use('/api/auth/login',           authLimiter);
app.use('/api/auth/signup',          authLimiter);
app.use('/api/company/login',        authLimiter);
app.use('/api/members/login',        authLimiter);
app.use('/api/members/signup',       authLimiter);
app.use('/api/pals/signup',           authLimiter);
app.use('/api/pals/login',            authLimiter);
app.use('/api/auth/forgot-password',        authLimiter);
app.use('/api/auth/reset-password',         authLimiter);
app.use('/api/company/signup',              authLimiter);
app.use('/api/company/forgot-password',     authLimiter);
app.use('/api/auth/send-code',              authLimiter);
app.use('/api/auth/verify-code',            authLimiter);
app.use('/api/members/forgot-password',     authLimiter);
app.use('/api/members/reset-password',      authLimiter);
app.use('/api/vendor/login',                authLimiter);
app.use('/api/vendor/signup',               authLimiter);
app.use('/api/pals/forgot-password',        authLimiter);
app.use('/api/demo/request',         demoLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/banks',     require('./routes/banks'));
app.use('/api/giftcards', require('./routes/giftcards'));
app.use('/api/gifs',      require('./routes/gifs'));
app.use('/api/credits',   require('./routes/credits'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/core-team', require('./routes/coreTeam'));
app.use('/api/admin', require('./routes/admin'));
// Teams / Company routes
app.use('/api/company', require('./routes/company'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/support', require('./routes/support'));
app.use('/api/occasions',    require('./routes/occasions'));
app.use('/api/activity-log', require('./routes/activityLog'));
app.use('/api/vendor',       require('./routes/vendor'));
app.use('/api/members', require('./routes/companyMembers'));
app.use('/api/deductions', require('./routes/deductions'));
app.use('/api/hris', require('./routes/hrisPublic')); // public: zoho-callback (no auth)
app.use('/api/hris', require('./routes/hris'));       // protected: all other hris routes
app.use('/api/demo', require('./routes/demo'));
app.use('/api/blog', require('./routes/blog'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/pals', require('./routes/pals'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Thankeeu API', time: new Date() }));

// Serve local uploads when Cloudinary is not configured
const path = require('path');
const uploadsDir = path.join(__dirname, '../uploads');
const fs = require('fs');
if (fs.existsSync(uploadsDir)) {
  app.use('/uploads', require('express').static(uploadsDir));
}

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// CRON: Auto-send cards on scheduled date + send reminders 2 days before deadline
// Visitor nurture emails — weekly Mondays
cron.schedule('0 9 * * 1', () => sendNudgeEmails().catch(console.error));

cron.schedule('0 8 * * *', async () => {
  console.log('Running daily cron jobs...');
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  // Auto-send scheduled cards
  const { data: cardsToSend } = await supabase
    .from('cards')
    .select('*, users!creator_id(email, full_name)')
    .eq('status', 'active')
    .eq('recipient_notified', false)
    .lte('send_date', now.toISOString())
    .not('recipient_email', 'is', null);

  for (const card of (cardsToSend || [])) {
    const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('card_id', card.id);
    await sendEmail({
      to: card.recipient_email,
      template: 'cardDelivery',
      data: {
        recipientName: card.recipient_name,
        occasion: card.occasion,
        cardSlug: card.slug,
        accessToken: card.access_token,
        senderCount: count || 0,
        giftAmount: card.total_collected > 0 ? card.total_collected : null
      }
    });
    await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('id', card.id);
    console.log(`Auto-sent card: ${card.slug}`);
  }

  // ── Deadline reminders (48hrs before deadline) — only for company cards ──
  // with a defined audience (company_id set). Targets colleagues who were
  // originally notified but have NOT yet signed — previously this sent to
  // people who had ALREADY signed (querying messages.author_email), which
  // was backwards and meant unsigned colleagues never got a deadline nudge.
  {
    const { data: closingSoon } = await supabase
      .from('cards')
      .select('id, slug, recipient_name, deadline, company_id, created_by_member_id, notification_scope, send_reminders, deadline_reminded')
      .eq('status', 'active')
      .eq('send_reminders', true)
      .not('company_id', 'is', null)
      .eq('deadline_reminded', false)
      .gte('deadline', now.toISOString())
      .lte('deadline', twoDaysFromNow.toISOString());

    for (const card of (closingSoon || [])) {
      const hoursLeft = Math.round((new Date(card.deadline) - now) / 3600000);

      // Who already signed this card?
      const { data: signedRows } = await supabase.from('messages').select('author_email').eq('card_id', card.id);
      const signedEmails = new Set((signedRows || []).map(r => r.author_email?.toLowerCase()).filter(Boolean));

      // Resolve the original audience for this card. For department-scoped
      // cards, the department comes from the creator's company_members row
      // (cards itself has no department column).
      let department = null;
      if (card.notification_scope === 'department' && card.created_by_member_id) {
        const { data: creator } = await supabase.from('company_members')
          .select('department').eq('id', card.created_by_member_id).maybeSingle();
        department = creator?.department || null;
      }

      let colleagueQuery = supabase.from('company_members')
        .select('email').eq('company_id', card.company_id)
        .in('status', ['approved', 'active']);
      if (department) colleagueQuery = colleagueQuery.eq('department', department);
      const { data: colleagues } = await colleagueQuery;
      const unsigned = (colleagues || []).filter(c => c.email && !signedEmails.has(c.email.toLowerCase()));

      for (const c of unsigned) {
        await sendEmail({
          to: c.email,
          template: 'cardReminder',
          data: { recipientName: card.recipient_name, cardSlug: card.slug, hoursLeft }
        }).catch(() => {});
      }

      await supabase.from('cards').update({ deadline_reminded: true }).eq('id', card.id);
      console.log(`[deadline-reminder] ${card.slug}: ${unsigned.length} unsigned colleagues notified`);
    }
  }
});

// Thankeeu Pals automation — auto-create cards, send reminders, settle gift pots
const { runPalAutomation } = require('./utils/palAutomation');
cron.schedule('0 * * * *', () => runPalAutomation().catch(e => console.error('Pal automation error:', e.message)));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Thankeeu API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// CRON: Birthday automation for Teams — runs every day at 7AM
// ═══════════════════════════════════════════════════════════
// CRON: All Occasion Types — runs daily at 6AM
// ═══════════════════════════════════════════════════════════
// PostgREST caps results at 1000 rows per request by default. This helper
// pages through `.range()` until a short page is returned, so the cron
// doesn't silently drop data once Thankeeu scales past 1000 rows in any of
// these tables.
async function fetchAllPages(buildQuery, label) {
  const PAGE_SIZE = 1000;
  const all = [];
  let from = 0;
  while (true) {
    const { data: page, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) { console.error(`Occasions cron: ${label} page error:`, error.message); break; }
    all.push(...(page || []));
    if (!page || page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

// Runs daily at 12:00pm (noon) — handles department notifications, mid-period
// reminders, and delivery of finished cards to the celebrant. Previously ran
// at 6am, which meant celebrants received their card before most colleagues
// were even awake/at work; 12pm ensures cards are delivered by midday as
// expected, and gives colleagues a more reasonable notification time too.
cron.schedule('0 12 * * *', async () => {
  console.log('Running all-occasions cron (source: company_members)...');
  try {
    const { getMemberOccasions } = require('./utils/occasionEngine');
    const today = new Date();
    const year  = today.getFullYear();
    today.setHours(0, 0, 0, 0);

    // Companies with active subscriptions
    const subs = await fetchAllPages(() => supabase
      .from('company_subscriptions').select('company_id')
      .eq('status', 'active').gt('expires_at', new Date().toISOString()), 'company_subscriptions');
    const companyIds = [...new Set(subs.map(s => s.company_id))];
    if (!companyIds.length) return;

    // Active occasion types per company, keyed by company_id then name
    const occasionTypes = await fetchAllPages(() => supabase
      .from('occasion_types')
      .select('*')
      .in('company_id', companyIds)
      .eq('is_active', true), 'occasion_types');

    const otByCompany = {};
    for (const ot of occasionTypes) {
      if (!otByCompany[ot.company_id]) otByCompany[ot.company_id] = {};
      otByCompany[ot.company_id][ot.name] = ot;
    }

    // Companies (for country, name, contact)
    const companies = await fetchAllPages(() => supabase
      .from('companies').select('*').in('id', companyIds), 'companies');
    const companyById = Object.fromEntries(companies.map(c => [c.id, c]));

    // All active company_members for these companies — only members who have
    // actually accepted their invite (approved/active) receive automated
    // signing emails. Members still pending invite acceptance, or with stale
    // null status, are excluded.
    const members = await fetchAllPages(() => supabase
      .from('company_members')
      .select('*')
      .in('company_id', companyIds)
      .in('status', ['approved', 'active']), 'company_members');

    for (const m of members) {
      const company = companyById[m.company_id];
      if (!company) continue;
      const otMap = otByCompany[m.company_id] || {};

      const occasions = getMemberOccasions(m, company, year);
      let trackingChanged = false;
      const tracking = { ...(m.occasion_tracking || {}) };

      for (const occ of occasions) {
        const ot = otMap[occ.occasionName];
        if (!ot) continue; // company doesn't have this occasion type configured/active

        const notifyDays = ot.notify_days_before || 7;
        const occasionDate = new Date(occ.occasionDate + 'T00:00:00');
        if (isNaN(occasionDate)) continue;

        const daysUntil = Math.round((occasionDate - today) / 86400000);
        const trackKey = occ.occasionName;
        const track = tracking[trackKey] || {};

        // Skip if already fully processed for this occasion this year
        // (recurring occasions reset each year; one-time occasions don't repeat —
        //  track.year stays fixed to the year they were processed, so this
        //  condition permanently blocks re-processing for one-time occasions).
        if (track.year === year && track.celebrant_notified) continue;
        if (!occ.isRecurring && track.celebrant_notified) continue; // one-time, ever-processed

        // ── STEP 1: Notify department N days before the occasion ──
        // For one-time occasions (promotion/leaving/new_hire), also catch up if
        // the date has already passed by up to 7 days (e.g. HR entered it late,
        // or the cron missed a run) and it hasn't been processed yet.
        const isDeptDue = occ.isRecurring
          ? daysUntil === notifyDays
          : (daysUntil <= notifyDays && daysUntil >= -7);

        if (isDeptDue && !(track.year === year && track.dept_notified) && !(!occ.isRecurring && track.dept_notified)) {
          await notifyDepartment({ m, ot, occ, company, notifyDays, occasionDate, year, tracking, trackKey });
          trackingChanged = true;
        }

        // ── STEP 1.5: Mid-period reminder to colleagues who haven't signed yet ──
        // Fires roughly halfway between the initial notification and the
        // occasion date (minimum 1 day after the initial notification, and
        // at least 1 day before the occasion), so colleagues who saw the
        // first email but didn't act get a second nudge. Only meaningful
        // when there's a gap of 2+ days to work with (notifyDays >= 3).
        const midDay = Math.floor(notifyDays / 2);
        const isMidDue = notifyDays >= 3 && midDay > 0 && midDay < notifyDays && daysUntil === midDay;

        if (isMidDue && (track.year === year && track.dept_notified) && !(track.year === year && track.mid_reminded)) {
          await sendMidReminder({ m, ot, occ, company, occasionDate, daysUntil, year, tracking, trackKey });
          trackingChanged = true;
        }

        // ── STEP 2: Deliver card to celebrant ON the occasion date ──
        // For one-time occasions, also catch up if the date has passed by up to
        // 7 days and the card hasn't been delivered yet.
        const isCelebrantDue = occ.isRecurring
          ? daysUntil === 0
          : (daysUntil <= 0 && daysUntil >= -7);

        if (isCelebrantDue && !(track.year === year && track.celebrant_notified) && !(!occ.isRecurring && track.celebrant_notified)) {
          await deliverCard({ m, ot, occ, company, year, tracking, trackKey });
          trackingChanged = true;
        }
      }

      if (trackingChanged) {
        await supabase.from('company_members')
          .update({ occasion_tracking: tracking, updated_at: new Date() })
          .eq('id', m.id);
      }
    }

    // ── Individual user birthday reminders (unrelated to company_members) ──
    try {
      const now7  = new Date(today); now7.setDate(now7.getDate() + 7);
      const now2  = new Date(today); now2.setDate(now2.getDate() + 2);
      const r7mm  = String(now7.getMonth()+1).padStart(2,'0'), r7dd = String(now7.getDate()).padStart(2,'0');
      const r2mm  = String(now2.getMonth()+1).padStart(2,'0'), r2dd = String(now2.getDate()).padStart(2,'0');
      const rymm  = String(new Date(today.getTime()-864e5).getMonth()+1).padStart(2,'0');
      const rydd  = String(new Date(today.getTime()-864e5).getDate()).padStart(2,'0');

      const { data: u7 } = await supabase.from('users')
        .select('id,email,full_name').not('date_of_birth','is',null)
        .ilike('date_of_birth',`%-${r7mm}-${r7dd}`).eq('birthday_reminded_7d',false);
      for (const u of (u7||[])) {
        await sendEmail({ to:u.email, template:'birthdayReminder7Days', data:{ name:u.full_name, daysLeft:7, createCardUrl:`${FRONTEND_URL}/create-card` }}).catch(()=>{});
        await supabase.from('users').update({ birthday_reminded_7d:true }).eq('id',u.id);
      }
      const { data: u2 } = await supabase.from('users')
        .select('id,email,full_name').not('date_of_birth','is',null)
        .ilike('date_of_birth',`%-${r2mm}-${r2dd}`).eq('birthday_reminded_2d',false);
      for (const u of (u2||[])) {
        await sendEmail({ to:u.email, template:'birthdayReminder2Days', data:{ name:u.full_name, daysLeft:2, createCardUrl:`${FRONTEND_URL}/create-card` }}).catch(()=>{});
        await supabase.from('users').update({ birthday_reminded_2d:true }).eq('id',u.id);
      }
      await supabase.from('users')
        .update({ birthday_reminded_7d:false, birthday_reminded_2d:false })
        .ilike('date_of_birth',`%-${rymm}-${rydd}`);
    } catch (e) { console.error('User birthday reminder error:', e.message); }

  } catch (err) { console.error('Occasions cron error:', err); }
});

// ─────────────────────────────────────────────────────────────────────────────
// notifyDepartment — Step 1: create the card + notify colleagues N days before
// ─────────────────────────────────────────────────────────────────────────────
async function notifyDepartment({ m, ot, occ, company, notifyDays, occasionDate, year, tracking, trackKey }) {
  const { nanoid } = require('nanoid');

  // ── Company-wide "everyone, same date" occasions (Valentine's Day, ──
  // Workers' Day) ── these are not personal milestones: every employee has
  // the same occasion on the same date. Without this guard, the cron would
  // create ONE CARD PER EMPLOYEE and email the entire company for each one
  // (e.g. a 200-person company would generate 200 cards and 40,000 emails
  // on Valentine's Day alone). Instead, create a single shared company card
  // for the occasion+year, and every member's tracking just points at it —
  // only the first member processed actually creates and notifies.
  const isCompanyWideForAll = ['valentines_day', 'workers_day'].includes(ot.name);

  if (isCompanyWideForAll) {
    const { data: sharedCards, error: sharedErr } = await supabase.from('cards')
      .select('id, slug').eq('occasion_type_id', ot.id).eq('company_id', ot.company_id)
      .gte('created_at', `${year}-01-01T00:00:00Z`)
      .order('created_at', { ascending: true })
      .limit(1);

    if (sharedErr) {
      console.error(`[${ot.label}] shared-card lookup error:`, sharedErr.message);
      return;
    }

    if (sharedCards && sharedCards.length) {
      tracking[trackKey] = { ...(tracking[trackKey]||{}), year, dept_notified: true, card_slug: sharedCards[0].slug };
      return;
    }

    const slug = `${(company.name || 'team').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${ot.name.replace(/_/g,'-')}-${year}-${nanoid(6)}`;
    let deadline = new Date(occasionDate.getTime() + notifyDays * 86400000);
    const minDeadline = new Date(Date.now() + 7 * 86400000);
    if (deadline < minDeadline) deadline = minDeadline;

    const { data: card } = await supabase.from('cards').insert({
      slug, recipient_name: company.name || 'the team',
      recipient_email: company.email || null, occasion: ot.name,
      title: `${ot.icon} Happy ${ot.label}, ${company.name || 'Team'}!`,
      design_theme: 'rose_love', background_color: '#FBEAF0',
      status: 'active', is_gift_enabled: false, gift_type: 'pot',
      send_date: occasionDate.toISOString(),
      deadline: deadline.toISOString(), allow_private_messages: true,
      company_id: ot.company_id, occasion_type_id: ot.id,
      notification_scope: 'company_wide',
    }).select().maybeSingle();
    if (!card) return;

    tracking[trackKey] = { year, dept_notified: true, card_slug: slug };

    // Notify the entire company once
    const { data: allMembers } = await supabase.from('company_members')
      .select('email, first_name').eq('company_id', ot.company_id)
      .in('status', ['approved', 'active']);

    const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
    const dlStr = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

    for (const colleague of (allMembers || [])) {
      await sendEmail({ to: colleague.email, template: 'occasionNotice', data: {
        icon: ot.icon, occasionLabel: ot.label,
        memberName: company.name || 'the whole team',
        memberFirstName: colleague.first_name,
        department: 'the whole company',
        companyName: company.name,
        cardSlug: slug, giftEnabled: false,
        occasionDate: occasionDateStr,
        daysLeft: notifyDays,
        deadline: dlStr,
      }}).catch(() => {});
    }
    console.log(`[${ot.label}] Shared company card created for ${company.name}: ${(allMembers||[]).length} emails`);
    return;
  }

  // Check for existing card for this person/occasion/year BEFORE inserting
  const { data: existingCards, error: existingErr } = await supabase.from('cards')
    .select('id, slug').eq('occasion_type_id', ot.id).eq('recipient_email', m.email)
    .gte('created_at', `${year}-01-01T00:00:00Z`)
    .order('created_at', { ascending: true })
    .limit(1);

  if (existingErr) {
    console.error(`[${ot.label}] existing-card lookup error:`, existingErr.message);
    return;
  }

  if (existingCards && existingCards.length) {
    console.log(`[${ot.label}] Card already exists for ${m.first_name} ${m.last_name} this year — skipping`);
    tracking[trackKey] = { ...(tracking[trackKey]||{}), year, dept_notified: true, card_slug: existingCards[0].slug };
    return;
  }

  const slug = `${m.first_name.toLowerCase()}-${ot.name.replace('_','-')}-${nanoid(6)}`;
  const notifyDate = occasionDate; // the occasion happens 'notifyDays' from now
  // Gift contributions stay open until notifyDays AFTER the occasion date itself
  // (matches original behaviour: deadline = notifyDate + notifyDays).
  // If we're catching up on a date that already passed (e.g. HR entered it
  // late), that would put the deadline in the past too — extend it to at
  // least a week from today so contributions remain possible.
  let deadline = new Date(occasionDate.getTime() + notifyDays * 86400000);
  const minDeadline = new Date(Date.now() + 7 * 86400000);
  if (deadline < minDeadline) deadline = minDeadline;
  const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });

  const { data: card } = await supabase.from('cards').insert({
    slug, recipient_name: `${m.first_name} ${m.last_name}`,
    recipient_email: m.email, occasion: ot.name,
    title: `Happy ${ot.label}, ${m.first_name}! ${ot.icon}`,
    design_theme: 'rose_love', background_color: '#FBEAF0',
    status: 'active', is_gift_enabled: true, gift_type: 'pot',
    suggested_amount: 2500, send_date: notifyDate.toISOString(),
    deadline: deadline.toISOString(), allow_private_messages: true,
    company_id: ot.company_id, occasion_type_id: ot.id,
    notification_scope: ot.default_scope || 'department',
  }).select().maybeSingle();
  if (!card) return;

  tracking[trackKey] = { year, dept_notified: true, card_slug: slug };

  // Create wallet for card
  try {
    await supabase.from('contribution_wallets').insert({
      card_id: card.id, company_id: ot.company_id,
      total_contributed: 0, platform_fee: 0, net_after_fee: 0, amount_to_celebrant: 0,
    });
  } catch (walletError) {
    console.error('Contribution wallet creation failed:', walletError);
  }

  // Determine who to notify based on scope — active company_members in the
  // same company (and department if scope requires it), excluding the celebrant
  let colleagueQuery = supabase.from('company_members')
    .select('email, first_name').eq('company_id', ot.company_id)
    .in('status', ['approved', 'active']).neq('id', m.id);

  if (ot.default_scope === 'department' || ot.default_scope === 'pending_approval') {
    colleagueQuery = colleagueQuery.eq('department', m.department);
  }
  const { data: colleagues } = await colleagueQuery;

  const allEmails = new Set((colleagues || []).map(c => c.email));
  allEmails.delete(m.email);

  const dlStr = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

  for (const email of allEmails) {
    if (ot.name === 'new_hire') {
      await sendEmail({ to: email, template: 'newHireDeptNotice', data: {
        newHireName: `${m.first_name} ${m.last_name}`,
        newHireFirstName: m.first_name,
        department: m.department,
        companyName: company.name,
        startDate: occasionDateStr,
        jobTitle: m.job_title || '',
        cardSlug: slug,
        deadline: dlStr,
      }});
    } else if (ot.name === 'leaving') {
      await sendEmail({ to: email, template: 'farewellDeptNotice', data: {
        leavingName: `${m.first_name} ${m.last_name}`,
        leavingFirstName: m.first_name,
        department: m.department,
        companyName: company.name,
        lastDay: occasionDateStr,
        cardSlug: slug,
        giftEnabled: true,
        deadline: dlStr,
      }});
    } else {
      await sendEmail({ to: email, template: 'occasionNotice', data: {
        icon: ot.icon, occasionLabel: ot.label,
        memberName: `${m.first_name} ${m.last_name}`,
        memberFirstName: m.first_name,
        department: m.department,
        companyName: company.name,
        cardSlug: slug, giftEnabled: true,
        occasionDate: occasionDateStr,
        daysLeft: notifyDays,
        deadline: dlStr,
      }});
    }
  }
  console.log(`[${ot.label}] Dept notified for ${m.first_name}: ${allEmails.size} emails`);
}

// ─────────────────────────────────────────────────────────────────────────────
// sendMidReminder — Step 1.5: nudge colleagues who haven't signed yet,
// roughly halfway between the initial notification and the occasion date.
// ─────────────────────────────────────────────────────────────────────────────
async function sendMidReminder({ m, ot, occ, company, occasionDate, daysUntil, year, tracking, trackKey }) {
  const track = tracking[trackKey] || {};
  const cardSlug = track.card_slug;
  if (!cardSlug) return; // no card yet (shouldn't happen if dept_notified is true)

  const { data: card } = await supabase.from('cards').select('id, deadline, mid_reminded_at').eq('slug', cardSlug).maybeSingle();
  if (!card) return;

  // ── Company-wide "everyone" occasions (Valentine's Day, Workers' Day) ──
  // The shared card's mid-reminder is sent once for the whole company.
  // Per-member occasion_tracking can't dedup this — every member has their
  // own independent tracking object, so each member processed would
  // otherwise trigger its own duplicate round of reminders. Instead we use
  // a flag on the shared card row itself (mid_reminded_at), claimed
  // atomically via a conditional update so only one member's pass actually
  // sends the emails.
  const isCompanyWideForAll = ['valentines_day', 'workers_day'].includes(ot.name);
  if (isCompanyWideForAll) {
    if (!card.mid_reminded_at) {
      // Atomically claim the reminder: only succeeds if still null
      const { data: claimed } = await supabase.from('cards')
        .update({ mid_reminded_at: new Date().toISOString() })
        .eq('id', card.id).is('mid_reminded_at', null)
        .select('id').maybeSingle();

      if (claimed) {
        const { data: signedRows } = await supabase.from('messages').select('author_email').eq('card_id', card.id);
        const signedEmails = new Set((signedRows || []).map(r => r.author_email?.toLowerCase()).filter(Boolean));

        const { data: allMembers } = await supabase.from('company_members')
          .select('email, first_name').eq('company_id', ot.company_id)
          .in('status', ['approved', 'active']);
        const unsigned = (allMembers || []).filter(c => c.email && !signedEmails.has(c.email.toLowerCase()));

        const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
        const dlStr = card.deadline ? new Date(card.deadline).toLocaleDateString('en', { day: 'numeric', month: 'long' }) : 'soon';

        for (const c of unsigned) {
          await sendEmail({ to: c.email, template: 'occasionReminder', data: {
            occasionLabel: ot.label,
            memberName: company.name || 'the whole team',
            memberFirstName: c.first_name,
            companyName: company.name,
            cardSlug, giftEnabled: false,
            occasionDate: occasionDateStr,
            daysLeft: daysUntil,
            deadline: dlStr,
          }}).catch(() => {});
        }
        console.log(`[${ot.label}] Shared-card mid-reminder sent for ${company.name}: ${unsigned.length} unsigned`);
      }
    }
    tracking[trackKey] = { ...track, year, mid_reminded: true };
    return;
  }

  // Who has already signed?
  const { data: signedRows } = await supabase.from('messages').select('author_email').eq('card_id', card.id);
  const signedEmails = new Set((signedRows || []).map(r => r.author_email?.toLowerCase()).filter(Boolean));

  // Who was originally notified (same audience as notifyDepartment)
  let colleagueQuery = supabase.from('company_members')
    .select('email, first_name').eq('company_id', ot.company_id)
    .in('status', ['approved', 'active']).neq('id', m.id);

  if (ot.default_scope === 'department' || ot.default_scope === 'pending_approval') {
    colleagueQuery = colleagueQuery.eq('department', m.department);
  }
  const { data: colleagues } = await colleagueQuery;

  const unsigned = (colleagues || []).filter(c => c.email && !signedEmails.has(c.email.toLowerCase()) && c.email !== m.email);
  if (!unsigned.length) {
    tracking[trackKey] = { ...track, year, mid_reminded: true };
    return;
  }

  const occasionDateStr = occasionDate.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
  const dlStr = card.deadline ? new Date(card.deadline).toLocaleDateString('en', { day: 'numeric', month: 'long' }) : 'soon';

  for (const c of unsigned) {
    await sendEmail({ to: c.email, template: 'occasionReminder', data: {
      occasionLabel: ot.label,
      memberName: `${m.first_name} ${m.last_name}`,
      memberFirstName: m.first_name,
      companyName: company.name,
      cardSlug, giftEnabled: true,
      occasionDate: occasionDateStr,
      daysLeft: daysUntil,
      deadline: dlStr,
    }}).catch(() => {});
  }

  tracking[trackKey] = { ...track, year, mid_reminded: true };
  console.log(`[${ot.label}] Mid-reminder sent for ${m.first_name}: ${unsigned.length} unsigned colleagues`);
}

// ─────────────────────────────────────────────────────────────────────────────
// deliverCard — Step 2: deliver the finished card to the celebrant on the day
// ─────────────────────────────────────────────────────────────────────────────
async function deliverCard({ m, ot, occ, company, year, tracking, trackKey }) {
  const track = tracking[trackKey] || {};
  const cardSlug = track.card_slug;
  if (!cardSlug) return; // STEP 1 hasn't created the card yet (shouldn't normally happen if notify_days_before >= 0)

  const { data: card } = await supabase.from('cards').select('*').eq('slug', cardSlug).maybeSingle();
  if (!card) return;

  // ── Company-wide "everyone" occasions (Valentine's Day, Workers' Day) ──
  // There's no individual celebrant to email — just close the shared card
  // (move it from active to sent) once, the first time any member's
  // tracking reaches this step. Every other member just records tracking.
  if (['valentines_day', 'workers_day'].includes(ot.name)) {
    if (card.status !== 'sent') {
      await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('slug', cardSlug);
      console.log(`[${ot.label}] Shared company card closed for ${company.name}`);
    }
    tracking[trackKey] = { ...track, year, celebrant_notified: true };
    return;
  }

  const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('card_id', card.id);
  const signerCount = count || 0;

  // Calculate gift amount after fee
  const { data: wallet } = await supabase.from('contribution_wallets').select('amount_to_celebrant').eq('card_id', card.id).maybeSingle();
  const giftAmount = wallet?.amount_to_celebrant > 0 ? wallet.amount_to_celebrant : null;

  let deliveryTemplate = 'occasionCelebrant';
  let deliveryData = { icon: ot.icon, occasionLabel: ot.label, firstName: m.first_name, companyName: company.name, cardSlug, accessToken: card.access_token, signerCount, giftAmount };

  if (ot.name === 'new_hire') {
    deliveryTemplate = 'newHireWelcome';
    deliveryData = { firstName: m.first_name, companyName: company.name, department: m.department, jobTitle: m.job_title || '', cardSlug, accessToken: card.access_token, signerCount, giftAmount };
  } else if (ot.name === 'leaving') {
    deliveryTemplate = 'farewellCelebrant';
    deliveryData = { firstName: m.first_name, companyName: company.name, department: m.department, cardSlug, accessToken: card.access_token, signerCount, giftAmount };
  }

  await sendEmail({ to: m.email, template: deliveryTemplate, data: deliveryData });
  await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('slug', cardSlug);

  tracking[trackKey] = { ...track, year, celebrant_notified: true };
  console.log(`[${ot.label}] Card delivered to ${m.first_name} ${m.last_name}`);
}

// ═══════════════════════════════════════════════════════════
// CRON: HRIS Auto-sync — daily at 5AM for companies with auto_sync=true
// ═══════════════════════════════════════════════════════════
cron.schedule('0 5 * * *', async () => {
  console.log('Running HRIS auto-sync...');
  try {
    const { data: autoConns } = await supabase
      .from('hris_connections')
      .select('*, companies(id, name)')
      .eq('is_active', true)
      .eq('auto_sync', true)
      .eq('is_verified', true);

    if (!autoConns?.length) return;
    const { PROVIDER_FETCHERS, syncEmployeesToOccasionTables } = require('./controllers/hrisController');

    for (const conn of autoConns) {
      try {
        const fetcher   = PROVIDER_FETCHERS[conn.provider];
        if (!fetcher) continue;
        const employees = await fetcher(conn);
        const { data: ots } = await supabase.from('occasion_types').select('*').eq('company_id', conn.company_id).eq('is_active', true);
        const { counts } = await syncEmployeesToOccasionTables(conn.company_id, employees, ots || []);
        await supabase.from('hris_connections').update({ last_synced_at: new Date(), last_sync_status: 'success', last_sync_count: employees.length }).eq('id', conn.id);
        console.log(`[HRIS Auto-sync] ${conn.companies?.name}: ${employees.length} employees synced`);
      } catch (err) {
        await supabase.from('hris_connections').update({ last_sync_status: 'failed', last_sync_error: err.message }).eq('id', conn.id);
        console.error(`[HRIS Auto-sync] Failed for company ${conn.company_id}:`, err.message);
      }
    }
  } catch (err) { console.error('HRIS cron error:', err); }
});
