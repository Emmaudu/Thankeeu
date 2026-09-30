const express  = require('express');
const router   = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const {
  getConnections, saveConnection, testConnection, syncHRIS,
  getSyncLogs, deleteConnection,
  getBranches, saveBranch, deleteBranch,
} = require('../controllers/hrisController');
const { validateUUIDParam } = require('../utils/paramGuard');

router.use(companyAuth);

// Fixed-segment routes BEFORE /:connectionId wildcard
router.get('/',          getConnections);
router.post('/connect',  saveConnection);
router.get('/logs',      getSyncLogs);

// Branch routes (fixed prefix 'branches') — must be before /:connectionId DELETE
// because DELETE /branches/:id would otherwise match DELETE /:connectionId
// with connectionId='branches'.
router.get('/branches',            getBranches);
router.post('/branches',           saveBranch);
router.delete('/branches/:id',     validateUUIDParam('id'), deleteBranch);

// Wildcard connection routes — after all fixed-segment routes
router.post('/:connectionId/test', validateUUIDParam('connectionId'), testConnection);
router.post('/:connectionId/sync', validateUUIDParam('connectionId'), syncHRIS);
router.delete('/:connectionId',    validateUUIDParam('connectionId'), deleteConnection);

module.exports = router;
