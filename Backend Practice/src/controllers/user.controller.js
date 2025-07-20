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
  let accessToken =await user.generateAccessToken();
  let refreshToken =await user.generateRefreshToken();
  let loginedUser = await User.findByIdAndUpdate(
    id,
    { $set: { refreshToken } },
    { new: true },
  );
  return { accessToken, refreshToken, loginedUser };
};

let renewAccessToken = asyncHandler(async (req, res) => {
  const parseExpiry = (exp) => {
    const time = parseInt(exp);
    if (exp.includes("d")) return time * 24 * 60 * 60 * 1000;
    if (exp.includes("h")) return time * 60 * 60 * 1000;
    if (exp.includes("m")) return time * 60 * 1000;
    if (exp.includes("s")) return time * 1000;
    return time;
  };
  let token =
    req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new error(401, "Login required");
  }

  const decodedToken = jsonWebToken.verify(
    token,
    process.env.REFRESH_TOKEN_KEY,
  );
  const user = await User.findById(decodedToken._id);

  if (!user || user.refreshToken !== token) {
    throw new error(401, "Invalid refresh token");
  }

  let { accessToken, refreshToken } = await generatingAccessAndRefreshToken(
    decodedToken._id,
  );

  let options = {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    path: "/",
    maxAge: parseExpiry(process.env.REFRESH_TOKEN_EXPIERY),
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new response(200, [], "Access token renewed successfully"));
});

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

let changePassword = asyncHandler(async (req, res) => {
  const id = req.user?._id;
  const { oldPassword, newPassword } = req.body;

  // Trim check
  if ([oldPassword, newPassword].some((e) => !e?.trim())) {
    throw new error(401, "Credentials cannot be empty");
  }

  // Prevent same password reuse
  if (oldPassword === newPassword) {
    throw new error(401, "Old password and new password cannot be the same");
  }

  const user = await User.findById(id);
  if (!user) {
    throw new error(404, "User not found");
  }

  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new error(401, "Old password is incorrect");
  }

  // Trigger pre-save hash
  user.password = newPassword;
  user.refreshToken = ""; // Invalidate refresh token
  await user.save(); // pre('save') will hash password

  // Secure cookie clearing
  const options = {
    httpOnly: true,
    secure: true, // ensure HTTPS
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new response(200, [], "Password changed successfully"));
});

const changeAvatar = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new error(400, "Invalid avatar image file.");
  }

  // Upload new avatar to Cloudinary
  const avatarRes = await uploadOnCloudinary(
    avatarLocalPath,
    "image",
    "user/avatar",
  );
  if (!avatarRes) {
    throw new error(500, "Failed to upload new avatar to Cloudinary.");
  }

  // Fetch user from DB
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    // Cleanup uploaded image
    await cloudinary.uploader.destroy(avatarRes.public_id);
    throw new error(404, "User not found.");
  }

  // Delete previous avatar from Cloudinary if it exists
  if (existingUser.avatarPublicId) {
    await cloudinary.uploader.destroy(existingUser.avatarPublicId);
  }

  // Update user with new avatar
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        avatar: avatarRes.secure_url,
        avatarPublicId: avatarRes.public_id,
      },
    },
    { new: true },
  );

  // Cleanup local file
  if (fs.existsSync(avatarLocalPath)) {
    fs.unlinkSync(avatarLocalPath);
  }

  if (!updatedUser) {
    throw new error(500, "Failed to update avatar.");
  }

  res
    .status(200)
    .json(new response(200, updatedUser, "Avatar updated successfully."));
});

const changeCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new error(400, "Invalid cover image file.");
  }

  // Upload new image to Cloudinary
  const uploadResult = await uploadOnCloudinary(
    coverImageLocalPath,
    "image",
    "user/coverImage",
  );

  if (!uploadResult) {
    throw new error(500, "Failed to upload cover image to Cloudinary.");
  }

  // Fetch current user to delete old image if exists
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    // Cleanup new upload if user not found
    await cloudinary.uploader.destroy(uploadResult.public_id);
    throw new error(404, "User not found.");
  }

  // Delete previous cover image from Cloudinary if it exists
  if (existingUser.coverImagePublicId) {
    await cloudinary.uploader.destroy(existingUser.coverImagePublicId);
  }

  // Update user with new image details
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage: uploadResult.secure_url,
        coverImagePublicId: uploadResult.public_id,
      },
    },
    { new: true },
  );

  // Cleanup local file
  if (fs.existsSync(coverImageLocalPath)) {
    fs.unlinkSync(coverImageLocalPath);
  }

  if (!updatedUser) {
    throw new error(500, "Failed to update user's cover image.");
  }

  return res
    .status(200)
    .json(new response(200, updatedUser, "Cover image updated successfully."));
});

const removeCoverImage = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Get current user to access stored Cloudinary public ID
  const user = await User.findById(userId);
  if (!user) {
    throw new error(404, "User not found.");
  }

  // If a cover image exists, delete it from Cloudinary
  if (user.coverImagePublicId) {
    await cloudinary.uploader.destroy(user.coverImagePublicId, {
      resource_type: "image",
    });
  }

  // Clear the cover image fields from the user record
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        coverImage: "",
        coverImagePublicId: "",
      },
    },
    { new: true },
  );

  if (!updatedUser) {
    throw new error(500, "Something went wrong while removing cover image.");
  }

  res
    .status(200)
    .json(new response(200, updatedUser, "Cover image removed successfully."));
});

const changeFullName = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  let { fullName } = req.body;

  fullName = fullName?.trim();

  if (!fullName) {
    throw new error(400, "Full name is required.");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { fullName } },
    { new: true },
  );

  if (!updatedUser) {
    throw new error(500, "Failed to update full name.");
  }

  res
    .status(200)
    .json(new response(200, updatedUser, "Full name changed successfully."));
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

let getReviewStatus = asyncHandler(async (req, res) => {
  let user = req.user?.id;
  let video = req.params?.id;

  let review = await Review.findOne({ $and: [{ user }, { video }] });

  res
    .status(200)
    .json(new response(200, review ? review : {}, "sub status fetched"));
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


const getCurrentUserVideos = asyncHandler(async (req, res) => {
  const id = req.user?._id;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit);
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

export {
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
  getReviewStatus,
  removeCoverImage,
  deleteHistory,
  getLikedVideos,
  deleteLikedVideos,
  authMe,
  deleteUser,
  getCurrentUserVideos
};
