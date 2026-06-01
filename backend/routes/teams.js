// routes/teams.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { companyAuth } = require('../middleware/companyAuth');
const {
  downloadTemplate, importTeamMembers, getTeamMembers,
  getDepartments, deleteTeamMember, getTeamsDashboard
} = require('../controllers/teamsController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(companyAuth);
router.get('/template', downloadTemplate);
router.post('/import', upload.single('file'), importTeamMembers);
router.get('/', getTeamMembers);
router.get('/departments', getDepartments);
router.get('/dashboard', getTeamsDashboard);
router.delete('/:memberId', deleteTeamMember);

module.exports = router;
