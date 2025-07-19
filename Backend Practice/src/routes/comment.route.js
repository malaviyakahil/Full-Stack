import express from "express";
import {
  deleteCommentReview,
  addComment,
  deleteComment,
  likeComment,
  disLikeComment,
  editComment,
  giveHeart,
  takeHeart,
  pin,
  unPin,
  getComments,
} from "../controllers/comment.controller.js";
import upload from "../middlewares/multer.middleware.js";
import auth from "../middlewares/auth.middleware.js";

let commentRouter = express.Router();

commentRouter.get("/get-comments/:id", upload.none(), auth, getComments);
commentRouter.post("/add-comment/:id", upload.none(), auth, addComment);
commentRouter.post("/delete-comment/:id", upload.none(), auth, deleteComment);
commentRouter.post("/edit-comment/:id", upload.none(), auth, editComment);
commentRouter.post("/like-comment/:id", upload.none(), auth, likeComment);
commentRouter.post("/dislike-comment/:id", upload.none(), auth, disLikeComment);
commentRouter.post("/delete-comment-review/:id", upload.none(), auth, deleteCommentReview);
commentRouter.post("/give-heart/:id", upload.none(), auth, giveHeart);
commentRouter.post("/take-heart/:id", upload.none(), auth, takeHeart);
commentRouter.post("/pin/:id", upload.none(), auth, pin);
commentRouter.post("/un-pin/:id", upload.none(), auth, unPin);

export default commentRouter;
