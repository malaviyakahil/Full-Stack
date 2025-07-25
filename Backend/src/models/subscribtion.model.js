import mongoose from "mongoose";

let subscribtionSchema = new mongoose.Schema(
  {
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

export let Subscribtion = mongoose.model("Subscription", subscribtionSchema);
