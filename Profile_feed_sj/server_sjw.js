require("dotenv").config();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = 3000;

// ✅ Supabase 연결
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.use(express.json());
app.use(
  cors({
    origin: "https://programmers-aibe1.github.io",
    methods: "GET, POST, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

// ✅ 요청 사이에 1초 텀을 주기 위한 delay 함수
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ✅ Supabase에 이미지 업로드하는 함수
async function uploadImageToSupabase(imageBuffer, fileName) {
    const { data, error } = await supabase.storage
        .from("my-bucket")  // ✅ Supabase 스토리지 버킷 이름
        .upload(fileName, imageBuffer, { contentType: "image/png" });

    if (error) {
        console.error("❌ 이미지 업로드 실패:", error);
        return null;
    }

    return `${process.env.SUPABASE_URL}/storage/v1/object/public/my-bucket/${fileName}`;
}

// ✅ 공통적인 AI API 호출 함수
async function callAI({ url, model, textForImage, apiKey }) {
  try {
    const payload = { model, prompt: textForImage };

    console.log("📢 AI 요청 데이터:", JSON.stringify(payload, null, 2));

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

// ✅ POST 요청 처리 (위인의 얼굴 + 업적 이미지 생성 추가)
app.post("/", async (req, res) => {
  try {
    const { TOGETHER_API_KEY, GROQ_API_KEY } = process.env;
    const TOGETHER_BASE_URL = "https://api.together.xyz";
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    const IMAGE_MODEL_TOGETHER = "black-forest-labs/FLUX.1-schnell-Free";
    const TEXT_MODEL = "mixtral-8x7b-32768";

    // 1️⃣ 요청 받은 위인 이름 검증
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "유효한 위인 이름을 입력하세요." });
    }

    // 2️⃣ 위인의 대표 업적 3개 추출
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

    console.log("✅ 업적 3개 추출 완료:", achievementPrompts);

    // 3️⃣ 위인의 얼굴 이미지 생성
    console.log("🖼️ 위인의 얼굴 이미지 생성 요청 중...");
    const faceImageData = await callAI({
      url: `${TOGETHER_BASE_URL}/v1/images/generations`,
      apiKey: TOGETHER_API_KEY,
      model: IMAGE_MODEL_TOGETHER,
      textForImage: `${text}의 얼굴을 고품질 인물 사진 스타일로 생성해줘.`,
    });

    const faceImageUrl = faceImageData.data?.[0]?.url || "default-face.png";

    // 4️⃣ 얼굴 이미지 다운로드 후 Supabase에 업로드
    const faceImageResponse = await axios.get(faceImageUrl, { responseType: "arraybuffer" });
    const faceFileName = `profile_${Date.now()}.png`;
    const profileImageUrl = await uploadImageToSupabase(faceImageResponse.data, faceFileName);
    console.log("✅ 위인의 얼굴 이미지 Supabase 업로드 완료:", profileImageUrl);

    // 5️⃣ 업적별 AI 이미지 생성 및 Supabase 업로드
    const imageUrls = [];
    for (let i = 0; i < achievementPrompts.length; i++) {
      console.log(`🖼️ ${i + 1}번째 업적 이미지 생성 요청 중...`);

      const imageData = await callAI({
        url: `${TOGETHER_BASE_URL}/v1/images/generations`,
        apiKey: TOGETHER_API_KEY,
        model: IMAGE_MODEL_TOGETHER,
        textForImage: achievementPrompts[i],
      });

      const aiImageUrl = imageData.data?.[0]?.url || "default-image.png";

      // AI가 생성한 이미지 다운로드 후 Supabase에 업로드
      const imageResponse = await axios.get(aiImageUrl, { responseType: "arraybuffer" });
      const fileName = `feed_${Date.now()}_${i}.png`;
      const supabaseImageUrl = await uploadImageToSupabase(imageResponse.data, fileName);

      if (supabaseImageUrl) {
        imageUrls.push(supabaseImageUrl);
      }
    }

    console.log("✅ Supabase 업적 이미지 업로드 완료:", imageUrls);

    // 6️⃣ 최종 JSON 응답 반환 (위인의 얼굴 이미지 추가)
    res.json({
      name: text,
      profileImage: profileImageUrl,
      achievements: imageUrls.map((url, index) => ({
        achievement: achievementPrompts[index],
        imageUrl: url,
      })),
    });

  } catch (error) {
    console.error("❌ 서버 오류 발생:", error.message);
    res.status(500).json({ error: error.message || "서버 내부 오류 발생" });
  }
});

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
