const express = require("express");
const cors = require("cors"); // CORS 미들웨어 추가
const session = require("express-session");
const passport = require("passport");
const axios = require("axios")
require("./passport/kakaoStrategy"); // 카카오 인증 전략 불러오기

const authRouter = require("./routers/auth");
const starRouter = require("./routers/star");
const authKakaoRouter = require("./routers/auth_kakao"); // 카카오 로그인 라우터 가져오기
const feedRouter = require("./routers/feed"); // feedRouter 추가
const llmRouter = require("./routers/llm")

const app = express();

// CORS 설정 추가 (localhost:5500에서 요청을 허용)
app.use(
  cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],  // 두 URL 모두 허용
    methods: "GET, POST, OPTIONS",   // 허용할 메서드 설정
    allowedHeaders: "Content-Type, Authorization", // 허용할 헤더
    credentials: true,  // 쿠키를 전송할 수 있도록 설정
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// 카카오 로그인 라우터 등록
app.use("/auth", authKakaoRouter);
app.use("/auth", authRouter);
app.use("/star", starRouter);
app.use("/feed", feedRouter);
app.use("/llm", llmRouter);

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
