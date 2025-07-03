import mongoose from "mongoose";
let likedVideosSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  video:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Video"
  }
},{timestamps:true});

export let LikedVideos = mongoose.model("LikedVideos", likedVideosSchema);