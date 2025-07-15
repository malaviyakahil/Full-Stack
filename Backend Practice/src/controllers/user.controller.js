import { User } from "../models/user.model.js";
import { Subscribtion } from "../models/subscribtion.model.js";
import { Video } from "../models/video.model.js";
import { History } from "../models/history.model.js";
import { Review } from "../models/review.model.js";
import { Comment } from "../models/comment.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import response from "../utils/response.js";
import error from "../utils/error.js";
import jsonWebToken from "jsonwebtoken";
import fs from "fs";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";
import { LikedVideos } from "../models/likedVideos.model.js";
import { v2 as cloudinary } from "cloudinary";
import { CommentReview } from "../models/commentReview.model.js";

let generatingAccessAndRefreshToken = async function (id) {
  let user = await User.findById(id);
  let accessToken = await user.generateAccessToken();
  let refreshToken = await user.generateRefreshToken();
  let loginedUser = await User.findByIdAndUpdate(
    id,
    { $set: { refreshToken } },
    { new: true },
  );
  return { accessToken, refreshToken, loginedUser };
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, fullName, password } = req.body;

  // Validate input
  if (
    [name, email, fullName, password].some(
      (field) => !field || field.trim() === "",
    )
  ) {
    throw new error(400, "All fields are required.");
  }

  // File paths
  const avatarPath = req.files?.avatar?.[0]?.path;
  const coverPath = req.files?.coverImage?.[0]?.path;

  if (!avatarPath) {
    throw new error(400, "Avatar image is required.");
  }

  // Check for existing user
  const existingUser = await User.findOne({ $or: [{ name }, { email }] });

  if (existingUser) {
    // Cleanup local files
    if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);

    if (existingUser.name === name && existingUser.email === email) {
      throw new error(
        409,
        "Name and email are already registered. Please login.",
      );
    }
    if (existingUser.name === name) {
      throw new error(409, "Username is already taken.");
    }
    if (existingUser.email === email) {
      throw new error(409, "Email is already registered.");
    }
  }

  const session = await mongoose.startSession();
  let avatarUpload = null;
  let coverUpload = null;

  try {
    session.startTransaction();

    // Upload avatar
    avatarUpload = await uploadOnCloudinary(avatarPath, "image", "user/avatar");
    if (!avatarUpload) throw new error(500, "Failed to upload avatar.");

    // Upload cover image if exists
    if (coverPath) {
      coverUpload = await uploadOnCloudinary(
        coverPath,
        "image",
        "user/coverImage",
      );
      if (!coverUpload) throw new error(500, "Failed to upload cover image.");
    }

    // Create user
    const [newUser] = await User.create(
      [
        {
          name,
          email,
          fullName,
          password,
          avatar: avatarUpload.secure_url,
          avatarPublicId: avatarUpload.public_id,
          coverImage: coverUpload?.secure_url || "",
          coverImagePublicId: coverUpload?.public_id || "",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // Clean up local files
    if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);

    return res
      .status(201)
      .json(new response(201, newUser, "Registered successfully."));
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    // Cloudinary cleanup
    if (avatarUpload?.public_id) {
      await cloudinary.uploader.destroy(avatarUpload.public_id);
    }
    if (coverUpload?.public_id) {
      await cloudinary.uploader.destroy(coverUpload.public_id);
    }

    // Local file cleanup
    if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
    if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);

    throw err;
  }
});

const loginUser = asyncHandler(async (req, res) => {
  let { name = "", email = "", password = "" } = req.body;

  name = name.trim();
  email = email.trim();
  password = password.trim();

  if ([name, email, password].some((field) => field === "")) {
    throw new error(400, "All credentials are required.");
  }

  // Authentication
  const user = await User.findOne({ name, email });
  if (!user) {
    throw new error(401, "Invalid credentials.");
  }

  const passwordValid = await user.comparePassword(password);
  if (!passwordValid) {
    throw new error(401, "Wrong password");
  }

  const { accessToken, refreshToken } = await generatingAccessAndRefreshToken(
    user._id,
  );

  const cookieOptions = {
    httpOnly: true,
    sameSite: "Lax",
    secure: process.env.NODE_ENV === "production",
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new response(200, user, "Logged in successfully"));
});

