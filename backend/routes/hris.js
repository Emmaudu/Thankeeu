const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const { companyAuth } = require('../middleware/companyAuth');
const {
  getConnections, saveConnection, testConnection, syncHRIS,
  getSyncLogs, deleteConnection,
  getBranches, saveBranch, deleteBranch,
} = require('../controllers/hrisController');

// ─────────────────────────────────────────────────────────────────────────────
// Standard HRIS routes (all require company auth)
// ─────────────────────────────────────────────────────────────────────────────
router.use(companyAuth);

router.get('/',                      getConnections);
router.post('/connect',              saveConnection);
router.post('/:connectionId/test',   testConnection);
router.post('/:connectionId/sync',   syncHRIS);
router.delete('/:connectionId',      deleteConnection);
router.get('/logs',                  getSyncLogs);

// Branches
router.get('/branches',              getBranches);
router.post('/branches',             saveBranch);
router.delete('/branches/:id',       deleteBranch);

// GET /api/hris/zoho-init — issues a short-lived token so the browser can
// navigate to /api/hris/zoho-auth without needing an Authorization header
router.get('/zoho-init', (req, res) => {
  const token = jwt.sign(
    { companyId: req.company.id, type: 'zoho_init' },
    process.env.JWT_SECRET,
    { expiresIn: '5m' }
  );
  const BACKEND_URL = process.env.BACKEND_URL || 'https://thankeeu-production.up.railway.app';
  res.json({ url: `${BACKEND_URL}/api/hris/zoho-auth?token=${token}` });
});

module.exports = router;
