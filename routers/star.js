const express = require("express");
const multer = require("multer");

const { isLoggedIn, isNotLoggedIn } = require("../middlewares");
const {
  createStar,
  getStars,
  getStarsByUser,
  createStorage,
  getStorage,
} = require("../controllers/star");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// 위인 정보(image x) 추가
router.post("/createStar", isLoggedIn, createStar);
// 모든 위인 검색
router.get("/getStars", isLoggedIn, getStars);
// 특정 사용자가 추가한 위인 정보 조회
router.get("/getStarsByUser", isLoggedIn, getStarsByUser);
// 위인 스토리지에 이미지추가 + 스타 테이블에 이미지 추가
router.post("/createStorage", upload.single("file"), isLoggedIn, createStorage);
router.get("/getStorage", isLoggedIn, getStorage);

module.exports = router;