let getCurrentUser = asyncHandler(async (req, res) => {
  let user = req.user._id;

  let currentUser = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(user),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subarray",
      },
    },
    {
      $addFields: {
        subs: {
          $size: "$subarray",
        },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "userVideos",
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$userVideos.views",
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        avatarPublicId: 1,
        coverImage: 1,
        coverImagePublicId: 1,
        subs: 1,
        totalViews: 1,
      },
    },
  ]);

  if (!currentUser) {
    throw new error(401, "Login required");
  }

  res.status(200).json(new response(200, currentUser[0], "Current user"));
});

const getCurrentUserVideos = asyncHandler(async (req, res) => {
  const id = req.user?._id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 6;
  const skip = (page - 1) * limit;

  const result = await Video.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "reviews",
        localField: "_id",
        foreignField: "video",
        as: "result",
      },
    },
    {
      $addFields: {
        likes: {
          $size: {
            $filter: {
              input: "$result",
              as: "review",
              cond: { $eq: ["$$review.review", "Like"] },
            },
          },
        },
        dislikes: {
          $size: {
            $filter: {
              input: "$result",
              as: "review",
              cond: { $eq: ["$$review.review", "Dislike"] },
            },
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        thumbnailPublicId: 1,
        videoPublicId: 1,
        createdAt: 1,
        duration: 1,
        description: 1,
        likes: 1,
        dislikes: 1,
        views: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $facet: {
        paginatedResults: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const videos = result[0]?.paginatedResults || [];
  const total = result[0]?.totalCount?.[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  res.status(200).json(
    new response(
      200,
      {
        videos,
        total,
        page,
        pages: totalPages,
      },
      "Current user videos fetched",
    ),
  );
});

let logoutUser = asyncHandler(async (req, res, next) => {
  let id = req.user?._id;

  let user = await User.findByIdAndUpdate(
    id,
    { $set: { refreshToken: "" } },
    { new: true },
  );

  if (!user) {
    throw new error(401, "Logout failed");
  }

  let options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new response(200, [], "Logged out successfully"));
});

let renewAccessToken = asyncHandler(async (req, res) => {
  let token =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new error(401, "Login required");
  }

  let decodedToken = jsonWebToken.verify(token, process.env.REFRESH_TOKEN_KEY);

  let { accessToken, refreshToken } = await generatingAccessAndRefreshToken(
    decodedToken._id,
  );

  let options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new response(200, [], "Access token renewed successfully"));
});

let changePassword = asyncHandler(async (req, res) => {
  let id = req.user?._id;
  let { oldPassword, newPassword } = req.body;

  if ([oldPassword, newPassword].some((e) => e?.trim == "")) {
    throw new error(401, "Credentials cannot be empty");
  }

  if (oldPassword === newPassword) {
    throw new error(401, "Old password and new password cannot be same");
  }

  let user = await User.findById(id);

  let decodedPassword = await user.comparePassword(oldPassword);

  if (!decodedPassword) {
    throw new error(401, "Old password is wrong");
  }

  user.password = newPassword;
  user.refreshToken = "";
  let changed = await user.save({ validateBeforeSave: false });

  if (!changed) {
    throw new error(401, "Password change failed");
  }

  let options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new response(200, [], "Password changed successfully"));
});

