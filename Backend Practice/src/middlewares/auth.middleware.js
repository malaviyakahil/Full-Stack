import { User } from "../models/user.model.js";
import jsonWebToken from "jsonwebtoken";
import error from "../utils/error.js";
let auth = async (req, res, next) => {
  try {
    let token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      throw new error(401, "Login required");
    }

    let decodedToken = jsonWebToken.verify(token, process.env.ACCESS_TOKEN_KEY);

    let user = await User.findById(decodedToken._id);

    if (!user) {
      throw new error(401, "Register your name and email first");
    }

    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};



export default auth;
