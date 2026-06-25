const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout:    180000, // 3 minutes — enough for multiple large files uploading sequentially
});

const hasCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

let upload;

if (hasCloudinary) {
  const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isVideo = file.mimetype.startsWith('video/');
      const isAudio = file.mimetype.startsWith('audio/');
      return {
        folder: 'thankeeu/messages',
        resource_type: isVideo || isAudio ? 'video' : 'image',
        allowed_formats: ['jpg','jpeg','png','gif','webp','mp4','mov','webm','mp3','wav','m4a','aac','ogg'],
        transformation: isVideo || isAudio ? [] : [{ width: 1200, crop: 'limit', quality: 'auto' }],
      };
    },
  });
  upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024, files: 10 } });
} else {
  // Local fallback — serve via /uploads static route
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  const diskStorage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || '.bin';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
  });
  upload = multer({ storage: diskStorage, limits: { fileSize: 100 * 1024 * 1024, files: 10 } });
}

const deleteFile = async (publicId, resourceType = 'image') => {
  if (!hasCloudinary) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); }
  catch (err) { console.error('Cloudinary delete error:', err); }
};

// ── Recipient photo upload ──────────────────────────────────────────────────
// Separate multer instance: images only, 5 MB cap, single file
let uploadRecipientPhoto;

if (hasCloudinary) {
  const photoStorage = new CloudinaryStorage({
    cloudinary,
    params: async () => ({
      folder: 'thankeeu/recipient-photos',
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1600, crop: 'limit', quality: 'auto:good' }],
    }),
  });
  uploadRecipientPhoto = multer({
    storage: photoStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed for recipient photos'));
    },
  });
} else {
  const uploadDir = path.join(__dirname, '../../uploads');
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  uploadRecipientPhoto = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `recipient-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed for recipient photos'));
    },
  });
}

module.exports = { upload, uploadRecipientPhoto, cloudinary, deleteFile };