let changeAvatar = asyncHandler(async (req, res) => {
  let id = req.user?._id;
  let publicId = req.params?.id;
  let avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new error(401, "Invalid avatar image");
  }

  let avatarRes = await uploadOnCloudinary(avatarLocalPath);

  if (!avatarRes) {
    throw new error(
      401,
      "Something went wrong while uploading avatar on cloudinary",
    );
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  let user = await User.findByIdAndUpdate(
    id,
    { $set: { avatar: avatarRes?.url, avatarPublicId: avatarRes?.public_id } },
    { new: true },
  );

  if (!user) {
    throw new error(401, "Avatar change failed");
  }

  res.status(200).json(new response(200, user, "Avatar changed successfully"));
});

let changeCoverImage = asyncHandler(async (req, res) => {
  let id = req.user?._id;
  let coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new error(401, "Invalid cover image");
  }

  let coverImageRes = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImageRes) {
    throw new error(
      401,
      "Something went wrong while uploading cover image on cloudinary",
    );
  }

  let user = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        coverImage: coverImageRes?.secure_url,
        coverImagePublicId: coverImageRes.public_id,
      },
    },
    { new: true },
  );

  if (!user) {
    throw new error(401, "Cover image change failed");
  }

  res
    .status(200)
    .json(new response(200, user, "Cover image changed successfully"));
});

let changeFullName = asyncHandler(async (req, res) => {
  let id = req.user?._id;
  let { fullName } = req.body;

  if (!fullName) {
    throw new error(400, "Full name is required");
  }

  let user = await User.findByIdAndUpdate(
    id,
    { $set: { fullName } },
    { new: true },
  );

  if (!user) {
    throw new error(400, "Full name change failed");
  }

  res
    .status(200)
    .json(new response(200, user, "Full name changed successfully"));
});

let subscribeTo = asyncHandler(async (req, res) => {
  let subscriber = req.user?._id;
  let id = req.params?.id;

  let user = await User.findById(id);

  if (!user) {
    throw new error(400, "Channel does not exists");
  }

  if (user?._id.equals(subscriber)) {
    throw new error(400, "You can not subscribe to your own channel");
  }

  let channel = await Subscribtion.findOne({
    channel: new mongoose.Types.ObjectId(user?._id),
    subscriber: new mongoose.Types.ObjectId(subscriber),
  });

  if (channel) {
    throw new error(400, "You already subscribed");
  }

  let subscribed = await Subscribtion.create({
    channel: user?._id,
    subscriber,
  });

  if (!subscribed) {
    throw new error(500, "something went wrong while subscribing");
  }

  res.status(200).json(new response(200, [], `Subscribed to ${user?.name}`));
});

let unsubscribeTo = asyncHandler(async (req, res) => {
  let unSubscriber = req.user?._id;
  let id = req.params?.id;

  let user = await User.findById(id);

  if (!user) {
    throw new error(400, "Channel does not exists");
  }

  if (user?._id.equals(unSubscriber)) {
    throw new error(400, "You can not unsubscribe to your own channel");
  }

  let subscribtion = await Subscribtion.findOne({
    channel: new mongoose.Types.ObjectId(user?._id),
    subscriber: new mongoose.Types.ObjectId(unSubscriber),
  });

  if (!subscribtion) {
    throw new error(400, "You haven't subscribed");
  }

  let unSubscribed = await Subscribtion.findByIdAndDelete(subscribtion._id);

  if (!unSubscribed) {
    throw new error(500, "something went wrong while unsubscribing");
  }

  res.status(200).json(new response(200, [], `Unsubscribed to ${user?.name}`));
});

