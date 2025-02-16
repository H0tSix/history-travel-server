const express = require("express");
const passport = require("passport");
const supabase = require("../config/supabase");

const router = express.Router(); 

router.get("/kakao", passport.authenticate("kakao"));

router.get("/kakao/callback", passport.authenticate("kakao", { failureRedirect: "/" }), async (req, res) => {
    try {
        console.log("🔹 카카오 로그인 콜백 실행됨");

        const { id, kakao_account } = req.user;
        console.log("🔹 카카오에서 받은 유저 정보:", { id, kakao_account });

        const email = kakao_account?.email || null;
        const nickname = kakao_account?.profile?.nickname || "Unknown";
        const provider = "kakao";

        console.log("🔹 Supabase에 저장 시도");

        const { data, error } = await supabase
            .from("USER")
            .upsert([
                {
                    id: Number(id),  
                    uId: nickname,   
                    email: email,
                    provider: provider,
                    password: null,
                    created_at: new Date().toISOString(),
                },
            ], { onConflict: ["id"] });

        if (error) {
            console.error("❌ Supabase 저장 오류:", error);
            return res.status(500).send("Supabase 저장 실패");
        }

        console.log("✅ Supabase 저장 성공:", data);
        res.json({ message: "카카오 로그인 성공", data });

    } catch (err) {
        console.error("❌ 카카오 로그인 처리 중 오류:", err);
        res.status(500).send("카카오 로그인 실패");
    }
});

module.exports = router;  
