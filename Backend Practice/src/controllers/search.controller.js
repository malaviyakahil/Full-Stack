import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import response from "../utils/response.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";

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

export { searchAll, getChannelAndVideo };
