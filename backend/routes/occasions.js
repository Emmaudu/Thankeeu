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

module.exports = router;
