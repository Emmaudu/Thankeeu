// routes/messages.js
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { addMessage, reactToMessage, deleteMessage, sendReply, upload } = require('../controllers/messageController');

router.post('/:card_slug', upload.single('media'), addMessage);
router.post('/react/:message_id', reactToMessage);
router.delete('/:message_id', auth, deleteMessage);
router.post('/:card_slug/reply', auth, sendReply);

module.exports = router;
