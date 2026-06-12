const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const { upload } = require('../utils/cloudinary');
const upload_csv = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const { palAuth } = require('../middleware/palAuth');

const palAuthCtrl = require('../controllers/palAuthController');
const palCtrl     = require('../controllers/palController');
const palSupport  = require('../controllers/palSupportController');

// ── Public ────────────────────────────────────────────────────────────────
router.post('/signup',        palAuthCtrl.palSignup);
router.get('/verify-email',   palAuthCtrl.palVerifyEmail);
router.post('/login',         palAuthCtrl.palLogin);
router.get('/invite/:token',  palAuthCtrl.previewInvite);
router.post('/accept-invite', palAuthCtrl.acceptInvite);

// ── Authenticated (palAuth) ──────────────────────────────────────────────────
router.get('/me',              palAuth, palAuthCtrl.palMe);

// Settings
router.get('/settings',        palAuth, palCtrl.getSettings);
router.put('/settings',        palAuth, palCtrl.updateSettings);
router.post('/settings/logo',  palAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path });
});

// Members
router.get('/members',                  palAuth, palCtrl.getMembers);
router.get('/members/:id',              palAuth, palCtrl.getMemberProfile);
router.put('/members/:id',              palAuth, palCtrl.updateMemberProfile);
router.put('/members/:id/event',        palAuth, palCtrl.updateMemberEvent);
router.post('/members/:id/avatar',      palAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: req.file.path });
});
router.post('/invite',                  palAuth, palCtrl.inviteMember);
router.post('/invite/csv',              palAuth, upload_csv.single('file'), palCtrl.inviteMembersCSV);

// My Cards
router.get('/cards', palAuth, palCtrl.getMyCards);

// Analytics
router.get('/analytics', palAuth, palCtrl.getDashboardAnalytics);

// Support
router.get('/support',  palAuth, palSupport.getPalTickets);
router.post('/support', palAuth, palSupport.createPalTicket);

module.exports = router;
