import { User } from "../models/user.model.js";
import jsonWebToken from "jsonwebtoken";
import error from "../utils/error.js";

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");

    const token =
      req.cookies?.accessToken ||
      (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1].trim() : null);

    if (!token) {
      throw new error(401, "Login required");
    }

    const decodedToken = jsonWebToken.verify(token, process.env.ACCESS_TOKEN_KEY);

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new error(401, "Register your name and email first");
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new error(401, "Session expired. Please log in again."));
    }
    next(err);
  }
};

export default auth;
