const passport = require("passport");
const KakaoStrategy = require("passport-kakao").Strategy;
require("dotenv").config();

passport.use(new KakaoStrategy({
    clientID: process.env.KAKAO_CLIENT_ID,  
    clientSecret: process.env.KAKAO_CLIENT_SECRET, 
    callbackURL: process.env.KAKAO_REDIRECT_URI 
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log("🔹 카카오 로그인 성공, profile 정보:", profile);
        return done(null, profile);
    } catch (error) {
        console.error("❌ 카카오 로그인 오류:", error);
        return done(error);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

module.exports = passport;
