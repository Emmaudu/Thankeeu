const { sendEmail } = require('../utils/email');
'use strict';
const supabase = require('../utils/supabase');
const FRONTEND_URL = (() => {
  const raw = process.env.FRONTEND_URL || process.env.FRONTEND_URLS || '';
  let s = raw.trim();
  if (!s.startsWith('http') && s.includes('=')) s = s.slice(s.lastIndexOf('=') + 1).trim();
  s = s.replace(/['"]/g, '').trim().replace(/\/$/, '');
  return (s.startsWith('http') ? s : 'https://thankeeu.com');
})();

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')       // remove special chars
    .replace(/[\s_]+/g, '-')         // spaces → hyphens
    .replace(/-+/g, '-')             // collapse multiple hyphens
    .replace(/^-|-$/g, '')           // trim leading/trailing hyphens
    .slice(0, 80);                   // max 80 chars
}

function estimateReadTime(content) {
  const wordCount = (content || '').replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(wordCount / 200)); // 200 words/min average
}

// ── Public endpoints ──────────────────────────────────────────────────────────

// GET /api/blog  — list published posts (with pagination + category filter)
const getPosts = async (req, res) => {
  try {
    const { category, tag, limit = 12, page = 1 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,cover_image,cover_alt,author_name,author_avatar,category,tags,is_featured,read_time,views,published_at', { count: 'exact' })
      .eq('status', 'published')
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (category && category !== 'all') query = query.eq('category', category);
    if (tag) query = query.contains('tags', [tag]);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ posts: data || [], total: count || 0, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// GET /api/blog/categories — unique categories with post counts
const getCategories = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .eq('status', 'published');
    if (error) throw error;

    const counts = {};
    for (const { category } of (data || [])) {
      counts[category] = (counts[category] || 0) + 1;
    }
    const categories = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    res.json([{ name: 'All', count: data?.length || 0 }, ...categories]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// GET /api/blog/:slug — single published post + related posts
const getPost = async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle();

    if (error || !post) return res.status(404).json({ error: 'Post not found' });

    // Increment view count (fire-and-forget)
    // Fire-and-forget view increment
    (async () => { try { await supabase.from('blog_posts').update({ views: (post.views || 0) + 1 }).eq('id', post.id); } catch (_) {} })();

    // Fetch related posts (same category, not this post)
    const { data: related } = await supabase
      .from('blog_posts')
      .select('id,title,slug,excerpt,cover_image,author_name,category,read_time,published_at')
      .eq('status', 'published')
      .eq('category', post.category)
      .neq('id', post.id)
      .order('published_at', { ascending: false })
      .limit(3);

    res.json({ post, related: related || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// ── Admin endpoints ───────────────────────────────────────────────────────────

// GET /api/blog/admin/posts — all posts (any status)
const adminGetPosts = async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('blog_posts')
      .select('id,title,slug,category,status,is_featured,views,read_time,published_at,created_at,updated_at')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
};

// GET /api/blog/admin/posts/:id — single post for editing
const adminGetPost = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts').select('*').eq('id', req.params.id).maybeSingle();
    if (error || !data) return res.status(404).json({ error: 'Post not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
};

// POST /api/blog/admin/posts — create post
const adminCreatePost = async (req, res) => {
  try {
    const {
      title, content, excerpt, cover_image, cover_alt,
      author_name, category, tags, status, is_featured,
      meta_title, meta_description, og_image,
    } = req.body;

    if (!title?.trim())   return res.status(400).json({ error: 'Title is required' });
    if (!content?.trim()) return res.status(400).json({ error: 'Content is required' });

    // Auto-generate slug, ensure uniqueness
    let slug = generateSlug(title);
    const { data: existing } = await supabase
      .from('blog_posts').select('id').eq('slug', slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const read_time    = estimateReadTime(content);
    const published_at = status === 'published' ? new Date().toISOString() : null;

    const { data, error } = await supabase.from('blog_posts').insert({
      title: title.trim(),
      slug,
      content,
      excerpt:          excerpt?.trim() || content.replace(/<[^>]+>/g, '').slice(0, 160),
      cover_image:      cover_image || null,
      cover_alt:        cover_alt   || title,
      author_name:      author_name || 'Thankeeu Team',
      category:         category    || 'General',
      tags:             Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
      status:           status      || 'draft',
      is_featured:      !!is_featured,
      read_time,
      published_at,
      meta_title:       meta_title       || null,
      meta_description: meta_description || null,
      og_image:         og_image         || null,
    }).select().maybeSingle();

    if (error) throw error;
    res.status(201).json({ message: 'Post created', post: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
};

// PUT /api/blog/admin/posts/:id — update post
const adminUpdatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, content, excerpt, cover_image, cover_alt,
      author_name, category, tags, status, is_featured,
      meta_title, meta_description, og_image,
    } = req.body;

    const { data: existing } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
    if (!existing) return res.status(404).json({ error: 'Post not found' });

    const read_time    = content ? estimateReadTime(content) : existing.read_time;
    const published_at = status === 'published' && !existing.published_at
      ? new Date().toISOString()
      : existing.published_at;

    const { data, error } = await supabase.from('blog_posts').update({
      title:            title?.trim()    || existing.title,
      content:          content          || existing.content,
      excerpt:          excerpt?.trim()  || existing.excerpt,
      cover_image:      cover_image      ?? existing.cover_image,
      cover_alt:        cover_alt        || existing.cover_alt,
      author_name:      author_name      || existing.author_name,
      category:         category         || existing.category,
      tags:             Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : existing.tags),
      status:           status           || existing.status,
      is_featured:      is_featured !== undefined ? !!is_featured : existing.is_featured,
      read_time,
      published_at,
      meta_title:       meta_title       ?? existing.meta_title,
      meta_description: meta_description ?? existing.meta_description,
      og_image:         og_image         ?? existing.og_image,
      updated_at:       new Date().toISOString(),
    }).eq('id', id).select().maybeSingle();

    if (error) throw error;
    res.json({ message: 'Post updated', post: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update post' });
  }
};

// PATCH /api/blog/admin/posts/:id/status — publish / unpublish / archive
const adminSetStatus = async (req, res) => {
  try {
    const { id }     = req.params;
    const { status } = req.body;
    const valid      = ['draft', 'published', 'archived'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle();
    const published_at   = status === 'published' && !post?.published_at
      ? new Date().toISOString()
      : post?.published_at;

    await supabase.from('blog_posts').update({ status, published_at, updated_at: new Date() }).eq('id', id);
    res.json({ message: `Post ${status}` });

    // Notify subscribers when newly published (was draft/archived → now published)
    if (status === 'published' && post?.status !== 'published' && post) {
      const fullPost = { ...post, published_at };
      notifySubscribersNewPost(fullPost).catch(e => console.error('subscriber notify:', e.message));
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

// PATCH /api/blog/admin/posts/:id/featured — toggle featured
const adminToggleFeatured = async (req, res) => {
  try {
    const { id }        = req.params;
    const { is_featured } = req.body;
    await supabase.from('blog_posts').update({ is_featured: !!is_featured }).eq('id', id);
    res.json({ message: 'Featured status updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
};

// DELETE /api/blog/admin/posts/:id — hard delete
const adminDeletePost = async (req, res) => {
  try {
    await supabase.from('blog_posts').delete().eq('id', req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
};

// GET /api/blog/sitemap — returns all published post slugs for sitemap generation
const getBlogSitemap = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('slug,updated_at,published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sitemap data' });
  }
};


// ── Newsletter / Blog Subscriber endpoints ────────────────────────────────────

const subscribeNewsletter = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ error: 'Valid email required' });

    const crypto = require('crypto');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');
    const confirmToken     = crypto.randomBytes(24).toString('hex');

    // Upsert — idempotent if already subscribed
    const { data: existing } = await supabase
      .from('blog_subscribers').select('id, confirmed').eq('email', email.toLowerCase()).maybeSingle();

    if (existing?.confirmed) {
      return res.json({ message: 'You are already subscribed! New articles will land in your inbox.' });
    }

    if (existing) {
      const { error: upErr } = await supabase.from('blog_subscribers')
        .update({ name: name || null, confirm_token: confirmToken }).eq('id', existing.id);
      if (upErr) {
        console.error('Blog subscribe update error:', upErr.message);
        return res.status(500).json({ error: 'Subscription failed. Please try again.' });
      }
    } else {
      const { error: insErr } = await supabase.from('blog_subscribers').insert({
        email: email.toLowerCase().trim(),
        name:  name?.trim() || null,
        confirmed: false,
        confirm_token: confirmToken,
        unsubscribe_token: unsubscribeToken,
      });
      if (insErr) {
        console.error('Blog subscribe insert error:', insErr.message);
        return res.status(500).json({ error: 'Subscription failed. Please try again.' });
      }
    }

    const frontendUrl = FRONTEND_URL;  // use hardened constant, not raw env
    await sendEmail({ to: email, template: 'blogSubscribeConfirm', data: {
      name: name || 'Friend',
      confirmUrl: `${frontendUrl}/blog/confirm-subscription?token=${confirmToken}`,  // token only — no email (avoids encoding issues)
      unsubscribeUrl: `${frontendUrl}/blog/unsubscribe?token=${unsubscribeToken}`,
    }}).catch(e => console.error('subscribe confirm email:', e.message));

    res.json({ message: 'Almost there! Check your inbox to confirm your subscription.' });
  } catch (err) {
    console.error('subscribeNewsletter:', err);
    res.status(500).json({ error: 'Subscription failed. Please try again.' });
  }
};

const confirmSubscription = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing confirmation token' });
    // Use token only — avoids email encoding bugs with + in email addresses
    const { data, error } = await supabase.from('blog_subscribers')
      .update({ confirmed: true, confirm_token: null, subscribed_at: new Date() })
      .eq('confirm_token', token)
      .select().maybeSingle();
    if (error) { console.error('Blog confirm error:', error.message); return res.status(500).json({ error: 'Confirmation failed' }); }
    if (!data) return res.status(400).json({ error: 'Invalid or expired confirmation link. This link may have already been used — if you are already confirmed, try subscribing again.' });
    res.json({ message: 'Subscription confirmed! You will receive new articles by email.', email: data.email });
  } catch (err) { res.status(500).json({ error: 'Confirmation failed' }); }
};

const unsubscribeNewsletter = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });
    await supabase.from('blog_subscribers').delete().eq('unsubscribe_token', token);
    res.json({ message: 'You have been unsubscribed. Sorry to see you go!' });
  } catch (err) { res.status(500).json({ error: 'Unsubscribe failed' }); }
};

const getSubscribers = async (req, res) => {
  try {
    const { data } = await supabase.from('blog_subscribers')
      .select('id, email, name, confirmed, subscribed_at').order('created_at', { ascending: false });
    res.json(data || []);
  } catch (err) { res.status(500).json({ error: 'Failed to load subscribers' }); }
};

// Called by cron when a new post is published
const notifySubscribersNewPost = async (post) => {
  const { data: subscribers } = await supabase.from('blog_subscribers')
    .select('email, name, unsubscribe_token').eq('confirmed', true);
  const frontendUrl = FRONTEND_URL;  // use hardened constant, not raw env

  for (const sub of (subscribers || [])) {
    await sendEmail({ to: sub.email, template: 'newBlogPost', data: {
      name: sub.name || 'Friend',
      postTitle: post.title,
      postExcerpt: post.excerpt || '',
      postUrl: `${frontendUrl}/blog/${post.slug}`,
      coverImage: post.cover_image || '',
      unsubscribeUrl: `${frontendUrl}/blog/unsubscribe?token=${sub.unsubscribe_token}`,
    }}).catch(() => {});
    await supabase.from('blog_subscribers').update({ last_emailed_at: new Date() }).eq('email', sub.email);
  }
  console.log(`Blog post notification sent to ${(subscribers || []).length} subscribers`);
};

module.exports = {
  getPosts, getCategories, getPost,
  adminGetPosts, adminGetPost, adminCreatePost, adminUpdatePost,
  adminSetStatus, adminToggleFeatured, adminDeletePost,
  getBlogSitemap,
  subscribeNewsletter, confirmSubscription, unsubscribeNewsletter, getSubscribers, notifySubscribersNewPost,
};
