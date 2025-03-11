const express = require("express");

const { getUserUSDCBalance } = require("../controllers/salimdevApiTest");

const router = express.Router();

router.route("/userUSDCBalance").get(getUserUSDCBalance);

module.exports = router;
