import express from "express";
import {
  uploadVideo,
  deleteVideo,
  likeVideo,
  disLikeVideo,
  getAllVideo,
  deleteReview,
  deleteCommentReview,
  editVideo,
  addComment,
  likeComment,
  disLikeComment
} from "../controllers/video.controller.js";
import upload from "../middlewares/multer.middleware.js";
import auth from "../middlewares/auth.middleware.js";

let videoRouter = express.Router();

videoRouter.post(
  "/upload-video",
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  auth,
  uploadVideo,
);

videoRouter.post("/delete-video/:id", upload.none(), auth, deleteVideo);
videoRouter.post(
  "/edit-video/:id",
  upload.single("thumbnail"),
  auth,
  editVideo,
);
videoRouter.post("/like-video/:id", upload.none(), auth, likeVideo);
videoRouter.post("/dislike-video/:id", upload.none(), auth, disLikeVideo);
videoRouter.post("/like-comment/:id", upload.none(), auth, likeComment);
videoRouter.post("/dislike-comment/:id", upload.none(), auth, disLikeComment);
videoRouter.get("/get-all-videos", upload.none(), auth, getAllVideo);
videoRouter.post("/delete-review/:id", upload.none(), auth, deleteReview);
videoRouter.post("/delete-comment-review/:id", upload.none(), auth, deleteCommentReview);
videoRouter.post("/add-comment/:id", upload.none(), auth, addComment);

export default videoRouter;
