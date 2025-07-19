import express from "express";
import {
  uploadVideo,
  deleteVideo,
  likeVideo,
  disLikeVideo,
  getAllVideo,
  deleteReview,
  changeVideoTitle,
  changeVideoDescription,
  changeVideoThumbnail,
  getVideo,
  getVideoQuality
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
videoRouter.post("/get-video/:id", upload.none(), auth, getVideo);
videoRouter.post("/get-video-quality", upload.none(), auth, getVideoQuality);
videoRouter.post("/change-video-title/:id", upload.none(), auth, changeVideoTitle);
videoRouter.post("/change-video-description/:id", upload.none(), auth, changeVideoDescription);
videoRouter.post("/change-video-thumbnail/:id", upload.single("thumbnail"), auth, changeVideoThumbnail);
videoRouter.post("/delete-video/:id", upload.none(), auth, deleteVideo);
videoRouter.post("/like-video/:id", upload.none(), auth, likeVideo);
videoRouter.post("/dislike-video/:id", upload.none(), auth, disLikeVideo);
videoRouter.get("/get-all-videos", upload.none(), auth, getAllVideo);
videoRouter.post("/delete-review/:id", upload.none(), auth, deleteReview);


export default videoRouter;