let getChannelAndVideo = asyncHandler(async (req, res) => {
  let name = req.params?.name;
  let currentUserId = req.user?._id;

  const [channel, video] = await Promise.all([
    User.aggregate([
      {
        $match: {
          name: { $regex: `^${name}$`, $options: "i" }, // Case-insensitive exact match
        },
      },
      {
        $lookup: {
          from: "videos",
          let: { ownerId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$owner", "$$ownerId"] },
              },
            },
            { $sort: { createdAt: -1 } }, // 🔁 Sort by latest
            { $limit: 3 }, // 🔢 Limit to 3 videos
          ],
          as: "videos",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          let: { channelId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$channel", "$$channelId"] },
              },
            },
          ],
          as: "allSubscriptions",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          let: { channelId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$channel", "$$channelId"] },
                    {
                      $eq: [
                        "$subscriber",
                        new mongoose.Types.ObjectId(currentUserId),
                      ],
                    },
                  ],
                },
              },
            },
          ],
          as: "subscriptionStatus",
        },
      },
      {
        $addFields: {
          subStatus: { $gt: [{ $size: "$subscriptionStatus" }, 0] },
          subscribersCount: { $size: "$allSubscriptions" },
        },
      },
      {
        $project: {
          name: 1,
          fullName: 1,
          email: 1,
          avatar: 1,
          videos: 1,
          subStatus: 1,
          subscribersCount: 1,
        },
      },
      {
        $limit: 10,
      },
    ]),

    Video.aggregate([
      {
        $match: {
          title: { $regex: `^${name}$`, $options: "i" },
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
      { $sort: { views: -1 } },
      {
        $limit: 10,
      },
    ]),
  ]);

  res
    .status(200)
    .json(
      new response(
        200,
        { channel: [...channel], video: [...video] },
        "Channel details",
      ),
    );
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

const getChannel = asyncHandler(async (req, res) => {
  const userId = req.params?.id;
  const currentUserId = req.user?._id;

  const channel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { channelId: "$_id" },
        pipeline: [{ $match: { $expr: { $eq: ["$channel", "$$channelId"] } } }],
        as: "allSubscriptions",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        let: { channelId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$channel", "$$channelId"] },
                  {
                    $eq: [
                      "$subscriber",
                      new mongoose.Types.ObjectId(currentUserId),
                    ],
                  },
                ],
              },
            },
          },
        ],
        as: "subscriptionStatus",
      },
    },
    {
      $lookup: {
        from: "videos",
        let: { ownerId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$owner", "$$ownerId"] },
            },
          },
          { $count: "count" },
        ],
        as: "videoCount",
      },
    },
    {
      $addFields: {
        subStatus: { $gt: [{ $size: "$subscriptionStatus" }, 0] },
        subscribersCount: { $size: "$allSubscriptions" },
        totalVideos: {
          $ifNull: [{ $arrayElemAt: ["$videoCount.count", 0] }, 0],
        },
      },
    },
    {
      $project: {
        name: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subStatus: 1,
        subscribersCount: 1,
        totalVideos: 1,
      },
    },
  ]);

  res
    .status(200)
    .json(
      new response(
        200,
        channel?.[0] || {},
        "Channel info fetched successfully",
      ),
    );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.params?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const [videos, total] = await Promise.all([
    Video.find({ owner: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Video.countDocuments({ owner: userId }),
  ]);

  const pages = Math.ceil(total / limit);

  res
    .status(200)
    .json(
      new response(
        200,
        { videos, total, page, pages, limit },
        "Videos fetched",
      ),
    );
});

