import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { uploadVideo } from "../apis/video.apis";
import axios from "axios";
import { clearCurrentUserVideos } from "../store/userVideos.slice";

const UploadVideoForm = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  let dispatch = useDispatch();

  const uploadToCloudinary = async (file, type, onProgress) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append(
      "upload_preset",
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
    );
    formData.append(
      "folder",
      type === "image" ? "video/thumbnail" : "video/video",
    );

    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${type}/upload`,
      formData,
      {
        onUploadProgress: (e) => {
          if (type === "video" && onProgress) {
            const percent = Math.round((e.loaded * 100) / e.total);
            onProgress(percent);
          }
        },
      },
    );
    return response.data;
  };

  const submit = async (data) => {
    setError("");

    const videoFile = data?.video?.[0];
    const thumbnailFile = data?.thumbnail?.[0];

    if (
      videoFile?.size > 100 * 1024 * 1024 &&
      thumbnailFile?.size > 5 * 1024 * 1024
    ) {
      setError("Too big file for Thumbnail and Video");
      return;
    }
    if (thumbnailFile?.size > 5 * 1024 * 1024) {
      setError("Too big file for Thumbnail");
      return;
    }
    if (videoFile?.size > 100 * 1024 * 1024) {
      setError("Too big file for Video");
      return;
    }

    const isJpg = (file) =>
      file && file.type === "image/jpeg" && /\.(jpe?g)$/i.test(file.name);
    const isMp4 = (file) =>
      file && file.type === "video/mp4" && /\.mp4$/i.test(file.name);

    if (thumbnailFile && !isJpg(thumbnailFile)) {
      setError("Only .jpg images are allowed for Thumbnail.");
      return;
    }

    if (videoFile && !isMp4(videoFile)) {
      setError("Only .mp4 videos are allowed.");
      return;
    }

    try {
      setLoader(true);

      const videoRes = await uploadToCloudinary(
        videoFile,
        "video",
        setProgress,
      );
      const thumbnailRes = await uploadToCloudinary(thumbnailFile, "image");

      let formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("videoRes", JSON.stringify(videoRes));
      formData.append("thumbnailRes", JSON.stringify(thumbnailRes));

      await uploadVideo(formData);
      dispatch(clearCurrentUserVideos());
      navigate("/app/my-videos/uploaded-videos");
    } catch (err) {
      setError(err?.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-end px-3">
        <h1 className="text-center text-[40px] mb-5">Upload video</h1>
        <form
          className="w-full"
          autoComplete="off"
          onSubmit={handleSubmit(submit)}
        >
          <label className="input w-full rounded-md my-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
              />
            </svg>

            <input
              type="text"
              {...register("title")}
              required
              placeholder="Title"
              minLength="3"
              maxLength="60"
            />
          </label>
          <label className="input w-full rounded-md my-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="2.5"
              stroke="currentColor"
              class="size-4"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z"
              />
            </svg>
            <input
              type="text"
              {...register("description")}
              required
              placeholder="Description"
              minLength="3"
              maxLength="5000"
            />
          </label>
          <fieldset className="fieldset mb-3">
            <legend className="fieldset-legend opacity-50 font-medium">
              Pick a Thumbnail
            </legend>
            <input
              type="file"
              accept="image/jpeg"
              required
              {...register("thumbnail")}
              className="file-input w-full rounded-md"
            />
            <label className="fieldset-label">Max size 5MB</label>
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend opacity-50 font-medium">Pick a Video</legend>
            <input
              type="file"
              accept="video/mp4"
              required
              {...register("video")}
              className="file-input w-full rounded-md"
            />
            <label className="fieldset-label">Max size 100MB</label>
          </fieldset>

          {error && <p className="text-red-500 text-center my-3">{error}</p>}

          <div className="h-[40px] w-full mt-5">
            {loader ? (
              <div className="relative w-full h-full rounded-md overflow-hidden box-border border border-gray-600">
                <p className=" absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-md"> {progress > 0 ? progress - 1 : 0}%</p>
                <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
                <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
                <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
                <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
              </div>
            ) : (
              <button
                className="btn bg-gray-600 h-full w-full rounded-md"
                type="submit"
              >
                Upload
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadVideoForm;
