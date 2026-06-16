const { validateUUIDParam, validateSlugParam } = require('../utils/paramGuard');
const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getPosts, getCategories, getPost,
  adminGetPosts, adminGetPost, adminCreatePost, adminUpdatePost,
  adminSetStatus, adminToggleFeatured, adminDeletePost,
  getBlogSitemap,
  subscribeNewsletter, confirmSubscription, unsubscribeNewsletter, getSubscribers,
} = require('../controllers/blogController');

// ── Public routes (no auth) ───────────────────────────────────────────────────
router.get('/sitemap',          getBlogSitemap);        // SEO sitemap data
router.get('/categories',       getCategories);

// ── Subscriber routes (public + admin) ────────────────────────────────────────
router.post('/subscribe',              subscribeNewsletter);
router.get('/confirm-subscription',    confirmSubscription);
router.get('/unsubscribe',             unsubscribeNewsletter);
router.get('/admin/subscribers',       adminAuth, getSubscribers);

// ── Admin routes (adminAuth required) ────────────────────────────────────────
router.get('/admin/posts',              adminAuth, adminGetPosts);
router.get('/admin/posts/:id', validateUUIDParam('id'),          adminAuth, adminGetPost);
router.post('/admin/posts',             adminAuth, adminCreatePost);
router.put('/admin/posts/:id', validateUUIDParam('id'),          adminAuth, adminUpdatePost);
router.patch('/admin/posts/:id/status', validateUUIDParam('id'), adminAuth, adminSetStatus);
router.patch('/admin/posts/:id/featured', validateUUIDParam('id'), adminAuth, adminToggleFeatured);
router.delete('/admin/posts/:id', validateUUIDParam('id'),       adminAuth, adminDeletePost);

// ── Slug lookup — MUST be last (catches any /blog/<anything>) ────────────────
router.get('/',                 getPosts);
router.get('/:slug', validateSlugParam('slug'),            getPost);

module.exports = router;
