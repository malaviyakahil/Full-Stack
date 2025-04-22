import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    video: {
      type: String,
      reqired: true,
    },
    thumbnail: {
      type: String,
      reqired: true,
    },
    title: {
      type: String,
      reqired: true,
    },
    description: {
      type: String,
      reqired: true,
    },
    duration: {
      type: Number,
      reqired: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      reqired: true,
      default: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export let Video = mongoose.model("Video", videoSchema);
