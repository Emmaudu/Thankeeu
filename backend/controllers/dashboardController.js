const supabase      = require('../utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Run all queries in parallel for speed
    const [cardsRes, creditsRes, notificationsRes] = await Promise.all([
      supabase
        .from('cards')
        .select(`
          id, slug, title, recipient_name, occasion, design_theme,
          background_color, status, is_gift_enabled, total_collected,
          send_date, deadline, created_at, updated_at,
          messages(count)
        `)
        .eq('creator_id', userId)
        .order('created_at', { ascending: false }),

      supabase
        .from('card_credits')
        .select('credits_remaining')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),

      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const cards = cardsRes.data || [];

    // Compute stats server-side (efficient)
    const stats = {
      total_cards: cards.length,
      active_cards: cards.filter(c => c.status === 'active').length,
      draft_cards: cards.filter(c => c.status === 'draft').length,
      sent_cards: cards.filter(c => c.status === 'sent').length,
      total_collected: cards.reduce((sum, c) => sum + (c.total_collected || 0), 0),
      total_messages: cards.reduce((sum, c) => sum + (c.messages?.[0]?.count || 0), 0),
      credits_remaining: creditsRes.data?.credits_remaining || 0,
      unread_notifications: notificationsRes.data?.length || 0
    };

    // Cards closing soon (within 48 hours)
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const closing_soon = cards.filter(c =>
      c.status === 'active' &&
      c.deadline &&
      new Date(c.deadline) > now &&
      new Date(c.deadline) <= in48h
    );

    // Recent activity — last 5 active/sent cards
    const recent_cards = cards.slice(0, 6);

    res.json({
      stats,
      recent_cards,
      closing_soon,
      notifications: notificationsRes.data || [],
      all_cards: cards
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
};

const markNotificationsRead = async (req, res) => {
  try {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Contribution history — how much gift money has flowed through user's cards
    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount, status, created_at, cards!inner(creator_id)')
      .eq('cards.creator_id', userId)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(20);

    // Monthly breakdown
    const monthly = {};
    (contributions || []).forEach(c => {
      const month = new Date(c.created_at).toLocaleDateString('en', { month: 'short', year: 'numeric' });
      monthly[month] = (monthly[month] || 0) + (c.amount || 0);
    });

    res.json({
      contribution_history: contributions || [],
      monthly_breakdown: monthly
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load stats' });
  }
};


// Financial history — all gift contributions on creator's cards
const getFinancialHistory = async (req, res) => {
  try {
    const { data } = await supabase
      .from('contributions')
      .select('id, amount, contributor_name, contributor_email, status, created_at, cards!inner(slug, title, recipient_name, occasion)')
      .eq('cards.creator_id', req.user.id)
      .eq('status', 'success')
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load financial history' }); }
};

// Delivered cards — sent cards (never expire)
const getDeliveredCards = async (req, res) => {
  try {
    const { data } = await supabase
      .from('cards')
      .select('*, messages(count)')
      .eq('creator_id', req.user.id)
      .eq('status', 'sent')
      .order('updated_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load delivered cards' }); }
};

// Received cards — transferred OR auto-matched by recipient_email
const getReceivedCards = async (req, res) => {
  try {
    const userId    = req.user.id;
    const userEmail = req.user.email?.toLowerCase();

    // 1. Cards explicitly transferred to this user
    const { data: transferred } = await supabase
      .from('received_cards')
      .select('transferred_at, cards(id, slug, title, recipient_name, occasion, design_theme, background_color, status, total_collected, is_gift_enabled, access_token, messages(count))')
      .eq('recipient_user_id', userId)
      .order('transferred_at', { ascending: false });

    // 2. Sent cards where recipient_email matches this user's email
    let emailMatched = [];
    if (userEmail) {
      const { data: em } = await supabase
        .from('cards')
        .select('id, slug, title, recipient_name, occasion, design_theme, background_color, status, total_collected, is_gift_enabled, access_token, updated_at, messages(count)')
        .eq('recipient_email', userEmail)
        .in('status', ['sent', 'active'])
        .order('updated_at', { ascending: false });
      emailMatched = em || [];
    }

    // Merge, dedup by card id
    const transferredCards = (transferred || []).map(r => ({
      ...r.cards,
      signed_count: r.cards?.messages?.[0]?.count || 0,
      messages: undefined,
      received_at: r.transferred_at,
      source: 'transferred',
    }));

    const emailMatchedCards = emailMatched.map(c => ({
      ...c,
      signed_count: c.messages?.[0]?.count || 0,
      messages: undefined,
      received_at: c.updated_at,
      source: 'email_match',
    }));

    // Combine and remove duplicates (prefer transferred over email_match)
    const seen = new Set(transferredCards.map(c => c.id));
    const combined = [
      ...transferredCards,
      ...emailMatchedCards.filter(c => !seen.has(c.id)),
    ];

    res.json(combined);
  } catch (err) {
    console.error('getReceivedCards error:', err);
    res.status(500).json({ error: 'Failed to load received cards' });
  }
};

// Pending to sign — cards where this user was invited via email
const getPendingToSign = async (req, res) => {
  try {
    const { data } = await supabase
      .from('card_invites')
      .select('*, cards(slug, title, recipient_name, occasion, design_theme, background_color, status, deadline)')
      .eq('user_id', req.user.id)
      .eq('signed', false)
      .order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load pending cards' }); }
};

// Transfer card to another user by username
const transferCard = async (req, res) => {
  try {
    const { card_slug, recipient_username } = req.body;
    if (!card_slug || !recipient_username)
      return res.status(400).json({ error: 'Card and recipient username are required' });

    const { data: card } = await supabase.from('cards').select('id, creator_id, title').eq('slug', card_slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });
    if (card.creator_id !== req.user.id) return res.status(403).json({ error: 'Only the card creator can transfer it' });

    const { data: recipient } = await supabase.from('users').select('id, email, full_name').eq('username', recipient_username.toLowerCase()).maybeSingle();
    if (!recipient) return res.status(404).json({ error: `User @${recipient_username} not found` });

    const { error } = await supabase.from('received_cards').upsert({
      card_id: card.id,
      recipient_user_id: recipient.id,
      transferred_by: req.user.id,
      transferred_at: new Date()
    }, { onConflict: 'card_id,recipient_user_id' });
    if (error) throw error;

    // Notify recipient
    await supabase.from('notifications').insert({
      user_id: recipient.id,
      type: 'card_received',
      title: `🎉 You received a card box!`,
      body: `${req.user.full_name} transferred "${card.title}" to your Received tab.`,
      meta: { card_slug, transferred_by: req.user.id }
    });

    res.json({ message: `Card transferred to @${recipient_username} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to transfer card' });
  }
};

// Track when recipient opens the card
const trackCardOpened = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: card } = await supabase.from('cards').select('id, creator_id, title, opened_at, opened_notified').eq('slug', slug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    if (!card.opened_at) {
      await supabase.from('cards').update({ opened_at: new Date() }).eq('id', card.id);
    }

    if (!card.opened_notified && card.creator_id) {
      await supabase.from('cards').update({ opened_notified: true }).eq('id', card.id);
      await supabase.from('notifications').insert({
        user_id: card.creator_id,
        type: 'card_opened',
        title: `👀 Your card was opened!`,
        body: `The recipient just opened "${card.title}"`,
        meta: { card_slug: slug }
      });
      // Email creator
      const { data: creator } = await supabase.from('users').select('email, full_name').eq('id', card.creator_id).single();
      if (creator) {
        const { sendEmail } = require('../utils/email');
        sendEmail({ to: creator.email, template: 'cardOpened', data: { name: creator.full_name, cardTitle: card.title, cardSlug: slug, appUrl: FRONTEND_URL } }).catch(() => {});
      }
    }
    res.json({ opened: true });
  } catch (err) { res.status(500).json({ error: 'Failed to track open' }); }
};

module.exports = {
  getDashboard, markNotificationsRead, getDashboardStats,
  getFinancialHistory, getDeliveredCards, getReceivedCards,
  getPendingToSign, transferCard, trackCardOpened
};
