import mongoose from "mongoose";

let commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    comment: {
      type: String,
      required: true,
    },
    heartByChannel: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export let Comment = mongoose.model("Comment", commentSchema);
