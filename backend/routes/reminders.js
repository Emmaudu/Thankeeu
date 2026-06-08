const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getReminders, createReminder, updateReminder, deleteReminder } = require('../controllers/reminderController');

router.use(auth);
router.get('/', getReminders);
router.post('/', createReminder);
router.put('/:id', updateReminder);
router.delete('/:id', deleteReminder);

module.exports = router;
