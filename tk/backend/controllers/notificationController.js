const supabase = require('../utils/supabase');

// GET /api/notifications — get my notifications (user, member, or company)
const getNotifications = async (req, res) => {
  try {
    const id   = req.user?.id || req.member?.id || req.company?.id;
    const type = req.user ? 'user' : req.member ? 'member' : 'company';
    if (!id) return res.status(401).json({ error: 'Not authenticated' });

    const { data, error } = await supabase
      .from('dashboard_notifications')
      .select('id, type, title, body, data, is_read, created_at')
      .eq('recipient_id', id)
      .eq('recipient_type', type)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
};

// GET /api/notifications/count — unread count
const getUnreadCount = async (req, res) => {
  try {
    const id   = req.user?.id || req.member?.id || req.company?.id;
    const type = req.user ? 'user' : req.member ? 'member' : 'company';
    if (!id) return res.json({ count: 0 });

    const { count, error } = await supabase
      .from('dashboard_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', id)
      .eq('recipient_type', type)
      .eq('is_read', false);

    if (error) throw error;
    res.json({ count: count || 0 });
  } catch (err) {
    res.json({ count: 0 });
  }
};

// POST /api/notifications/mark-read  — mark all as read
const markAllRead = async (req, res) => {
  try {
    const id   = req.user?.id || req.member?.id || req.company?.id;
    const type = req.user ? 'user' : req.member ? 'member' : 'company';
    if (!id) return res.status(401).json({ error: 'Not authenticated' });

    await supabase
      .from('dashboard_notifications')
      .update({ is_read: true })
      .eq('recipient_id', id)
      .eq('recipient_type', type)
      .eq('is_read', false);

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
};

// POST /api/notifications/:id/read — mark single as read
const markOneRead = async (req, res) => {
  try {
    const id   = req.user?.id || req.member?.id || req.company?.id;
    const type = req.user ? 'user' : req.member ? 'member' : 'company';
    if (!id) return res.status(401).json({ error: 'Not authenticated' });

    await supabase
      .from('dashboard_notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('recipient_id', id)
      .eq('recipient_type', type);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
};

module.exports = { getNotifications, getUnreadCount, markAllRead, markOneRead };
