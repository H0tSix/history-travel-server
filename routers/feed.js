const express = require("express");
const multer = require("multer");
const { getFeed, createFeed, getFeeds } = require("../controllers/feed");
const { isLoggedIn } = require("../middlewares");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

router.post("/createFeed", upload.single("file"), isLoggedIn, createFeed);
router.get("/getFeed/:id", isLoggedIn, getFeed);
router.get("/getFeeds", isLoggedIn, getFeeds);

module.exports = router;