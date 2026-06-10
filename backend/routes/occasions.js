const express = require('express');
const router  = express.Router();
const multer  = require('multer');

const { companyAuth }   = require('../middleware/companyAuth');
const { hrOrMemberAuth } = require('../middleware/memberAuth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Main occasion controller ─────────────────────────────────────────────────
const {
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate,
  importOccasionMembers, getOccasionMembers, deleteOccasionMember,
  downloadGeneralTemplate, importGeneralTemplate,
  updateOccasionTypeScope, updateOccasionMember, triggerOccasionNow,
} = require('../controllers/occasionController');

// ── Bulk controller (bulk Excel sync, /tables endpoint) ─────────────────────
const {
  downloadBulkTemplate, bulkSyncEmployees, getOccasionTables,
  updateOccasionMember: bulkUpdateMember,
  deleteOccasionMember: bulkDeleteMember,
} = require('../controllers/occasionBulkController');

// ─────────────────────────────────────────────────────────────────────────────

// Occasion types
router.get('/types',              companyAuth, getOccasionTypes);
router.post('/types',             companyAuth, createOccasionType);

// Per-type template download and import
router.get('/template/:occasionName',         companyAuth, downloadOccasionTemplate);
router.post('/:occasionTypeId/import',        companyAuth, upload.single('file'), importOccasionMembers);
router.delete('/:occasionTypeId/members/:memberId', companyAuth, deleteOccasionMember);

// View members (HR or approved member)
router.get('/:occasionTypeId/members',        hrOrMemberAuth, getOccasionMembers);

// ── /tables — main dashboard data endpoint (used by OccasionsPage) ───────────
router.get('/tables',                         companyAuth, getOccasionTables);

// ── General master template (one file → all tables) ──────────────────────────
router.get('/general-template',               companyAuth, downloadGeneralTemplate);
router.post('/import-general', upload.single('file'), companyAuth, importGeneralTemplate);

// ── Bulk CSV sync (legacy / alternative path) ─────────────────────────────────
router.get('/bulk-template',                  companyAuth, downloadBulkTemplate);
router.post('/bulk-sync',                     companyAuth, bulkSyncEmployees);

// ── Per-type notification scope ───────────────────────────────────────────────
router.put('/types/:occasionTypeId/scope',   companyAuth, updateOccasionTypeScope);

// ── Edit / patch occasion member rows ────────────────────────────────────────
router.post('/members/:memberId/trigger', companyAuth, triggerOccasionNow);
router.put('/members/:memberId',             companyAuth, updateOccasionMember);
router.patch('/members/:id',                 companyAuth, bulkUpdateMember);
router.delete('/members/:id/bulk',           companyAuth, bulkDeleteMember);

module.exports = router;
