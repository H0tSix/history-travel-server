const express = require("express");
const { getFeed } = require("../controllers/feed");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

// router.get("/getFeed", isLoggedIn, getFeed);
router.get("/getFeed", getFeed);

module.exports = router;
