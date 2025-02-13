const jwt = require("jsonwebtoken");

exports.isLoggedIn = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);  // 토큰이 유효한지 확인 후, user정보 반환
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (token) {
        return res.status(400).json({ error: "You are already logged in" });
    }

    next();
};
