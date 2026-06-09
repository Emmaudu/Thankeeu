const express = require('express');
const router = express.Router();
const multer = require('multer');
const { companyAuth } = require('../middleware/companyAuth');
const { hrOrMemberAuth } = require('../middleware/memberAuth');
const {
  getOccasionTypes, createOccasionType,
  downloadOccasionTemplate, importOccasionMembers,
  getOccasionMembers, deleteOccasionMember,
} = require('../controllers/occasionController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Public template download (HR only needs company auth)
router.get('/template/:occasionName', companyAuth, downloadOccasionTemplate);

// HR-only: manage occasion types and import
router.use('/types', companyAuth);
router.get('/types', getOccasionTypes);
router.post('/types', createOccasionType);

router.post('/:occasionTypeId/import', companyAuth, upload.single('file'), importOccasionMembers);
router.delete('/:occasionTypeId/members/:memberId', companyAuth, deleteOccasionMember);

// HR or approved member: view members
router.get('/:occasionTypeId/members', hrOrMemberAuth, getOccasionMembers);

// General master template
router.get('/general-template', companyAuth, downloadGeneralTemplate);
router.post('/import-general', companyAuth, upload.single('file'), importGeneralTemplate);

// Occasion type scope
router.put('/types/:occasionTypeId/scope', companyAuth, updateOccasionTypeScope);

// Edit individual occasion member
router.put('/members/:memberId', companyAuth, updateOccasionMember);

module.exports = router;

// ── Bulk import / tables / member edit ───────────────────────────────
const {
  downloadBulkTemplate, bulkSyncEmployees, getOccasionTables,
  updateOccasionMember: updateOM, deleteOccasionMember: deleteOM2,
} = require('../controllers/occasionBulkController');

router.get('/bulk-template',     companyAuth, downloadBulkTemplate);
router.post('/bulk-sync',        companyAuth, bulkSyncEmployees);
router.get('/tables',            companyAuth, getOccasionTables);
router.patch('/members/:id',     companyAuth, updateOM);
router.delete('/members/:id/bulk', companyAuth, deleteOM2);
