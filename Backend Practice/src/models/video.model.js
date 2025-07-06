import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    video: {
      type: String,
      reqired: true,
      
    },
    videoPublicId: {
      type: String,
      reqired: true,
      
    },
    thumbnail: {
      type: String,
      reqired: true,
    },
    thumbnailPublicId: {
      type: String,
      reqired: true,
    },
    title: {
      type: String,
      reqired: true,
      index:true
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
    availableQualities:{
      type:[String],
      enum: ["144p", "240p", "360p", "480p", "720p", "1080p"],
      reqired: true
    },
    originalQuality:{
      type:String,
      reqired: true
    }
  },
  { timestamps: true },
);

export let Video = mongoose.model("Video", videoSchema);
