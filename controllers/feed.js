const supabase = require("../config/supabase");

const folderName = "uploads";
const bucketName = "my-bucket";

exports.createFeed = async (req, res) => {
    const uId = req.user.userId;
    try{
        if (!req.file) {
            return res.status(400).json({ error: "파일이 제공되지 않았습니다." });
          }
          const { originalname, buffer, mimetype } = req.file;
          const filePath = `${folderName}/${Date.now()}_${originalname}`;
          const path = `${Date.now()}_${originalname}`;
      
          const { data, error } = await supabase.storage.from(bucketName).upload(filePath, buffer, { contentType: mimetype });
  
          const { feed_text, sId } = req.body;
          await supabase.from('FEED').insert({feed_text, sId, feed_image:path });
      
          if (error) throw error;
      
          const { publicURL } = supabase.storage.from(bucketName).getPublicUrl(filePath);
      
          return res.status(201).json({ message: "피드 정보 등록, 파일 업로드 성공", url: publicURL });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

exports.getFeeds = async (req, res) => {
    try {
        const { data, error } = await supabase.from('FEED').select('*');
        if (error) throw error;
        res.status(200).json({ message: "모든 피드 정보 조회 성공", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

exports.getFeed = async (req, res) => {
    // const uId = req.user.userId;
    const sId = req.params.id;
    try {
        const { data, error } = await supabase.from('FEED').select('*').eq('sId', sId);
        if (error) throw error;
        res.status(200).json({ message: "피드 정보 조회 성공", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};