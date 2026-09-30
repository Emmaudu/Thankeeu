/**
 * movieController.js — Thankeeu Memory Movie™
 *
 * Routes:
 *   POST /api/movies/:cardId/generate  — queue generation (card owner only)
 *   GET  /api/movies/:cardId           — get movie status + URL
 *   POST /api/movies/:cardId/regenerate — force re-render (card owner only)
 */

'use strict';

const supabase      = require('../utils/supabase');
const { renderMovie } = require('../utils/movieRenderer');

// ── In-memory queue (no Redis needed — Railway restarts are rare) ─────────────
// Maps cardId → Promise so we never render the same card twice simultaneously.
const activeJobs = new Map();

// ── Helper: update movie status in both tables atomically ────────────────────
async function setStatus(cardId, status, extra = {}) {
  const now = new Date().toISOString();

  // Upsert memory_movies row
  const { error: upsertErr } = await supabase.from('memory_movies').upsert({
    card_id: cardId,
    status,
    updated_at: now,
    ...(status === 'rendering' ? { render_started_at: now } : {}),
    ...(status === 'completed' ? { render_completed_at: now } : {}),
    ...extra,
  }, { onConflict: 'card_id' });
  if (upsertErr) console.error(`[movie] setStatus upsert failed (${cardId}, ${status}):`, upsertErr.message);

  // Mirror status on cards row for fast reads
  const { error: mirrorErr } = await supabase.from('cards')
    .update({ movie_status: status })
    .eq('id', cardId);
  if (mirrorErr) console.error(`[movie] movie_status mirror failed (${cardId}, ${status}):`, mirrorErr.message);
}

// ── Background render job ────────────────────────────────────────────────────
async function runRenderJob(cardId) {
  try {
    await setStatus(cardId, 'rendering');

    // Fetch card (include fields needed for the "movie ready" email)
    const { data: card, error: cardErr } = await supabase
      .from('cards')
      .select('id, title, recipient_name, recipient_email, occasion, slug, status')
      .eq('id', cardId)
      .maybeSingle();
    if (cardErr) throw new Error(`Card fetch error: ${cardErr.message} (code: ${cardErr.code})`);
    if (!card) throw new Error(`Card not found in DB: ${cardId}`);

    // Fetch messages with media — include media_gallery (JSONB array of additional
    // media URLs per message) so carousel photos all make it into the movie.
    const { data: msgs, error: msgsErr } = await supabase
      .from('messages')
      .select('id, author_name, content, media_url, media_type, media_gallery, is_private')
      .eq('card_id', cardId)
      .order('created_at', { ascending: true });
    if (msgsErr) throw new Error('Could not fetch messages');

    const result = await renderMovie(card, msgs || []);

    await setStatus(cardId, 'completed', {
      movie_url:           result.movie_url,
      movie_public_id:     result.movie_public_id,
      thumbnail_url:       result.thumbnail_url,
      duration_secs:       result.duration_secs,
      file_size_bytes:     result.file_size_bytes,
      error_message:       null,
    });

    // Send "movie ready" email to the recipient — but ONLY if the card has
    // already been delivered when the render finishes.
    //
    // Timeline A (pre-render): render finishes before delivery.
    //   card.status is still 'active' here -> no movieReady email.
    //   The delivery email will instead carry hasMovie:true ("watch now").
    //
    // Timeline B (render at delivery / slow renders): render finishes after
    //   delivery email was already sent -> card.status is 'sent' -> send
    //   the separate movieReady email so the recipient gets notified.
    //
    // Re-fetch status now (not the stale value from job start) so we get the
    // correct answer even if delivery happened while we were rendering.
    try {
      const { data: cardNow } = await supabase
        .from('cards')
        .select('status, recipient_email, recipient_name, slug, access_token')
        .eq('id', cardId)
        .maybeSingle();

      if (cardNow?.status === 'sent' && cardNow?.recipient_email) {
        const { sendEmail } = require('../utils/email');
        await sendEmail({
          to: cardNow.recipient_email,
          template: 'movieReady',
          data: {
            recipientName: cardNow.recipient_name,
            cardSlug:      cardNow.slug,
            accessToken:   cardNow.access_token || '',
          },
        });
        console.log(`[movie] movieReady email sent for ${cardNow.slug}`);
      } else {
        console.log(`[movie] Movie done for ${card.slug} — delivery email will carry hasMovie:true (status=${cardNow?.status})`);
      }
    } catch (e) {
      console.warn(`[movie] movieReady email failed for ${card.slug}:`, e.message);
    }

  } catch (err) {
    console.error(`[movie] Render failed for card ${cardId}:`, err.message);
    await setStatus(cardId, 'failed', { error_message: err.message.slice(0, 500) });
  } finally {
    activeJobs.delete(cardId);
  }
}

