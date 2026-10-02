const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabase');
const { authenticate } = require('../middleware/auth');
const { uploadChat, uploadChatBuffer } = require('../utils/cloudinary');
const { sendNewMessageEmail } = require('../utils/email');
const { onlineUsers } = require('../socket/chatSocket');
const keeu = require('../utils/keeu');

// ── Chat email notification queue ─────────────────────────────────
//
// Rules:
//   1. Never email if recipient has an active socket connection (they're online).
//   2. If recipient is offline, wait DELAY_MS before sending — they may come
//      back or the sender may send more messages (batched into one email).
//   3. Once an email is sent for a room, enforce COOLDOWN_MS before the next
//      one — prevents flooding on a long back-and-forth.
//   4. If a new message arrives while the delay timer is still pending,
//      reset the timer so we always wait from the LAST message.
//
const DELAY_MS    = 30 * 1000;       // wait 30 s after last message before emailing
const COOLDOWN_MS = 10 * 60 * 1000; // minimum 10 min between emails per room/recipient

// key: `${roomId}:${recipientId}` -> { timer, lastEmailAt }
const pendingNotifications = new Map();

function isUserOnline(userId) {
  if (!onlineUsers) return false;
  const sockets = onlineUsers.get(userId);
  return sockets != null && sockets.size > 0;
}

function scheduleEmailNotification({ roomId, recipientId, recipientEmail, recipientName, senderName, preview }) {
  const key = `${roomId}:${recipientId}`;
  const existing = pendingNotifications.get(key);

  // Clear any existing pending timer — reset the delay from this latest message
  if (existing?.timer) {
    clearTimeout(existing.timer);
  }

  const lastEmailAt = existing?.lastEmailAt || 0;

  const timer = setTimeout(() => {
    pendingNotifications.delete(key);

    // Final check: still offline? Cooldown elapsed?
    if (isUserOnline(recipientId)) return;
    if (Date.now() - lastEmailAt < COOLDOWN_MS) return;

    // Update lastEmailAt before sending so concurrent calls can't double-fire
    pendingNotifications.set(key, { timer: null, lastEmailAt: Date.now() });

    sendNewMessageEmail(recipientEmail, recipientName, senderName, preview).catch(() => {});
  }, DELAY_MS);

  pendingNotifications.set(key, { timer, lastEmailAt });
}

// Cleanup stale entries every 30 minutes (memory hygiene)
setInterval(() => {
  const cutoff = Date.now() - COOLDOWN_MS * 2;
  for (const [key, val] of pendingNotifications.entries()) {
    if (!val.timer && val.lastEmailAt < cutoff) pendingNotifications.delete(key);
  }
}, 30 * 60 * 1000);

// ─── GET /chat/rooms — list my chat rooms ─────────────────────────
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch rooms where user is requester OR tasker — regardless of their primary role
    // This covers dual-account users who have both requester and tasker chat rooms.
    const { data: rooms, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        task:tasks(id, title, status, task_city, task_state),
        vooom_task:vooom_tasks(id, from_city, to_city, status, item_type),
        requester:users!requester_id(id, full_name, avatar_url, last_seen),
        tasker:users!tasker_id(id, full_name, avatar_url, last_seen),
        last_message:chat_messages(id, content, media_type, created_at, sender_id).order(created_at.desc).limit(1)
      `)
      .or(`requester_id.eq.${userId},tasker_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    const roomsWithUnread = await Promise.all(
      (rooms || []).map(async (room) => {
        const isRoomTasker = room.tasker_id === userId;
        const lastRead = isRoomTasker ? room.tasker_last_read : room.requester_last_read;
        let unreadQ = supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', room.id)
          .neq('sender_id', userId);
        if (lastRead) unreadQ = unreadQ.gt('created_at', lastRead);
        const { count } = await unreadQ;

        // Add display title for vooom rooms
        const displayTitle = room.vooom_task
          ? `⚡ Vooom: ${room.vooom_task.from_city} → ${room.vooom_task.to_city}`
          : (room.task_title || room.task?.title || 'Chat');

        return { ...room, unread_count: count || 0, display_title: displayTitle };
      })
    );

    res.json({ success: true, rooms: roomsWithUnread });
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch chat rooms' });
  }
});

