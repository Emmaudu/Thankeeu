'use strict';
const router  = require('express').Router();
const { generateMovie, getMovieStatus, regenerateMovie } = require('../controllers/movieController');
const { optionalAuth } = require('../middleware/auth');
const { validateUUIDParam } = require('../utils/paramGuard');

// Status is pollable by anyone with the card link (recipients aren't always
// logged in), but cardId must be a valid UUID or Postgres throws a 500.
router.get('/:cardId',             validateUUIDParam('cardId'), getMovieStatus);
// Creator or recipient. optionalAuth (not anyAuth): a recipient opening the
// card from their private link isn't logged in and proves it with the card's
// access token instead (checked in movieController.canManageMovie).
router.post('/:cardId/generate',   validateUUIDParam('cardId'), optionalAuth, generateMovie);
router.post('/:cardId/regenerate', validateUUIDParam('cardId'), optionalAuth, regenerateMovie);

module.exports = router;
