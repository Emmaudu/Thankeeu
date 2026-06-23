const supabase = require('../utils/supabase');
const { safeError } = require('../utils/paramGuard');
const { sendEmail } = require('../utils/email');

const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

const OCCASION_EMOJI = {
  birthday: '🎂', anniversary: '💍', leaving: '👋', promotion: '🌟',
  wedding: '💒', baby_shower: '👶', retirement: '🏖️', graduation: '🎓',
  valentine: '💝', christmas: '🎄', get_well: '🌷', other: '🎉',
};


const getStats = async (req, res) => {
  try {
    // Use count-only queries for totals — avoids Supabase's 1000-row default cap
    // and doesn't waste bandwidth fetching full rows just to count them.
    const [
      { count: totalUsers },
      { count: totalCards },
      { count: activeCards },
      { count: sentCards },
      { count: totalMessages },
      recentUsersRes,
      recentCardsRes,
      contributionsRes,
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('cards').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
      supabase.from('messages').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('cards').select('id, slug, title, status, occasion, total_collected, created_at').order('created_at', { ascending: false }).limit(10),
      // Fetch all successful contribution amounts for revenue total.
      // Use pagination if this grows large — for now select only amount column.
      supabase.from('contributions').select('id, amount, contributor_name, created_at').eq('status', 'success').order('created_at', { ascending: false }),
    ]);

    const totalRevenue = contributionsRes.data?.reduce((s, c) => s + (c.amount || 0), 0) || 0;
    const platformCut  = Math.round(totalRevenue * 0.04);

    res.json({
      stats: {
        total_users:         totalUsers   || 0,
        total_cards:         totalCards   || 0,
        active_cards:        activeCards  || 0,
        sent_cards:          sentCards    || 0,
        total_messages:      totalMessages || 0,
        total_contributions: contributionsRes.data?.length || 0,
        total_gift_volume:   totalRevenue,
        platform_revenue:    platformCut,
      },
      recent_users:         recentUsersRes.data  || [],
      recent_cards:         recentCardsRes.data  || [],
      recent_contributions: contributionsRes.data?.slice(0, 10) || [],
    });
  } catch (err) {
    console.error('[admin] getStats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const [usersRes, creditsRes] = await Promise.all([
      supabase.from('users')
        .select('id, full_name, email, role, is_verified, created_at')
        .order('created_at', { ascending: false })
        .limit(2000),
      supabase.from('card_credits')
        .select('user_id, credits_remaining, total_purchased'),
    ]);
    if (usersRes.error) throw usersRes.error;
    const creditsByUser = {};
    (creditsRes.data || []).forEach(c => { creditsByUser[c.user_id] = c; });
    const users = (usersRes.data || []).map(u => ({
      ...u,
      credits_remaining: creditsByUser[u.id]?.credits_remaining || 0,
      total_purchased:   creditsByUser[u.id]?.total_purchased   || 0,
    }));
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const giftCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    const { credits, reason } = req.body;
    const amount = parseInt(credits, 10);

    if (!amount || amount < 1 || amount > 1000) {
      return res.status(400).json({ error: 'Credits must be between 1 and 1000' });
    }

    const { data: user } = await supabase.from('users')
      .select('id, full_name, email').eq('id', userId).maybeSingle();
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if a credits row already exists for this user
    const { data: existing, error: selectErr } = await supabase
      .from('card_credits')
      .select('id, credits_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    if (selectErr) {
      console.error('[admin/gift-credits] select error:', selectErr.message);
      return res.status(500).json({ error: 'Failed to read credit balance: ' + selectErr.message });
    }

    let newBalance = 0;

    if (existing) {
      // Row exists — plain UPDATE by id, no optimistic lock, no optional columns
      newBalance = (existing.credits_remaining || 0) + amount;
      const { error: updateErr } = await supabase
        .from('card_credits')
        .update({ credits_remaining: newBalance })
        .eq('id', existing.id);

      if (updateErr) {
        console.error('[admin/gift-credits] update error:', updateErr.message);
        return res.status(500).json({ error: 'Failed to update credit balance: ' + updateErr.message });
      }
    } else {
      // No row yet — insert with only base schema columns (no plan_type_v2, no updated_at)
      newBalance = amount;
      const { error: insertErr } = await supabase
        .from('card_credits')
        .insert({ user_id: userId, credits_remaining: amount });

      if (insertErr) {
        console.error('[admin/gift-credits] insert error:', insertErr.message);
        return res.status(500).json({ error: 'Failed to create credit balance: ' + insertErr.message });
      }
    }

    // Audit log — best-effort, never block the response
    supabase.from('credit_purchases').insert({
      user_id:        userId,
      plan_type:      'classic',
      credits_bought: amount,
      amount_paid:    0,
      status:         'paid',
      flw_reference:  `admin_gift_${Date.now()}_${userId.slice(0,8)}`,
    }).then(({ error: e }) => {
      if (e) console.warn('[admin/gift-credits] audit log failed:', e.message);
    });

    console.log(`[admin/gift-credits] Gifted ${amount} credits to user ${userId} (${user.email}). New balance: ${newBalance}. Reason: ${reason || 'none'}`);

    // Send email notification to the user
    try {
      const { sendEmail } = require('../utils/email');
      const FRONTEND_URL = (() => {
        const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
        let s = raw.trim();
        if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
        s = s.replace(/['\"]/g, '').trim().replace(/\/$/, '');
        return (s.startsWith('http') ? s : 'https://thankeeu.com');
      })();
      await sendEmail({
        to:      user.email,
        subject: `🎁 You've received ${amount} free credit${amount !== 1 ? 's' : ''} on Thankeeu!`,
        html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="font-size:48px;">🎁</div>
            <h2 style="color:#5B4BDF;margin:12px 0 4px;">You've got free credits, ${user.full_name?.split(' ')[0] || 'friend'}!</h2>
            <p style="color:#888;font-size:14px;margin:0;">A gift from the Thankeeu team</p>
          </div>
          <div style="background:#F5F3FF;border-radius:16px;padding:20px 24px;margin:20px 0;text-align:center;">
            <p style="font-size:40px;font-weight:900;color:#5B4BDF;margin:0;">${amount}</p>
            <p style="color:#7C3AED;font-size:16px;font-weight:700;margin:4px 0 0;">Free card credit${amount !== 1 ? 's' : ''} added to your account</p>
            <p style="color:#888;font-size:13px;margin-top:8px;">New balance: <strong>${newBalance} credit${newBalance !== 1 ? 's' : ''}</strong></p>
          </div>
          ${reason ? `<p style="color:#555;font-size:14px;text-align:center;">Reason: <em>${reason}</em></p>` : ''}
          <p style="color:#555;font-size:14px;line-height:1.7;">Each credit lets you send one group card to a recipient — complete with messages, photos, voice notes, and a gift pot.</p>
          <div style="text-align:center;margin-top:24px;">
            <a href="${FRONTEND_URL}/card/new" style="display:inline-block;background:#5B4BDF;color:#fff;padding:13px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">Create a card now →</a>
          </div>
          <p style="color:#bbb;font-size:12px;text-align:center;margin-top:24px;">Thankeeu · <a href="${FRONTEND_URL}" style="color:#7C3AED;">thankeeu.com</a></p>
        </div>`,
      });
    } catch (emailErr) {
      console.warn('[admin/gift-credits] email notification failed:', emailErr.message);
    }

    res.json({
      ok: true,
      user_id:       userId,
      user_email:    user.email,
      user_name:     user.full_name,
      credits_gifted: amount,
      new_balance:   newBalance,
    });
  } catch (err) {
    console.error('[admin/gift-credits]', err.message);
    res.status(500).json({ error: 'Failed to gift credits' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    const { data, error } = await supabase.from('users').update({ role }).eq('id', userId).select().maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Fetch user first so we have their email for related-data cleanup
    const { data: user, error: fetchErr } = await supabase
      .from('users').select('id, email').eq('id', userId).maybeSingle();
    if (fetchErr) throw fetchErr;
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Explicitly clean up data not covered by ON DELETE CASCADE
    // (messages use author_email, not a FK, so they won't cascade)
    if (user.email) {
      await Promise.allSettled([
        supabase.from('messages').delete().eq('author_email', user.email),
        supabase.from('card_signatures').delete().eq('signer_email', user.email),
      ]);
    }

    // Hard-delete the user row — cards, card_credits, notifications
    // all have ON DELETE CASCADE so they'll be removed automatically.
    const { data: deleted, error: delErr } = await supabase
      .from('users').delete().eq('id', userId).select('id');
    if (delErr) throw delErr;
    if (!deleted || deleted.length === 0)
      return res.status(404).json({ error: 'User not found or already deleted' });

    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error('[admin] deleteUser error:', err.message);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const getAllCards = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
};

const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { data: deleted, error } = await supabase
      .from('cards').delete().eq('id', cardId).select('id');
    if (error) throw error;
    if (!deleted || deleted.length === 0)
      return res.status(404).json({ error: 'Card not found or already deleted' });
    res.json({ message: 'Card deleted' });
  } catch (err) {
    console.error('[admin] deleteCard error:', err.message);
    res.status(500).json({ error: 'Failed to delete card' });
  }
};

// Re-deliver a card that has already been sent once. Sends a fresh email to
// the recipient, calling out anything new (messages + gift money) that has
// come in since the last time they were emailed, then bumps the card's
// redelivery tracking. Does NOT touch card.status — it's already 'sent'.
const redeliverCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { data: card, error: cardErr } = await supabase
      .from('cards').select('*').eq('id', cardId).maybeSingle();
    if (cardErr) throw cardErr;
    if (!card) return res.status(404).json({ error: 'Card not found' });

    if (card.status !== 'sent')
      return res.status(400).json({ error: 'This card has not been delivered yet — it must be sent at least once before it can be re-delivered' });
    if (!card.recipient_email)
      return res.status(400).json({ error: 'This card has no recipient email on file, so it cannot be re-delivered' });

    // "Since" cutoff = the last time the recipient actually received an
    // email for this card — either the most recent re-delivery, or the
    // original delivery if it's never been re-delivered before.
    const sinceTs = new Date(card.last_redelivered_at || card.delivered_at || card.created_at).toISOString();

    const [totalMsgRes, newMsgRes, newGiftRes] = await Promise.all([
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('card_id', card.id),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('card_id', card.id).gt('created_at', sinceTs),
      supabase.from('contributions').select('amount').eq('card_id', card.id).eq('status', 'success').gt('created_at', sinceTs),
    ]);
    if (totalMsgRes.error) throw totalMsgRes.error;
    if (newMsgRes.error) throw newMsgRes.error;
    if (newGiftRes.error) throw newGiftRes.error;

    const totalSenderCount = totalMsgRes.count || 0;
    const newMessageCount  = newMsgRes.count || 0;
    const newGiftAmount    = (newGiftRes.data || []).reduce((sum, c) => sum + (c.amount || 0), 0);

    await sendEmail({
      to: card.recipient_email,
      template: 'cardRedelivery',
      data: {
        recipientName:  card.recipient_name,
        recipientEmail: card.recipient_email,
        occasion:       (card.occasion || '').replace(/_/g, ' '),
        occasionEmoji:  OCCASION_EMOJI[card.occasion] || '🎉',
        cardSlug:       card.slug,
        accessToken:    card.access_token,
        senderCount:    totalSenderCount,
        newMessageCount,
        giftAmount:     card.total_collected > 0 ? card.total_collected : null,
        newGiftAmount:  newGiftAmount > 0 ? newGiftAmount : null,
        appUrl:         FRONTEND_URL,
      },
    });

    const now = new Date();
    const { data: updated, error: updErr } = await supabase
      .from('cards')
      .update({ last_redelivered_at: now, redelivery_count: (card.redelivery_count || 0) + 1, updated_at: now })
      .eq('id', card.id)
      .select('redelivery_count, last_redelivered_at')
      .maybeSingle();
    if (updErr) throw updErr;

    res.json({
      message:           'Card re-delivered to recipient!',
      new_messages:       newMessageCount,
      new_gift_amount:    newGiftAmount,
      total_messages:     totalSenderCount,
      total_gift_amount:  card.total_collected || 0,
      redelivery_count:   updated?.redelivery_count ?? ((card.redelivery_count || 0) + 1),
      last_redelivered_at: updated?.last_redelivered_at ?? now,
    });
  } catch (err) {
    console.error('[admin] redeliverCard error:', err.message);
    res.status(500).json({ error: 'Failed to re-deliver card' });
  }
};


// ── Company management ────────────────────────────────────────────────

const getAllCompanies = async (req, res) => {
  try {
    // Fetch companies first — no nested select to avoid PostgREST FK requirement
    const { data: companiesRaw, error: coErr } = await supabase
      .from('companies')
      .select('id, name, email, contact_person, phone, industry, role, created_at, pricing_multiplier, subscription_status, subscription_plan, subscription_expires_at, pilot_ends_at')
      .order('created_at', { ascending: false });
    if (coErr) throw coErr;

    if (!companiesRaw || companiesRaw.length === 0) return res.json([]);

    // Fetch subscriptions separately for all companies in one query
    const companyIds = companiesRaw.map(c => c.id);
    const { data: subs } = await supabase
      .from('company_subscriptions')
      .select('company_id, status, plan, expires_at, amount')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false });

    // Build a map: companyId → latest subscription
    const subMap = {};
    for (const s of (subs || [])) {
      if (!subMap[s.company_id]) subMap[s.company_id] = s; // already ordered desc
    }

    const companies = companiesRaw.map(c => ({
      ...c,
      subscription: subMap[c.id] || null,
    }));

    res.json(companies);
  } catch (err) {
    console.error('[admin] getAllCompanies error:', err.message);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { companyId } = req.params;

    // Verify company exists first
    const { data: company } = await supabase
      .from('companies').select('id, name, email').eq('id', companyId).maybeSingle();
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // ── Step 1: Delete tables that do NOT have ON DELETE CASCADE to companies ──
    // These must be deleted explicitly before the companies row is removed.

    // Cards — company_id was added via ALTER TABLE (no FK constraint → no cascade).
    // Deleting cards first also cascades: messages, contribution_wallets,
    // gift_claims, notification_approvals, received_cards, member_received_cards.
    const { data: companyCards } = await supabase
      .from('cards').select('id').eq('company_id', companyId);
    if (companyCards?.length) {
      // Delete in batches to avoid hitting Supabase row limits
      const cardIds = companyCards.map(c => c.id);
      for (let i = 0; i < cardIds.length; i += 100) {
        await supabase.from('cards').delete().in('id', cardIds.slice(i, i + 100));
      }
    }

    // company_subscriptions — may not have FK depending on which migration ran
    await supabase.from('company_subscriptions').delete().eq('company_id', companyId);

    // company_core_team — no FK constraint in migration_all_fixes version
    await supabase.from('company_core_team').delete().eq('company_id', companyId);

    // activity_logs — has CASCADE per migration_activity_logs but delete explicitly to be safe
    await supabase.from('activity_logs').delete().eq('company_id', companyId);

    // company_deleted_members — has CASCADE but be explicit
    try { await supabase.from('company_deleted_members').delete().eq('company_id', companyId); } catch (_) {}

    // occasion_hide_amounts / occasion_scopes live on the companies row itself — auto-deleted ✓

    // ── Step 2: Delete the companies row ──────────────────────────────────────
    // This triggers ON DELETE CASCADE for all properly constrained tables:
    // company_members, team_members, occasion_types, occasion_members,
    // notification_approvals, deduction_requests, hris_connections, hris_sync_logs,
    // bank_accounts (where company_id set), company_subscriptions (schema_teams version),
    // support_tickets, gift_claims, contribution_wallets (via cards already deleted).
    const { data: deleted, error: delErr } = await supabase
      .from('companies').delete().eq('id', companyId).select('id');
    if (delErr) throw delErr;
    if (!deleted || deleted.length === 0)
      return res.status(404).json({ error: 'Company not found or already deleted' });

    console.log(`[admin] Company "${company.name}" (${companyId}) fully deleted by admin`);

    res.json({
      message: `Company "${company.name}" and all associated data have been permanently deleted.`,
      deleted_company: { id: companyId, name: company.name, email: company.email },
    });
  } catch (err) {
    console.error('[admin] deleteCompany error:', err.message);
    res.status(500).json({ error: 'Failed to delete company: ' + err.message });
  }
};

const getCompanyTeamMembers = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { data, error } = await supabase
      .from('team_members')
      .select('id, first_name, last_name, email, department, birthday, is_active')
      .eq('company_id', companyId)
      .order('first_name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
};



// GET /api/admin/visitors — admin view of card visitors (guest signers)
const getVisitors = async (req, res) => {
  try {
    // visitors table: guests who signed a card without creating an account
    const { data, error } = await supabase
      .from('visitors')
      .select(`
        id, email, full_name, card_id, card_slug,
        occasion, creator_name, nudge_count,
        last_nudged_at, converted_to_user, converted_at, created_at
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    // Table may not exist yet — return empty gracefully
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return res.json([]);
      }
      throw error;
    }

    // Decorate with converted status
    const decorated = (data || []).map(v => ({
      ...v,
      converted: !!v.converted_to_user,
      author_name:  v.full_name,
      author_email: v.email,
      emails_sent:  v.nudge_count || 0,
    }));

    res.json(decorated);
  } catch (err) {
    console.error('getVisitors error:', err.message);
    res.status(500).json({ error: 'Failed to load visitors' });
  }
};


// ── POST /api/admin/companies/:companyId/set-multiplier ──────────────────────
// Admin sets the per-employee pricing rate for a specific company.
// multiplier = 0 → free, null → not set (get quote), >0 → rate per head
// IMPORTANT: Also upserts an active company_subscriptions row so the nightly
// occasions cron (which only runs for companies with active subscriptions)
// immediately picks up this company and auto-creates birthday cards etc.
const setCompanyMultiplier = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { multiplier } = req.body;

    if (multiplier === undefined || multiplier === null)
      return res.status(400).json({ error: 'multiplier is required (number, 0 for free)' });

    const rate = Number(multiplier);
    if (isNaN(rate) || rate < 0)
      return res.status(400).json({ error: 'multiplier must be a non-negative number' });

    // 1. Update pricing_multiplier on companies table
    const { error } = await supabase.from('companies')
      .update({
        pricing_multiplier:  rate,
        subscription_status: 'active',
        updated_at:          new Date(),
      })
      .eq('id', companyId);

    if (error) throw error;

    // 2. Ensure an active subscription row exists so the nightly occasions cron
    //    includes this company. The cron checks company_subscriptions.status='active'
    //    AND expires_at > now. We use UPDATE-then-INSERT (no upsert) to avoid
    //    needing a unique constraint on company_id.
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 10);
    const subPayload = {
      status:     'active',
      amount:     0,
      starts_at:  new Date(),
      expires_at: farFuture,
      auto_renew: false,
    };

    // Try to UPDATE the most recent existing row first
    let existingSub = null;
    try {
      const { data } = await supabase.from('company_subscriptions')
        .select('id').eq('company_id', companyId)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      existingSub = data;
    } catch (_) {}

    if (existingSub?.id) {
      try {
        const { error: subErr } = await supabase.from('company_subscriptions')
          .update(subPayload).eq('id', existingSub.id);
        if (subErr) console.warn('[setMultiplier] subscription update warning:', subErr.message);
      } catch (e) { console.warn('[setMultiplier] subscription update exception:', e.message); }
    } else {
      // No existing row — INSERT a new one
      try {
        const { error: subErr } = await supabase.from('company_subscriptions').insert({
          company_id: companyId,
          plan:       'monthly', // safe default — 'admin' requires migration_subscription_enum.sql
          ...subPayload,
        });
        if (subErr) console.warn('[setMultiplier] subscription insert warning:', subErr.message);
      } catch (e) { console.warn('[setMultiplier] subscription insert exception:', e.message); }
    }

    try {
      await supabase.from('activity_logs').insert({
        action:      'admin_set_multiplier',
        description: `Admin set pricing multiplier to ₦${rate.toLocaleString('en-NG')} for company ${companyId}`,
        actor_type:  'admin',
      });
    } catch (_) {}

    // Notify HR by email — pricing for their account has changed
    const { data: company } = await supabase.from('companies')
      .select('name, email').eq('id', companyId).maybeSingle();

    if (company?.email) {
      const { sendEmail } = require('../utils/email');
      const FRONTEND_URL = (() => {
        const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
        let s = raw.trim();
        if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
        s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
        return (s.startsWith('http') ? s : 'https://thankeeu.com');
      })();
      sendEmail({
        to:      company.email,
        subject: rate === 0 ? `Your Thankeeu account is now free 🎉` : `Your Thankeeu pricing has been updated`,
        html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;">
          <h2 style="color:#5B4BDF;">Hi ${company.name},</h2>
          <p style="color:#555;line-height:1.7;">
            ${rate === 0
              ? `Great news — your Thankeeu account has been set to <strong>FREE</strong>. No subscription is required to keep using all features.`
              : `Your per-employee pricing has been updated to <strong>₦${rate.toLocaleString('en-NG')} / employee / month</strong>.`}
          </p>
          <p style="color:#555;">Please check your mail and log in to your dashboard to review your current plan and subscription status.</p>
          <a href="${FRONTEND_URL}/company/subscription" style="display:inline-block;background:#5B4BDF;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">View subscription →</a>
          <p style="color:#aaa;font-size:12px;margin-top:20px;">Questions? Reply to this email or contact hello@thankeeu.com</p>
        </div>`,
      }).catch(() => {});
    }

    res.json({
      ok:         true,
      company_id: companyId,
      multiplier: rate,
      message:    rate === 0
        ? 'Company set to FREE — no subscription required'
        : `Multiplier set to ₦${rate.toLocaleString('en-NG')} per employee/month`,
    });
  } catch (err) {
    console.error('setCompanyMultiplier error:', err.message);
    safeError(res, err, 'Admin operation failed');
  }
};

// ── POST /api/admin/companies/:companyId/grant-pilot ─────────────────────────
// Admin grants a free pilot period (14 or 30 days) to a company
const grantPilot = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { days } = req.body;

    const pilotDays = Number(days);
    if (![14, 30].includes(pilotDays))
      return res.status(400).json({ error: 'days must be 14 or 30' });

    const now       = new Date();
    const endsAt    = new Date(now.getTime() + pilotDays * 24 * 60 * 60 * 1000);

    const { error } = await supabase.from('companies').update({
      pilot_starts_at:     now,
      pilot_ends_at:       endsAt,
      pilot_days:          pilotDays,
      subscription_status: 'pilot',
      updated_at:          new Date(),
    }).eq('id', companyId);

    if (error) throw error;

    // Also ensure company_subscriptions has a pilot row
    try {
      await supabase.from('company_subscriptions').upsert({
        company_id: companyId,
        plan:       'pilot',
        status:     'active',
        amount:     0,
        starts_at:  now,
        expires_at: endsAt,
      }, { onConflict: 'company_id' });
    } catch (_) {}

    try {
      await supabase.from('activity_logs').insert({
        action:      'admin_grant_pilot',
        description: `Admin granted ${pilotDays}-day pilot to company ${companyId} until ${endsAt.toISOString().slice(0,10)}`,
        actor_type:  'admin',
      });
    } catch (_) {}

    // Get company details for email
    const { data: company } = await supabase.from('companies')
      .select('name, email').eq('id', companyId).maybeSingle();

    if (company) {
      const { sendEmail } = require('../utils/email');
      const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
      sendEmail({
        to:      company.email,
        subject: `Your Thankeeu ${pilotDays}-day pilot has started! 🚀`,
        html: `<div style="font-family:sans-serif;max-width:540px;margin:0 auto;padding:32px;">
          <h2 style="color:#5B4BDF;">Your pilot is live, ${company.name}! 🧪</h2>
          <p style="color:#555;">You now have <strong>${pilotDays} days of free access</strong> to all Thankeeu automation features — birthday cards, occasion emails, gift pot collection, and more.</p>
          <p style="color:#555;">Your pilot runs until <strong>${endsAt.toLocaleDateString('en-NG', { day:'numeric', month:'long', year:'numeric' })}</strong>. We will notify you before it ends.</p>
          <a href="${FRONTEND_URL}/company/dashboard" style="display:inline-block;background:#5B4BDF;color:#fff;padding:13px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">Go to dashboard →</a>
          <p style="color:#aaa;font-size:12px;margin-top:20px;">Questions? Reply to this email or contact hello@thankeeu.com</p>
        </div>`,
      }).catch(() => {});
    }

    res.json({
      ok:          true,
      company_id:  companyId,
      pilot_days:  pilotDays,
      starts_at:   now,
      ends_at:     endsAt,
      message:     `${pilotDays}-day pilot granted. Company has free access until ${endsAt.toISOString().slice(0,10)}`,
    });
  } catch (err) {
    console.error('grantPilot error:', err.message);
    safeError(res, err, 'Admin operation failed');
  }
};


// ── GET /api/admin/pals — list pal group applications ────────────────────────
const listPalApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let q = supabase.from('pal_groups')
      .select('id, group_name, group_username, email, group_size, description, status, is_verified, created_at')
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) {
      if (error.code === '42P01') return res.json([]); // table not migrated yet
      throw error;
    }
    res.json(data || []);
  } catch (err) { safeError(res, err, 'Admin operation failed'); }
};

// ── POST /api/admin/pals/:id/approve ──────────────────────────────────────────
const approvePalGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { data: group } = await supabase.from('pal_groups').select('*').eq('id', id).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Pals group not found' });

    const verify_token = require('crypto').randomBytes(32).toString('hex');
    await supabase.from('pal_groups').update({ status: 'approved', verify_token, updated_at: new Date() }).eq('id', id);

    const { sendEmail } = require('../utils/email');
    const FRONTEND_URL = (() => {
      const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
      let s = raw.trim();
      if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
      s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
      return (s.startsWith('http') ? s : 'https://thankeeu.com');
    })();

    sendEmail({
      to: group.email,
      template: 'palApproved',
      data: {
        groupName: group.group_name,
        groupUsername: group.group_username,
        verifyUrl: `${FRONTEND_URL}/pals/verify-email?token=${verify_token}`,
      },
    }).catch(() => {});

    res.json({ ok: true, message: `${group.group_name} approved and notified.` });
  } catch (err) { safeError(res, err, 'Admin operation failed'); }
};

// ── POST /api/admin/pals/:id/reject ───────────────────────────────────────────
const rejectPalGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ error: 'A rejection reason is required' });

    const { data: group } = await supabase.from('pal_groups').select('*').eq('id', id).maybeSingle();
    if (!group) return res.status(404).json({ error: 'Pals group not found' });

    await supabase.from('pal_groups').update({ status: 'rejected', rejection_reason: reason.trim(), updated_at: new Date() }).eq('id', id);

    const { sendEmail } = require('../utils/email');
    sendEmail({
      to: group.email,
      template: 'palRejected',
      data: { groupName: group.group_name, reason: reason.trim() },
    }).catch(() => {});

    res.json({ ok: true, message: `${group.group_name} rejected and notified.` });
  } catch (err) { safeError(res, err, 'Admin operation failed'); }
};

module.exports = { getStats, getAllUsers, updateUserRole, deleteUser, giftCredits, getAllCards, deleteCard, redeliverCard, getAllCompanies, deleteCompany, getCompanyTeamMembers, getVisitors, setCompanyMultiplier, grantPilot, listPalApplications, approvePalGroup, rejectPalGroup };
