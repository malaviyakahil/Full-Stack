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

let registerUser = asyncHandler(async (req, res) => {
  let { name, email, fullName, password } = req.body;

  if ([name, email, fullName, password].some((e) => e?.trim == "")) {
    throw new error(401, "Credentials cannot be empty");
  }

  let alreadyRegistered = await User.findOne({ $or: [{ name }, { email }] });
  let avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath = req.files?.coverImage
    ? req.files?.coverImage[0].path
    : "";

  if (alreadyRegistered) {
    if (fs.existsSync(avatarLocalPath)) {
      fs.unlinkSync(avatarLocalPath);
    }
    if (fs.existsSync(coverImageLocalPath)) {
      fs.unlinkSync(coverImageLocalPath);
    }
    throw new error(401, "Name and email already registered");
  }

  if (!avatarLocalPath) {
    throw new error(401, "Invalid avatar image");
  }

  let avatarRes = await uploadOnCloudinary(avatarLocalPath);
  let coverImageRes = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatarRes) {
    throw new error(
      401,
      "Something went wrong while uploading avatar on cloudinary",
    );
  }

  if (coverImageLocalPath) {
    if (!coverImageRes) {
      throw new error(
        401,
        "Something went wrong while uploading cover image on cloudinary",
      );
    }
  }

  let user = await User.create({
    name,
    email,
    fullName,
    password,
    avatar: avatarRes?.url,
    coverImage: coverImageRes?.url || "",
  });

  if (!user) {
    throw new error(500, "Something went wrong while registring user");
  }

  res.status(200).json(new response(200, user, "Registered successfully"));
});

let loginUser = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;

  name = name.trim();
  email = email.trim();
  password = password.trim();

  if ([name, email, password].some((e) => e?.trim == "")) {
    throw new error(401, "Credentials cannot be empty");
  }

  let isUserRegistered = await User.findOne({ $and: [{ name }, { email }] });

  if (!isUserRegistered) {
    throw new error(
      401,
      "You are not registered. Register you name and email first",
    );
  }

  let passwordCheck = await isUserRegistered.comparePassword(password);

  if (!passwordCheck) {
    throw new error(401, "Wrong password");
  }

  let { accessToken, refreshToken } = await generatingAccessAndRefreshToken(
    isUserRegistered._id,
  );

  let options = {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new response(200, [], "logged in successfully"));
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
        coverImage: 1,
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

let getCurrentUserVideos = asyncHandler(async (req, res) => {
  let id = req.user?._id;

  let videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(id),
      },
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
              cond: {
                $eq: ["$$review.review", "Like"],
              },
            },
          },
        },
        dislikes: {
          $size: {
            $filter: {
              input: "$result",
              as: "review",
              cond: {
                $eq: ["$$review.review", "Dislike"],
              },
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
        createdAt: 1,
        duration: 1,
        description: 1,
        title: 1,
        likes: 1,
        dislikes: 1,
        views: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  if (!videos) {
    throw new error(500, "Something went wrong while fetching videos");
  }

  res.status(200).json(new response(200, videos, "Current user"));
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

  let user = await User.findByIdAndUpdate(
    id,
    { $set: { avatar: avatarRes?.url } },
    { new: true },
  );

  if (!user) {
    throw new error(401, "Avatar change failed");
  }

  res.status(200).json(new response(200, [], "Avatar changed successfully"));
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
    { $set: { coverImage: coverImageRes?.url } },
    { new: true },
  );

  if (!user) {
    throw new error(401, "Cover image change failed");
  }

  res
    .status(200)
    .json(new response(200, [], "Cover image changed successfully"));
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

  res.status(200).json(new response(200, [], "Full name changed successfully"));
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
          localField: "_id",
          foreignField: "owner",
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
      {
        $sort: {
          createdAt: -1,
        },
      },
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
          $mergeObjects: [
            { Like: 0, Dislike: 0 }, // Default values
            { $arrayToObject: "$data" },
          ],
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

let getChannel = asyncHandler(async (req, res) => {
  let userId = req.params?.id;
  let currentUserId = req.user?._id;

  let channel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
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
        coverImage: 1,
        videos: 1,
        subStatus: 1,
        subscribersCount: 1,
      },
    },
    {
      $limit: 10,
    },
  ]);

  if (!channel) {
    throw new error(500, "Something went wrong while fetching channel");
  }

  res
    .status(200)
    .json(new response(200, channel[0], "Channel fetched successfully"));
});