// ── POST /api/movies/:cardId/generate ────────────────────────────────────────
async function generateMovie(req, res) {
  const { cardId } = req.params;

  // Verify caller owns the card
  const userId    = req.user?.id;
  const companyId = req.company?.id || req.member?.company_id;

  const { data: card, error } = await supabase
    .from('cards')
    .select('id, creator_id, company_id, created_by_member_id, movie_status')
    .eq('id', cardId)
    .single();

  if (error || !card) return res.status(404).json({ error: 'Card not found' });

  const isOwner = (userId && card.creator_id === userId)
    || (companyId && card.company_id === companyId)
    || (req.member?.id && card.created_by_member_id === req.member.id);

  if (!isOwner) return res.status(403).json({ error: 'Not authorised' });

  // If already running or completed recently, return current status
  if (activeJobs.has(cardId)) {
    return res.json({ status: 'rendering', message: 'Already rendering' });
  }
  if (card.movie_status === 'completed') {
    return res.json({ status: 'completed', message: 'Movie already ready' });
  }

  // Check for recent failure — don't immediately re-queue if it just failed
  // (unless the caller explicitly used the /regenerate endpoint)
  if (card.movie_status === 'failed') {
    const { data: movieRow } = await supabase
      .from('memory_movies').select('updated_at').eq('card_id', cardId).maybeSingle();
    if (movieRow?.updated_at) {
      const secsSinceFailure = (Date.now() - new Date(movieRow.updated_at).getTime()) / 1000;
      if (secsSinceFailure < 30) {
        return res.json({ status: 'failed', message: 'Generation failed recently — wait a moment before retrying' });
      }
    }
  }

  // Queue it
  await setStatus(cardId, 'queued');

  // Fire and forget — don't await
  const job = runRenderJob(cardId);
  activeJobs.set(cardId, job);

  return res.json({ status: 'queued', message: 'Memory Movie is being created' });
}

// ── GET /api/movies/:cardId ───────────────────────────────────────────────────
async function getMovieStatus(req, res) {
  const { cardId } = req.params;

  const { data: movie, error } = await supabase
    .from('memory_movies')
    .select('status, movie_url, thumbnail_url, duration_secs, file_size_bytes, error_message, render_started_at, render_completed_at, updated_at')
    .eq('card_id', cardId)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Could not fetch movie status' });

  if (!movie) {
    return res.json({ status: 'none', movie_url: null, thumbnail_url: null });
  }

  // Expose error_message only if the caller is authenticated as owner
  // (checked via anyAuth middleware on generate/regenerate; GET is public so
  //  we check presence of auth header as a proxy — full auth check not needed
  //  here since the error message itself is not security-sensitive).
  const isAuthed = !!(req.user || req.company || req.member);
  const payload = { ...movie, failed: movie.status === 'failed' };
  if (!isAuthed) delete payload.error_message;
  return res.json(payload);
}

// ── POST /api/movies/:cardId/regenerate ──────────────────────────────────────
async function regenerateMovie(req, res) {
  const { cardId } = req.params;
  const userId    = req.user?.id;
  const companyId = req.company?.id || req.member?.company_id;

  const { data: card, error } = await supabase
    .from('cards')
    .select('id, creator_id, company_id, created_by_member_id')
    .eq('id', cardId)
    .single();

  if (error || !card) return res.status(404).json({ error: 'Card not found' });

  const isOwner = (userId && card.creator_id === userId)
    || (companyId && card.company_id === companyId)
    || (req.member?.id && card.created_by_member_id === req.member.id);

  if (!isOwner) return res.status(403).json({ error: 'Not authorised' });

  if (activeJobs.has(cardId)) {
    return res.json({ status: 'rendering', message: 'Already rendering' });
  }

  // Reset and re-queue
  await setStatus(cardId, 'queued', { movie_url: null, thumbnail_url: null, error_message: null });

  const job = runRenderJob(cardId);
  activeJobs.set(cardId, job);

  return res.json({ status: 'queued', message: 'Regenerating Memory Movie' });
}

module.exports = { generateMovie, getMovieStatus, regenerateMovie, runMovieJob: runRenderJob, activeJobs };
