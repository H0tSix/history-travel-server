const supabase = require("../config/supabase");

exports.createFeed = async (req, res) => {
    const uId = req.user.userId;
    try{
        const { feed_text, feed_image, sId } = req.body;
        const { data: starData, error: starError } = await supabase.from('STAR').select('sId').eq('sId', sId).single();

        if (starError || !starData) {
            return res.status(400).json({ error: "해당 sId가 STAR 테이블에 존재하지 않습니다." });
        }
        const { data, error } = await supabase.from('FEED').insert({ feed_text, feed_image, sId });
        if (error) throw error;
        res.status(201).json({ message: "피드 정보 등록 성공" });
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