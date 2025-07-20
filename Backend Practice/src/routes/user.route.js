import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  renewAccessToken,
  changePassword,
  changeAvatar,
  changeCoverImage,
  changeFullName,
  getHistory,
  deleteHistory,
  getReviewStatus,
  getLikedVideos,
  deleteLikedVideos,
  authMe,
  deleteUser,
  removeCoverImage,
  getCurrentUserVideos,
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
userRouter.post("/remove-cover-image", upload.none(), auth, removeCoverImage);
userRouter.get("/get-history", upload.none(), auth, getHistory);
userRouter.post("/delete-history/:id", upload.none(), auth, deleteHistory);
userRouter.get("/get-liked-videos", upload.none(), auth, getLikedVideos);
userRouter.post(
  "/delete-liked-videos/:id",
  upload.none(),
  auth,
  deleteLikedVideos,
);
userRouter.post("/get-review-status/:id", upload.none(), auth, getReviewStatus);
userRouter.get(
  "/get-current-user-videos",
  upload.none(),
  auth,
  getCurrentUserVideos,
);

export default userRouter;
