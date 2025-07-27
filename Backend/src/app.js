import express, { urlencoded } from "express";
import mongoose from "mongoose";
import { dbName } from "./constants.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import commentRouter from "./routes/comment.route.js";
import channelRouter from "./routes/channel.route.js";
import searchRouter from "./routes/search.route.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Strict CORS (only allow your frontend origin)

app.use(
  cors({
    origin: [process.env.CROSS_ORIGIN], // ✅ your actual frontend domain
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true, // ✅ important if you're using cookies too
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ ensure Authorization is allowed
  })
);

// Middleware
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB connection and server startup
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODBL_URL}/${dbName}`);
    console.log("✅ Connected to MongoDB");

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
})();

// API routes
app.use("/user", userRouter);
app.use("/video", videoRouter);
app.use("/comment", commentRouter);
app.use("/channel", channelRouter);
app.use("/search", searchRouter);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Internal Error:", err);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});
