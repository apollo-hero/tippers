const express = require('express');

const {
    createCandidate,
    getCandidates,
    createVote,
    getWinner
} = require("../controllers/voteController");

const {validateAddress , validateCandidateIndex} = require("../middlewares/validator/index");
const {
    isAuthenticatedUser,
    authorizeRoles,
} = require("../middlewares/user_actions/auth");

const router = express.Router();

router.route("/vote/createCandidate").post( isAuthenticatedUser , createCandidate);
router.route("/vote/getCandidates").get(isAuthenticatedUser , getCandidates);
router.route("vote/createVote").post(isAuthenticatedUser , createVote);
router.route("/vote/getWinner").get(isAuthenticatedUser , getWinner);

module.exports = router;
