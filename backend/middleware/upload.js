/**
 * upload.js — Multer + Cloudinary middleware for Taskeeu
 *
 * All uploaded files go to Cloudinary (not Supabase Storage).
 *
 * Install:  npm install cloudinary multer
 *
 * Profile photos  → folder: 'taskeeu/avatars'
 * KYC / ID docs   → folder: 'taskeeu/kyc'     (raw/PDF)
 * Task photos     → folder: 'taskeeu/tasks'
 */

const multer = require('multer');
const { uploadImage, uploadPDF } = require('../utils/cloudinary');

// Store in memory — we stream the buffer straight to Cloudinary
const storage = multer.memoryStorage();

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5 MB
const MAX_DOC_SIZE   = 10 * 1024 * 1024; // 10 MB

/** Allowed MIME types */
const imageFilter = (req, file, cb) => {
  if (/^image\/(jpeg|png|webp|gif)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only JPEG, PNG, WEBP or GIF images are allowed.'));
};

const docFilter = (req, file, cb) => {
  if (/^(image\/(jpeg|png|webp)|application\/pdf)$/i.test(file.mimetype)) return cb(null, true);
  cb(new Error('Only PDF, JPEG or PNG files are allowed.'));
};

/** Avatar upload — single file, image only */
const uploadAvatar = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('avatar');

/** KYC / ID document upload — single file, image or PDF */
const uploadDocument = multer({
  storage,
  fileFilter: docFilter,
  limits: { fileSize: MAX_DOC_SIZE },
}).single('document');

/** Task photo upload — single image */
const uploadTaskPhoto = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_IMAGE_SIZE },
}).single('photo');

// ─── Cloudinary upload helpers ──────────────────────────────────────────────

/**
 * After multer populates req.file, call this to push the buffer to Cloudinary.
 * Sets req.cloudinaryUrl and req.cloudinaryPublicId on success.
 *
 * Usage:
 *   router.patch('/avatar', authenticate, uploadAvatar, toCloudinaryImage('avatars'), handler);
 */
const toCloudinaryImage = (subfolder = 'general') => async (req, res, next) => {
  if (!req.file) return next();
  try {
    const userId = req.user?.id || 'anon';
    const result = await uploadImage(req.file.buffer, {
      folder: `taskeeu/${subfolder}`,
      public_id: `${userId}-${Date.now()}`,
    });
    req.cloudinaryUrl = result.url;
    req.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    console.error('[Cloudinary] image upload failed:', err.message);
    res.status(500).json({ success: false, message: 'File upload failed. Please try again.' });
  }
};

/**
 * Push a PDF or image document to Cloudinary raw storage.
 */
const toCloudinaryDoc = (subfolder = 'docs') => async (req, res, next) => {
  if (!req.file) return next();
  try {
    const userId = req.user?.id || 'anon';
    const isPDF  = req.file.mimetype === 'application/pdf';
    const result = isPDF
      ? await uploadPDF(req.file.buffer, {
          folder: `taskeeu/${subfolder}`,
          public_id: `${userId}-${Date.now()}`,
        })
      : await uploadImage(req.file.buffer, {
          folder: `taskeeu/${subfolder}`,
          public_id: `${userId}-${Date.now()}`,
        });
    req.cloudinaryUrl = result.url;
    req.cloudinaryPublicId = result.public_id;
    next();
  } catch (err) {
    console.error('[Cloudinary] doc upload failed:', err.message);
    res.status(500).json({ success: false, message: 'Document upload failed. Please try again.' });
  }
};

module.exports = {
  uploadAvatar,
  uploadDocument,
  uploadTaskPhoto,
  toCloudinaryImage,
  toCloudinaryDoc,
};
