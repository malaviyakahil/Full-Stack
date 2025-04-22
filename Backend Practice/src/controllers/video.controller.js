import { Review } from "../models/review.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { CommentReview } from "../models/commentReview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import error from "../utils/error.js";
import response from "../utils/response.js";
import mongoose from "mongoose";

let uploadVideo = asyncHandler(async (req, res) => {
  let owner = req.user?._id;

  let { title, description } = req.body;

  if ([title, description].some((e) => e.trim() == "")) {
    throw new error(400, "title and description must required");
  }

  let videoLocalPath = req.files.video ? req.files.video[0]?.path : null;

  if (!videoLocalPath) {
    throw new error(401, "Invalid video path");
  }

  let thumbnailLocalPath = req.files.thumbnail
    ? req.files.thumbnail[0]?.path
    : null;

  if (!thumbnailLocalPath) {
    throw new error(401, "Invalid thumbnail path");
  }

  let videoRes = await uploadOnCloudinary(videoLocalPath);

  if (!videoRes) {
    throw new error(
      401,
      "Something went wrong while uploading video on cloudinary",
    );
  }

  let thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);

  if (!thumbnailRes) {
    throw new error(
      401,
      "Something went wrong while uploading thumbnail on cloudinary",
    );
  }

  let videoUploaded = await Video.create({
    video: videoRes?.url,
    thumbnail: thumbnailRes?.url,
    title,
    description,
    owner,
    duration: videoRes?.duration,
  });

  if (!videoUploaded) {
    throw new error(500, "Video uploading failed");
  }

  res
    .status(200)
    .json(new response(200, videoUploaded, "Video uploaded successfully"));
});

let editVideo = asyncHandler(async (req, res) => {
  let videoId = req.params?.id;

  let { title, description } = req.body;

  if ([title, description].some((e) => e.trim() == "")) {
    throw new error(400, "title and description must required");
  }

  let thumbnailRes;
  if (!req.body.thumbnail) {
    let thumbnailLocalPath = req.file?.path;

    if (!thumbnailLocalPath) {
      throw new error(401, "Invalid thumbnail path");
    }

    thumbnailRes = await uploadOnCloudinary(thumbnailLocalPath);

    if (!thumbnailRes) {
      throw new error(
        401,
        "Something went wrong while uploading thumbnail on cloudinary",
      );
    }
  }

  let editVideoSuccess = await Video.findByIdAndUpdate(videoId, {
    $set: {
      title,
      description,
      thumbnail: thumbnailRes?.url || req.body.thumbnail,
    },
  });

  if (!editVideoSuccess) {
    throw new error(500, "Error while editing video");
  }

  res.status(200).json(new response(200, [], "Video edited successfully"));
});

let deleteVideo = asyncHandler(async (req, res) => {
  let owner = req.user?._id;
  let videoId = req.params?.id;

  let video = await Video.findById(videoId);

  if (!video) {
    throw new error(400, "Video does not exists");
  }

  if (!owner.equals(video?.owner)) {
    throw new error(400, "These video does not belong to you");
  }

  let deleteVideoSuccess = await Video.findByIdAndDelete(video?._id);
  let deleteReviewsSuccess = await Review.deleteMany({ video: video?._id });

  if (!deleteVideoSuccess && !deleteReviewsSuccess) {
    throw new error(500, "Error while deleting video");
  }
  console.log("deleted");

  res.status(200).json(new response(200, [], "Video deleted successfully"));
});

