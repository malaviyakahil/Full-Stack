import { User } from "../models/user.model.js";
import { Subscribtion } from "../models/subscribtion.model.js";
import { Video } from "../models/video.model.js";
import response from "../utils/response.js";
import error from "../utils/error.js";
import mongoose from "mongoose";
import asyncHandler from "../utils/asyncHandler.js";


const subscribeTo = asyncHandler(async (req, res) => {
  const subscriber = req.user?._id;
  const channelId = req.params?.id;

  if (!channelId) {
    throw new error(400, "Channel ID is required");
  }

  // Prevent self-subscription
  if (subscriber.equals(channelId)) {
    throw new error(400, "You cannot subscribe to your own channel");
  }

  const user = await User.findById(channelId);
  if (!user) {
    throw new error(404, "Channel does not exist");
  }

  const alreadySubscribed = await Subscribtion.findOne({
    channel: channelId,
    subscriber,
  });

  if (alreadySubscribed) {
    throw new error(400, "You are already subscribed to this channel");
  }

  const subscribed = await Subscribtion.create({
    channel: channelId,
    subscriber,
  });

  if (!subscribed) {
    throw new error(500, "Subscription failed");
  }

  res
    .status(200)
    .json(new response(200, [], `Successfully subscribed to ${user.name}`));
});

const unsubscribeTo = asyncHandler(async (req, res) => {
  const subscriber = req.user?._id;
  const channelId = req.params?.id;

  if (!channelId) {
    throw new error(400, "Channel ID is required");
  }

  // Prevent unsubscribing from oneself
  if (subscriber.equals(channelId)) {
    throw new error(400, "You cannot unsubscribe from your own channel");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new error(404, "Channel does not exist");
  }

  const subscription = await Subscribtion.findOne({
    channel: channelId,
    subscriber,
  });

  if (!subscription) {
    throw new error(400, "You are not subscribed to this channel");
  }

  const unSubscribed = await Subscribtion.findByIdAndDelete(subscription._id);
  if (!unSubscribed) {
    throw new error(500, "Unsubscription failed");
  }

  res
    .status(200)
    .json(
      new response(200, [], `Successfully unsubscribed from ${channel.name}`),
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
  const limit = parseInt(req.query.limit);
  const skip = (page - 1) * limit;

  const filter = req.query.filter || "latest"; // Default: latest

  // Determine sorting criteria based on filter
  let sortOption = {};
  switch (filter) {
    case "top":
      sortOption = { views: -1, createdAt: -1 }; // Most viewed
      break;
    case "oldest":
      sortOption = { createdAt: 1 }; // Oldest first
      break;
    case "latest":
    default:
      sortOption = { createdAt: -1 }; // Newest first
      break;
  }

  const [videos, total] = await Promise.all([
    Video.find({ owner: userId }).sort(sortOption).skip(skip).limit(limit),
    Video.countDocuments({ owner: userId }),
  ]);

  const pages = Math.ceil(total / limit);

  res
    .status(200)
    .json(new response(200, { videos, total, page, pages }, "Videos fetched"));
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

export {
  subscribeTo,
  unsubscribeTo,
  getChannelDetails,
  getChannel,
  getChannelVideos,
  getSubStatus,
};
