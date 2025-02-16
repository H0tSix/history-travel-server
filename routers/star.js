const express = require("express");

const { isLoggedIn, isNotLoggedIn } = require("../middlewares");
const {
  createStar,
  getStars,
  getStarsByUser,
  createStarImage,
} = require("../controllers/star");

const router = express.Router();

// 위인 정보(image x) 추가
router.post("/createStar", isLoggedIn, createStar);
// 모든 위인 검색
router.get("/getStars", isLoggedIn, getStars);
// 특정 사용자가 추가한 위인 정보 조회
router.get("/getStarsByUser", isLoggedIn, getStarsByUser);
// 위인 이미지 추가
router.post("/createStarImage", isLoggedIn, createStarImage);

module.exports = router;
