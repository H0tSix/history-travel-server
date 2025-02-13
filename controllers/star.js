const supabase = require("../config/supabase");

exports.createStar = async (req, res) => {
    const uId = req.user.userId;
    try{
        const {star_name, profile_image, country, year} = req.body;
        const { data, error } = await supabase.from('STAR').insert({ star_name, profile_image, country, year, uId });
        if (error) throw error;
        res.status(201).json({ message: "위인 정보 등록 성공" });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

exports.getStars = async (req, res) => {
    try {
        const { data, error } = await supabase.from('STAR').select('*');
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
        const { data, error } = await supabase.from('STAR').select('*').eq("uId", uId);
        if (error) throw error;
        res.status(200).json({ message: "사용자의 위인 정보 조회 성공", data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};