let getAllVideo = asyncHandler(async (req, res) => {
  let id = req.user._id;
  let video = await Video.aggregate([
    {
      $match: {
        owner: {
          $ne: new mongoose.Types.ObjectId(id),
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "result",
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$result",
        },
      },
    },
    {
      $project: {
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        "owner._id": 1,
        "owner.name": 1,
        "owner.email": 1,
        "owner.avatar": 1,
        createdAt: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (!video) {
    throw new error(500, "Something went wrong while getting videos");
  }

  res.status(200).json(new response(200, video, "Fetched videos successfully"));
});

let likeVideo = asyncHandler(async (req, res) => {
  let id = req.user?.id;
  let videoId = req.params?.id;

  let video = await Video.findById(videoId);

  if (!video) {
    throw new error(400, "Video does not exists");
  }

  await Review.findOneAndDelete({
    video: new mongoose.Types.ObjectId(video?._id),
    user: new mongoose.Types.ObjectId(id),
  });

  let review = await Review.create({
    video: video?._id,
    user: id,
    review: "Like",
  });

  if (!review) {
    throw new error(500, "Something went wrong while liking video");
  }

  res.status(200).json(new response(200, [], "Liked video successfully"));
});

let disLikeVideo = asyncHandler(async (req, res) => {
  let id = req.user?.id;
  let videoId = req.params?.id;

  let video = await Video.findById(videoId);

  if (!video) {
    throw new error(400, "Video does not exists");
  }

  await Review.findOneAndDelete({
    video: new mongoose.Types.ObjectId(video?._id),
    user: new mongoose.Types.ObjectId(id),
  });

  let review = await Review.create({
    video: video?._id,
    user: id,
    review: "Dislike",
  });

  if (!review) {
    throw new error(500, "Something went wrong while disliking video");
  }

  res.status(200).json(new response(200, [], "Disiked video successfully"));
});

let likeComment = asyncHandler(async (req, res) => {
  let id = req.user?.id;
  let commentId = req.params?.id;

  let comment = await Comment.findById(commentId);

  if (!comment) {
    throw new error(400, "Comment does not exists");
  }

  await CommentReview.findOneAndDelete({
    comment: new mongoose.Types.ObjectId(comment?._id),
    user: new mongoose.Types.ObjectId(id),
  });

  let review = await CommentReview.create({
    comment: comment?._id,
    user: id,
    review: "Like",
  });

  if (!review) {
    throw new error(500, "Something went wrong while liking comment");
  }

  res.status(200).json(new response(200, [], "Liked comment successfully"));
});

let disLikeComment = asyncHandler(async (req, res) => {
  let id = req.user?.id;
  let commentId = req.params?.id;

  let comment = await Comment.findById(commentId);

  if (!comment) {
    throw new error(400, "Comment does not exists");
  }

  await CommentReview.findOneAndDelete({
    comment: new mongoose.Types.ObjectId(comment?._id),
    user: new mongoose.Types.ObjectId(id),
  });

  let review = await CommentReview.create({
    comment: comment?._id,
    user: id,
    review: "Dislike",
  });

  if (!review) {
    throw new error(500, "Something went wrong while disliking comment");
  }

  res.status(200).json(new response(200, [], "Disliked comment successfully"));
});

let deleteReview = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let video = req.params?.id;

  let deleteSuccess = await Review.findOneAndDelete({
    $and: [{ video }, { user }],
  });

  if (!deleteSuccess) {
    throw new error(500, "Error while deleting review");
  }

  res.status(200).json(new response(200, [], "Review deleted successfully"));
});

let deleteCommentReview = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let comment = req.params?.id;

  let deleteSuccess = await CommentReview.findOneAndDelete({
    $and: [{ comment }, { user }],
  });

  if (!deleteSuccess) {
    throw new error(500, "Error while deleting review");
  }

  res.status(200).json(new response(200, [], "Review deleted successfully"));
});

let addComment = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let video = req.params?.id;

  let { comment } = req.body;

  if ([comment].some((e) => e.trim() == "")) {
    throw new error(400, "Comment cannot be empty");
  }

  let commentAdded = await Comment.create({
    comment,
    video,
    user,
  });

  res.status(200).json(new response(200, commentAdded , "Comment added successfully"));
});

export {
  uploadVideo,
  editVideo,
  deleteVideo,
  getAllVideo,
  likeVideo,
  disLikeVideo,
  likeComment,
  disLikeComment,
  deleteReview,
  deleteCommentReview,
  addComment
};