const getComments = asyncHandler(async (req, res) => {
  const videoId = new mongoose.Types.ObjectId(req.params.id);
  const userId = req.user._id;
  const currentUserId = req.user._id;

  const limit = parseInt(req.query.limit) || 5;
  const sortBy = req.query.sortBy || "newest";

  const cursorId = req.query.id
    ? new mongoose.Types.ObjectId(req.query.id)
    : null;
  const cursorDate = req.query.cursor ? new Date(req.query.cursor) : null;
  const cursorLikeCount = req.query.likeCount
    ? parseInt(req.query.likeCount)
    : null;

  const isFirstPage = !cursorId && !cursorDate && !cursorLikeCount;

  const enrichmentPipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "commentreviews",
        localField: "_id",
        foreignField: "comment",
        as: "reviews",
      },
    },
    {
      $addFields: {
        like: {
          count: {
            $size: {
              $filter: {
                input: "$reviews",
                as: "review",
                cond: { $eq: ["$$review.review", "Like"] },
              },
            },
          },
          status: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$reviews",
                    as: "review",
                    cond: {
                      $and: [
                        { $eq: ["$$review.review", "Like"] },
                        { $eq: ["$$review.user", currentUserId] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
        dislike: {
          count: {
            $size: {
              $filter: {
                input: "$reviews",
                as: "review",
                cond: { $eq: ["$$review.review", "Dislike"] },
              },
            },
          },
          status: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: "$reviews",
                    as: "review",
                    cond: {
                      $and: [
                        { $eq: ["$$review.review", "Dislike"] },
                        { $eq: ["$$review.user", currentUserId] },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        comment: 1,
        video: 1,
        user: { _id: 1, avatar: 1, name: 1 },
        heartByChannel: 1,
        createdAt: 1,
        like: 1,
        dislike: 1,
        pinByChannel: 1,
        edited: 1,
      },
    },
  ];

  // === Step 1: Pinned Comments ===
  let pinnedComments = [];
  if (isFirstPage) {
    pinnedComments = await Comment.aggregate([
      {
        $match: {
          video: videoId,
          pinByChannel: true,
        },
      },
      { $sort: { createdAt: -1, _id: -1 } },
      ...enrichmentPipeline,
    ]);
  }

  // === Step 2: Current User Comments ===
  let currentUserComments = [];
  if (isFirstPage) {
    currentUserComments = await Comment.aggregate([
      {
        $match: {
          video: videoId,
          pinByChannel: { $ne: true },
          user: currentUserId,
        },
      },
      {
        $sort:
          sortBy === "top"
            ? { "like.count": -1, _id: -1 }
            : { createdAt: -1, _id: -1 },
      },
      ...enrichmentPipeline,
    ]);
  }

  // === Step 3: Paginate Other Comments ===
  const otherMatch = {
    video: videoId,
    pinByChannel: { $ne: true },
    user: { $ne: currentUserId },
  };

  let matchCursorStage = {};
  if (sortBy === "top") {
    if (cursorLikeCount !== null && cursorId) {
      matchCursorStage = {
        $or: [
          { "like.count": { $lt: cursorLikeCount } },
          { "like.count": cursorLikeCount, _id: { $lt: cursorId } },
        ],
      };
    }
  } else {
    if (cursorDate && cursorId) {
      matchCursorStage = {
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      };
    }
  }

  const otherComments = await Comment.aggregate([
    { $match: otherMatch },
    ...enrichmentPipeline,
    ...(Object.keys(matchCursorStage).length
      ? [{ $match: matchCursorStage }]
      : []),
    {
      $sort:
        sortBy === "top"
          ? { "like.count": -1, _id: -1 }
          : { createdAt: -1, _id: -1 },
    },
    { $limit: limit },
  ]);

  const hasMore = otherComments.length === limit;
  const last = hasMore ? otherComments[otherComments.length - 1] : null;

  const nextCursor =
    sortBy === "top"
      ? last
        ? { likeCount: last.like.count, id: last._id }
        : null
      : last
        ? { createdAt: last.createdAt, id: last._id }
        : null;

  const total = await Comment.countDocuments({ video: videoId });

  return res.status(200).json(
    new response(
      200,
      {
        comments: [...pinnedComments, ...currentUserComments, ...otherComments],
        hasMore,
        nextCursor,
        total,
      },
      "Comments fetched",
    ),
  );
});

let getHistory = asyncHandler(async (req, res) => {
  let id = req.user?.id;

  let history = await History.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $limit: 10,
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoData",
      },
    },
    {
      $unwind: "$videoData",
    },
    {
      $lookup: {
        from: "users",
        localField: "videoData.owner",
        foreignField: "_id",
        as: "ownerData",
      },
    },
    {
      $unwind: "$ownerData",
    },
    {
      $project: {
        _id: 1, // history document's own _id
        video: {
          _id: "$videoData._id",
          title: "$videoData.title",
          thumbnail: "$videoData.thumbnail",
          duration: "$videoData.duration",
          views: "$videoData.views",
          createdAt: "$videoData.createdAt",
          owner: {
            _id: "$ownerData._id",
            name: "$ownerData.name",
            avatar: "$ownerData.avatar",
          },
        },
      },
    },
  ]);

  if (!history) {
    throw new error(500, "Something went wrong while fetching history");
  }

  res.status(200).json(new response(200, history, "History fetched"));
});

