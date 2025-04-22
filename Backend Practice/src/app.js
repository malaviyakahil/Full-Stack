import express, { urlencoded } from "express";
import mongoose from "mongoose";
import { dbName } from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import userRouter  from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";

dotenv.config();

let app = express();

app.use(cors({ origin: process.env.CROSS_ORIGIN ,credentials:true}));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODBL_URL}/${dbName}`);
    app.listen(process.env.PORT, () => {
      console.log("====================================");
      console.log(`http://localhost:${process.env.PORT}`);
      console.log("====================================");
    });
  } catch (error) {
    console.log("Cannot connect to mongoDB atlas");
  }
})();

app.get("/", (req, res) => {
  res.send("hello");
});

app.use('/user',userRouter)
app.use('/video',videoRouter)

app.use((err, req, res, next) => {  
  res.status(500).json({
    success: false,
    message: err.message || "Internal kahil Error",
  });
});