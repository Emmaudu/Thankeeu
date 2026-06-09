const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const {
  inviteCoreTeamMember, bulkInviteCoreTeam, downloadCoreTeamTemplate,
  getCoreTeam, removeCoreTeamMember,
} = require('../controllers/coreTeamController');

router.use(companyAuth);
router.get('/',                getCoreTeam);
router.get('/template',        downloadCoreTeamTemplate);
router.post('/invite',         inviteCoreTeamMember);
router.post('/invite-bulk',    upload.single('file'), bulkInviteCoreTeam);
router.delete('/:id',          removeCoreTeamMember);

module.exports = router;
