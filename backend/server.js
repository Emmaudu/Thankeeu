require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const supabase = require('./utils/supabase');
const { sendEmail } = require('./utils/email');

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: [process.env.FRONTEND_URL, 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

// Body parsing (skip for webhook route)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/cards', require('./routes/cards'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/admin', require('./routes/admin'));
// Teams / Company routes
app.use('/api/company', require('./routes/company'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/subscription', require('./routes/subscription'));
app.use('/api/support', require('./routes/support'));
app.use('/api/occasions', require('./routes/occasions'));
app.use('/api/members', require('./routes/companyMembers'));
app.use('/api/deductions', require('./routes/deductions'));
app.use('/api/hris', require('./routes/hris'));
app.use('/api/demo', require('./routes/demo'));
app.use('/api/blog', require('./routes/blog'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', app: 'Thankeeu API', time: new Date() }));

// 404
app.use('*', (req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// CRON: Auto-send cards on scheduled date + send reminders 2 days before deadline
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
    const { data: msgs } = await supabase.from('messages').select('count').eq('card_id', card.id);
    await sendEmail({
      to: card.recipient_email,
      template: 'cardDelivery',
      data: {
        recipientName: card.recipient_name,
        occasion: card.occasion,
        cardSlug: card.slug,
        accessToken: card.access_token,
        senderCount: msgs?.[0]?.count || 0,
        giftAmount: card.total_collected > 0 ? card.total_collected : null
      }
    });
    await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('id', card.id);
    console.log(`Auto-sent card: ${card.slug}`);
  }

  // Send reminder emails
  if (true) {
    const { data: closingSoon } = await supabase
      .from('cards')
      .select('*, messages(author_email)')
      .eq('status', 'active')
      .eq('send_reminders', true)
      .gte('deadline', now.toISOString())
      .lte('deadline', twoDaysFromNow.toISOString());

    for (const card of (closingSoon || [])) {
      const emails = [...new Set((card.messages || []).map(m => m.author_email).filter(Boolean))];
      const hoursLeft = Math.round((new Date(card.deadline) - now) / 3600000);
      for (const email of emails) {
        await sendEmail({
          to: email,
          template: 'cardReminder',
          data: { recipientName: card.recipient_name, cardSlug: card.slug, hoursLeft }
        });
      }
    }
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Thankeeu API running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});

// CRON: Birthday automation for Teams — runs every day at 7AM
cron.schedule('0 7 * * *', async () => {
  console.log('Running birthday automation...');
  try {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const twoDays = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
    const mm2 = String(twoDays.getMonth() + 1).padStart(2, '0');
    const dd2 = String(twoDays.getDate()).padStart(2, '0');

    // Only process companies with active subscriptions
    const { data: activeSubs } = await supabase.from('company_subscriptions').select('company_id').eq('status', 'active').gt('expires_at', today.toISOString());
    const companyIds = (activeSubs || []).map(s => s.company_id);
    if (!companyIds.length) return;

    // 1. Notify departments 2 days before birthday
    const { data: upcoming } = await supabase.from('team_members').select('*').in('company_id', companyIds).eq('is_active', true).ilike('birthday', `%-${mm2}-${dd2}`);
    for (const m of (upcoming || [])) {
      const year = today.getFullYear();
      const { data: existing } = await supabase.from('birthday_automations').select('id,department_notified_at').eq('member_id', m.id).eq('year', year).maybeSingle();
      if (existing?.department_notified_at) continue;

      const { data: company } = await supabase.from('companies').select('*').eq('id', m.company_id).single();
      const { nanoid } = require('nanoid');
      const slug = `${m.first_name.toLowerCase()}-bday-${nanoid(6)}`;
      const deadline = new Date(twoDays.getTime() + 48 * 3600000);

      const { data: card } = await supabase.from('cards').insert({
        slug, recipient_name: `${m.first_name} ${m.last_name}`, recipient_email: m.email,
        occasion: 'birthday', title: `Happy Birthday, ${m.first_name}!`, design_theme: 'rose_love',
        background_color: '#FBEAF0', status: 'active', is_gift_enabled: true, gift_type: 'pot',
        suggested_amount: 2500, send_date: twoDays.toISOString(), deadline: deadline.toISOString(), allow_private_messages: true,
      }).select().maybeSingle();

      if (!card) continue;
      await supabase.from('team_members').update({ card_slug: slug }).eq('id', m.id);
      await supabase.from('birthday_automations').upsert({ company_id: m.company_id, member_id: m.id, card_slug: slug, year, department_notified_at: new Date() }, { onConflict: 'member_id,year' });

      const { data: colleagues } = await supabase.from('team_members').select('email,first_name').eq('company_id', m.company_id).eq('department', m.department).eq('is_active', true).neq('id', m.id);
      const bdStr = twoDays.toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });
      const dlStr = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

      for (const col of (colleagues || [])) {
        await sendEmail({ to: col.email, template: 'birthdayDeptNotice', data: { celebrantName: `${m.first_name} ${m.last_name}`, celebrantFirstName: m.first_name, department: m.department, birthdayDate: bdStr, companyName: company.name, cardSlug: slug, giftEnabled: true, deadline: dlStr } });
      }
      console.log(`Dept notified for ${m.first_name}: ${colleagues?.length || 0} emails`);
    }

    // 2. Send card to celebrant ON birthday
    const { data: celebrants } = await supabase.from('team_members').select('*').in('company_id', companyIds).eq('is_active', true).ilike('birthday', `%-${mm}-${dd}`);
    for (const m of (celebrants || [])) {
      const year = today.getFullYear();
      const { data: auto } = await supabase.from('birthday_automations').select('*').eq('member_id', m.id).eq('year', year).maybeSingle();
      if (auto?.celebrant_notified_at) continue;
      const cardSlug = auto?.card_slug || m.card_slug;
      if (!cardSlug) continue;
      const { data: card } = await supabase.from('cards').select('*').eq('slug', cardSlug).maybeSingle();
      if (!card) continue;
      const { data: msgs } = await supabase.from('messages').select('count').eq('card_id', card.id);
      const count = msgs?.[0]?.count || 0;
      const { data: co } = await supabase.from('companies').select('name').eq('id', m.company_id).single();
      await sendEmail({ to: m.email, template: 'birthdayCelebrant', data: { firstName: m.first_name, companyName: co.name, cardSlug, accessToken: card.access_token, signerCount: count, giftAmount: card.total_collected > 0 ? card.total_collected : null } });
      await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('slug', cardSlug);
      await supabase.from('birthday_automations').update({ celebrant_notified_at: new Date(), total_signed: count, total_gift_collected: card.total_collected || 0 }).eq('member_id', m.id).eq('year', year);
      await supabase.from('team_members').update({ last_birthday_card_sent: new Date(), card_signed_count: count }).eq('id', m.id);
      console.log(`Birthday card delivered to ${m.first_name} ${m.last_name}`);
    }
  } catch (err) { console.error('Birthday cron error:', err); }
});

// ═══════════════════════════════════════════════════════════
// CRON: All Occasion Types — runs daily at 6AM
// ═══════════════════════════════════════════════════════════
cron.schedule('0 6 * * *', async () => {
  console.log('Running all-occasions cron...');
  try {
    const today = new Date();
    const mm  = String(today.getMonth() + 1).padStart(2, '0');
    const dd  = String(today.getDate()).padStart(2, '0');

    // Companies with active subscriptions
    const { data: subs } = await supabase
      .from('company_subscriptions').select('company_id')
      .eq('status', 'active').gt('expires_at', today.toISOString());
    const companyIds = (subs || []).map(s => s.company_id);
    if (!companyIds.length) return;

    // Get all active occasion types for subscribed companies
    const { data: occasionTypes } = await supabase
      .from('occasion_types')
      .select('*')
      .in('company_id', companyIds)
      .eq('is_active', true);

    for (const ot of (occasionTypes || [])) {
      const notifyDays = ot.notify_days_before || 7;
      const notifyDate = new Date(today.getTime() + notifyDays * 86400000);
      const nm = String(notifyDate.getMonth() + 1).padStart(2, '0');
      const nd = String(notifyDate.getDate()).padStart(2, '0');

      // ── STEP 1: Notify departments N days before occasion ──
      const { data: upcoming } = await supabase
        .from('occasion_members')
        .select('*')
        .eq('company_id', ot.company_id)
        .eq('occasion_type_id', ot.id)
        .eq('is_active', true)
        .filter('occasion_date', 'like', `%-${nm}-${nd}`);

      for (const m of (upcoming || [])) {
        if (m.last_dept_notified_at) {
          const notifiedYear = new Date(m.last_dept_notified_at).getFullYear();
          if (notifiedYear === today.getFullYear()) continue;
        }

        const { data: company } = await supabase.from('companies').select('*').eq('id', ot.company_id).single();
        const { nanoid } = require('nanoid');
        const slug = `${m.first_name.toLowerCase()}-${ot.name.replace('_','-')}-${nanoid(6)}`;
        const deadline = new Date(notifyDate.getTime() + notifyDays * 86400000);
        const occasionDateStr = new Date(m.occasion_date).toLocaleDateString('en', { weekday: 'long', day: 'numeric', month: 'long' });

        // Create card
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
        if (!card) continue;

        await supabase.from('occasion_members')
          .update({ card_slug: slug, last_dept_notified_at: new Date() })
          .eq('id', m.id);

        // Create wallet for card
        await supabase.from('contribution_wallets').insert({
          card_id: card.id, company_id: ot.company_id,
          total_contributed: 0, platform_fee: 0, net_after_fee: 0, amount_to_celebrant: 0,
        }).catch(() => {});

        // Determine who to notify based on scope
        let colleagueQuery = supabase.from('occasion_members')
          .select('email, first_name').eq('company_id', ot.company_id)
          .eq('is_active', true).neq('id', m.id);

        if (ot.default_scope === 'department' || ot.default_scope === 'pending_approval') {
          colleagueQuery = colleagueQuery.eq('department', m.department);
        }
        const { data: colleagues } = await colleagueQuery;

        // Also notify registered company members
        let membersQuery = supabase.from('company_members')
          .select('email, first_name').eq('company_id', ot.company_id).eq('status', 'approved').neq('email', m.email);
        if (ot.default_scope === 'department') {
          membersQuery = membersQuery.eq('department', m.department);
        }
        const { data: regMembers } = await membersQuery;

        const allEmails = new Set([
          ...(colleagues || []).map(c => c.email),
          ...(regMembers  || []).map(c => c.email),
        ]);
        allEmails.delete(m.email);

        const dlStr = deadline.toLocaleDateString('en', { day: 'numeric', month: 'long' });

        // Use occasion-specific email templates for new_hire and leaving
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

      // ── STEP 2: Send card to celebrant ON occasion date ──
      const { data: celebrants } = await supabase
        .from('occasion_members').select('*')
        .eq('company_id', ot.company_id).eq('occasion_type_id', ot.id).eq('is_active', true)
        .filter('occasion_date', 'like', `%-${mm}-${dd}`);

      for (const m of (celebrants || [])) {
        if (m.celebrant_notified_at) {
          const yr = new Date(m.celebrant_notified_at).getFullYear();
          if (yr === today.getFullYear()) continue;
        }
        const cardSlug = m.card_slug;
        if (!cardSlug) continue;
        const { data: card } = await supabase.from('cards').select('*').eq('slug', cardSlug).maybeSingle();
        if (!card) continue;

        const { data: msgs } = await supabase.from('messages').select('count').eq('card_id', card.id);
        const count = msgs?.[0]?.count || 0;
        const { data: co } = await supabase.from('companies').select('name').eq('id', ot.company_id).single();

        // Calculate gift amount after fee
        const { data: wallet } = await supabase.from('contribution_wallets').select('amount_to_celebrant').eq('card_id', card.id).maybeSingle();
        const giftAmount = wallet?.amount_to_celebrant > 0 ? wallet.amount_to_celebrant : null;

        // Use occasion-specific delivery templates for new_hire and leaving
        let deliveryTemplate = 'occasionCelebrant';
        let deliveryData = { icon: ot.icon, occasionLabel: ot.label, firstName: m.first_name, companyName: co.name, cardSlug, accessToken: card.access_token, signerCount: count, giftAmount };

        if (ot.name === 'new_hire') {
          deliveryTemplate = 'newHireWelcome';
          deliveryData = { firstName: m.first_name, companyName: co.name, department: m.department, jobTitle: m.job_title || '', cardSlug, accessToken: card.access_token, signerCount: count, giftAmount };
        } else if (ot.name === 'leaving') {
          deliveryTemplate = 'farewellCelebrant';
          deliveryData = { firstName: m.first_name, companyName: co.name, department: m.department, cardSlug, accessToken: card.access_token, signerCount: count, giftAmount };
        }

        await sendEmail({ to: m.email, template: deliveryTemplate, data: deliveryData });
        await supabase.from('cards').update({ status: 'sent', recipient_notified: true }).eq('slug', cardSlug);
        await supabase.from('occasion_members').update({
          celebrant_notified_at: new Date(), year_processed: today.getFullYear()
        }).eq('id', m.id);
        console.log(`[${ot.label}] Card delivered to ${m.first_name} ${m.last_name}`);
      }
    }
  } catch (err) { console.error('Occasions cron error:', err); }
});

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
