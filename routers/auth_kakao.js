const express = require("express");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const router = express.Router();

// ✅ 카카오 로그인 요청
router.get("/", (req, res) => {
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${process.env.KAKAO_CLIENT_ID}&redirect_uri=${process.env.KAKAO_REDIRECT_URI}&response_type=code`;
    res.redirect(kakaoAuthUrl);
});

// ✅ 카카오 콜백 (로그인 후 리디렉트)
router.get("/callback", async (req, res) => {
    const { code } = req.query;

    try {
        // 1️⃣ 액세스 토큰 요청
        const tokenResponse = await axios.post(
            "https://kauth.kakao.com/oauth/token",
            new URLSearchParams({
                grant_type: "authorization_code",
                client_id: process.env.KAKAO_CLIENT_ID,
                redirect_uri: process.env.KAKAO_REDIRECT_URI,
                client_secret: process.env.KAKAO_CLIENT_SECRET,
                code,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const { access_token } = tokenResponse.data;

        // 2️⃣ 사용자 정보 가져오기
        const userResponse = await axios.get("https://kapi.kakao.com/v2/user/me", {
            headers: { Authorization: `Bearer ${access_token}` },
        });

        const { id, properties, kakao_account } = userResponse.data;
        const user = {
            id,
            nickname: properties?.nickname,
            email: kakao_account?.email,
        };

        // 3️⃣ JWT 토큰 생성
        const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1h" });

        res.json({ message: "카카오 로그인 성공", user, token });
    } catch (error) {
        console.error("카카오 로그인 실패:", error);
        res.status(500).json({ message: "카카오 로그인 실패", error: error.response?.data });
    }
});

module.exports = router;
