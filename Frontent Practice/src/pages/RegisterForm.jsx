import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import {useNavigate} from "react-router-dom"
const RegisterForm = () => {
  let { register, handleSubmit } = useForm();
  let [error, setError] = useState(false);
  let [loader, setLoader] = useState(false);
  let navigate = useNavigate()

  let submit = async (data) => {
    setLoader(true);
    setError(false)
    let formData = new FormData();
    formData.append("fullName", data.fullName);
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);
    formData.append("avatar", data.avatar[0]);
    formData.append("coverImage", data.coverImage[0]);

    try {
      let res = await axios.post(
        "http://localhost:8000/user/register",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      setLoader(false);
      if (res.data?.success) {
        navigate("/login")
      }
    } catch (error) {
      setLoader(false);
      setError(error?.response?.data?.message);
    }
  };

  return (
    <>

      <div className="flex justify-center items-center min-h-screen">
        <div className="w-full max-w-md justify-end p-5">
          <h1 className="text-center text-[40px] mb-5">Register Here</h1>
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </g>
              </svg>
              <input
                key={"input"}
                type="input"
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
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </g>
              </svg>
              <input
                key={"input"}
                type="input"
                required
                name="fullName"
                {...register("fullName")}
                placeholder="Fullname"
                minLength="3"
                maxLength="30"
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
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </g>
              </svg>
              <input
                key={"email"}
                type="email"
                placeholder="mail@site.com"
                name="email"
                {...register("email")}
                required
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
                  <circle
                    cx="16.5"
                    cy="7.5"
                    r=".5"
                    fill="currentColor"
                  ></circle>
                </g>
              </svg>
              <input
                key={"password"}
                type="password"
                name="password"
                {...register("password")}
                placeholder="Password"
                minLength="5"
                required
                pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
                title="Must be more than 8 characters, including number, lowercase letter, uppercase letter"
              />
            </label>

            <br />

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
              <label className="fieldset-label">Max size 2MB</label>
            </fieldset>

            <fieldset className="fieldset my-2 ">
              <legend className="fieldset-legend opacity-50">
                Pick an image for Cover-Image ( Optional )
              </legend>
              <input
                type="file"
                accept="image/*"
                name="coverImage"
                {...register("coverImage")}
                className="file-input w-full"
              />
              <label className="fieldset-label w-full">Max size 2MB</label>
            </fieldset>
            {error && <p className="text-red-500 text-center my-2">{error}</p>}

            <button className="btn btn-primary w-full my-2" type="submit">
              {loader ? (
                <span className="loading loading-dots loading-lg"></span>
              ) : (
                "Register"
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;
