import axios from "axios";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch} from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearCurrentUserVideos } from "../store/userVideos.slice";
import { clearCurrentUser } from "../store/user.slice";
import { clearVideos } from "../store/videos.slice";

const ChangePasswordForm = () => {

  let { register, handleSubmit } = useForm();
  let dispatch = useDispatch();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let navigate = useNavigate();

  let submit = async (data) => {
    setLoader(true);
    setError(false);
    let formData = new FormData();
    formData.append("oldPassword", data.oldPassword);
    formData.append("newPassword", data.newPassword);

    try {
      let res = await axios.post(
        `http://localhost:8000/user/change-password`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
        },
      );

      if (res.data?.success) {
        setLoader(false);
        dispatch(clearCurrentUser());
        dispatch(clearCurrentUserVideos());
        dispatch(clearVideos());
        navigate("/login");
      }
    } catch (error) {
      setLoader(false);
      console.log(error);
      
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-full">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Change password</h1>
        <form className="w-full" onSubmit={handleSubmit(submit)}>
          <label className="input validator w-full my-2">
            <svg
              className="h-[1em]"
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
              key={"oldpassword"}
              type="password"
              name="oldPassword"
              {...register("oldPassword")}
              placeholder="Old password"
              minLength="5"
              required
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            />
          </label>

          <label className="input validator w-full my-2">
            <svg
              className="h-[1em]"
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
              key={"newPassword"}
              type="password"
              name="newPassword"
              {...register("newPassword")}
              placeholder="New password"
              minLength="5"
              required
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            />
          </label>

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
              Change
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordForm;