let getComments = asyncHandler(async (req, res) => {
  let userId = req.user?._id;
  let videoId = req.params?.id;
  let currentUserId = req.user?._id;

  let comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
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
                        {
                          $eq: [
                            "$$review.user",
                            new mongoose.Types.ObjectId(currentUserId),
                          ],
                        },
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
                        {
                          $eq: [
                            "$$review.user",
                            new mongoose.Types.ObjectId(currentUserId),
                          ],
                        },
                      ],
                    },
                  },
                },
              },
              0,
            ],
          },
        },
        isCurrentUser: {
          $eq: ["$user._id", new mongoose.Types.ObjectId(userId)],
        },
        isPinned: {
          $eq: ["$pinByChannel", true],
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
        isCurrentUser: 1, // optional for frontend
        isPinned: 1, // optional for frontend
      },
    },
    {
      $sort: {
        isPinned: -1, // Pinned comments first
        isCurrentUser: -1, // Then current user comments
        createdAt: -1, // Then by newest
      },
    },
  ]);

  if (!comments) {
    throw new error(500, "Something went wrong while fetching comments");
  }

  res
    .status(200)
    .json(new response(200, comments, "Comments fetched successfully"));
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

let getLikedVideos = asyncHandler(async (req, res) => {
  let id = req.user?.id;

  let likedVideos = await LikedVideos.aggregate([
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
  ]);

  if (!likedVideos) {
    throw new error(500, "Something went wrong while fetching liked videos");
  }

  res.status(200).json(new response(200, likedVideos, "Liked videos fetched"));
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

let editProfile = asyncHandler(async (req, res) => {
  let id = req.user._id;
  let { fullName } = req.body;

  let avatarRes;
  if (!req.body.avatar) {
    let avatarLocalPath = req.files?.avatar[0]?.path;
    avatarRes = await uploadOnCloudinary(avatarLocalPath);
    if (!avatarRes) {
      throw new error(
        401,
        "Something went wrong while uploading avatar on cloudinary",
      );
    }
  }

  let coverImageRes;
  if (!req.body.coverImage) {
    let coverImageLocalPath = req.files?.coverImage[0]?.path;
    coverImageRes = await uploadOnCloudinary(coverImageLocalPath);
    if (!coverImageRes) {
      throw new error(
        401,
        "Something went wrong while uploading coverImage on cloudinary",
      );
    }
  }

  let editUser = await User.findByIdAndUpdate(
    id,
    {
      $set: {
        fullName,
        avatar: avatarRes?.url || req.body.avatar,
        coverImage: coverImageRes?.url || req.body.coverImage,
      },
    },
    { new: true },
  );

  if (!editUser) {
    throw new error(500, "Something went wrong while editing user");
  }

  res
    .status(200)
    .json(new response(200, editUser, "Profile edited successfully"));
});

let searchAll = asyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query) {
    res.status(200).json(new response(200, [], "Data fetched successfully"));
    return;
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
    ...users.map((user) => ({ _id: user._id, value: user.name, type: "user" })),
    ...videos.map((video) => ({
      _id: video._id,
      value: video.title,
      type: "video",
    })),
  ];

  const uniqueSet = new Set();
  const uniqueResults = [];

  combined.forEach((item) => {
    if (!uniqueSet.has(item.value)) {
      uniqueSet.add(item.value);
      uniqueResults.push(item);
    }
  });

  res
    .status(200)
    .json(new response(200, uniqueResults, "Data fetched successfully"));
});

const authMe = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new error(401, "Login required");
  }

  try {
    jsonWebToken.verify(token, process.env.REFRESH_TOKEN_KEY); // 👈 using your .env secret
    res.status(200).json(
      new response(
        200,
      [],
        "Authorized user",
      ),
    );
  } catch (err) {
    throw new error(401, "Invalid or expired token");
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
  getComments,
  getHistory,
  getSubStatus,
  getReviewStatus,
  editProfile,
  searchAll,
  deleteHistory,
  getLikedVideos,
  deleteLikedVideos,
  getVideoQuality,
  authMe
};
