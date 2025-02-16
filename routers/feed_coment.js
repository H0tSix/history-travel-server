const express = require("express");
const {
  getFeed,
  addComment,
  getComment,
  addCommetChat,
} = require("../controllers/feed_coment");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

router.get("/getFeed/:id", isLoggedIn, getFeed);
router.get("/getComment", isLoggedIn, getComment);
router.post("/addComment", isLoggedIn, addComment);
router.post("/addCommetChat", isLoggedIn, addCommetChat);

module.exports = router;
