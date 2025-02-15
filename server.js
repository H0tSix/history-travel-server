const express = require("express");
const cors = require("cors"); // CORS 미들웨어 추가
const session = require("express-session");
const passport = require("passport");
const axios = require("axios")
require("./passport/kakaoStrategy"); // 카카오 인증 전략 불러오기

const supabaseRoutes = require("./routers/supabase"); // ✅ Supabase 라우트 추가

const authRouter = require("./routers/auth");
const starRouter = require("./routers/star");
const authKakaoRouter = require("./routers/auth_kakao"); // ✅ 카카오 로그인 라우터 가져오기
const feedComentRouter = require("./routers/feed_coment");
const feedRouter = require("./routers/feed");
const llmRouter = require("./routers/llm")

const app = express();

app.use(cors({
  origin: '*',  // 모든 도메인 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
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

// ✅ Supabase 라우트 등록
app.use("/supabase", supabaseRoutes); // 🔹 프론트엔드에서 요청하는 `/supabase/star`를 처리

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

