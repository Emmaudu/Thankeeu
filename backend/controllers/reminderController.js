const supabase      = require('../utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();
const { sendEmail } = require('../utils/email');

// Calculate next reminder date based on occasion date + frequency
const calcNextRemind = (occasionDate, frequency) => {
  const now = new Date();
  const oDate = new Date(occasionDate);
  const remind = new Date(oDate);
  remind.setFullYear(now.getFullYear());
  // Remind 7 days before
  remind.setDate(remind.getDate() - 7);
  if (remind < now) remind.setFullYear(now.getFullYear() + 1);

  if (frequency === 'once') return remind;
  if (frequency === 'yearly') return remind;
  if (frequency === 'monthly') {
    const r = new Date(now); r.setMonth(r.getMonth() + 1); return r;
  }
  if (frequency === 'quarterly') {
    const r = new Date(now); r.setMonth(r.getMonth() + 3); return r;
  }
  if (frequency === 'weekly') {
    const r = new Date(now); r.setDate(r.getDate() + 7); return r;
  }
  if (frequency === 'bi-weekly') {
    const r = new Date(now); r.setDate(r.getDate() + 14); return r;
  }
  if (frequency === 'daily') {
    const r = new Date(now); r.setDate(r.getDate() + 1); return r;
  }
  return remind;
};

const getReminders = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', req.user.id)
      .order('occasion_date', { ascending: true });
    if (error) throw error;
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load reminders' }); }
};

const createReminder = async (req, res) => {
  try {
    const { recipient_name, recipient_email, occasion, occasion_date, frequency, notes } = req.body;
    if (!recipient_name || !occasion || !occasion_date)
      return res.status(400).json({ error: 'Name, occasion and date are required' });

    const next_remind_at = calcNextRemind(occasion_date, frequency || 'yearly');

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        user_id: req.user.id,
        recipient_name, recipient_email, occasion, occasion_date,
        frequency: frequency || 'yearly',
        notes,
        next_remind_at,
        is_active: true
      })
      .select()
      .maybeSingle();
    if (error) throw error;

    // Dashboard notification
    await supabase.from('notifications').insert({
      user_id: req.user.id,
      type: 'reminder_set',
      title: `⏰ Reminder set for ${recipient_name}`,
      body: `You'll be reminded about ${recipient_name}'s ${occasion} on ${new Date(next_remind_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
      meta: { reminder_id: data.id }
    });

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
};

const updateReminder = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipient_name, recipient_email, occasion, occasion_date, frequency, notes, is_active } = req.body;
    const next_remind_at = calcNextRemind(occasion_date, frequency || 'yearly');
    const { data, error } = await supabase
      .from('reminders')
      .update({ recipient_name, recipient_email, occasion, occasion_date, frequency, notes, is_active, next_remind_at, updated_at: new Date() })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to update reminder' }); }
};

const deleteReminder = async (req, res) => {
  try {
    await supabase.from('reminders').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Reminder deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete reminder' }); }
};

// Called by a cron job — send due reminders
const processDueReminders = async () => {
  const now = new Date();
  const { data: due } = await supabase
    .from('reminders')
    .select('*, users(email, full_name)')
    .eq('is_active', true)
    .lte('next_remind_at', now.toISOString())
    .limit(100);

  for (const r of (due || [])) {
    try {
      const daysUntil = Math.ceil((new Date(r.occasion_date).setFullYear(now.getFullYear()) - now) / 86400000);
      await sendEmail({
        to: r.users.email,
        template: 'reminder',
        data: {
          userName: r.users.full_name,
          recipientName: r.recipient_name,
          occasion: r.occasion,
          occasionDate: new Date(r.occasion_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }),
          daysUntil: Math.max(daysUntil, 7),
          createLink: `${FRONTEND_URL}/create-card`,
        }
      });

      await supabase.from('notifications').insert({
        user_id: r.user_id,
        type: 'reminder_due',
        title: `⏰ Reminder: ${r.recipient_name}'s ${r.occasion} is coming up!`,
        body: `${r.recipient_name}'s ${r.occasion} is in about 7 days. Create a card now!`,
        meta: { reminder_id: r.id }
      });

      // Calculate next
      const next = calcNextRemind(r.occasion_date, r.frequency);
      const updates = { last_reminded_at: now, next_remind_at: next };
      if (r.frequency === 'once') updates.is_active = false;
      await supabase.from('reminders').update(updates).eq('id', r.id);
    } catch (e) { console.error('Reminder send error:', r.id, e); }
  }
};

module.exports = { getReminders, createReminder, updateReminder, deleteReminder, processDueReminders };
