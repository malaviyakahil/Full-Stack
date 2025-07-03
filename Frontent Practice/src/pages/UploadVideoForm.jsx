import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCurrentUserVideos } from "../store/userVideos.slice";

const UploadVideoForm = () => {
  
  let { register, handleSubmit } = useForm();
  let dispatch = useDispatch();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let navigate = useNavigate();

  let submit = async (data) => {
    setLoader(true);
    setError(false);
    let formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description);
    formData.append("thumbnail", data.thumbnail[0]);
    formData.append("video", data.video[0]);

    try {
      let res = await axios.post(
        "http://localhost:8000/video/upload-video",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );
      setLoader(false);

      if (res.data?.success) {
        dispatch(clearCurrentUserVideos());
        navigate("/app/my-videos/uploaded-videos");
      }
    } catch (error) {
      setLoader(false);
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px]">Upload video</h1>
        <form className="m-1  w-full" onSubmit={handleSubmit(submit)}>
          <input
            type="text"
            className="input w-full my-3"
            key={"title"}
            required
            name="title"
            {...register("title")}
            placeholder="Title"
            minLength="3"
            maxLength="30"
          />
          <input
            type="text"
            className="input w-full my-3"
            key={"description"}
            required
            name="description"
            {...register("description")}
            placeholder="Description"
          />

          <fieldset className="fieldset mb-3">
            <legend className="fieldset-legend opacity-50">
              Pick an image for Thumbnail
            </legend>
            <input
              type="file"
              accept="image/*"
              required
              name="thumbnail"
              {...register("thumbnail")}
              className="file-input w-full"
            />
            <label className="fieldset-label">Max size 2MB</label>
          </fieldset>

          <fieldset className="fieldset mb-3">
            <legend className="fieldset-legend opacity-50">
              Pick a video for Upload
            </legend>
            <input
              type="file"
              accept="video/*"
              required
              name="video"
              {...register("video")}
              className="file-input w-full"
            />
            <label className="fieldset-label">Max size 5MB</label>
          </fieldset>

          {error && <p className="text-red-500 text-center mb-3.5">{error}</p>}
          {loader ? (
                   <div className="relative w-full h-[40px] rounded-lg overflow-hidden border border-gray-600 my-2">
                   <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
                   <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
                   <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
                   <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
                 </div>
          ) : (
            <button className="btn bg-gray-600 w-full my-2" type="submit">
              Upload
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default UploadVideoForm;
