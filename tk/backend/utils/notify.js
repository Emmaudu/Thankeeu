/**
 * notify.js — dashboard notification helper
 * Inserts a dashboard_notifications row so the bell lights up in the UI.
 * Errors are swallowed so a failed notification never breaks the main flow.
 */
const supabase = require('./supabase');

/**
 * @param {string}   recipientId    — user.id or company_members.id
 * @param {'user'|'member'|'company'} recipientType
 * @param {string}   type           — e.g. 'sign_card'
 * @param {string}   title
 * @param {string}   [body]
 * @param {object}   [data]         — {card_slug, amount, …}
 */
const pushNotification = async (recipientId, recipientType, type, title, body = '', data = {}) => {
  try {
    await supabase.from('dashboard_notifications').insert({
      recipient_id:   recipientId,
      recipient_type: recipientType,
      type,
      title,
      body,
      data,
    });
  } catch (e) {
    console.error('pushNotification error:', e.message);
  }
};

/**
 * Notify many recipients at once (bulk insert)
 */
const pushNotificationBulk = async (rows) => {
  if (!rows.length) return;
  try {
    await supabase.from('dashboard_notifications').insert(rows);
  } catch (e) {
    console.error('pushNotificationBulk error:', e.message);
  }
};

module.exports = { pushNotification, pushNotificationBulk };
