import React, { useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { registerUser } from "../apis/user.apis";

const RegisterForm = () => {
  const { register, handleSubmit } = useForm();
  const [loader, setLoader] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const submit = async (data) => {
    if (loader) return;

    setErrorMessage("");
    setSuccessMessage("");

    const maxSize = 5 * 1024 * 1024;
    const avatarSize = data.avatar?.[0]?.size || 0;
    const coverSize = data.coverImage?.[0]?.size || 0;

    if (avatarSize > maxSize && coverSize > maxSize) {
      setErrorMessage("Both Avatar and Cover Image exceed 5MB limit.");
      return;
    }
    if (avatarSize > maxSize) {
      setErrorMessage("Avatar exceeds 5MB limit.");
      return;
    }
    if (coverSize > maxSize) {
      setErrorMessage("Cover Image exceeds 5MB limit.");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", data.fullName.trim());
    formData.append("name", data.name.trim());
    formData.append("email", data.email.trim());
    formData.append("password", data.password);
    formData.append("avatar", data.avatar[0]);
    if (data.coverImage?.[0]) {
      formData.append("coverImage", data.coverImage[0]);
    }

    try {
      setLoader(true);
      await registerUser(formData);
      setSuccessMessage("Registration successful! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (error) {
      setErrorMessage(error?.message || "Registration failed.");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex justify-center items-center">
      <div className="w-full max-w-md justify-end px-5">
        <h1 className="text-center  text-[40px] mb-5">
          Register Here
        </h1>

        <form
          className="w-full"
          onSubmit={handleSubmit(submit)}
          autoComplete="off"
          encType="multipart/form-data"
          noValidate={false}
        >
          {/* Username */}
          <label
            htmlFor="name"
            className="input validator w-full my-2 rounded-md"
          >
            <svg
              className="h-[1em] opacity-100"
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
              id="name"
              type="text"
              placeholder="Name"
              required
              minLength={3}
              maxLength={16}
              pattern="[A-Za-z][A-Za-z0-9\-_]*"
              title="Only letters, numbers or dash"
              {...register("name")}
            />
          </label>

          {/* Full Name */}
          <label
            htmlFor="fullName"
            className="input validator w-full my-2 rounded-md"
          >
            <svg
              className="h-[1em] opacity-100"
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
              type="text"
              placeholder="Full Name"
              pattern="[A-Za-z][A-Za-z0-9\-_ ]*"
              required
              minLength={3}
              maxLength={30}
              {...register("fullName")}
            />
          </label>

          {/* Email */}
          <label
            htmlFor="email"
            className="input validator w-full my-2 rounded-md"
          >
            <svg
              className="h-[1em] opacity-100"
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
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </g>
            </svg>
            <input
              id="email"
              type="email"
              placeholder="mail@site.com"
              required
              pattern="^\S+@\S+\.\S+$"
              {...register("email")}
            />
          </label>

          {/* Password */}
          <label
            htmlFor="password"
            className="input validator w-full my-2 relative rounded-md"
          >
            <svg
              className="h-[1em] opacity-100"
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
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              autoComplete="new-password"
              required
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be at least 8 characters and include uppercase, lowercase, and a number"
              {...register("password")}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="cursor-pointer "
            >
              {showPassword ? (
                <RiEyeLine className="text-gray-400 text-[15px]" />
              ) : (
                <RiEyeOffLine className="text-gray-400 text-[15px]" />
              )}
            </span>
          </label>

          {/* Avatar Upload */}
          <fieldset className="fieldset my-2 rounded-md">
            <legend className="fieldset-legend font-medium opacity-50">
              Pick an Avatar Image
            </legend>
            <input
              type="file"
              accept="image/*"
              required
              className="file-input w-full rounded-md"
              {...register("avatar")}
            />
            <label className="fieldset-label  font-medium">Max size 5MB</label>
          </fieldset>

          {/* Cover Image Upload */}
          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend  font-medium opacity-50 ">
              Pick a Cover Image (Optional)
            </legend>
            <input
              type="file"
              accept="image/*"
              className="file-input w-full rounded-md"
              {...register("coverImage")}
            />
            <label className="fieldset-label font-medium">Max size 5MB</label>
          </fieldset>

          {/* Errors / Success */}
          {errorMessage && (
            <p className="text-red-500 text-center my-2">{errorMessage}</p>
          )}
          {successMessage && (
            <p className="text-green-600 text-center my-2">{successMessage}</p>
          )}

          {/* Submit / Loader */}
          <div className="h-[40px] w-full mt-5">
            {loader ? (
              <div className="relative w-full h-full rounded-md overflow-hidden box-border border border-gray-600">
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
                Register
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
