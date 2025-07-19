import { Comment } from "../models/comment.model.js";
import { CommentReview } from "../models/commentReview.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import error from "../utils/error.js";
import response from "../utils/response.js";
import mongoose from "mongoose";

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

const addComment = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const videoId = req.params.id;
  const { comment } = req.body;

  // Save basic comment
  const newComment = await Comment.create({
    comment,
    video: videoId,
    user: userId,
  });

  // Aggregate it back with all enrichments
  const enriched = await Comment.aggregate([
    { $match: { _id: newComment._id } },
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
          status: false, // Always false for new comment
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
          status: false,
        },
        isCurrentUser: true,
        isPinned: { $eq: ["$pinByChannel", true] },
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
        isCurrentUser: 1,
        isPinned: 1,
      },
    },
  ]);

  if (!enriched[0]) {
    return res
      .status(500)
      .json(new response(500, null, "Failed to enrich comment"));
  }

  res.status(201).json(new response(201, enriched[0], "Comment created"));
});

let deleteComment = asyncHandler(async (req, res) => {
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
  likeComment,
  disLikeComment,
  giveHeart,
  takeHeart,
  deleteCommentReview,
  addComment,
  deleteComment,
  editComment,
  pin,
  unPin,
  getComments
};
