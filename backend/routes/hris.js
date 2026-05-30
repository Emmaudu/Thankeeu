const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const {
  getConnections, saveConnection, testConnection, syncHRIS,
  getSyncLogs, deleteConnection,
  getBranches, saveBranch, deleteBranch,
} = require('../controllers/hrisController');

router.use(companyAuth);

// Connections
router.get('/',                          getConnections);
router.post('/connect',                  saveConnection);
router.post('/:connectionId/test',       testConnection);
router.post('/:connectionId/sync',       syncHRIS);
router.delete('/:connectionId',          deleteConnection);

// Sync history
router.get('/logs',                      getSyncLogs);

// Branch management
router.get('/branches',                  getBranches);
router.post('/branches',                 saveBranch);
router.delete('/branches/:branchId',     deleteBranch);

module.exports = router;
