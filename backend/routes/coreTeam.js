const express = require('express');
const router  = express.Router();
const { companyAuth } = require('../middleware/companyAuth');
const multer  = require('multer');
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const {
  inviteCoreMember, bulkInviteCoreTeam,
  getCoreTeam, removeCoreMember,
} = require('../controllers/coreTeamController');

router.use(companyAuth);
router.get('/',                getCoreTeam);
router.post('/invite',         inviteCoreMember);
router.post('/invite-bulk',    upload.single('file'), bulkInviteCoreTeam);
router.delete('/:id',          removeCoreMember);

module.exports = router;
