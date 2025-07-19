import express from "express";
import {
  getChannelAndVideo,
  searchAll,
} from "../controllers/search.controller.js";
import upload from "../middlewares/multer.middleware.js";
import auth from "../middlewares/auth.middleware.js";

let searchRouter = express.Router();

searchRouter.get("/search-all", upload.none(), auth, searchAll);
searchRouter.get(
  "/search-channel-and-video/:name",
  upload.none(),
  auth,
  getChannelAndVideo,
);

export default searchRouter;
