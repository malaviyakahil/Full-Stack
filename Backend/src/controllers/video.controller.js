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
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// const uploadVideo = asyncHandler(async (req, res) => {
//   const owner = req.user?._id;
//   let { title, description } = req.body;

//   title = title?.trim();
//   description = description?.trim();

//   if (!title || !description) {
//     throw new error(400, "Title and description are required.");
//   }

//   const videoPath = req.files?.video?.[0]?.path;
//   const thumbnailPath = req.files?.thumbnail?.[0]?.path;

//   if (!videoPath) throw new error(400, "Invalid video file.");
//   if (!thumbnailPath) throw new error(400, "Invalid thumbnail file.");

//   let videoRes = null;
//   let thumbnailRes = null;

//   try {
//     // Upload video
//     videoRes = await uploadOnCloudinary(videoPath, "video", "video/video");
//     if (!videoRes) throw new error(500, "Video upload to Cloudinary failed");

//     // Upload thumbnail
//     thumbnailRes = await uploadOnCloudinary(thumbnailPath, "image", "video/thumbnail");
//     if (!thumbnailRes) throw new error(500, "Thumbnail upload to Cloudinary failed");

//     const videoHeight = videoRes?.height;
//     const qualityOptions = [
//       { label: "144p", height: 144 },
//       { label: "240p", height: 240 },
//       { label: "360p", height: 360 },
//       { label: "480p", height: 480 },
//       { label: "720p", height: 720 },
//       { label: "1080p", height: 1080 },
//     ];

//     const availableQualities = qualityOptions
//       .filter(q => videoHeight >= q.height)
//       .map(q => q.label);

//     const originalQuality = availableQualities.at(-1);

//     const videoUploaded = await Video.create({
//       video: videoRes.secure_url,
//       videoPublicId: videoRes.public_id,
//       thumbnail: thumbnailRes.secure_url,
//       thumbnailPublicId: thumbnailRes.public_id,
//       title,
//       description,
//       owner,
//       duration: videoRes?.duration,
//       width: videoRes?.width,
//       height: videoRes?.height,
//       availableQualities,
//       originalQuality,
//     });

//     if (!videoUploaded) {
//       throw new error(500, "Failed to save video to database.");
//     }

//     res
//       .status(201)
//       .json(new response(201, videoUploaded, "Video uploaded successfully."));
//   } catch (err) {
//     // Cleanup Cloudinary if either upload fails after one succeeds
//     if (videoRes?.public_id) {
//       await cloudinary.uploader.destroy(videoRes.public_id, { resource_type: "video" });
//     }
//     if (thumbnailRes?.public_id) {
//       await cloudinary.uploader.destroy(thumbnailRes.public_id, { resource_type: "image" });
//     }
//     throw err;
//   } finally {
//     // Always delete local files
//     if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
//     if (fs.existsSync(thumbnailPath)) fs.unlinkSync(thumbnailPath);
//   }
// });

const uploadVideo = asyncHandler(async (req, res) => {
  const owner = req.user?._id;
  let { title, description, videoRes, thumbnailRes } = req.body;

  title = title?.trim();
  description = description?.trim();
  videoRes = JSON.parse(videoRes)
  thumbnailRes = JSON.parse(thumbnailRes)

  if (!title || !description || !videoRes || !thumbnailRes) {
    throw new error(
      400,
      "All fields including Cloudinary upload data are required.",
    );
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

  const videoUploaded = await Video.create({
    video: videoRes.secure_url,
    videoPublicId: videoRes.public_id,
    thumbnail: thumbnailRes.secure_url,
    thumbnailPublicId: thumbnailRes.public_id,
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
    throw new error(500, "Failed to save video to database.");
  }

  res
    .status(201)
    .json(
      new response(201, videoUploaded, "Video metadata stored successfully."),
    );
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

const changeVideoTitle = asyncHandler(async (req, res) => {
  const videoId = req.params?.id;
  const { title } = req.body;

  if (!title || title.trim() === "") {
    throw new error(400, "Title is required.");
  }

  const trimmedTitle = title.trim();

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { title: trimmedTitle } },
    { new: true }, // return the updated document
  );

  if (!updatedVideo) {
    throw new error(404, "Video not found or title update failed.");
  }

  return res
    .status(200)
    .json(new response(200, updatedVideo, "Title updated successfully."));
});

const changeVideoDescription = asyncHandler(async (req, res) => {
  const videoId = req.params?.id;
  const { description } = req.body;

  if (!description || description.trim() === "") {
    throw new error(400, "Description is required.");
  }

  const trimmedDescription = description.trim();

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: { description: trimmedDescription } },
    { new: true },
  );

  if (!updatedVideo) {
    throw new error(404, "Video not found or update failed.");
  }

  return res
    .status(200)
    .json(new response(200, updatedVideo, "Description updated successfully."));
});

