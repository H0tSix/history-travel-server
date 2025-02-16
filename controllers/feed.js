const supabase = require("../config/supabase");

const folderName = "uploads";
const bucketName = "my-bucket";

exports.createFeed = async (req, res) => {
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

    const { feed_text, sId } = req.body;
    await supabase.from("FEED").insert({ feed_text, sId, feed_image: path });
    const { data: data2 } = await supabase
      .from("FEED")
      .select("fId")
      .eq("feed_text", feed_text)
      .eq("sId", sId)
      .eq("feed_image", path);
    if (error) throw error;

    const { publicURL } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return res
      .status(201)
      .json({
        message: "피드 정보 등록, 파일 업로드 성공",
        url: publicURL,
        fId: data2,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFeeds = async (req, res) => {
  try {
    const { data, error } = await supabase.from("FEED").select("*");
    const { data: files } = await supabase.storage
      .from(bucketName)
      .list(folderName);
    const feedImageFiles = files.filter((file) => {
      const fileName = file.name;
      const fileParts = fileName.split("_");
      return fileParts[1] === "feed-image.png";
    });
    const feedImageUrls = feedImageFiles.map((file) => {
      return `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucketName}/${folderName}/${file.name}`;
    });
    const feedsWithImages = data.map((feed, index) => {
      return {
        ...feed,
        imageUrl: feedImageUrls[index] || "default-image.png", // 이미지가 없으면 기본 이미지 사용
      };
    });
    if (error) throw error;
    res
      .status(200)
      .json({ message: "모든 피드 정보 조회 성공", data: feedsWithImages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

exports.getFeed = async (req, res) => {
  // const uId = req.user.userId;
  const fId = req.params.id;
  try {
    const { data, error } = await supabase
      .from("FEED")
      .select("*")
      .eq("fId", fId);
    if (error) throw error;
    res.status(200).json({ message: "피드 정보 조회 성공", data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
