const supabase = require('../utils/supabase');

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
    const { data, error } = await supabase.from('users').update({ role }).eq('id', userId).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await supabase.from('users').delete().eq('id', userId);
    res.json({ message: 'User deleted' });
  } catch (err) {
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
    await supabase.from('cards').delete().eq('id', cardId);
    res.json({ message: 'Card deleted' });
  } catch (err) {
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
    await supabase.from('companies').delete().eq('id', companyId);
    res.json({ message: 'Company deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete company' });
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
    const { data, error } = await supabase
      .from('card_visitors')
      .select('id, card_slug, occasion, author_name, author_email, converted, converted_at, emails_sent, last_email_at, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load visitors' });
  }
};

module.exports = { getStats, getAllUsers, updateUserRole, deleteUser, getAllCards, deleteCard, getAllCompanies, deleteCompany, getCompanyTeamMembers, getVisitors };
