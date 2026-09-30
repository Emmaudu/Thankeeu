const { validateUUIDParam } = require('../utils/paramGuard');
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminderController');

router.use(auth);
router.get('/', getReminders);
router.post('/', createReminder);
router.put('/:id', validateUUIDParam('id'), updateReminder);
router.delete('/:id', validateUUIDParam('id'), deleteReminder);

module.exports = router;
