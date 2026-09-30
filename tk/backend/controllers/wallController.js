'use strict';
const supabase  = require('../utils/supabase');
const mediaFromFile = (file) => {
  if (!file) return null;
  const mime = file.mimetype || '';
  const type = mime.startsWith('video/') ? 'video'
    : mime.startsWith('audio/') ? 'voice'
      : mime === 'image/gif' ? 'gif' : 'image';
  const url = file.path?.startsWith('http') ? file.path : file.secure_url || file.path;
  return url ? { url, type } : null;
};

// POST /api/wall/:cardSlug  — upload a wall post
async function addWallPost(req, res) {
  try {
    const { cardSlug } = req.params;
    const { author_name, author_email, caption, message } = req.body;

    if (!author_name?.trim()) return res.status(400).json({ error: 'Name is required' });

    // Fetch card — verify it supports a wall
    const { data: card, error: cardErr } = await supabase
      .from('cards').select('id, card_experience, status')
      .eq('slug', cardSlug).maybeSingle();

    if (cardErr || !card) return res.status(404).json({ error: 'Card not found' });
    if (!['wall_only','card_and_wall'].includes(card.card_experience))
      return res.status(400).json({ error: 'This card does not have a Memory Wall' });

    const uploadedFiles = Array.isArray(req.files) ? req.files : (req.file ? [req.file] : []);
    if (uploadedFiles.length > 5) return res.status(400).json({ error: 'Add no more than 5 media items to one wall card.' });
    const files = uploadedFiles.slice(0, 5);
    const primaryFile = files.find(file => file.fieldname === 'media') || files[0];
    const primary = mediaFromFile(primaryFile);
    const gallery = files.filter(file => file !== primaryFile).map(mediaFromFile).filter(Boolean);
    const media_url = primary?.url || null;
    const media_type = primary?.type || null;

    // A post must carry something — a photo/video or a caption. Reject empties
    // (the UI already prevents this, but a direct API call could slip through).
    const cleanCaption = caption ? String(caption).slice(0, 300).trim() : null;
    const cleanMessage = message ? String(message).slice(0, 600).trim() : null;
    if (!media_url && !cleanCaption && !cleanMessage) {
      return res.status(400).json({ error: 'Add a photo, video, voice note, message or caption to post.' });
    }

    const postValues = {
        card_id:     card.id,
        author_name: String(author_name).slice(0, 80).trim(),
        author_email: author_email?.toLowerCase().trim().slice(0, 254) || null,
        message:     cleanMessage,
        caption:     cleanCaption,
        media_url,
        media_type,
        media_gallery: gallery,
    };
    let { data: post, error: insertErr } = await supabase.from('wall_posts').insert(postValues).select().single();

    // Keep existing deployments usable before the accompanying migration is
    // applied. New carousel fields become available immediately after it runs.
    if (insertErr && ['42703', 'PGRST204'].includes(insertErr.code)) {
      const legacyValues = { ...postValues };
      delete legacyValues.message;
      delete legacyValues.media_gallery;
      if (cleanMessage && !legacyValues.caption) legacyValues.caption = cleanMessage.slice(0, 300);
      ({ data: post, error: insertErr } = await supabase.from('wall_posts').insert(legacyValues).select().single());
    }

    if (insertErr) return res.status(500).json({ error: 'Could not save post' });
    return res.status(201).json({ post });
  } catch (err) {
    console.error('[wall] addWallPost:', err.message);
    return res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/wall/:cardSlug  — list wall posts
async function getWallPosts(req, res) {
  try {
    const { cardSlug } = req.params;
    const { data: card } = await supabase
      .from('cards').select('id').eq('slug', cardSlug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 6));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let { data: posts, count, error: postsErr } = await supabase
      .from('wall_posts')
      .select('id, author_name, message, caption, media_url, media_type, media_gallery, created_at', { count: 'exact' })
      .eq('card_id', card.id)
      .eq('is_moderated', false)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsErr && ['42703', 'PGRST204'].includes(postsErr.code)) {
      ({ data: posts, count, error: postsErr } = await supabase
        .from('wall_posts')
        .select('id, author_name, caption, media_url, media_type, created_at', { count: 'exact' })
        .eq('card_id', card.id)
        .eq('is_moderated', false)
        .order('created_at', { ascending: false })
        .range(from, to));
    }
    if (postsErr) throw postsErr;

    const total = count || 0;
    return res.json({ posts: posts || [], pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

// DELETE /api/wall/:cardSlug/:postId  — creator only
async function deleteWallPost(req, res) {
  try {
    const { cardSlug, postId } = req.params;
    const userId = req.user?.id;
    const companyId = req.company?.id || req.member?.company_id;

    const { data: card } = await supabase
      .from('cards').select('id, creator_id, company_id, created_by_member_id').eq('slug', cardSlug).maybeSingle();
    if (!card) return res.status(404).json({ error: 'Card not found' });

    const isOwner = (userId && card.creator_id === userId)
      || (companyId && card.company_id === companyId)
      || (req.member?.id && card.created_by_member_id === req.member.id);
    if (!isOwner) return res.status(403).json({ error: 'Not authorised' });

    await supabase.from('wall_posts').delete().eq('id', postId).eq('card_id', card.id);
    return res.json({ deleted: true });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}

module.exports = { addWallPost, getWallPosts, deleteWallPost };
