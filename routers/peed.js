const express = require('express');

const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const {  } = require('../controllers/peed');

const router = express.Router();

// 피드저장
router.post('/', isNotLoggedIn, );
router.get('/', isLoggedIn, );

module.exports = router;