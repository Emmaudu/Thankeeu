const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
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
  upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });
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
  upload = multer({ storage: diskStorage, limits: { fileSize: 50 * 1024 * 1024 } });
}

const deleteFile = async (publicId, resourceType = 'image') => {
  if (!hasCloudinary) return;
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }); }
  catch (err) { console.error('Cloudinary delete error:', err); }
};

module.exports = { upload, cloudinary, deleteFile };