let deleteHistory = asyncHandler(async (req, res) => {
  let videoId = req.params?.id;
  let history = await History.findByIdAndDelete(videoId);

  if (!history) {
    throw new error(500, "Something went wrong deleting history");
  }

  res.status(200).json(new response(200, [], "History fetched"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const id = req.user?.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const skip = (page - 1) * limit;

  const result = await LikedVideos.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "videos",
              localField: "video",
              foreignField: "_id",
              as: "videoData",
            },
          },
          { $unwind: "$videoData" },
          {
            $lookup: {
              from: "users",
              localField: "videoData.owner",
              foreignField: "_id",
              as: "ownerData",
            },
          },
          { $unwind: "$ownerData" },
          {
            $project: {
              _id: 1,
              video: {
                _id: "$videoData._id",
                title: "$videoData.title",
                thumbnail: "$videoData.thumbnail",
                duration: "$videoData.duration",
                views: "$videoData.views",
                createdAt: "$videoData.createdAt",
                owner: {
                  _id: "$ownerData._id",
                  name: "$ownerData.name",
                  avatar: "$ownerData.avatar",
                },
              },
            },
          },
        ],
      },
    },
    {
      $unwind: "$metadata",
    },
    {
      $project: {
        data: 1,
        total: "$metadata.total",
      },
    },
  ]);

  if (!result || result.length === 0) {
    return res.status(200).json(
      new response(
        200,
        {
          videos: [],
          total: 0,
          pages: 0,
          page,
          limit,
        },
        "Liked videos fetched",
      ),
    );
  }

  const { data, total } = result[0];
  const pages = Math.ceil(total / limit);

  res.status(200).json(
    new response(
      200,
      {
        videos: data,
        total,
        pages,
        page,
        limit,
      },
      "Liked videos fetched",
    ),
  );
});

let deleteLikedVideos = asyncHandler(async (req, res) => {
  let videoId = req.params?.id;
  let likedVideo = await LikedVideos.findByIdAndDelete(videoId);

  if (!likedVideo) {
    throw new error(500, "Something went wrong deleting liked video");
  }

  res.status(200).json(new response(200, [], "Liked video fetched"));
});

let getSubStatus = asyncHandler(async (req, res) => {
  let subscriber = req.user?.id;
  let channel = req.params?.id;

  let status = await Subscribtion.find({ $and: [{ channel }, { subscriber }] });

  res
    .status(200)
    .json(
      new response(200, status.length > 0 ? true : false, "sub status fetched"),
    );
});

let getReviewStatus = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let video = req.params?.id;

  let review = await Review.findOne({ $and: [{ user }, { video }] });

  res
    .status(200)
    .json(new response(200, review ? review : {}, "sub status fetched"));
});

let getChannelDetails = asyncHandler(async (req, res) => {
  let id = req.params?.id;

  let details = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subarray",
      },
    },
    {
      $addFields: {
        subs: {
          $size: "$subarray",
        },
      },
    },
    {
      $project: {
        name: 1,
        fullName: 1,
        email: 1,
        avatar: 1,
        videos: 1,
        subs: 1,
      },
    },
  ]);

  if (!details) {
    throw new error(500, "Something went wrong while fetching details");
  }

  res
    .status(200)
    .json(
      new response(
        200,
        details ? details[0] : {},
        "Details fetched successfully",
      ),
    );
});

