const express = require("express");
const { getFeed, addComment } = require("../controllers/feed");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

router.get("/getFeed", getFeed);
router.post("/addComment", addComment);

module.exports = router;
