const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const {
  createCard, getUserCards, getCard, updateCard,
  activateCard, sendCard, deleteCard, getPublicCard
} = require('../controllers/cardController');

router.get('/public/:slug', getPublicCard);
router.use(auth);
router.post('/', createCard);
router.get('/', getUserCards);
router.get('/:slug', getCard);
router.put('/:slug', updateCard);
router.post('/:slug/activate', activateCard);
router.post('/:slug/send', sendCard);
router.delete('/:slug', deleteCard);

module.exports = router;
