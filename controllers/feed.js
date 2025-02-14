const supabase = require("../config/supabase");

exports.getFeed = async (req, res) => {
  const { id } = req.query;
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

    res.status(200).json(feed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { coment, uId, fId, sId } = req.body;
  const fcId = Date.now();
  if (!coment || !uId || !fId || !sId) {
    return res.status(400).json({ error: "필수 데이터 누락" });
  }
  console.log("🛠️ Supabase에 댓글 저장 시도:", {
    fcId,
    fId,
    uId,
    sId,
    coment,
    parent_id: null,
  });

  const { data, error } = await supabase
    .from("FEEDCOMMENT")
    .insert([{ fcId, fId, uId, sId, coment, parent_id: null }])
    .select("*")
    .single();

  if (error) {
    if (error) {
      console.error("❌ 댓글 저장 오류:", error || "No error message");
      console.error("❌ Supabase 에러 상세:", JSON.stringify(error, null, 2));
      return res.status(500).json({ error: error.message || "댓글 저장 실패" });
    }
  }

  console.log("사용자 댓글 저장 완료:", data);
};
