import { Review } from "../models/review.model.js";
import { Video } from "../models/video.model.js";
import { Comment } from "../models/comment.model.js";
import { CommentReview } from "../models/commentReview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import error from "../utils/error.js";
import response from "../utils/response.js";
import mongoose from "mongoose";
import { LikedVideos } from "../models/likedVideos.model.js";
import { History } from "../models/history.model.js";

let uploadVideo = asyncHandler(async (req, res) => {
  let owner = req.user?._id;
  let { title, description } = req.body;

  if ([title, description].some((e) => e.trim() == "")) {
    throw new error(400, "Title and description are required.");
  }

  let videoLocalPath = req.files.video ? req.files.video[0]?.path : null;
  if (!videoLocalPath) throw new error(401, "Invalid video path");

  let thumbnailLocalPath = req.files.thumbnail
    ? req.files.thumbnail[0]?.path
    : null;
  if (!thumbnailLocalPath) throw new error(401, "Invalid thumbnail path");

  let videoRes = await uploadOnCloudinary(videoLocalPath, "video", "videos");
  if (!videoRes) {
    throw new error(401, "Video upload to Cloudinary failed");
  }

  let thumbnailRes = await uploadOnCloudinary(
    thumbnailLocalPath,
    "image",
    "thumbnails",
  );
  if (!thumbnailRes) {
    throw new error(401, "Thumbnail upload to Cloudinary failed");
  }

  const videoHeight = videoRes?.height;

  const qualityOptions = [
    { label: "144p", height: 144 },
    { label: "240p", height: 240 },
    { label: "360p", height: 360 },
    { label: "480p", height: 480 },
    { label: "720p", height: 720 },
    { label: "1080p", height: 1080 },
  ];

  const availableQualities = qualityOptions
    .filter((q) => videoHeight >= q.height)
    .map((q) => q.label);

  const originalQuality = availableQualities.at(-1);

  let videoUploaded = await Video.create({
    video: videoRes?.secure_url,
    videoPublicId: videoRes?.public_id,
    thumbnail: thumbnailRes?.secure_url,
    thumbnailPublicId: thumbnailRes?.public_id,
    title,
    description,
    owner,
    duration: videoRes?.duration,
    width: videoRes?.width,
    height: videoRes?.height,
    availableQualities,
    originalQuality,
  });

  if (!videoUploaded) {
    throw new error(500, "Video upload failed");
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
  const owner = req.user?._id;
  const videoId = req.params?.id;

  const video = await Video.findById(videoId);
  if (!video) {
    throw new error(404, "Video not found");
  }

  if (!owner.equals(video.owner)) {
    throw new error(403, "You are not authorized to delete this video");
  }

  const session = await Video.startSession();

  try {
    await session.withTransaction(async () => {
      const comments = await Comment.find({ video: video._id }).session(session);
      const commentIds = comments.map((comment) => comment._id);

      await CommentReview.deleteMany({ comment: { $in: commentIds } }).session(session);
      await Comment.deleteMany({ video: video._id }).session(session);
      await Review.deleteMany({ video: video._id }).session(session);
      await History.deleteMany({ video: video._id }).session(session);
      await LikedVideos.deleteMany({ video: video._id }).session(session);
      await Video.findByIdAndDelete(video._id).session(session);
    });

    res.status(200).json(new response(200, [], "Video and related data deleted successfully"));
  } catch (err) {
    throw new error(500, "Error while deleting video and associated data");
  } finally {
    session.endSession();
  }
});

const getAllVideo = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  const userId = new mongoose.Types.ObjectId(req.user._id);

  const pipeline = [
    {
      $match: {
        owner: { $ne: userId },
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
        owner: { $first: "$result" },
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
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const video = await Video.aggregate(pipeline);

  const total = await Video.countDocuments({ owner: { $ne: userId } });

  res.status(200).json(
    new response(
      200,
      {
        videos: video,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
      "Fetched videos successfully",
    ),
  );
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

  let likedVideo = LikedVideos.create({
    video: video?._id,
    user: id,
  });

  if (!likedVideo) {
    throw new error(
      500,
      "Something went wrong while making history of liked video",
    );
  }

  res.status(200).json(new response(200, [], "Liked video successfully"));
});

let disLikeVideo = asyncHandler(async (req, res) => {
  let id = req.user?.id;
  let videoId = req.params?.id;
  let user = req.user?.id;

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

  let likedDeleteSuccess = await LikedVideos.findOneAndDelete({
    $and: [{ video }, { user }],
  });

  if (!likedDeleteSuccess) {
    throw new error(500, "Error while deleting liked video from liked videos");
  }

  res.status(200).json(new response(200, [], "Disliked video successfully"));
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

  if (deleteSuccess.review == "Like") {
    let likedDeleteSuccess = await LikedVideos.findOneAndDelete({
      $and: [{ video }, { user }],
    });
    if (!likedDeleteSuccess) {
      throw new error(
        500,
        "Error while deleting liked video from liked videos",
      );
    }
  }

  res.status(200).json(new response(200, [], "Review deleted successfully"));
});

let giveHeart = asyncHandler(async (req, res) => {
  let commentId = req.params?.id;

  let hearted = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      heartByChannel: true,
    },
  });

  if (!hearted) {
    throw new error(500, "Something went wrong while hearting comment");
  }

  res.status(200).json(new response(200, [], "Hearted comment successfully"));
});

let takeHeart = asyncHandler(async (req, res) => {
  let commentId = req.params?.id;

  let unhearted = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      heartByChannel: false,
    },
  });

  if (!unhearted) {
    throw new error(500, "Something went wrong while unhearting comment");
  }

  res.status(200).json(new response(200, [], "Unhearted comment successfully"));
});

let pin = asyncHandler(async (req, res) => {
  let commentId = req.params?.id;

  let pinned = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      pinByChannel: true,
    },
  });

  if (!pinned) {
    throw new error(500, "Something went wrong while pinning comment");
  }

  res.status(200).json(new response(200, [], "Pinned comment successfully"));
});

let unPin = asyncHandler(async (req, res) => {
  let commentId = req.params?.id;

  let unPinned = await Comment.findByIdAndUpdate(commentId, {
    $set: {
      pinByChannel: false,
    },
  });

  if (!unPinned) {
    throw new error(500, "Something went wrong while un-pinning comment");
  }

  res.status(200).json(new response(200, [], "Un-pinned comment successfully"));
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


  res
    .status(200)
    .json(new response(200, commentAdded, "Comment added successfully"));
});

let deleteComment = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let comment = req.params?.id;

  let deleteSuccess = await Comment.findByIdAndDelete(comment);
  let deleteReviewSuccess = await CommentReview.deleteMany({
    comment: new mongoose.Types.ObjectId(comment),
  });

  if (!(deleteSuccess && deleteReviewSuccess)) {
    throw new error(500, "Error while deleting comment");
  }

  res.status(200).json(new response(200, [], "Comment deleted successfully"));
});

let editComment = asyncHandler(async (req, res) => {
  let commentId = req.params?.id;

  let { comment } = req.body;

  if (comment.trim() == "") {
    throw new error(500, "Comment can not be empty");
  }

  let editSuccess = await Comment.findByIdAndUpdate(commentId, {
    $set: { comment: comment, edited: true },
  });

  if (!editSuccess) {
    throw new error(500, "Error while editing comment");
  }

  res.status(200).json(new response(200, [], "Comment edited successfully"));
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
  giveHeart,
  takeHeart,
  deleteReview,
  deleteCommentReview,
  addComment,
  deleteComment,
  editComment,
  pin,
  unPin,
};
