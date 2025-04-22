import { v2 as cloudinary } from "cloudinary";
import fs from "fs"
import dotenv from "dotenv"
dotenv.config()

cloudinary.config({
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
  api_key:process.env.CLOUDINARY_API_KEY,
  api_secret:process.env.CLOUDINARY_API_SECRET
})

let uploadOnCloudinary = async (localPath) => {
  try {
    if(!localPath) return null
    let response = await cloudinary.uploader.upload(localPath, {resource_type: "auto",});
    if(fs.existsSync(localPath)){
      fs.unlinkSync(localPath)
    }
    return response
  } catch (error) {
    console.log(error);
    if(fs.existsSync(localPath)){
      fs.unlinkSync(localPath)
    }
    return null
  }
};

export default uploadOnCloudinary
