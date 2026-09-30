/**
 * deliveryEngine.js — scheduled card delivery (moved out of server.js so it
 * can be tested). createDeliveryEngine(deps?) — deps default to the real
 * services; tests inject fakes (supabase, sendEmail, scheduler, cardPayment).
 */
const cryptoLib = require('crypto');

function createDeliveryEngine(deps = {}) {
  const supabase  = deps.supabase  || require('./supabase');
  const sendEmail = deps.sendEmail || require('./email').sendEmail;
  const scheduler = deps.scheduler || require('./scheduler');
  const { isPaymentPending, queryExcludingUnpaid } = deps.cardPayment || require('./cardPayment');
  const crypto = cryptoLib;

  // In-memory lock: prevent two concurrent deliveries of the same card
  // (e.g. startup autoSendDueCards + scheduler firing at the same time)
  const _delivering = new Set();
  // slug → epoch ms before which a failed delivery is not retried (the minute
  // sweep would otherwise hammer a bad address / email outage every minute).
  const _deliveryBackoff = new Map();
  const DELIVERY_RETRY_MIN = 15;

  async function deliverCard(card) {
    const now = new Date();
    const slug = card?.slug || 'unknown';

    // In-memory lock: if another async path is already delivering this card, skip
    const retryAt = _deliveryBackoff.get(slug);
    if (retryAt && Date.now() < retryAt) return { skipped: true, reason: 'backoff' };
    if (_delivering.has(slug)) {
      console.log(`[deliver] Already in progress for ${slug}, skipping duplicate`);
      return { skipped: true };
    }
    _delivering.add(slug);

    try {
      // Safety check — card must have an id to proceed
      if (!card || !card.id) {
        console.error(`[deliver] Card missing id. card=`, JSON.stringify(card)?.slice(0, 200));
        return { error: 'card.id is missing' };
      }

      // Guard: re-fetch current status so a concurrent delivery never double-sends
      const { data: fresh, error: fetchErr } = await supabase
        .from('cards')
        .select('id, slug, status, recipient_notified, recipient_email, recipient_name, occasion, custom_occasion, access_token, claim_token, total_collected, company_id, card_experience, movie_status, send_date')
        .eq('id', card.id)
        .maybeSingle();

      if (fetchErr) {
        console.error(`[deliver] Failed to fetch card ${slug}:`, fetchErr.message);
        return { error: fetchErr.message };
      }

      if (!fresh || fresh.status !== 'active' || fresh.recipient_notified) {
        console.log(`[deliver] Skipping ${slug}: status=${fresh?.status}, notified=${fresh?.recipient_notified}`);
        return { skipped: true };
      }

      // Create Now, Pay Later: an unpaid card is held — never delivered. Paying
      // it (markCardFeePaid) re-arms delivery, immediately if already overdue.
      // Read fresh here, on the authoritative path, rather than trusting the
      // flag on whatever card object armed this timer.
      if (await isPaymentPending(fresh.id)) {
        console.log(`[deliver] Holding ${slug}: card fee not paid yet (pay-later)`);
        scheduler.cancelSchedule(slug);
        return { skipped: true, reason: 'awaiting_payment' };
      }

      // Due-date guard. A timer armed before the creator rescheduled the card
      // would otherwise deliver it at the OLD time — the card arrives early and
      // there is no way to undo it. Re-read send_date at fire time and refuse if
      // the card is not actually due yet, then re-arm for the real time.
      // 30s of slack absorbs timer jitter and clock skew.
      if (fresh.send_date) {
        const dueAt = new Date(fresh.send_date).getTime();
        if (!isNaN(dueAt) && dueAt - Date.now() > 30 * 1000) {
          console.log(`[deliver] ${slug} is not due yet (due ${new Date(dueAt).toISOString()}) — re-arming, not sending`);
          scheduler.scheduleCardDelivery({ ...fresh, send_date: fresh.send_date });
          return { skipped: true, reason: 'not_due' };
        }
      }

      if (!fresh.recipient_email) {
        console.error(`[deliver] Card ${slug} has no recipient_email — cannot deliver`);
        return { error: 'no recipient_email' };
      }

      const claimToken = fresh.claim_token || crypto.randomBytes(24).toString('hex');

      // 1. Mark as sent in DB FIRST
      // .select('id') tells us whether THIS call flipped the row: if another
      // server instance got there first, 0 rows change and we must not email
      // the recipient a second time.
      let saveErr, claimedRows;
      ({ data: claimedRows, error: saveErr } = await supabase.from('cards').update({
        status:             'sent',
        recipient_notified: true,
        delivered_at:       now,
        claim_token:        claimToken,
      }).eq('id', fresh.id).eq('status', 'active').select('id'));

      // Fallback: if delivered_at or claim_token columns don't exist yet
      if (saveErr && (saveErr.code === '42703' || /column .* does not exist/i.test(saveErr.message || ''))) {
        console.warn(`[deliver] Optional column missing, retrying minimal update for ${slug}:`, saveErr.message);
        ({ data: claimedRows, error: saveErr } = await supabase.from('cards').update({
          status:             'sent',
          recipient_notified: true,
        }).eq('id', fresh.id).eq('status', 'active').select('id'));
      }

      if (saveErr) {
        console.error(`[deliver] DB update failed for ${slug}:`, saveErr.message);
        return { error: saveErr.message };
      }
      if (Array.isArray(claimedRows) && claimedRows.length === 0) {
        console.log(`[deliver] ${slug} was already claimed by another delivery — not sending twice`);
        return { skipped: true, reason: 'already_claimed' };
      }

      // 2. Auto-link to recipient's account if they have one
      try {
        const { data: existingUser } = await supabase
          .from('users').select('id').eq('email', fresh.recipient_email.toLowerCase()).maybeSingle();
        if (existingUser?.id) {
          // Use insert and silently ignore the duplicate-key error (UNIQUE constraint on card_id, recipient_user_id)
          // instead of upsert with onConflict, which has parsing quirks in some Supabase JS versions.
          const { error: insertErr } = await supabase.from('received_cards').insert({
            card_id:           fresh.id,
            recipient_user_id: existingUser.id,
            transferred_by:    null,
            transferred_at:    now,
          });
          if (insertErr && !insertErr.code?.includes('23505')) {
            // 23505 = unique_violation (already linked) — ignore that, log anything else
            console.warn(`[deliver] received_cards insert warning for ${slug}:`, insertErr.message);
          }
        }
      } catch (linkErr) {
        console.warn(`[deliver] Auto-link failed for ${slug} (non-fatal):`, linkErr.message);
      }

      // 3. Count messages for the email
      const { count } = await supabase.from('messages')
        .select('*', { count: 'exact', head: true }).eq('card_id', fresh.id);

      // 3b. Check if the movie was pre-rendered before delivery.
      //     The pre-render cron fires ~45 min before send_date so the movie is
      //     often already done by the time this delivery email goes out.
      const movieAlreadyDone = fresh.movie_status === 'completed';
      const hasMessages      = (count || 0) > 0;

      // 4. Send delivery email — checked and retried. If it still fails the
      // card is put back to 'active' (undelivered) so it is retried later,
      // instead of being marked delivered with nothing in the inbox.
      const deliveryEmail = {
        to: fresh.recipient_email,
        template: 'cardDelivery',
        data: {
          recipientName:  fresh.recipient_name,
          recipientEmail: fresh.recipient_email,
          occasion: (fresh.occasion === 'other' && fresh.custom_occasion)
            ? fresh.custom_occasion
            : (fresh.occasion || '').replace(/_/g, ' '),
          custom_occasion: fresh.custom_occasion || null,
          occasionLabel: fresh.custom_occasion || (fresh.occasion || '').replace(/_/g, ' '),
          cardSlug:      fresh.slug,
          claimToken:    null,
          accessToken:   fresh.access_token,
          senderCount:   count || 0,
          giftAmount:    (fresh.total_collected || 0) > 0 ? fresh.total_collected : null,
          isCompanyCard: !!fresh.company_id,
          hasMemoryWall: ['card_and_wall','wall_only'].includes(fresh.card_experience),
          // If movie was pre-rendered before delivery -> show "Watch now" CTA.
          // Otherwise signal it's on its way; a separate email fires when done.
          hasMovie:    movieAlreadyDone,
          movieComing: hasMessages && !movieAlreadyDone,
        },
      };
      let mailResult = null;
      for (let attempt = 1; attempt <= 3; attempt++) {
        mailResult = await sendEmail(deliveryEmail);
        if (mailResult?.success) break;
        if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 2000));
      }
      if (!mailResult?.success) {
        console.error(`[deliver] ❌ Email to ${fresh.recipient_email} failed 3 times for ${slug} — reverting to undelivered, retrying in ${DELIVERY_RETRY_MIN} min`);
        // Put it back so it is retried. Try twice: if this write were lost the
        // card would look delivered while nothing reached the recipient.
        for (let i = 0; i < 2; i++) {
          const { error: revertErr } = await supabase.from('cards')
            .update({ status: 'active', recipient_notified: false })
            .eq('id', fresh.id).eq('status', 'sent');
          if (!revertErr) break;
          console.error(`[deliver] ❌ Could not revert ${slug} to undelivered (attempt ${i + 1}):`, revertErr.message);
          if (i === 0) await new Promise(r => setTimeout(r, 2000));
        }
        _deliveryBackoff.set(slug, Date.now() + DELIVERY_RETRY_MIN * 60 * 1000);
        _delivering.delete(slug);
        return { error: 'delivery email failed' };
      }
      _deliveryBackoff.delete(slug);

      console.log(`[deliver] Delivered ${slug} -> ${fresh.recipient_email}${movieAlreadyDone ? ' (movie ready)' : ''}`);

      // Trigger Memory Movie render if not already done/in-progress.
      // Fire-and-forget: never awaited, never blocks delivery, never throws.
      // The pre-render cron fires 45 min early so the movie is often already
      // done here and this block just logs and returns.
      setImmediate(async () => {
        try {
          if (!hasMessages) {
            console.log(`[movie] Skipping render for ${slug}: no messages`);
            return;
          }
          if (movieAlreadyDone) {
            console.log(`[movie] Skipping render for ${slug}: already completed by pre-render`);
            return;
          }
          // Re-check live status in case pre-render cron fired since our fresh fetch
          const { data: mmRow } = await supabase.from('memory_movies')
            .select('status').eq('card_id', fresh.id).maybeSingle();
          if (mmRow && ['completed','rendering','queued'].includes(mmRow.status)) {
            console.log(`[movie] Skipping render for ${slug}: status=${mmRow.status}`);
            return;
          }
          const { runMovieJob } = require('../controllers/movieController');
          if (runMovieJob) await runMovieJob(fresh.id);
        } catch (e) {
          console.warn(`[movie] Auto-trigger failed for ${slug}:`, e.message);
        }
      });

      _delivering.delete(slug);
      return { delivered: slug };
    } catch (err) {
      _delivering.delete(slug);
      console.error(`[deliver] ❌ Error for ${slug}:`, err.message, err.stack?.split('\n').slice(1, 4).join(' | '));
      return { error: err.message };
    }
  }

  // Register deliverCard with the shared scheduler so controllers can arm timers
  // without circular-requiring server.js.
  // scheduler.init(deliverCard) is done by server.js after creating the engine.

  // autoSendDueCards: sweep the DB for any past-due cards.
  // Serves as a safety net for cards missed during restarts or whose
  // send_date is too far out for setTimeout. Runs every minute via cron.
  async function autoSendDueCards() {
    const now = new Date();
    const nowISO = now.toISOString();

    let cardsToSend, cardsToSendErr;
    try {
      // Unpaid (pay-later) cards are excluded at the query so they are not
      // re-examined every minute; deliverCard re-checks regardless.
      ({ data: cardsToSend, error: cardsToSendErr } = await queryExcludingUnpaid((excludeUnpaid) => {
        // FIX: `.eq('recipient_notified', false)` never matches a NULL flag
        // (NULL = false is not true in SQL), so a card with a NULL flag was
        // skipped forever. Treat NULL as "not delivered yet". Oldest first.
        let q = supabase
          .from('cards')
          .select('*')
          .eq('status', 'active')
          .or('recipient_notified.is.null,recipient_notified.eq.false')
          .not('recipient_email', 'is', null)
          .not('send_date', 'is', null)
          .lte('send_date', nowISO)
          .order('send_date', { ascending: true });
        if (excludeUnpaid) q = q.eq('payment_pending', false);
        return q;
      }, 'autoSendDueCards'));
    } catch (queryErr) {
      console.error('[auto-send] Supabase query threw:', queryErr.message);
      lastSweep = { at: new Date().toISOString(), error: queryErr.message };
      return lastSweep;
    }

    if (cardsToSendErr) {
      console.error('[auto-send] Query error:', cardsToSendErr.message);
      lastSweep = { at: new Date().toISOString(), error: cardsToSendErr.message };
      return lastSweep;
    }

    const cards = cardsToSend || [];
    let delivered = 0;
    if (cards.length) {
      console.log(`[auto-send] Sweep found ${cards.length} due card(s)`);
      for (const card of cards) {
        const r = await deliverCard(card).catch(e => { console.error('[auto-send] deliver error:', e.message); return null; });
        if (r?.delivered) delivered += 1;
      }
    }
    lastSweep = { at: new Date().toISOString(), due: cards.length, delivered };
    return lastSweep;
  }

  // scheduleAllActive: on startup, load every future-scheduled active card
  // and register a precise setTimeout for each one.
  async function scheduleAllActive() {
    const { data: cards, error } = await queryExcludingUnpaid((excludeUnpaid) => {
      let q = supabase
        .from('cards')
        .select('id, slug, send_date, send_time, recipient_email, recipient_name, occasion, custom_occasion, access_token, claim_token, total_collected, company_id, status, recipient_notified')
        .eq('status', 'active')
        .or('recipient_notified.is.null,recipient_notified.eq.false')
        .not('send_date', 'is', null)
        .not('recipient_email', 'is', null);
      if (excludeUnpaid) q = q.eq('payment_pending', false);
      return q;
    }, 'scheduleAllActive');

    if (error) { console.error('[scheduleAllActive] Query error:', error.message); return; }

    const future = (cards || []).filter(c => {
      const t = new Date(c.send_date);
      return !isNaN(t.getTime());
    });

    console.log(`[scheduleAllActive] Registering ${future.length} scheduled card(s)`);
    future.forEach(c => scheduler.scheduleCardDelivery(c));
  }

  let lastSweep = null;

  // ── FIX: a due card that cannot be sent must not fail silently ───────────
  // Cards that reached their delivery time but have no recipient email are
  // skipped by the sweep (there is nowhere to send them). Tell the creator
  // once, straight away, so they can add it — the card then goes out on the
  // next minute. Unpaid (pay-later) cards get their own "on hold" email from
  // payLaterEmails.sweepOverduePayLater.
  const _alerted = new Set(); // fallback when delivery_issue_notified_at is missing
  async function alertBlockedDueCards() {
    const nowISO = new Date().toISOString();
    let { data: cards, error } = await supabase.from('cards')
      .select('id, slug, recipient_name, send_date, delivery_timezone, creator_id, delivery_issue_notified_at')
      .eq('status', 'active')
      .or('recipient_notified.is.null,recipient_notified.eq.false')
      .is('recipient_email', null)
      .not('send_date', 'is', null)
      .lte('send_date', nowISO)
      .is('delivery_issue_notified_at', null)
      .limit(100);
    let hasColumn = true;
    if (error && /delivery_issue_notified_at/.test(`${error.message} ${error.details || ''}`)) {
      hasColumn = false;
      ({ data: cards, error } = await supabase.from('cards')
        .select('id, slug, recipient_name, send_date, delivery_timezone, creator_id')
        .eq('status', 'active')
        .or('recipient_notified.is.null,recipient_notified.eq.false')
        .is('recipient_email', null)
        .not('send_date', 'is', null)
        .lte('send_date', nowISO)
        .limit(100));
    }
    if (error) { console.error('[delivery-alert] query failed:', error.message); return { alerted: 0 }; }
    let alerted = 0;
    for (const card of cards || []) {
      if (!hasColumn && _alerted.has(card.id)) continue;
      if (hasColumn) {
        // Claim first so two instances never email twice.
        const { data: claimed } = await supabase.from('cards')
          .update({ delivery_issue_notified_at: new Date().toISOString() })
          .eq('id', card.id).is('delivery_issue_notified_at', null).select('id').maybeSingle();
        if (!claimed) continue;
      } else {
        _alerted.add(card.id);
      }
      if (!card.creator_id) continue;
      const { data: creator } = await supabase.from('users').select('email, full_name').eq('id', card.creator_id).maybeSingle();
      if (!creator?.email) continue;
      const { humanSendDate } = deps.cardPayment || require('./cardPayment');
      const res = await sendEmail({
        to: creator.email,
        template: 'deliveryBlockedNoEmail',
        data: {
          creatorName: (creator.full_name || '').split(/\s+/)[0] || '',
          recipientName: card.recipient_name || 'your recipient',
          cardSlug: card.slug,
          sendDate: humanSendDate ? humanSendDate(card.send_date, card.delivery_timezone) : card.send_date,
        },
      });
      if (res?.success) alerted += 1;
      console.warn(`[delivery-alert] ${card.slug} is due but has no recipient email — creator notified`);
    }
    return { alerted };
  }

  /**
   * Diagnostics: every card whose delivery time has passed but that has not
   * been delivered, with the reason. Powers /api/internal/delivery-status.
   */
  async function deliveryStatus({ limit = 200 } = {}) {
    const nowISO = new Date().toISOString();
    const { data, error } = await supabase.from('cards')
      .select('*')
      .in('status', ['draft', 'active'])
      .or('recipient_notified.is.null,recipient_notified.eq.false')
      .not('send_date', 'is', null)
      .lte('send_date', nowISO)
      .order('send_date', { ascending: true })
      .limit(limit);
    if (error) return { error: error.message, lastSweep };
    const overdue = (data || []).map((c) => {
      const reason = c.status === 'draft' ? 'draft — never launched'
        : c.payment_pending ? 'unpaid — held until the card fee is paid'
        : !c.recipient_email ? 'no recipient email'
        : _deliveryBackoff.get(c.slug) ? 'email provider failed — retrying'
        : 'due — will be sent on the next sweep';
      return { slug: c.slug, status: c.status, send_date: c.send_date, delivery_timezone: c.delivery_timezone || null,
        recipient_email: c.recipient_email ? c.recipient_email.replace(/^(.).*(@.*)$/, '$1***$2') : null, reason };
    });
    return { now: nowISO, lastSweep, overdue };
  }

  return { deliverCard, autoSendDueCards, scheduleAllActive, alertBlockedDueCards, deliveryStatus, getLastSweep: () => lastSweep };
}

module.exports = { createDeliveryEngine };
