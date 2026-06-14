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

module.exports = router;
