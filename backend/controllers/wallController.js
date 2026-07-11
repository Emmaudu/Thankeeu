'use strict';
const supabase  = require('../utils/supabase');
const { cloudinary, upload } = require('../utils/cloudinary');

// POST /api/wall/:cardSlug  — upload a wall post
async function addWallPost(req, res) {
  try {
    const { cardSlug } = req.params;
    const { author_name, author_email, caption } = req.body;

    if (!author_name?.trim()) return res.status(400).json({ error: 'Name is required' });

    // Fetch card — verify it supports a wall
    const { data: card, error: cardErr } = await supabase
      .from('cards').select('id, card_experience, status')
      .eq('slug', cardSlug).maybeSingle();

    if (cardErr || !card) return res.status(404).json({ error: 'Card not found' });
    if (!['wall_only','card_and_wall'].includes(card.card_experience))
      return res.status(400).json({ error: 'This card does not have a Memory Wall' });

    let media_url = null, media_type = null;
    const file = req.file;
    if (file) {
      const mime = file.mimetype || '';
      media_type = mime.startsWith('video/') ? 'video' : mime === 'image/gif' ? 'gif' : 'image';
      media_url  = file.path?.startsWith('http') ? file.path : file.secure_url || file.path;
    }

    // A post must carry something — a photo/video or a caption. Reject empties
    // (the UI already prevents this, but a direct API call could slip through).
    const cleanCaption = caption ? String(caption).slice(0, 300).trim() : null;
    if (!media_url && !cleanCaption) {
      return res.status(400).json({ error: 'Add a photo, video or caption to post.' });
    }

    const { data: post, error: insertErr } = await supabase
      .from('wall_posts').insert({
        card_id:     card.id,
        author_name: String(author_name).slice(0, 80).trim(),
        author_email: author_email?.toLowerCase().trim().slice(0, 254) || null,
        caption:     cleanCaption,
        media_url,
        media_type,
      }).select().single();

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

    const { data: posts } = await supabase
      .from('wall_posts')
      .select('id, author_name, caption, media_url, media_type, created_at')
      .eq('card_id', card.id)
      .eq('is_moderated', false)
      .order('created_at', { ascending: false });

    return res.json({ posts: posts || [] });
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
