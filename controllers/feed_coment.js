const supabase = require("../config/supabase");
const { randomUUID } = require("crypto");

exports.getFeed = async (req, res) => {
  const { id } = req.query;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  try {
    const { data: feed, error } = await supabase
      .from("FEED")
      .select(
        `
      fId,
      feed_text,
      feed_image,
      STAR!inner(sId, star_name, profile_image, USER!inner(id, uId))
    `
      )
      .eq("fId", id)
      .single();

    if (error) throw error;
    if (!feed) return res.status(404).json({ message: "게시물이 없습니다." });

    feed.feed_image = feed.feed_image
      ? `${SUPABASE_URL}/storage/v1/object/public/my-bucket/uploads/${feed.feed_image}`
      : null;

    feed.STAR.profile_image = feed.STAR.profile_image
      ? `${SUPABASE_URL}/storage/v1/object/public/my-bucket/uploads/${feed.STAR.profile_image}`
      : null;

    res.status(200).json(feed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getComment = async (req, res) => {
  try {
    const { fId } = req.query; // URL에서 fId 가져오기
    if (!fId) {
      return res.status(400).json({ error: "fId가 필요합니다." });
    }

    const { data, error } = await supabase
      .from("FEEDCOMENT")
      .select("*")
      .eq("fId", fId)
      .order("parent_id", { ascending: true, nullsFirst: true })
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  try {
    const { coment, uId, fId, sId } = req.body;
    const fcId = parseInt(randomUUID().replace(/-/g, "").substring(0, 15), 16);
    if (!coment || !uId || !fId || !sId) {
      return res.status(400).json({ error: "필수 데이터 누락" });
    }

    const { data, error } = await supabase
      .from("FEEDCOMENT")
      .insert([{ fcId, fId, uId, sId, coment }])
      .select("*")
      .single();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.addCommetChat = async (req, res) => {
  const { parent_id, fId, uId, sId, comment, star } = req.body;
  const fcId = parseInt(randomUUID().replace(/-/g, "").substring(0, 15), 16);

  const groq_url = process.env.GROQ_URL;
  const groq_api_key = process.env.GROQ_API_KEY;
  const mixtral_model = "mixtral-8x7b-32768";

  async function callAI({ url, model, text, apiKey, jsonMode = false }) {
    const payload = {
      model,
      messages: [{ role: "user", content: text }],
    };
    if (jsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  }

  try {
    const aiPrompt = `너는 오랜 역사를 가진 ${star}라는 인물이야. 
    지금 그 시대에 상황에 맞게 "${comment}" 라는 댓글이 달렸을 때, 
    그 시대적 상황을 고려하여 재치있게 30자 내외로 한글로만 답글을 작성해줘. 
    반드시 JSON 형식으로 응답해. 예제: {"response": "여기에 AI의 답글이 들어감"}`;

    const response = await callAI({
      url: groq_url,
      apiKey: groq_api_key,
      model: mixtral_model,
      text: aiPrompt,
      jsonMode: true,
    });

    if (!response.choices || response.choices.length === 0) {
      throw new Error("AI 응답이 비어 있습니다.");
    }
    let promptJSON;
    try {
      promptJSON = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      throw new Error("AI 응답을 JSON으로 변환하는 데 실패했습니다.");
    }

    res.status(200).json(promptJSON.response);
    const coment = promptJSON.response;

    const { data, error } = await supabase
      .from("FEEDCOMENT")
      .insert([{ fcId, fId, uId, sId, coment, parent_id }]);

    if (error) throw error;
  } catch (error) {
    console.error("AI 호출 중 오류 발생:", error);
    res.status(500).json({ error: "AI 응답 생성 실패" });
  }
};
