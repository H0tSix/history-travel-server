const express = require("express");
const router = express.Router();
const { createClient } = require("@supabase/supabase-js");

// ✅ Supabase 환경 변수 로드
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Supabase 환경 변수가 설정되지 않았습니다.");
    process.exit(1); // 서버 종료
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ✅ 최신 스타 이름 가져오는 API
router.get("/star", async (req, res) => {
    try {
        console.log("📢 Supabase에서 최신 스타 가져오기 시도...");
        
        const { data, error } = await supabase
        .from("STAR")  // ✅ 테이블명 정확히 지정
        .select("star_name")
        .order("sId", { ascending: false })  // ✅ `sld` 기준 최신 데이터 가져오기
        .limit(1)
        .single();


        if (error) {
            console.error("❌ Supabase에서 데이터 가져오기 실패:", error);
            return res.status(500).json({ error: "Supabase에서 스타 데이터를 가져올 수 없음" });
        }

        if (!data) {
            console.warn("⚠️ Supabase에서 데이터를 찾을 수 없습니다.");
            return res.status(404).json({ error: "스타 데이터 없음" });
        }

        console.log("✅ 최신 스타 이름:", data.star_name);
        res.json({ starName: data.star_name });
    } catch (error) {
        console.error("❌ 서버 내부 오류 발생:", error);
        res.status(500).json({ error: "서버 내부 오류 발생" });
    }
});

module.exports = router;
