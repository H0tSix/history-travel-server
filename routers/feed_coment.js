const express = require("express");
const { getFeed, addComment } = require("../controllers/feed_coment");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

router.get("/getFeed", isLoggedIn, getFeed);
router.post("/addComment", isLoggedIn, addComment);

module.exports = router;
