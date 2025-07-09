import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  getCurrentUserVideos,
  logoutUser,
  renewAccessToken,
  changePassword,
  changeAvatar,
  changeCoverImage,
  changeFullName,
  subscribeTo,
  unsubscribeTo,
  getChannelAndVideo,
  getVideo,
  getHistory,
  deleteHistory,
  getSubStatus,
  getReviewStatus,
  getChannelDetails,
  editProfile,
  getComments,
  searchAll,
  getChannel,
  getLikedVideos,
  deleteLikedVideos,
  getVideoQuality,
  authMe,
  deleteUser
} from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import auth from "../middlewares/auth.middleware.js";

let userRouter = express.Router();

userRouter.post(
  "/register",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser,
);
userRouter.post("/login", upload.none(), loginUser);
userRouter.post("/logout", upload.none(), auth, logoutUser);
userRouter.post("/delete-user", upload.none(), auth, deleteUser);
userRouter.get("/get-current-user", upload.none(), auth, getCurrentUser);
userRouter.get(
  "/get-current-user-videos",
  upload.none(),
  auth,
  getCurrentUserVideos,
);
userRouter.post("/renew-access-token", upload.none(), renewAccessToken);
userRouter.get("/auth-me", upload.none(), authMe);

userRouter.post("/change-password", upload.none(), auth, changePassword);
userRouter.post("/change-full-name", upload.none(), auth, changeFullName);
userRouter.post("/change-avatar", upload.single("avatar"), auth, changeAvatar);
userRouter.post(
  "/change-cover-image",
  upload.single("coverImage"),
  auth,
  changeCoverImage,
);
userRouter.get("/get-history", upload.none(), auth, getHistory);
userRouter.post("/delete-history/:id", upload.none(), auth, deleteHistory);
userRouter.get("/get-liked-videos", upload.none(), auth, getLikedVideos);
userRouter.post("/delete-liked-videos/:id", upload.none(), auth, deleteLikedVideos);
userRouter.post("/get-sub-status/:id", upload.none(), auth, getSubStatus);
userRouter.post("/get-review-status/:id", upload.none(), auth, getReviewStatus);
userRouter.post(
  "/edit-profile",
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  auth,
  editProfile,
);
userRouter.post("/subscribe-to/:id", upload.none(), auth, subscribeTo);
userRouter.post("/unsubscribe-to/:id", upload.none(), auth, unsubscribeTo);
userRouter.get(
  "/search-channel-and-video/:name",
  upload.none(),
  auth,
  getChannelAndVideo,
);
userRouter.get("/get-channel-details/:id", upload.none(), getChannelDetails);
userRouter.post("/get-video/:id", upload.none(), auth, getVideo);
userRouter.post("/get-video-quality", upload.none(), auth, getVideoQuality);
userRouter.get("/get-channel/:id", upload.none(), auth, getChannel);
userRouter.get("/get-comments/:id", upload.none(), auth, getComments);
userRouter.get("/search-all", upload.none(), auth, searchAll);

export default userRouter;
