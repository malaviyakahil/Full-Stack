import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState(false);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();

  const submit = async (data) => {
    if (
      data.avatar?.[0]?.size > 5 * 1024 * 1024 &&
      data.coverImage?.[0]?.size > 5 * 1024 * 1024
    ) {
      setError("Too big file for Avatar and Cover Image");
      return;
    }
    if (data.avatar?.[0]?.size > 5 * 1024 * 1024) {
      setError("Too big file for Avatar");
      return;
    }
    if (data.coverImage?.[0]?.size > 5 * 1024 * 1024) {
      setError("Too big file for Cover Image");
      return;
    }

    setLoader(true);
    setError(false);

    const formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("avatar", data.avatar[0]);
    formData.append("coverImage", data.coverImage[0]);

    try {
      const res = await axios.post("http://localhost:8000/user/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLoader(false);
      if (res.data?.success) {
        navigate("/login");
      }
    } catch (error) {
      setLoader(false);
      setError(error?.response?.data?.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Register Here</h1>
        <form className="w-full" onSubmit={handleSubmit(submit)} autoComplete="off">
          {/* Username */}
          <label className="input validator w-full my-2">
            <input
              type="text"
              autoComplete="off"
              required
              name="name"
              {...register("name")}
              placeholder="Username"
              pattern="[A-Za-z][A-Za-z0-9\-]*"
              minLength="3"
              maxLength="30"
              title="Only letters, numbers or dash"
            />
          </label>

          {/* Full Name */}
          <label className="input validator w-full my-2">
            <input
              type="text"
              autoComplete="off"
              required
              name="fullName"
              {...register("fullName")}
              placeholder="Fullname"
              minLength="3"
              maxLength="30"
            />
          </label>

          {/* Email */}
          <label className="input validator w-full my-2">
            <input
              type="email"
              autoComplete="off"
              placeholder="mail@site.com"
              name="email"
              {...register("email")}
              required
            />
          </label>

          {/* Password */}
          <label className="input validator w-full my-2">
            <input
              type="password"
              autoComplete="new-password"
              name="password"
              {...register("password")}
              placeholder="Password"
              minLength="5"
              required
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
            />
          </label>

          {/* Avatar Upload */}
          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend opacity-50">
              Pick an image for Avatar
            </legend>
            <input
              type="file"
              accept="image/*"
              required
              name="avatar"
              {...register("avatar")}
              className="file-input w-full"
            />
            <label className="fieldset-label">Max size 5MB</label>
          </fieldset>

          {/* Cover Image Upload */}
          <fieldset className="fieldset my-2">
            <legend className="fieldset-legend opacity-50">
              Pick an image for Cover-Image (Optional)
            </legend>
            <input
              type="file"
              accept="image/*"
              name="coverImage"
              {...register("coverImage")}
              className="file-input w-full"
            />
            <label className="fieldset-label w-full">Max size 5MB</label>
          </fieldset>

          {/* Error Display */}
          {error && <p className="text-red-500 text-center my-2">{error}</p>}

          {/* Loader or Submit Button */}
          {loader ? (
            <div className="relative w-full h-[40px] rounded-lg overflow-hidden border border-gray-600 my-2">
              <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
              <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
              <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
              <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
            </div>
          ) : (
            <button className="btn bg-gray-600 w-full my-2" type="submit">
              Register
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
