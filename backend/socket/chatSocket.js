const jwt = require('jsonwebtoken');
const supabase = require('../utils/supabase');

// Map: userId -> Set of socketIds — exported so chat.js can check real-time presence
const onlineUsers = new Map();

module.exports = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { data: user } = await supabase
        .from('users')
        .select('id, full_name, role, avatar_url')
        .eq('id', decoded.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Track online status
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    // Update last_seen
    Promise.resolve(supabase.from('users').update({ last_seen: new Date().toISOString() }).eq('id', userId)).catch(() => {});

    // Broadcast online status
    io.emit('user_online', { user_id: userId });
    if (process.env.NODE_ENV !== 'production') console.log(`Socket connected: ${socket.user.full_name}`);

    // ── Join a chat room ──────────────────────────────────────────
    socket.on('join_room', async (roomId) => {
      try {
        // Verify access
        const { data: room } = await supabase
          .from('chat_rooms')
          .select('id, requester_id, tasker_id')
          .eq('id', roomId)
          .maybeSingle();

        if (!room) return socket.emit('error', { message: 'Room not found' });
        if (room.requester_id !== userId && room.tasker_id !== userId)
          return socket.emit('error', { message: 'Access denied' });

        socket.join(roomId);
        socket.emit('joined_room', { room_id: roomId });

        // Notify partner user is online
        const partnerId = room.requester_id === userId ? room.tasker_id : room.requester_id;
        const partnerOnline = onlineUsers.has(partnerId) && onlineUsers.get(partnerId).size > 0;
        socket.emit('partner_status', { user_id: partnerId, is_online: partnerOnline });

        // Alert partner that current user is in the room
        io.to(roomId).emit('user_joined_room', { user_id: userId, room_id: roomId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ── Leave a room ──────────────────────────────────────────────
    socket.on('leave_room', (roomId) => {
      socket.leave(roomId);
      io.to(roomId).emit('user_left_room', { user_id: userId, room_id: roomId });
    });

    // ── Typing indicator ──────────────────────────────────────────
    socket.on('typing', ({ room_id, is_typing }) => {
      socket.to(room_id).emit('user_typing', { user_id: userId, is_typing, room_id });
    });

    // ── Message read receipt ──────────────────────────────────────
    socket.on('message_read', async ({ room_id, message_id }) => {
      try {
        await supabase
          .from('chat_messages')
          .update({ is_read: true })
          .eq('id', message_id);

        io.to(room_id).emit('message_seen', { message_id, read_by: userId });
      } catch (_) {}
    });

    // ── Check if a user is online ─────────────────────────────────
    socket.on('check_online', ({ user_id }) => {
      const isOnline = onlineUsers.has(user_id) && onlineUsers.get(user_id).size > 0;
      socket.emit('online_status', { user_id, is_online: isOnline });
    });

    // ── Notification: mark read ───────────────────────────────────
    socket.on('notification_read', async (notifId) => {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
    });

    // ── Disconnect ────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_offline', { user_id: userId });
        }
      }

      supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId)
        .then(() => {});

      console.log(`❌ Socket disconnected: ${socket.user.full_name}`);
    });
  });

  // Helper to push notification to a specific user's sockets
  io.notifyUser = (userId, event, data) => {
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.forEach((socketId) => {
        io.to(socketId).emit(event, data);
      });
    }
  };

  return io;
};

// Attach onlineUsers AFTER module.exports is defined so it isn't wiped
module.exports.onlineUsers = onlineUsers;
