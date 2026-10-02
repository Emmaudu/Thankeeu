const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');
const axios = require('axios');
const FormData = require('form-data');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const memStorage = multer.memoryStorage();

// ── Unsigned upload via REST API (no signature needed) ────────────
// Uses Cloudinary's unsigned upload endpoint with a preset.
// Create preset in Cloudinary: Settings → Upload → Upload Presets
// → Add upload preset → Signing mode: Unsigned → Save
// Set CLOUDINARY_UPLOAD_PRESET env var to that preset name.
async function unsignedUpload(buffer, folder) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !preset) {
    throw new Error('CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET must be set');
  }

  const fd = new FormData();
  fd.append('file', buffer, { filename: 'upload.jpg', contentType: 'image/jpeg' });
  fd.append('upload_preset', preset);
  fd.append('folder', folder);

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const { data } = await axios.post(url, fd, { headers: fd.getHeaders() });
  return data;
}

// ── Signed upload via SDK (for when unsigned preset is not needed) ─
function uploadToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

const uploadAvatar = multer({ storage: memStorage, limits: { fileSize: 5  * 1024 * 1024 } });
const uploadKYC    = multer({ storage: memStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadProof  = multer({ storage: memStorage, limits: { fileSize: 10 * 1024 * 1024 } });
const uploadChat   = multer({ storage: memStorage, limits: { fileSize: 25 * 1024 * 1024 } });

async function uploadAvatarBuffer(buffer) {
  let result;
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    // Use unsigned upload — no signature, no secret needed
    result = await unsignedUpload(buffer, 'taskeeu/avatars');
  } else {
    // Fall back to signed upload
    result = await uploadToCloudinary(buffer, {
      folder: 'taskeeu/avatars',
      resource_type: 'image',
    });
  }
  const url = result.secure_url.replace('/upload/', '/upload/c_fill,g_face,h_400,q_auto,w_400/');
  return { ...result, secure_url: url };
}

async function uploadKYCBuffer(buffer) {
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    return unsignedUpload(buffer, 'taskeeu/kyc');
  }
  return uploadToCloudinary(buffer, { folder: 'taskeeu/kyc' });
}

async function uploadProofBuffer(buffer) {
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    return unsignedUpload(buffer, 'taskeeu/proofs');
  }
  return uploadToCloudinary(buffer, { folder: 'taskeeu/proofs', resource_type: 'image' });
}

async function uploadChatBuffer(buffer, resourceType = 'auto') {
  if (process.env.CLOUDINARY_UPLOAD_PRESET) {
    return unsignedUpload(buffer, 'taskeeu/chat');
  }
  return uploadToCloudinary(buffer, { folder: 'taskeeu/chat', resource_type: resourceType });
}

// ── Any file type (photos, videos, PDFs, documents…) ─────────────
// Used for task proofs. Keeps the real file name and content type and lets
// Cloudinary pick image / video / raw automatically ("auto").
const uploadAnyFile = multer({
  storage: memStorage,
  limits: { fileSize: 25 * 1024 * 1024, files: 10 },
});

async function uploadAnyFileBuffer(buffer, { folder = 'taskeeu/files', filename = 'file', mimetype = 'application/octet-stream' } = {}) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const preset = process.env.CLOUDINARY_UPLOAD_PRESET;
  if (preset && cloudName) {
    const fd = new FormData();
    fd.append('file', buffer, { filename, contentType: mimetype });
    fd.append('upload_preset', preset);
    fd.append('folder', folder);
    const { data } = await axios.post(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, fd, {
      headers: fd.getHeaders(), maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 120000,
    });
    return data;
  }
  return uploadToCloudinary(buffer, {
    folder,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    filename_override: filename,
  });
}

// resourceType: 'image' (default) | 'video' | 'raw' — Cloudinary needs it to
// delete non-image files (proof videos, PDFs, documents).
const deleteFile = async (publicId, resourceType) => {
  try {
    const type = ['image', 'video', 'raw'].includes(resourceType) ? resourceType : 'image';
    await cloudinary.uploader.destroy(publicId, { resource_type: type });
  }
  catch (err) { console.error('Cloudinary delete error:', err); }
};

module.exports = {
  cloudinary,
  uploadAvatar, uploadKYC, uploadProof, uploadChat, uploadAnyFile, uploadAnyFileBuffer,
  uploadAvatarBuffer, uploadKYCBuffer, uploadProofBuffer, uploadChatBuffer,
  deleteFile,
};
