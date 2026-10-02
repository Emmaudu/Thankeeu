/**
 * dashEmit.js — helpers to push real-time dashboard refresh signals
 * to specific users via the Socket.IO instance stored on the Express app.
 *
 * Usage (in any route file):
 *   const { emitDash } = require('../socket/dashEmit');
 *   emitDash(req, userId, ['tasks', 'bids']);
 */

/**
 * Emit a dashboard:refresh event to a single user.
 * @param {import('express').Request} req - Express request (has req.app)
 * @param {string} userId
 * @param {string[]} keys - e.g. ['tasks'], ['payments'], ['all']
 */
function emitDash(req, userId, keys = ['all']) {
  try {
    const io = req.app.get('io');
    if (io?.notifyUser) {
      io.notifyUser(userId, 'dashboard:refresh', { keys });
    }
  } catch (_) {}
}

/**
 * Emit to multiple users at once.
 */
function emitDashMany(req, userIds, keys = ['all']) {
  userIds.forEach(uid => emitDash(req, uid, keys));
}

module.exports = { emitDash, emitDashMany };
