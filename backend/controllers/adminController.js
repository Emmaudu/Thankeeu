const supabase = require('../utils/supabase');
const { safeError } = require('../utils/paramGuard');

const getStats = async (req, res) => {
  try {
    const [users, cards, contributions, messages] = await Promise.all([
      supabase.from('users').select('id, full_name, email, role, created_at').order('created_at', { ascending: false }),
      supabase.from('cards').select('id, slug, title, status, occasion, total_collected, created_at').order('created_at', { ascending: false }),
      supabase.from('contributions').select('id, amount, status, contributor_name, created_at').eq('status', 'success'),
      supabase.from('messages').select('count')
    ]);

    const totalRevenue = contributions.data?.reduce((s, c) => s + (c.amount || 0), 0) || 0;
    const platformCut = Math.round(totalRevenue * 0.04);

    res.json({
      stats: {
        total_users: users.data?.length || 0,
        total_cards: cards.data?.length || 0,
        active_cards: cards.data?.filter(c => c.status === 'active').length || 0,
        sent_cards: cards.data?.filter(c => c.status === 'sent').length || 0,
        total_contributions: contributions.data?.length || 0,
        total_gift_volume: totalRevenue,
        platform_revenue: platformCut
      },
      recent_users: users.data?.slice(0, 10) || [],
      recent_cards: cards.data?.slice(0, 10) || [],
      recent_contributions: contributions.data?.slice(0, 10) || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('id, full_name, email, role, is_verified, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
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
        supabase.from('card_signatures').delete().eq('signer_email', user.email).catch?.(() => {}),
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
      .order('created_at', { ascending: false });
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


// ── Company management ────────────────────────────────────────────────

const getAllCompanies = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        id, name, email, contact_person, phone, industry,
        role, created_at,
        company_subscriptions(status, plan, expires_at, amount)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Flatten latest subscription per company
    const companies = (data || []).map(c => {
      const subs = c.company_subscriptions || [];
      const latest = subs.sort((a, b) =>
        new Date(b.expires_at) - new Date(a.expires_at))[0] || null;
      const { company_subscriptions, ...rest } = c;
      return { ...rest, subscription: latest };
    });

    res.json(companies);
  } catch (err) {
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
    await supabase.from('company_deleted_members').delete().eq('company_id', companyId).catch(() => {});

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
    const { data: existingSub } = await supabase.from('company_subscriptions')
      .select('id').eq('company_id', companyId)
      .order('created_at', { ascending: false }).limit(1).maybeSingle().catch(() => ({ data: null }));

    if (existingSub?.id) {
      const { error: subErr } = await supabase.from('company_subscriptions')
        .update(subPayload).eq('id', existingSub.id);
      if (subErr) console.warn('[setMultiplier] subscription update warning:', subErr.message);
    } else {
      // No existing row — INSERT a new one
      const { error: subErr } = await supabase.from('company_subscriptions').insert({
        company_id: companyId,
        plan:       'admin',   // requires migration_subscription_enum.sql to be run
        ...subPayload,
      });
      if (subErr) console.warn('[setMultiplier] subscription insert warning:', subErr.message);
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

module.exports = { getStats, getAllUsers, updateUserRole, deleteUser, getAllCards, deleteCard, getAllCompanies, deleteCompany, getCompanyTeamMembers, getVisitors, setCompanyMultiplier, grantPilot, listPalApplications, approvePalGroup, rejectPalGroup };
