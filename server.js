const express = require("express");
const cors = require("cors"); // CORS 미들웨어 추가
const session = require("express-session");
const fetch = require("node-fetch");
const passport = require("passport");
const axios = require("axios");
require("./passport/kakaoStrategy"); // 카카오 인증 전략 불러오기

const authRouter = require("./routers/auth");
const starRouter = require("./routers/star");
const authKakaoRouter = require("./routers/auth_kakao"); // ✅ 카카오 로그인 라우터 가져오기
const feedComentRouter = require("./routers/feed_coment");
const feedRouter = require("./routers/feed");
const llmRouter = require("./routers/llm");

const app = express();

app.use(
  cors({
    origin: "*", // 모든 도메인 허용
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
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

app.get("/proxy", async (req, res) => {
  try {
    const response = await fetch(req.query.imgPath); // 쿼리 파라미터로 이미지 경로 전달
    const data = await response.buffer(); // 이미지 데이터를 버퍼로 받기
    res.set("Content-Type", "image/jpeg"); // 반환할 데이터 타입 설정
    res.send(data); // 이미지 전송
  } catch (error) {
    res.status(500).send("이미지 요청 실패");
  }
});

// 카카오 로그인 라우터 등록
app.use("/auth", authKakaoRouter);
app.use("/auth", authRouter);
app.use("/star", starRouter);
app.use("/feed_coment", feedComentRouter);
app.use("/feed", feedRouter);
app.use("/llm", llmRouter);

app.listen(3000, () => {
  console.log("✅ Server running on http://localhost:3000");
});
