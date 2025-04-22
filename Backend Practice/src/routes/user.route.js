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
  getChannel,
  getVideo,
  getHistory,
  getSubStatus,
  getReviewStatus,
  getChannelDetails,
  editProfile,
  getComments
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
userRouter.post("/logout", upload.none(),auth, logoutUser);
userRouter.get("/get-current-user", upload.none(), auth, getCurrentUser);
userRouter.get("/get-current-user-videos", upload.none(), auth, getCurrentUserVideos);
userRouter.post("/renew-access-token", upload.none(), renewAccessToken);
userRouter.post("/change-password", upload.none(), auth, changePassword);
userRouter.post("/change-full-name", upload.none(), auth, changeFullName);
userRouter.post("/change-avatar", upload.single("avatar"), auth, changeAvatar);
userRouter.post("/change-cover-image", upload.single("coverImage"), auth, changeCoverImage);
userRouter.post("/get-history", upload.none(), auth, getHistory);
userRouter.post("/get-sub-status/:id", upload.none(), auth,getSubStatus);
userRouter.post("/get-review-status/:id", upload.none(), auth,getReviewStatus);
userRouter.post("/edit-profile", upload.fields([
  {
    name: "avatar",
    maxCount: 1,
  },
  {
    name: "coverImage",
    maxCount: 1,
  },
]), auth,editProfile);
userRouter.post('/subscribe-to/:id',upload.none(),auth,subscribeTo)
userRouter.post('/unsubscribe-to/:id',upload.none(),auth,unsubscribeTo)
userRouter.get('/get-channel/:name',upload.none(),getChannel)
userRouter.get('/get-channel-details/:id',upload.none(),getChannelDetails)
userRouter.post('/get-video/:id',upload.none(),auth,getVideo)
userRouter.get('/get-comments/:id',upload.none(),auth,getComments)


export default userRouter;
