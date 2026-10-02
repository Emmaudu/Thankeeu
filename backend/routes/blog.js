const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');
const supabase = require('../utils/supabase');
const { authenticate, requireRole } = require('../middleware/auth');

// ── Slug generator ─────────────────────────────────────────────────
function makeSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 280);
}

// ── Estimate reading time ──────────────────────────────────────────
function readingTime(content) {
  const words = content?.split(/\s+/).length || 0;
  return Math.max(1, Math.round(words / 200));
}

// ── PUBLIC ROUTES ──────────────────────────────────────────────────

// GET /blog — list published posts
router.get('/', async (req, res) => {
  try {
    const { category, tag, search, featured, page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,cover_image_url,cover_image_alt,author_name,category,tags,published_at,reading_time_minutes,views,featured', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (category) q = q.ilike('category', category);
    if (tag)      q = q.contains('tags', [tag.toLowerCase()]);
    if (featured === 'true') q = q.eq('featured', true);
    if (search) {
      q = q.or(`title.ilike.%${search}%,excerpt.ilike.%${search}%`);
    }

    const { data: posts, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      posts: posts || [],
      pagination: {
        total: count || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Blog list error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch posts' });
  }
});

// GET /blog/categories — list categories with post counts
router.get('/categories', async (req, res) => {
  try {
    const { data: cats } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name');

    // Get counts per category
    const { data: counts } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published');

    const countMap = {};
    (counts || []).forEach(p => {
      countMap[p.category] = (countMap[p.category] || 0) + 1;
    });

    const enriched = (cats || []).map(cat => ({
      ...cat,
      post_count: countMap[cat.name] || 0,
    }));

    res.json({ success: true, categories: enriched });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
});

// GET /blog/sitemap — all published post slugs and dates for SEO
router.get('/sitemap', async (req, res) => {
  try {
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, published_at, updated_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    res.json({ success: true, posts: posts || [] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate sitemap data' });
  }
});

// GET /blog/:slug — single published post (also increments view count)
router.get('/admin/all', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let q = supabase
      .from('blog_posts')
      .select('id,title,slug,status,category,featured,views,published_at,created_at,reading_time_minutes,author_name', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (status) q = q.eq('status', status);

    const { data: posts, error, count } = await q;
    if (error) throw error;

    res.json({
      success: true,
      posts: posts || [],
      pagination: { total: count || 0, page: parseInt(page), pages: Math.ceil((count || 0) / parseInt(limit)) },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// GET /blog/admin/:id — get single post by ID for editing

router.get('/admin/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !post) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Fetch failed' });
  }
});

// POST /blog/admin — create post

router.get('/:slug', async (req, res) => {
  try {
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // Increment view count asynchronously (fire-and-forget)
    (async () => {
      try {
        await supabase
          .from('blog_posts')
          .update({ views: (post.views || 0) + 1 })
          .eq('id', post.id);
      } catch (_) {}
    })();

    // Related posts (same category, exclude current)
    const { data: related } = await supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,cover_image_url,published_at,reading_time_minutes,category')
      .eq('status', 'published')
      .eq('category', post.category)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);

    res.json({ success: true, post, related: related || [] });
  } catch (err) {
    console.error('Blog post fetch error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch post' });
  }
});

// ── ADMIN ROUTES ───────────────────────────────────────────────────

// GET /blog/admin/all — list ALL posts (including drafts)


router.post('/admin',
  authenticate,
  requireRole('admin'),
  [
    body('title').trim().isLength({ min: 5, max: 300 }).withMessage('Title must be 5–300 characters'),
    body('content').trim().isLength({ min: 50 }).withMessage('Content must be at least 50 characters'),
    body('status').isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array(), message: errors.array()[0].msg });

    try {
      const {
        title, content, excerpt, cover_image_url, cover_image_alt,
        category, tags, status, featured,
        meta_title, meta_description, og_image_url,
      } = req.body;

      // Auto-generate slug from title
      let slug = makeSlug(title);
      // Ensure uniqueness
      const { data: existing } = await supabase
        .from('blog_posts').select('slug').ilike('slug', `${slug}%`);
      if (existing?.length > 0) {
        slug = `${slug}-${Date.now().toString(36)}`;
      }

      const { data: post, error } = await supabase
        .from('blog_posts')
        .insert({
          title,
          slug,
          excerpt: excerpt || content.replace(/#+\s/g, '').replace(/\*\*/g, '').substring(0, 160) + '...',
          content,
          cover_image_url: cover_image_url || null,
          cover_image_alt: cover_image_alt || title,
          author_id: req.user.id,
          author_name: req.user.full_name,
          category: category || 'General',
          tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim().toLowerCase()) : []),
          status,
          featured: featured === true || featured === 'true',
          published_at: status === 'published' ? new Date().toISOString() : null,
          reading_time_minutes: readingTime(content),
          meta_title: meta_title || title.substring(0, 70),
          meta_description: meta_description || excerpt || content.substring(0, 165),
          og_image_url: og_image_url || cover_image_url || null,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      res.status(201).json({ success: true, message: 'Post created!', post });
    } catch (err) {
      console.error('Create blog error:', err);
      console.error('[blog.js] Failed to create post:', err?.message);
      res.status(500).json({ success: false, message: 'Failed to create post' });
    }
  }
);

// PUT /blog/admin/:id — update post
router.put('/admin/:id',
  authenticate,
  requireRole('admin'),
  [
    body('title').optional().trim().isLength({ min: 5, max: 300 }),
    body('content').optional().trim().isLength({ min: 50 }),
    body('status').optional().isIn(['draft', 'published', 'archived']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, message: errors.array()[0].msg });

    try {
      const {
        title, content, excerpt, cover_image_url, cover_image_alt,
        category, tags, status, featured,
        meta_title, meta_description, og_image_url,
      } = req.body;

      // Get current post to check if being published for first time
      const { data: current } = await supabase
        .from('blog_posts').select('status, published_at, slug').eq('id', req.params.id).maybeSingle();

      const updates = {};
      if (title !== undefined)             updates.title = title;
      if (content !== undefined) {
        updates.content = content;
        updates.reading_time_minutes = readingTime(content);
      }
      if (excerpt !== undefined)           updates.excerpt = excerpt;
      if (cover_image_url !== undefined)   updates.cover_image_url = cover_image_url;
      if (cover_image_alt !== undefined)   updates.cover_image_alt = cover_image_alt;
      if (category !== undefined)          updates.category = category;
      if (tags !== undefined)              updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().toLowerCase());
      if (featured !== undefined)          updates.featured = featured === true || featured === 'true';
      if (meta_title !== undefined)        updates.meta_title = meta_title;
      if (meta_description !== undefined)  updates.meta_description = meta_description;
      if (og_image_url !== undefined)      updates.og_image_url = og_image_url;

      if (status !== undefined) {
        updates.status = status;
        // Set published_at only on first publish
        if (status === 'published' && current?.status !== 'published') {
          updates.published_at = new Date().toISOString();
        }
      }

      const { data: post, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('id', req.params.id)
        .select()
        .maybeSingle();

      if (error) throw error;
      res.json({ success: true, message: 'Post updated!', post });
    } catch (err) {
      console.error('Update blog error:', err);
      console.error('[blog.js] Update failed:', err?.message);
      res.status(500).json({ success: false, message: 'Update failed' });
    }
  }
);

// DELETE /blog/admin/:id — delete post
router.delete('/admin/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

// PATCH /blog/admin/:id/toggle-featured — quick toggle
router.patch('/admin/:id/toggle-featured', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { data: post } = await supabase.from('blog_posts').select('featured').eq('id', req.params.id).maybeSingle();
    await supabase.from('blog_posts').update({ featured: !post.featured }).eq('id', req.params.id);
    res.json({ success: true, featured: !post.featured });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Toggle failed' });
  }
});

// PATCH /blog/admin/:id/status — quick status change
router.patch('/admin/:id/status', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['draft', 'published', 'archived'].includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    const updates = { status };
    if (status === 'published') {
      const { data: cur } = await supabase.from('blog_posts').select('published_at').eq('id', req.params.id).maybeSingle();
      if (!cur?.published_at) updates.published_at = new Date().toISOString();
    }

    await supabase.from('blog_posts').update(updates).eq('id', req.params.id);
    res.json({ success: true, message: `Post ${status}` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Status change failed' });
  }
});

module.exports = router;
