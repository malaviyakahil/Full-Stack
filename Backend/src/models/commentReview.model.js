import mongoose from "mongoose";

let commentReviewSchema = new mongoose.Schema(
  {
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    review: {
      type: String,
      enum: ["Like", "Dislike"],
    },
  },
  { timestamps: true },
);

export let CommentReview = mongoose.model("CommentReview",commentReviewSchema);
