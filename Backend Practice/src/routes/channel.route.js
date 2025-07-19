import express from "express";
import {
  getSubStatus,
  getChannelDetails,
  getChannel,
  getChannelVideos,
  subscribeTo,
  unsubscribeTo,
} from "../controllers/channel.controller.js";
import upload from "../middlewares/multer.middleware.js";
import auth from "../middlewares/auth.middleware.js";

let channelRouter = express.Router();

channelRouter.post("/get-sub-status/:id", upload.none(), auth, getSubStatus);
channelRouter.post("/subscribe-to/:id", upload.none(), auth, subscribeTo);
channelRouter.post("/unsubscribe-to/:id", upload.none(), auth, unsubscribeTo);

channelRouter.get("/get-channel-details/:id", upload.none(), getChannelDetails);
channelRouter.get("/get-channel/:id", upload.none(), auth, getChannel);
channelRouter.get("/get-channel-videos/:id", upload.none(), auth, getChannelVideos);

export default channelRouter;
