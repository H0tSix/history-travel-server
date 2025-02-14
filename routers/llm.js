const express = require('express');

const { isLoggedIn, isNotLoggedIn } = require('../middlewares');
const { createAvata } = require('../controllers/llm');

const router = express.Router();

router.post("/createSI", isLoggedIn, createAvata);

module.exports = router;