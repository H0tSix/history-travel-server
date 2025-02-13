const express = require('express');

const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const { createStar, getStars, getStarsByUser } = require('../controllers/star');

const router = express.Router();

// 위인 정보 추가
router.post('/createStar', isLoggedIn, createStar);
// 모든 위인 검색
router.get('/getStars', isLoggedIn, getStars);
// 특정 사용자가 추가한 위인 정보 조회
router.get('/getStarsByUser', isLoggedIn, getStarsByUser);

module.exports = router;