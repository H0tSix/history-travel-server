const express = require("express");
const axios = require("axios");
const router = express.Router();
const cors = require("cors");

// 🔹 두 개의 Together API 키를 환경 변수에서 가져옴
const { BF_API_KEY, ACHIEVEMENT_API_KEY, GROQ_API_KEY } = process.env;
const TOGETHER_BASE_URL = "https://api.together.xyz";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const IMAGE_MODEL_TOGETHER = "black-forest-labs/FLUX.1-schnell-Free";
const TEXT_MODEL = "mixtral-8x7b-32768";

// 요청 간 대기 시간 (10초로 변경)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🔥 캐싱을 위한 저장소 (중복 요청 방지)
const cache = new Map();

// 📢 "Rate Limit" 에러 발생 시 재시도 로직 (최대 2회, 10초 대기)
async function callAIWithRetry({ url, model, textForImage, apiKey }, retries = 2) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callAI({ url, model, textForImage, apiKey });
    } catch (error) {
      if (error.message.includes("rate limit") && attempt < retries - 1) {
        console.warn("🚨 Rate limit 초과! 10초 후 재시도...");
        await delay(10000); // 10초 대기 후 재시도
      } else {
        throw error;
      }
    }
  }
}

// 공통적인 AI API 호출 함수
async function callAI({ url, model, textForImage, apiKey }) {
  try {
    const payload = { model, prompt: textForImage };
    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    return response.data;
  } catch (error) {
    console.error("❌ AI 요청 실패:", error.response ? error.response.data : error.message);
    throw new Error("AI 요청 중 오류 발생");
  }
}

// CORS 설정
router.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: "GET, POST",
  allowedHeaders: "Content-Type",
}));

// 📌 AI 이미지 생성 및 업적 정보 요청
router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "유효한 위인 이름을 입력하세요." });
    }

    // ✅ 1️⃣ 캐시에 데이터가 있으면 API 호출 없이 반환
    if (cache.has(text)) {
      console.log(`✅ 캐시에서 데이터 반환: ${text}`);
      return res.json(cache.get(text));
    }

    // ✅ 2️⃣ 위인의 얼굴 이미지 생성 (프로필) → `BF_API_KEY` 사용
    console.log("🖼️ 프로필 이미지 생성 요청...");
    const faceImageData = await callAIWithRetry({
      url: `${TOGETHER_BASE_URL}/v1/images/generations`,
      apiKey: BF_API_KEY, // 🔥 프로필 이미지는 BF_API_KEY 사용
      model: IMAGE_MODEL_TOGETHER,
      textForImage: `${text}의 얼굴을 사실적인 인물 초상화 스타일로 생성해줘.`,
    });

    const profileImageUrl = faceImageData.data?.[0]?.url || "default-face.png";
    console.log("✅ 프로필 이미지 생성 완료:", profileImageUrl);

    console.log("⏳ 10초 대기 중...");
    await delay(10000); // 🔥 요청 간격 10초 유지

    // ✅ 3️⃣ 위인의 대표 업적 3개 추출
    console.log("📢 업적 정보 요청 중...");
    const achievementPrompts = await axios.post(GROQ_URL, {
      model: TEXT_MODEL,
      messages: [{ role: "user", content: `${text}가 이룬 대표적인 업적 3가지를 JSON 배열 ["업적1", "업적2", "업적3"] 형식으로 반환해줘.` }],
      response_format: { type: "json_object" },
    }, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    }).then((res) => JSON.parse(res.data.choices[0]?.message?.content || "{}").achievements || []);

    console.log("✅ 업적 정보 추출 완료:", achievementPrompts);

    // ✅ 4️⃣ 업적별 AI 이미지 생성 요청 (각 요청 사이에 10초 대기) → `ACHIEVEMENT_API_KEY` 사용
    const imageUrls = [];
    for (let i = 0; i < achievementPrompts.length; i++) {
      console.log(`🖼️ ${i + 1}번째 업적 이미지 생성 요청 중...`);

      const imageData = await callAIWithRetry({
        url: `${TOGETHER_BASE_URL}/v1/images/generations`,
        apiKey: ACHIEVEMENT_API_KEY, // 🔥 업적 이미지는 ACHIEVEMENT_API_KEY 사용
        model: IMAGE_MODEL_TOGETHER,
        textForImage: achievementPrompts[i],
      });

      const aiImageUrl = imageData.data?.[0]?.url || "default-image.png";
      imageUrls.push(aiImageUrl);

      console.log(`✅ ${i + 1}번째 업적 이미지 생성 완료: ${aiImageUrl}`);

      if (i < achievementPrompts.length - 1) {
        console.log("⏳ 10초 대기 중...");
        await delay(10000);
      }
    }

    console.log("✅ 모든 업적 이미지 생성 완료:", imageUrls);

    // ✅ 5️⃣ 캐시에 저장
    const responseData = {
      name: text,
      profileImage: profileImageUrl,
      achievements: imageUrls.map((url, index) => ({
        achievement: achievementPrompts[index],
        imageUrl: url,
      })),
    };

    cache.set(text, responseData);
    res.json(responseData);

  } catch (error) {
    console.error("❌ 서버 오류 발생:", error.message);
    res.status(500).json({ error: error.message || "서버 내부 오류 발생" });
  }
});

module.exports = router;
