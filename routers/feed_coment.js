const express = require("express");
const {
  getFeed,
  addComment,
  getComment,
  addCommetChat,
} = require("../controllers/feed_coment");
const { isLoggedIn } = require("../middlewares");

const router = express.Router();

// router.get("/getFeed",isLoggedIn, getFeed);
// router.get("/getComment",isLoggedIn, getComment);
// router.post("/addComment",isLoggedIn, addComment);
// router.post("/addCommetChat",isLoggedIn, addCommetChat);

router.get("/getFeed", getFeed);
router.get("/getComment", getComment);
router.post("/addComment", addComment);
router.post("/addCommetChat", addCommetChat);

module.exports = router;
