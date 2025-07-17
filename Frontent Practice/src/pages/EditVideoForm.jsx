import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { updateCurrentUserVideo } from "../store/userVideos.slice";

const EditVideoForm = () => {
  const location = useLocation();
  const { title, description, thumbnail } = location.state || {};
  let { id } = useParams();
  let { register, handleSubmit } = useForm();
  let dispatch = useDispatch();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let [showFileInput, setShowFileInput] = useState(false);
  let navigate = useNavigate();
  const handleChangeClick = () => setShowFileInput(!showFileInput);

let submit = async (data) => {
  setError("");
  const thumbnailFile = data?.thumbnail?.[0];

  const isJpg = (file) =>
    file?.type === "image/jpeg" && /\.(jpe?g)$/i.test(file.name);

  if (thumbnailFile?.size > 5 * 1024 * 1024) {
    setError("Thumbnail file is too large (max 5MB).");
    return;
  }

  if (thumbnailFile && !isJpg(thumbnailFile)) {
    setError("Only .jpg images are allowed for Thumbnail.");
    return;
  }

  setLoader(true);

  try {
    let combinedUpdatedVideo = {}; // Object to store all updated fields

    // Update title
    const trimmedTitle = data.title?.trim();
    if (trimmedTitle) {
      const formData = new FormData();
      formData.append("title", trimmedTitle);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/video/change-video-title/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      Object.assign(combinedUpdatedVideo, res?.data?.data);
    }

    // Update description
    const trimmedDescription = data.description?.trim();
    if (trimmedDescription) {
      const formData = new FormData();
      formData.append("description", trimmedDescription);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/video/change-video-description/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      Object.assign(combinedUpdatedVideo, res?.data?.data);
    }

    // Update thumbnail
    if (thumbnailFile) {
      const formData = new FormData();
      formData.append("thumbnail", thumbnailFile);

      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/video/change-video-thumbnail/${id}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        }
      );
      Object.assign(combinedUpdatedVideo, res?.data?.data);
    }

    // Dispatch only once
    if (Object.keys(combinedUpdatedVideo).length > 0) {
      dispatch(updateCurrentUserVideo(combinedUpdatedVideo));
    }

    navigate("/app/my-videos/uploaded-videos");
  } catch (err) {
    setError(err?.response?.data?.message || "Failed to update video.");
  } finally {
    setShowFileInput(false);
    setLoader(false);
  }
};


  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px]">Edit video</h1>
        <form className="w-full" onSubmit={handleSubmit(submit)}>
          <p className="text-md font-semibold my-2">Title</p>
          <input
            type="text"
            defaultValue={title}
            className="input w-full"
            required
            {...register("title")}
            placeholder="Title"
            minLength="3"
            maxLength="30"
          />
          <p className="text-md font-semibold my-2">Description</p>
          <input
            type="text"
            defaultValue={description}
            className="input w-full"
            required
            {...register("description")}
            placeholder="Description"
          />
          <p className="text-md font-semibold my-2">Thumbnail</p>
          <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center ">
            <img
              src={thumbnail}
              alt={title}
              className="h-full object-contain"
            />
            <button
              type="button"
              onClick={handleChangeClick}
              className="absolute bottom-2 left-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
            >
              {showFileInput ? "Cancel" : "Change"}
            </button>
          </div>

          {showFileInput && (
            <fieldset className="fieldset mb-3">
              <legend className="fieldset-legend opacity-50">
                Pick an image for Thumbnail
              </legend>
              <input
                type="file"
                accept="image/*"
                {...register("thumbnail")}
                className="file-input w-full"
              />
              <label className="fieldset-label">Max size 5MB</label>
            </fieldset>
          )}

          {error && <p className="text-red-500 text-center my-3.5">{error}</p>}
          {loader ? (
            <div className="relative w-full h-[40px] rounded-lg overflow-hidden border border-gray-600 my-2">
              <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
              <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
              <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
              <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
            </div>
          ) : (
            <button className="btn bg-gray-600 w-full my-2" type="submit">
              Save
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default EditVideoForm;
