// ═══════════════════════════════════════════════════════════════════════
// Keeu 👩🏾 — Taskeeu's friendly chat assistant
//
// Keeu posts short reminders into requester ⇄ tasker task chats:
//   • welcome   — when the chat starts (first time either person opens it)
//   • costs     — agree the full price breakdown; how escrow + advance work
//                 (only BEFORE the task is paid for)
//   • proofs    — share photo proofs in chat/WhatsApp; uploading proof in the
//                 3-step completion flow is compulsory before payout
//   • respect   — stay respectful; take disagreements to the Support tab
//
// Pacing (never spam):
//   • a reminder is only posted right after a person sends a message
//     (so Keeu speaks while they are active, not into an empty chat);
//   • at least KEEU_GAP_MS since Keeu last spoke AND at least
//     KEEU_MIN_HUMAN_MESSAGES messages from the two people since then;
//   • at most KEEU_DAILY_MAX reminders per chat in 24 hours;
//   • the kind Keeu said least recently goes next.
//
// Safety: everything here is best-effort. A Keeu failure never blocks or
// fails a real chat message. A unique (room_id, bot_slot) index makes a
// double post impossible even when two messages arrive at the same moment.
// Vooom chats are not task chats and get no reminders.
// ═══════════════════════════════════════════════════════════════════════
const supabase = require('./supabase');

const KEEU_NAME = 'Keeu';
const KEEU_GAP_MS = Number(process.env.KEEU_GAP_MS) || 25 * 60 * 1000;
const KEEU_MIN_HUMAN_MESSAGES = Number(process.env.KEEU_MIN_HUMAN_MESSAGES) || 6;
const KEEU_DAILY_MAX = 4;

const firstName = (full, fallback) => (String(full || '').trim().split(/\s+/)[0] || fallback);

function texts({ requester, tasker }) {
  const r = firstName(requester, 'Requester');
  const t = firstName(tasker, 'Tasker');
  return {
    welcome_unpaid:
`Hi ${r} and ${t}! 👋 I'm Keeu, your Taskeeu assistant. Quick guide before you start:

💬 Agree on the full price in this chat:
📍 distance to the task location
🚕 transport cost (if any)
🧰 equipment / item cost (if any)
📦 courier cost for items (if any)
🛠️ workmanship

💳 ${r} pays ONE total into Taskeeu escrow. ${t} can request an advance from it (for transport, items or courier) on the task page. The workmanship balance is released at the end with the completion code.`,
    welcome_paid:
`Hi ${r} and ${t}! 👋 I'm Keeu, your Taskeeu assistant. The task is paid and held safely in escrow 🔒

📸 ${t}, share photo proofs of your progress here (or on WhatsApp). Uploading proof in the task's completion steps is compulsory before the workmanship balance can be withdrawn.
🙏 Keep it respectful. If you disagree, use the Support tab on your dashboard.`,
    costs:
`Keeu here 👩🏾 Friendly reminder: agree on 📍 distance, 🚕 transport, 🧰 equipment/items, 📦 courier and 🛠️ workmanship before paying. ${r} pays one total into escrow. ${t} can request an advance on the task page for transport, items or courier, and gets the workmanship balance at the end.`,
    proofs:
`Keeu here 👩🏾 ${t}, please send photo proofs of the work here in the chat (or on WhatsApp) as you go 📸 When you finish, uploading proof in the task's 3-step completion flow is compulsory before the workmanship balance can be withdrawn.`,
    respect:
`Keeu here 👩🏾 Please keep this chat kind and respectful 🙏 If you disagree about anything, don't argue here. Open the Support tab on your dashboard and our team will help you both.`,
  };
}

async function loadRoom(roomId) {
  const { data: room, error } = await supabase
    .from('chat_rooms')
    .select('id, task_id, vooom_task_id, requester_id, tasker_id, requester:users!requester_id(full_name), tasker:users!tasker_id(full_name), task:tasks(id, status, is_funded, accepted_tasker_id)')
    .eq('id', roomId)
    .maybeSingle();
  if (error || !room || !room.task_id || room.vooom_task_id) return null;
  return room;
}

// Paid = this room's tasker is the chosen tasker and the task is funded.
const isPaid = (room) => !!(room.task?.is_funded && room.task.accepted_tasker_id === room.tasker_id);
const isClosed = (room) => ['completed', 'cancelled'].includes(room.task?.status);

async function keeuHistory(roomId) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, bot_kind, created_at')
    .eq('room_id', roomId)
    .eq('is_bot', true)
    .order('created_at', { ascending: true });
  if (error) throw error; // column missing (migration not run) → caller gives up quietly
  return data || [];
}

async function post(room, kind, content, slotIndex, io) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: room.id, sender_id: null, content,
      is_bot: true, bot_name: KEEU_NAME, bot_kind: kind, bot_slot: `keeu:${slotIndex}`,
    })
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') return null; // another request just posted this slot
    throw error;
  }
  const message = { ...data, sender: null };
  io?.to(room.id).emit('new_message', message);
  return message;
}

/** Post Keeu's welcome once, when a task chat is first opened or used. */
async function ensureWelcome(roomId, io) {
  try {
    const room = await loadRoom(roomId);
    if (!room || isClosed(room)) return null;
    const history = await keeuHistory(roomId);
    if (history.length) return null;
    const t = texts({ requester: room.requester?.full_name, tasker: room.tasker?.full_name });
    return await post(room, 'welcome', isPaid(room) ? t.welcome_paid : t.welcome_unpaid, 0, io);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('Keeu welcome skipped:', e?.message);
    return null;
  }
}

/** Called after a person sends a message: maybe post one spaced-out reminder. */
async function maybeNudge(roomId, io) {
  try {
    const room = await loadRoom(roomId);
    if (!room || isClosed(room)) return null;
    const history = await keeuHistory(roomId);
    if (!history.length) return await ensureWelcome(roomId, io);

    const now = Date.now();
    const last = history[history.length - 1];
    if (now - new Date(last.created_at).getTime() < KEEU_GAP_MS) return null;
    if (history.filter((h) => now - new Date(h.created_at).getTime() < 24 * 3600 * 1000).length >= KEEU_DAILY_MAX) return null;

    const { count, error } = await supabase
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .eq('is_bot', false)
      .gt('created_at', last.created_at);
    if (error) throw error;
    if ((count || 0) < KEEU_MIN_HUMAN_MESSAGES) return null;

    // After payment the price reminder is no longer needed.
    const kinds = isPaid(room) ? ['proofs', 'respect'] : ['costs', 'proofs', 'respect'];
    const lastSaid = (k) => {
      for (let i = history.length - 1; i >= 0; i--) if (history[i].bot_kind === k) return i;
      return -1;
    };
    const kind = kinds.reduce((best, k) => (lastSaid(k) < lastSaid(best) ? k : best), kinds[0]);
    const t = texts({ requester: room.requester?.full_name, tasker: room.tasker?.full_name });
    return await post(room, kind, t[kind], history.length, io);
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('Keeu reminder skipped:', e?.message);
    return null;
  }
}

module.exports = { ensureWelcome, maybeNudge, KEEU_NAME, _texts: texts };
