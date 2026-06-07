const supabase = require('../utils/supabase');

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

module.exports = { getDashboard, markNotificationsRead, getDashboardStats };
