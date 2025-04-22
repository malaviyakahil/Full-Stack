import mongoose from "mongoose";
let historySchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
  },
  video:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Video"
  }
},{timestamps:true});
export let History = mongoose.model("History", historySchema);