let removeCoverImage = asyncHandler(async (req, res) => {
  let id = req.user._id;
  let publicId = req.params?.id;

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  let editUser = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        coverImage: "",
        coverImagePublicId: "",
      },
    },
    { new: true },
  );

  if (!editUser) {
    throw new error(500, "Something went wrong while removing Cover Image");
  }

  res
    .status(200)
    .json(new response(200, editUser, "Cover image removed successfully"));
});

const searchAll = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res
      .status(200)
      .json(new response(200, [], "Data fetched successfully"));
  }

  const [videos, users] = await Promise.all([
    Video.find({ title: { $regex: query, $options: "i" } })
      .select("_id title")
      .limit(5),
    User.find({ name: { $regex: query, $options: "i" } })
      .select("_id name")
      .limit(5),
  ]);

  const combined = [
    ...users.map((user) => ({
      _id: user._id,
      value: user.name,
      type: "user",
    })),
    ...videos.map((video) => ({
      _id: video._id,
      value: video.title,
      type: "video",
    })),
  ];

  const uniqueSet = new Set();
  const uniqueResults = [];

  for (const item of combined) {
    const normalized = item.value.trim().toLowerCase();
    if (!uniqueSet.has(normalized)) {
      uniqueSet.add(normalized);
      uniqueResults.push(item);
    }
  }

  return res
    .status(200)
    .json(new response(200, uniqueResults, "Data fetched successfully"));
});

const authMe = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new error(401, "Login required");
  }

  try {
    jsonWebToken.verify(token, process.env.ACCESS_TOKEN_KEY);
    res.status(200).json(new response(200, [], "Authorized user"));
  } catch (err) {
    throw new error(401, "Invalid or expired token");
  }
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req?.user._id;
  let { password } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new error(404, "User not found");
  }
  password = password.trim();
  if (password == "") {
    throw new error(401, "Password cannot be empty");
  }

  let passwordCheck = await user.comparePassword(password);

  if (!passwordCheck) {
    throw new error(401, "Wrong password");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // 1. Find all videos uploaded by this user
      const videos = await Video.find({ owner: userId }).session(session);

      for (const video of videos) {
        const videoId = video._id;

        // a. Find all comments on this video
        const comments = await Comment.find({ video: videoId }).session(
          session,
        );
        const commentIds = comments.map((comment) => comment._id);

        // b. Delete reviews on comments of this video
        await CommentReview.deleteMany({
          comment: { $in: commentIds },
        }).session(session);

        // c. Delete comments on this video
        await Comment.deleteMany({ video: videoId }).session(session);

        // d. Delete reviews on the video
        await Review.deleteMany({ video: videoId }).session(session);

        // e. Delete from all users' history and liked lists
        await History.deleteMany({ video: videoId }).session(session);
        await LikedVideos.deleteMany({ video: videoId }).session(session);

        // f. Delete the video itself
        await Video.findByIdAndDelete(videoId).session(session);
      }

      // 2. Delete the user’s activity on other videos
      await CommentReview.deleteMany({ user: userId }).session(session);
      await Comment.deleteMany({ user: userId }).session(session);
      await Review.deleteMany({ user: userId }).session(session);
      await History.deleteMany({ user: userId }).session(session); // user's watched videos
      await LikedVideos.deleteMany({ user: userId }).session(session); // user's liked videos

      // 3. Delete the user
      await User.findByIdAndDelete(userId).session(session);
    });
    let options = {
      httpOnly: true,
      secure: true,
    };
    res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(
        new response(200, [], "User and all related data deleted successfully"),
      );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw new error(500, "Failed to delete user and related data");
  } finally {
    session.endSession();
  }
});

export {
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
  getChannelDetails,
  getVideo,
  getChannel,
  getChannelVideos,
  getComments,
  getHistory,
  getSubStatus,
  getReviewStatus,
  removeCoverImage,
  searchAll,
  deleteHistory,
  getLikedVideos,
  deleteLikedVideos,
  getVideoQuality,
  authMe,
  deleteUser,
};