const changeVideoThumbnail = asyncHandler(async (req, res) => {
  const videoId = req.params?.id;
  const thumbnailLocalPath = req.file?.path;

  if (!thumbnailLocalPath) {
    throw new error(400, "Invalid thumbnail image.");
  }

  // Upload new thumbnail
  const uploadResult = await uploadOnCloudinary(
    thumbnailLocalPath,
    "image",
    "video/thumbnail",
  );

  if (!uploadResult) {
    throw new error(500, "Thumbnail upload to Cloudinary failed.");
  }

  // Find the existing video
  const existingVideo = await Video.findById(videoId);
  if (!existingVideo) {
    // Clean up new Cloudinary upload if video not found
    await cloudinary.uploader.destroy(uploadResult.public_id, {
      resource_type: "image",
    });
    throw new error(404, "Video not found.");
  }

  // Delete previous thumbnail from Cloudinary if it exists
  if (existingVideo.thumbnailPublicId) {
    await cloudinary.uploader.destroy(existingVideo.thumbnailPublicId, {
      resource_type: "image",
    });
  }

  // Update video document
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        thumbnail: uploadResult.secure_url,
        thumbnailPublicId: uploadResult.public_id,
      },
    },
    { new: true },
  );

  // Clean up local file
  if (fs.existsSync(thumbnailLocalPath)) {
    fs.unlinkSync(thumbnailLocalPath);
  }

  if (!updatedVideo) {
    throw new error(500, "Failed to update video with new thumbnail.");
  }

  return res
    .status(200)
    .json(new response(200, updatedVideo, "Thumbnail changed successfully."));
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

  // ✅ Remove from Cloudinary (outside of DB transaction)
  try {
    if (video.videoPublicId) {
      await cloudinary.uploader.destroy(video.videoPublicId, {
        resource_type: "video",
      });
    }
    if (video.thumbnailPublicId) {
      await cloudinary.uploader.destroy(video.thumbnailPublicId, {
        resource_type: "image",
      });
    }
  } catch (cloudErr) {
    // Log but don't block video deletion
    console.error("Cloudinary cleanup failed:", cloudErr.message);
  }

  // ✅ Transactional DB cleanup
  const session = await Video.startSession();

  try {
    await session.withTransaction(async () => {
      const comments = await Comment.find({ video: video._id }).session(
        session,
      );
      const commentIds = comments.map((comment) => comment._id);

      await CommentReview.deleteMany({ comment: { $in: commentIds } }).session(
        session,
      );
      await Comment.deleteMany({ video: video._id }).session(session);
      await Review.deleteMany({ video: video._id }).session(session);
      await History.deleteMany({ video: video._id }).session(session);
      await LikedVideos.deleteMany({ video: video._id }).session(session);
      await Video.findByIdAndDelete(video._id).session(session);
    });

    res
      .status(200)
      .json(
        new response(200, [], "Video and related data deleted successfully"),
      );
  } catch (err) {
    throw new error(500, "Error while deleting video and associated data");
  } finally {
    session.endSession();
  }
});

let getVideo = asyncHandler(async (req, res) => {
  let videoId = req.params?.id;
  let userId = req.user?._id;

  let video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true },
  );

  if (!video) {
    throw new error(400, "Video does not exists");
  }

  let review = await Review.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(video._id),
      },
    },
    {
      $group: {
        _id: "$review",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        review: "$_id",
        count: 1,
        createdAt: 1,
      },
    },
    {
      $group: {
        _id: null,
        data: {
          $push: {
            k: "$review",
            v: "$count",
          },
        },
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: [{ Like: 0, Dislike: 0 }, { $arrayToObject: "$data" }],
        },
      },
    },
  ]);

  video._doc.reviews = review[0] || { Like: 0, Dislike: 0 };

  let prevVideo = await History.findOne({ user: userId }).sort({
    createdAt: -1,
  });

  let history;
  if (!prevVideo?.video?.equals(videoId)) {
    history = await History.create({
      user: userId,
      video: video?._id,
    });
    if (!history) {
      throw new error(500, "Something went wrong while managing history");
    }
  }

  const count = await History.countDocuments({ user: userId });

  if (count > 10) {
    const oldest = await History.findOne({ user: userId })
      .sort({ createdAt: 1 })
      .limit(1);

    if (oldest) {
      await History.findByIdAndDelete(oldest._id);
    }
  }
  res
    .status(200)
    .json(
      new response(
        200,
        { ...video._doc, history: history || {} },
        "Video fetched successfully",
      ),
    );
});

let getVideoQuality = asyncHandler(async (req, res) => {
  const qualityOptions = [
    { label: "144p", height: 144 },
    { label: "240p", height: 240 },
    { label: "360p", height: 360 },
    { label: "480p", height: 480 },
    { label: "720p", height: 720 },
    { label: "1080p", height: 1080 },
  ];

  const extractPublicIdFromUrl = (videoUrl) => {
    const pattern = /\/upload\/(?:v\d+\/)?([^\.]+)\.(mp4|webm|mov|avi|mkv)/;
    const match = videoUrl.match(pattern);
    return match?.[1] || null;
  };

  let { url } = req.body;

  if (!url) {
    throw new error(401, "Missing Cloudinary video URL.");
  }

  const publicId = extractPublicIdFromUrl(url);

  if (!publicId) {
    throw new error(401, "Invalid Cloudinary video URL.");
  }
  const result = await cloudinary.api.resource(publicId, {
    resource_type: "video",
  });

  const originalHeight = result.height;

  const availableQualities = qualityOptions
    .filter((q) => q.height <= originalHeight)
    .map((q) => q.label);

  res
    .status(200)
    .json(
      new response(200, { availableQualities }, "Quality fetched successfully"),
    );
});

const getAllVideo = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit);
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

  res.status(200).json(new response(200, [], "Disliked video successfully"));
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

export {
  uploadVideo,
  editVideo,
  changeVideoTitle,
  changeVideoDescription,
  changeVideoThumbnail,
  deleteVideo,
  getAllVideo,
  likeVideo,
  disLikeVideo,
  getVideo,
  getVideoQuality,
  deleteReview,
};
