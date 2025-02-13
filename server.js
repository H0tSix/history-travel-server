const express = require("express");
const session = require("express-session");
const passport = require("passport");
require("./passport/kakaoStrategy"); // 카카오 인증 전략 불러오기

const authKakaoRouter = require("./routers/auth_kakao"); // ✅ 카카오 로그인 라우터 가져오기

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

// ✅ 카카오 로그인 라우터 등록
app.use("/auth", authKakaoRouter);

app.listen(3000, () => {
    console.log("✅ Server running on http://localhost:3000");
});
