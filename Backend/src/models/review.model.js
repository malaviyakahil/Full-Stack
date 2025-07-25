import mongoose from "mongoose";

let reviewSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
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

export let Review = mongoose.model("Review",reviewSchema);
