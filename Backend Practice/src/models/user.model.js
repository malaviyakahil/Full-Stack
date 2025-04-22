import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jsonWebToken from "jsonwebtoken";

let userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowerCase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken =async function () {
  return  jsonWebToken.sign(
    { _id: this._id }, 
    process.env.ACCESS_TOKEN_KEY, 
    {expiresIn: process.env.ACCESS_TOKEN_EXPIERY,});
};

userSchema.methods.generateRefreshToken = async function () {
  return  jsonWebToken.sign(
    { _id: this._id }, 
    process.env.REFRESH_TOKEN_KEY, 
    {expiresIn: process.env.REFRESH_TOKEN_EXPIERY,});
};

export let User = mongoose.model("User", userSchema);
