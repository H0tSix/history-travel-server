require("dotenv").config();

const express = require("express");
const cors = require("cors");

const authRouter = require("./routers/auth");

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors()); 

app.use('/auth', authRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
