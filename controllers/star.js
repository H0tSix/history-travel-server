const supabase = require("../config/supabase");

const folderName = "uploads";
const bucketName = "my-bucket";

exports.createStar = async (req, res) => {
  const uId = req.user.userId;
  try {
    const { star_name, country, year } = req.body;
    const { data, error } = await supabase
      .from("STAR")
      .insert({ star_name, country, year, uId });
    if (error) throw error;
    res.status(201).json({ message: "위인 정보 등록 성공" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStars = async (req, res) => {
  try {
    const { data, error } = await supabase.from("STAR").select("*");
    if (error) throw error;
    res.status(200).json({ message: "위인 정보 조회 성공", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getStarsByUser = async (req, res) => {
  const uId = req.user.userId;
  try {
    const { data, error } = await supabase
      .from("STAR")
      .select("*")
      .eq("uId", uId);
    if (error) throw error;
    res.status(200).json({ message: "사용자의 위인 정보 조회 성공", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.createStorage = async (req, res) => {
  const uId = req.user.userId;
  try {
    if (!req.file) {
      return res.status(400).json({ error: "파일이 제공되지 않았습니다." });
    }
    const { originalname, buffer, mimetype } = req.file;
    const filePath = `${folderName}/${Date.now()}_${originalname}`;
    const path = `${Date.now()}_${originalname}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, { contentType: mimetype });

    const { star_name } = req.body;
    await supabase
      .from("STAR")
      .update({ profile_image: path })
      .eq("uId", uId)
      .eq("star_name", star_name)
      .single();
    const { data: data2 } = await supabase
      .from("STAR")
      .select("sId")
      .eq("star_name", star_name)
      .single();
    if (error) throw error;

    const { publicURL } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return res
      .status(201)
      .json({ message: "파일 업로드 성공", url: publicURL, sId: data2.sId });
  } catch (error) {
    console.error("파일 업로드 실패:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

exports.getStorage = async (req, res) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list(folderName);
    if (error) throw error;
    return res.status(200).json({ files: data });
  } catch (error) {
    console.error("파일 목록 조회 실패:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
