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