// ─── GET /chat/rooms/:roomId/messages ─────────────────────────────
router.get('/rooms/:roomId/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Verify access
    const { data: room } = await supabase
      .from('chat_rooms')
      .select('id, requester_id, tasker_id')
      .eq('id', req.params.roomId)
      .maybeSingle();

    if (!room || (room.requester_id !== req.user.id && room.tasker_id !== req.user.id))
      return res.status(403).json({ success: false, message: 'Access denied' });

    // Keeu (chat assistant) greets both people the first time a task chat is opened.
    await keeu.ensureWelcome(req.params.roomId, req.app.get('io'));

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:users!sender_id(id, full_name, avatar_url)
      `)
      .eq('room_id', req.params.roomId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    // Mark messages as read
    const now = new Date().toISOString();
    const isTasker = req.user.role === 'tasker';
    await supabase
      .from('chat_rooms')
      .update(isTasker ? { tasker_last_read: now } : { requester_last_read: now })
      .eq('id', req.params.roomId);

    res.json({ success: true, messages: (messages || []).reverse() });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

// ─── POST /chat/rooms/:roomId/messages — send a message ──────────
router.post(
  '/rooms/:roomId/messages',
  authenticate,
  uploadChat.single('media'),
  async (req, res) => {
    try {
      const { content } = req.body;

      let mediaUrl = null;
      let mediaType = null;

      if (req.file?.buffer) {
        const resourceType = req.file.mimetype.startsWith('video/') ? 'video' : 'auto';
        const result = await uploadChatBuffer(req.file.buffer, resourceType);
        mediaUrl = result.secure_url;
        mediaType = req.file.mimetype.startsWith('video/')
          ? 'video'
          : req.file.mimetype.startsWith('audio/')
          ? 'audio'
          : req.file.mimetype === 'application/pdf'
          ? 'file'
          : 'image';
      }

      if (!content && !mediaUrl)
        return res.status(400).json({ success: false, message: 'Message content or media required' });

      // Verify room access
      const { data: room } = await supabase
        .from('chat_rooms')
        .select('*, requester:users!requester_id(id, email, full_name, last_seen), tasker:users!tasker_id(id, email, full_name, last_seen)')
        .eq('id', req.params.roomId)
        .maybeSingle();

      if (!room || (room.requester_id !== req.user.id && room.tasker_id !== req.user.id))
        return res.status(403).json({ success: false, message: 'Access denied' });

      const { data: message, error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: req.params.roomId,
          sender_id: req.user.id,
          content: content || null,
          media_url: mediaUrl || null,
          media_type: mediaType,
        })
        .select(`*, sender:users!sender_id(id, full_name, avatar_url)`)
        .maybeSingle();

      if (error) throw error;

      // Update room last_message_at
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', req.params.roomId);

      // Email notification — only if recipient is offline, with 30s delay + 10min cooldown
      const recipient = room.requester_id === req.user.id ? room.tasker : room.requester;

      if (recipient?.email && !isUserOnline(recipient.id)) {
        scheduleEmailNotification({
          roomId:        req.params.roomId,
          recipientId:   recipient.id,
          recipientEmail: recipient.email,
          recipientName:  recipient.full_name,
          senderName:    req.user.full_name,
          preview:       content || '[Media file]',
        });
      }

      // Emit via socket (handled in chatSocket.js)
      req.app.get('io')?.to(req.params.roomId).emit('new_message', message);

      // Detect if the sender shared a phone/bank number — nudge them to stay
      // on-platform (does not block the message).
      const offPlatform = detectOffPlatformContact(content);

      res.status(201).json({ success: true, message, offPlatformWarning: offPlatform ? OFF_PLATFORM_WARNING : null });

      // Keeu may add a spaced-out reminder now that the two people are active.
      keeu.maybeNudge(req.params.roomId, req.app.get('io'));
    } catch (err) {
      console.error('Send message error:', err);
      res.status(500).json({ success: false, message: 'Failed to send message' });
    }
  }
);

// ── Off-platform contact detection ────────────────────────────────
// Encourages users to keep negotiation/payment on Taskeeu (so support can
// resolve disputes with a full record). We detect likely phone numbers and
// Nigerian bank account numbers (10 consecutive digits) and, when found,
// return a soft warning flag with the message. We do NOT block the message
// — just nudge. Runs server-side so it can't be bypassed by the client.
function detectOffPlatformContact(text) {
  if (!text) return false;
  // Normalise: strip spaces, dashes, dots, brackets between digits so
  // "080-1234-5678" and "0 8 0 1..." still match.
  const compact = text.replace(/[\s.\-()]/g, '');
  // Nigerian phone: 0 followed by 10 digits (11 total), or +234/234 + 10 digits.
  const ngPhone = /(?:\+?234\d{10}|0\d{10})/;
  // A standalone 10-digit run = likely a NUBAN bank account number.
  const bankAcct = /\d{10}/;
  // People spelling it to dodge detection ("account number is ...").
  const acctKeyword = /\b(acc(oun)?t\s*(no|number|#)?|acct)\b/i;
  return ngPhone.test(compact) || bankAcct.test(compact) || (acctKeyword.test(text) && /\d{6,}/.test(compact));
}

const OFF_PLATFORM_WARNING =
  'For your protection, keep all conversation and payment on Taskeeu. Sharing phone or bank details to deal off-platform means Taskeeu support cannot help if there is a dispute.';


router.post('/rooms/:roomId/messages/:msgId/react', authenticate, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ success: false, message: 'Emoji required' });

    const { data: msg } = await supabase
      .from('chat_messages')
      .select('reactions, room_id')
      .eq('id', req.params.msgId)
      .maybeSingle();

    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });

    const reactions = msg.reactions || {};
    if (!reactions[emoji]) reactions[emoji] = [];

    const idx = reactions[emoji].indexOf(req.user.id);
    if (idx === -1) reactions[emoji].push(req.user.id);
    else reactions[emoji].splice(idx, 1); // toggle off

    if (reactions[emoji].length === 0) delete reactions[emoji];

    await supabase
      .from('chat_messages')
      .update({ reactions })
      .eq('id', req.params.msgId);

    req.app.get('io')?.to(req.params.roomId).emit('reaction_update', {
      message_id: req.params.msgId,
      reactions,
    });

    res.json({ success: true, reactions });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Reaction failed' });
  }
});

// ─── DELETE /chat/rooms/:roomId/messages/:msgId ───────────────────
router.delete('/rooms/:roomId/messages/:msgId', authenticate, async (req, res) => {
  try {
    const { data: msg } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .eq('id', req.params.msgId)
      .maybeSingle();

    if (!msg || msg.sender_id !== req.user.id)
      return res.status(403).json({ success: false, message: 'Not authorized' });

    await supabase
      .from('chat_messages')
      .update({ is_deleted: true, content: 'Message deleted' })
      .eq('id', req.params.msgId);

    req.app.get('io')?.to(req.params.roomId).emit('message_deleted', { message_id: req.params.msgId });

    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// ─── GET /chat/notifications — unread notifications ───────────────
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) throw error;
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// ─── PUT /chat/notifications/read — mark all read ─────────────────
router.put('/notifications/read', authenticate, async (req, res) => {
  try {
    const { ids } = req.body;
    let q = supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id);
    if (ids?.length) q = q.in('id', ids);

    await q;
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Update failed' });
  }
});

module.exports = router;
