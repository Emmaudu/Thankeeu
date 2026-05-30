const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const {
  getStats, getAllUsers, updateUserRole, deleteUser,
  getAllCards, deleteCard,
  getAllCompanies, deleteCompany, getCompanyTeamMembers
} = require('../controllers/adminController');

router.use(adminAuth);

// Stats
router.get('/stats', getStats);

// Users
router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);
router.delete('/users/:userId', deleteUser);

// Cards
router.get('/cards', getAllCards);
router.delete('/cards/:cardId', deleteCard);

// Companies
router.get('/companies', getAllCompanies);
router.delete('/companies/:companyId', deleteCompany);
router.get('/companies/:companyId/members', getCompanyTeamMembers);

module.exports = router;
