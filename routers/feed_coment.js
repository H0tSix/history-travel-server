const express = require("express");
const {
  getFeed,
  addComment,
  getComment,
  addCommetChat,
} = require("../controllers/feed_coment");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

// router.get("/getFeed", isLoggedIn, getFeed);
// router.post("/addComment", isLoggedIn, addComment);

router.get("/getFeed", getFeed);
router.get("/getComment", getComment);
router.post("/addComment", addComment);
router.post("/addCommetChat", addCommetChat);

module.exports = router;
