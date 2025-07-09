import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { updateCurrentUser } from "../store/user.slice";

const EditProfileForm = () => {
  let currentUser = useSelector((store) => store.currentUser);
  let dispatch = useDispatch();
  let { register, handleSubmit } = useForm();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let [showAvatarFileInput, setShowAvatarFileInput] = useState(false);
  let [showCoverImageFileInput, setShowCoverImageFileInput] = useState(false);

  const handleAvatarChangeClick = () =>
    setShowAvatarFileInput(!showAvatarFileInput);

  const handleCoverImageChangeClick = () =>
    setShowCoverImageFileInput(!showCoverImageFileInput);

  let submit = async (data) => {

    setError("");
    if (data?.avatar?.[0]?.size > 5 * 1024 * 1024 && data?.coverImage?.[0]?.size > 5 * 1024 * 1024) {
      setError("Too big file for Avatar and Cover Image");
      return;
    }
    if (data?.avatar?.[0]?.size > 5 * 1024 * 1024) {
      setError("Too big file for Avatar");
      return;
    }
    if (data?.coverImage?.[0]?.size > 5 * 1024 * 1024) {
      setError("Too big file for Cover Image");
      return;
    }
    
    setLoader(true);
    
    let formData = new FormData();
    formData.append("fullName", data?.fullName || currentUser.data?.fullName);
    formData.append("avatar", data?.avatar?.[0] || currentUser.data?.avatar);
    formData.append(
      "coverImage",
      data?.coverImage?.[0] || currentUser.data?.coverImage,
    );

    try {
      let res = await axios.post(
        `http://localhost:8000/user/edit-profile`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      if (res.data?.success) {
        setLoader(false);
        dispatch(updateCurrentUser(res));
      }
    } catch (error) {
      setLoader(false);
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Edit profile</h1>
        <form className="w-full" onSubmit={handleSubmit(submit)}>
          <p className="text-md font-semibold my-2">Full name</p>
          <input
            type="text"
            defaultValue={currentUser.data?.fullName}
            className="input w-full"
            required
            {...register("fullName")}
            placeholder="Full name"
            minLength="3"
            maxLength="30"
          />

          <p className="text-md font-semibold my-2">Avatar</p>

          <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center ">
            <img
              src={currentUser.data?.avatar}
              alt="img"
              className="h-full object-contain"
            />
            <button
              type="button"
              onClick={handleAvatarChangeClick}
              className="absolute bottom-2 left-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
            >
              {showAvatarFileInput ? "Cancel" : "Change"}
            </button>
          </div>

          {showAvatarFileInput && (
            <fieldset className="fieldset mb-3">
              <legend className="fieldset-legend opacity-50">
                Pick an image for Avatar
              </legend>
              <input
                type="file"
                accept="image/*"
                {...register("avatar")}
                className="file-input w-full"
              />
              <label className="fieldset-label">Max size 5MB</label>
            </fieldset>
          )}
          <p className="text-md font-semibold my-2">Cover Image</p>

          <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center">
            <img
              src={currentUser.data?.coverImage}
              alt="img"
              className="h-full object-contain"
            />
            <button
              type="button"
              onClick={handleCoverImageChangeClick}
              className="absolute bottom-2 left-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
            >
              {showCoverImageFileInput ? "Cancel" : "Change"}
            </button>
          </div>

          {showCoverImageFileInput && (
            <fieldset className="fieldset mb-3">
              <legend className="fieldset-legend opacity-50">
                Pick an image for Cover image
              </legend>
              <input
                type="file"
                accept="image/*"
                {...register("coverImage")}
                className="file-input w-full"
              />
              <label className="fieldset-label">Max size 5MB</label>
            </fieldset>
          )}

          {error && <p className="text-red-500 text-center my-2">{error}</p>}
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

export default EditProfileForm;
