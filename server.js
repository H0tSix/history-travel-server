const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRouter = require("./routers/auth");  
const kakaoAuthRouter = require("./routers/auth_kakao");  

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use("/auth", authRouter); 
app.use("/auth/kakao", kakaoAuthRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
