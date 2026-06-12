const express = require('express');
const router  = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getStats, getAllUsers, updateUserRole, deleteUser,
  getAllCards, deleteCard,
  getAllCompanies, deleteCompany, getCompanyTeamMembers,
  getVisitors, setCompanyMultiplier, grantPilot,
} = require('../controllers/adminController');

router.use(adminAuth);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users',                     getAllUsers);
router.put('/users/:userId/role',        updateUserRole);
router.delete('/users/:userId',          deleteUser);

// Cards
router.get('/cards',                     getAllCards);
router.delete('/cards/:cardId',          deleteCard);

// Companies
router.get('/companies',                 getAllCompanies);
router.delete('/companies/:companyId',   deleteCompany);
router.get('/companies/:companyId/members', getCompanyTeamMembers);

// Visitors (guests who signed cards without an account)
router.get('/visitors',                  getVisitors);

// Company pricing & pilot management
router.post('/companies/:companyId/set-multiplier', setCompanyMultiplier);
router.post('/companies/:companyId/grant-pilot',    grantPilot);

module.exports = router;
