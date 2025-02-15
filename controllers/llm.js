//수파노바-에스파
const { createClient } = require("@supabase/supabase-js");

// ✅ Supabase 연결 🔹 API 키
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);


const express = require("express");
const axios = require("axios");

// 🔹 API 키 로드
const { BF_API_KEY, ACHIEVEMENT_API_KEY, GROQ_API_KEY } = process.env;
const TOGETHER_BASE_URL = "https://api.together.xyz";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const IMAGE_MODEL_TOGETHER = "black-forest-labs/FLUX.1-schnell-Free";
const TEXT_MODEL = "mixtral-8x7b-32768";
const PROMPT_MODEL = "mixtral-8x7b-32768"; // 프롬프트 최적화용 모델

// 요청 간 대기 시간 (15초)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 🔥 캐싱을 위한 저장소 (중복 요청 방지)
const cache = new Map();

// 📢 "Rate Limit" 에러 발생 시 재시도 로직 (최대 2회, 15초 대기)
async function callAIWithRetry({ url, model, textForImage, apiKey }, retries = 2) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await callAI({ url, model, textForImage, apiKey });
    } catch (error) {
      if (error.message.includes("rate limit") && attempt < retries - 1) {
        console.warn("🚨 Rate limit 초과! 15초 후 재시도...");
        await delay(15000);
      } else {
        throw error;
      }
    }
  }
}

// ✅ 최신 스타 이름을 Supabase에서 가져오는 함수
async function getLatestStarName() {
  try {
    const { data, error } = await supabase
    .from("STAR")  // ✅ 테이블명 정확히 지정
    .select("star_name")
    .order("sId", { ascending: false })  // ✅ `sld` 기준 최신 데이터 가져오기
    .limit(1)
    .single();


    if (error || !data) {
      throw new Error("Supabase에서 스타 데이터를 가져올 수 없음");
    }

    console.log("✅ 최신 스타 이름:", data.star_name);
    return data.star_name;
  } catch (error) {
    console.error("❌ Supabase에서 데이터 가져오기 실패:", error);
    return "이순신";  // ✅ 실패 시 기본값 반환
  }
}


// 공통적인 AI API 호출 함수
async function callAI({ url, model, textForImage, apiKey }) {
  try {
    const payload = {
      model,
      messages: [{ role: "user", content: textForImage }], // ✅ prompt → messages 사용
    };

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

// 📌 AI 이미지 생성 및 업적 정보 요청
exports.createAvata = async (req, res) => {
  try {
    let { text } = req.body; // 🔹 사용자 입력값 받아오기

    console.log("📢 LLM API 호출됨! 받은 텍스트:", text); // 디버깅 로그

    // ✅ Supabase에서 최신 스타 이름 가져오기 (입력값이 없을 경우 자동으로 가져옴)
    if (!text || typeof text !== "string") {
      console.log("📢 Supabase에서 최신 스타 가져오는 중...");
      text = await getLatestStarName();
    }

    console.log(`✅ LLM 요청 대상 스타: ${text}`);

    // ✅ 1️⃣ 캐시에 데이터가 있으면 API 호출 없이 반환
    if (cache.has(text)) {
      console.log(`✅ 캐시에서 데이터 반환: ${text}`);
      return res.json(cache.get(text));
    }

    // ✅ 2️⃣ 위인의 얼굴 이미지 프롬프트 생성
    console.log("📝 프로필 이미지 프롬프트 생성...");
    const facePromptResponse = await callAI({
      url: GROQ_URL,
      apiKey: GROQ_API_KEY,
      model: PROMPT_MODEL,
      textForImage: `${text}의 얼굴을 역사적으로 정확한 모습의 초상화 스타일로 AI 이미지를 생성하는 영어 프롬프트를 200자로 작성해줘.`,
    });

    const facePrompt = facePromptResponse?.choices?.[0]?.message?.content || "A realistic historical portrait of a great person";
    console.log("✅ 프로필 이미지 프롬프트 생성 완료:", facePrompt);

    console.log("🖼️ 프로필 이미지 생성 요청...");
    const faceImageData = await callAIWithRetry({
      url: `${TOGETHER_BASE_URL}/v1/images/generations`,
      apiKey: BF_API_KEY,
      model: IMAGE_MODEL_TOGETHER,
      textForImage: facePrompt,
    });

    const profileImageUrl = faceImageData?.data?.[0]?.url || "default-face.png";
    console.log("✅ 프로필 이미지 생성 완료:", profileImageUrl);

    console.log("⏳ 15초 대기 중...");
    await delay(15000);

    // ✅ 3️⃣ 위인의 대표 업적 3개 추출
    console.log("📢 업적 정보 요청 중...");
    const achievementResponse = await axios.post(GROQ_URL, {
      model: TEXT_MODEL,
      messages: [{ role: "user", content: `${text}가 이룬 대표적인 업적 3가지를 JSON 배열 ["업적1", "업적2", "업적3"] 형식으로 반환해줘.` }],
      response_format: { type: "json_object" },
    }, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const achievementPrompts = achievementResponse?.data?.choices?.[0]?.message?.content
      ? JSON.parse(achievementResponse.data.choices[0].message.content).achievements || []
      : ["업적 1", "업적 2", "업적 3"];

    console.log("✅ 업적 정보 추출 완료:", achievementPrompts);

    const imageUrls = [];
    for (let i = 0; i < achievementPrompts.length; i++) {
      console.log(`📝 ${i + 1}번째 업적 이미지 프롬프트 생성...`);

      const achievementImagePromptResponse = await callAI({
        url: GROQ_URL,
        apiKey: GROQ_API_KEY,
        model: PROMPT_MODEL,
        textForImage: `${text}가 이룬 ${achievementPrompts[i]}에 대한 AI 이미지 생성을 위한 200자 이내의 최적화된 영어 프롬프트를 작성해줘.`,
      });

      const achievementImagePrompt = achievementImagePromptResponse?.choices?.[0]?.message?.content || "A historical representation of an achievement";
      console.log(`✅ ${i + 1}번째 업적 이미지 프롬프트 생성 완료:`, achievementImagePrompt);

      console.log(`🖼️ ${i + 1}번째 업적 이미지 생성 요청...`);
      const imageData = await callAIWithRetry({
        url: `${TOGETHER_BASE_URL}/v1/images/generations`,
        apiKey: ACHIEVEMENT_API_KEY,
        model: IMAGE_MODEL_TOGETHER,
        textForImage: achievementImagePrompt,
      });

      const aiImageUrl = imageData?.data?.[0]?.url || "default-image.png";
      imageUrls.push(aiImageUrl);

      console.log(`✅ ${i + 1}번째 업적 이미지 생성 완료: ${aiImageUrl}`);

      if (i < achievementPrompts.length - 1) {
        console.log("⏳ 15초 대기 중...");
        await delay(15000);
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
};