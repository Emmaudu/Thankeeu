'use strict';
const router  = require('express').Router();
const { addWallPost, getWallPosts, deleteWallPost } = require('../controllers/wallController');
const { anyAuth } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');
const { validateSlugParam, validateUUIDParam } = require('../utils/paramGuard');

// Wrap multer so oversized / failed uploads return a clear 400 instead of
// falling through to the generic error handler as a vague 500.
const handleWallUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (!err) return next();
    console.error('[wall upload] error:', err.code, err.message);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large — photos and GIFs must be under 9MB; videos and voice notes must be under 50MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Too many media files. Add no more than 5 items to one wall card.' });
    }
    if (err.message?.includes('File size too large') || err.message?.includes('Maximum is')) {
      return res.status(400).json({ error: 'File too large — please use a photo/GIF under 9MB or video/voice note under 50MB.' });
    }
    if (err.message?.includes('timeout') || err.message?.includes('ETIMEDOUT')) {
      return res.status(504).json({ error: 'Upload timed out. Your file may be too large or your connection is slow.' });
    }
    return res.status(502).json({ error: 'Could not upload right now. Please check your connection and try again.' });
  });
};

router.get('/:cardSlug',               validateSlugParam('cardSlug'), getWallPosts);
router.post('/:cardSlug',              validateSlugParam('cardSlug'), handleWallUpload, addWallPost);
router.delete('/:cardSlug/:postId',    validateSlugParam('cardSlug'), validateUUIDParam('postId'), anyAuth, deleteWallPost);

module.exports = router;
