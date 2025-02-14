const express = require("express");
const { getFeed, createFeed } = require("../controllers/feed");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

router.post("/createFeed", isLoggedIn, createFeed);
router.get("/getFeed/:id", isLoggedIn, getFeed);

module.exports = router;