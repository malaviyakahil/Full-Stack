import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { clearCurrentUser } from "../store/user.slice.js";
import { clearCurrentUserVideos } from "../store/userVideos.slice.js";
import { clearVideos } from "../store/videos.slice.js";
import { clearHistory } from "../store/history.slice.js";
import { clearLikedVideos } from "../store/likedVideos.slice.js";
import { useDispatch } from "react-redux";
import { deleteUser } from "../apis/user.apis.js";

const DeleteUser = () => {
  let { register, handleSubmit } = useForm();
  let [error, setError] = useState("");
  let [loader, setLoader] = useState(false);
  let navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  let dispatch = useDispatch();

  let submit = async (data) => {
    setLoader(true);
    setError("");

    let formData = new FormData();
    formData.append("password", data.password);

    try {
      await deleteUser(formData)
      dispatch(clearCurrentUser());
      dispatch(clearCurrentUserVideos());
      dispatch(clearVideos());
      dispatch(clearHistory());
      dispatch(clearLikedVideos());
      navigate("/");
    } catch (error) {
      setError(error?.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Delete account</h1>
        <form
          className="w-full"
          autoComplete="off"
          encType="multipart/form-data"
          onSubmit={handleSubmit(submit)}
        >
          <label className="input validator w-full my-2 relative rounded-md">
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
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
              </g>
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              {...register("password")}
              placeholder="Password"
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must contain at least 1 number, 1 uppercase and 1 lowercase letter, and be at least 8 characters"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-sm"
            >
              {showPassword ? (
                <RiEyeLine className="text-gray-400 text-[15px]" />
              ) : (
                <RiEyeOffLine className="text-gray-400 text-[15px]" />
              )}
            </span>
          </label>

          {error && <p className="text-red-500 text-center my-2">{error}</p>}
          {loader ? (
            <div className="relative w-full h-[40px] rounded-md overflow-hidden border border-gray-600 my-2">
              <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
              <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
              <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
              <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
            </div>
          ) : (
            <button className="btn bg-gray-600 w-full my-2 rounded-md" type="submit">
              Delete account
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default DeleteUser;
