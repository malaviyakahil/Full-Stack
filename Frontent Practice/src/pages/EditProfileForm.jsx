import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { removeCoverImage, updateCurrentUser } from "../store/user.slice.js";

const EditProfileForm = () => {
  let currentUser = useSelector((store) => store.currentUser);
  let dispatch = useDispatch();
  let { register, handleSubmit } = useForm();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let [showAvatarFileInput, setShowAvatarFileInput] = useState(false);
  let [showCoverImageFileInput, setShowCoverImageFileInput] = useState(false);
  let [coverImageRemove, setCoverImageRemove] = useState(false);

  const handleAvatarChangeClick = () => {
    setShowAvatarFileInput(!showAvatarFileInput);
  };

  const handleCoverImageChangeClick = () =>
    setShowCoverImageFileInput(!showCoverImageFileInput);

  let submit = async (data) => {
    setError("");

    const avatarFile = data?.avatar?.[0];
    const coverImageFile = data?.coverImage?.[0];

    const isJpg = (file) =>
      file && file.type === "image/jpeg" && /\.(jpe?g)$/i.test(file.name);

    // Validate file sizes
    if (
      avatarFile?.size > 5 * 1024 * 1024 &&
      coverImageFile?.size > 5 * 1024 * 1024
    ) {
      setError("Too big file for Avatar and Cover Image");
      return;
    }
    if (avatarFile?.size > 5 * 1024 * 1024) {
      setError("Too big file for Avatar");
      return;
    }
    if (coverImageFile?.size > 5 * 1024 * 1024) {
      setError("Too big file for Cover Image");
      return;
    }

    // Validate file types
    if (avatarFile && !isJpg(avatarFile)) {
      setError("Only .jpg images are allowed for Avatar.");
      return;
    }
    if (coverImageFile && !isJpg(coverImageFile)) {
      setError("Only .jpg images are allowed for Cover Image.");
      return;
    }

    setLoader(true);

    try {
      let updatedUser = {};

      // Full name
      const trimmedFullName = data.fullName?.trim();
      if (trimmedFullName.length > 0) {
        const formData = new FormData();
        formData.append("fullName", trimmedFullName);

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/change-full-name`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        Object.assign(updatedUser, res?.data?.data);
      } else {
        setError("Fullname cannot be empty");
      }

      // Avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/change-avatar`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        Object.assign(updatedUser, res?.data?.data);
      }

      // Cover image
      if (coverImageFile) {
        const formData = new FormData();
        formData.append("coverImage", coverImageFile);

        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/user/change-cover-image`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          },
        );
        Object.assign(updatedUser, res?.data?.data);
      }

      // Dispatch only if there's something to update
      if (Object.keys(updatedUser).length > 0) {
        dispatch(updateCurrentUser(updatedUser));
      }

      // Cover image removal
      if (coverImageRemove) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/user/remove-cover-image`,
          [],
          {
            withCredentials: true,
          },
        );
        dispatch(removeCoverImage());
      }
    } catch (error) {
      setError(
        error?.response?.data?.message || "Failed to change user details",
      );
    } finally {
      setLoader(false);
      setShowAvatarFileInput(false);
      setShowCoverImageFileInput(false);
      setCoverImageRemove(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Edit profile</h1>
        <form
          className="w-full"
          autoComplete="off"
          encType="multipart/form-data"
          noValidate={false}
          onSubmit={handleSubmit(submit)}
        >
          <p className="text-md font-semibold my-2">Full name</p>

          <label htmlFor="fullName" className="input w-full">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </g>
            </svg>
            <input
              id="fullName"
              defaultValue={currentUser.data?.fullName}
              type="text"
              required
              placeholder="Full name"
              className="w-full"
              minLength={3}
              maxLength={30}
              {...register("fullName")}
            />
          </label>

          <p className="text-md font-semibold my-2">Avatar</p>

          <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center items-center">
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

          <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center items-center">
            {currentUser.data?.coverImage ? (
              <>
                {!coverImageRemove ? (
                  <img
                    src={currentUser.data?.coverImage}
                    alt="img"
                    className="h-full object-contain"
                  />
                ) : (
                  <p>User has no cover image</p>
                )}
                {!coverImageRemove && (
                  <button
                    type="button"
                    onClick={handleCoverImageChangeClick}
                    className="absolute bottom-2 left-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
                  >
                    {showCoverImageFileInput ? "Cancel" : "Change"}
                  </button>
                )}
                {!showCoverImageFileInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCoverImageRemove(!coverImageRemove);
                    }}
                    className="absolute bottom-2 right-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
                  >
                    {coverImageRemove ? "Cancel" : "Remove"}
                  </button>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleCoverImageChangeClick}
                className="absolute bottom-2 left-2 bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] text-white"
              >
                {showCoverImageFileInput ? "Cancel" : "Add"}
              </button>
            )}
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
