const express = require('express');
const router = express.Router();
const votingController = require('../votingController');

// POST /api/voting/candidates - Add a candidate (only owner account)
router.post('/candidates', votingController.addCandidate);

// GET /api/voting/candidates - List all candidates and their vote counts
router.get('/candidates', votingController.getCandidates);

// POST /api/voting/vote - Cast a vote for a candidate
router.post('/vote', votingController.castVote);

// POST /api/voting/set-dates - Set voting period (owner only)
router.post('/set-dates', votingController.setVotingDates);

// GET /api/voting/winner - Return the winner's name and voting status
router.get('/winner', votingController.getWinner);

// GET /api/voting/dates - Get voting dates
router.get('/dates', votingController.getVotingDates);

// GET /api/voting/health - Health check endpoint
router.get('/health', votingController.getHealth);

module.exports = router; 