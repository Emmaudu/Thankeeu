'use strict';
const router  = require('express').Router();
const { generateMovie, getMovieStatus, regenerateMovie } = require('../controllers/movieController');
const { anyAuth } = require('../middleware/auth');
const { validateUUIDParam } = require('../utils/paramGuard');

// Status is pollable by anyone with the card link (recipients aren't always
// logged in), but cardId must be a valid UUID or Postgres throws a 500.
router.get('/:cardId',             validateUUIDParam('cardId'), getMovieStatus);
router.post('/:cardId/generate',   validateUUIDParam('cardId'), anyAuth, generateMovie);
router.post('/:cardId/regenerate', validateUUIDParam('cardId'), anyAuth, regenerateMovie);

module.exports = router;
