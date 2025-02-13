const bcrypt = require('bcrypt')
const supabase = require("../config/supabase");

exports.join = async(req, res, next) => {
    const { uId, email, password, provider = "local" } = req.body;

    try{
        const hashPassword = await bcrypt.hash(password, 10);
        const { data, error } = await supabase.from('user').insert({ uId, email, hashPassword, provider });
        if (error) throw error;
        res.status(201).json({ message: "회원가입 성공", data });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

exports.login = async (req, res, next) => {
    const { uId, password } = req.body;
    try {
        const {data:user, error} = await supabase.from('user').select('*').eq("uId", uId).single();
        if (error || !user) {
            return res.status(400).json({ error: "사용자가 존재하지 않습니다." });
        }
        const match = await bcrypt.compare(password, user.password);
        if(!match){
            return res.status(400).json({ error: "비밀번호가 일치하지 않습니다." });
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.status(200).json({ message: "로그인 성공", token });
    }catch(error){
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}

exports.logout = (req, res) => {
    req.logout(() => {
        res.redirect('/')
    })
}