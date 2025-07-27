import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { RiEyeLine, RiEyeOffLine } from "react-icons/ri";
import { authMe, loginUser } from "../apis/user.apis";

const LoginForm = () => {
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState("");
  const [loader, setLoader] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const submit = async (data) => {
    if (loader) return;

    setLoader(true);
    setError("");

    const formData = new FormData();
    formData.append("name", data.name.trim());
    formData.append("email", data.email.trim());
    formData.append("password", data.password.trim());

    try {
      let res = await loginUser(formData);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("accessToken", res.data.refreshToken);
      await authMe();
      setUser({ authenticated: true });
      const redirect =
        new URLSearchParams(location.search).get("redirect") ||
        "/app/dashboard/all";
      navigate(redirect);
    } catch (error) {
      setError(error?.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="h-[100dvh] w-screen flex justify-center items-center">
      <div className="w-full max-w-md px-5">
        <h1 className="text-center text-[40px] mb-5 text-white">Login Here</h1>
        <form
          className="w-full"
          onSubmit={handleSubmit(submit)}
          autoComplete="off"
        >
          {/* Username */}
          <label className="input validator w-full my-2 rounded-md">
            <svg
              className="h-[1em] "
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
              type="text"
              autoComplete="off"
              required
              {...register("name")}
              placeholder="Username"
              pattern="[a-z][a-z0-9\-_]*"
              minLength={3}
              maxLength={16}
              title="Only lower-case letters, numbers, dash or underscore"
            />
          </label>

          {/* Email */}
          <label className="input validator w-full rounded-md my-2">
            <svg
              className="h-[1em] "
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
              type="email"
              autoComplete="off"
              placeholder="mail@site.com"
              {...register("email")}
              required
              pattern="^\S+@\S+\.\S+$"
              title="Enter a valid email address"
            />
          </label>

          {/* Password */}
          <label className="input validator w-full my-2 relative rounded-md">
            <svg
              className="h-[1em] "
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
              className="cursor-pointer "
            >
              {showPassword ? (
                <RiEyeLine className="text-gray-400 text-[15px]" />
              ) : (
                <RiEyeOffLine className="text-gray-400 text-[15px]" />
              )}
            </span>
          </label>

          {/* Error Message */}
          {error && <p className="text-red-500 text-center my-2">{error}</p>}

          {/* Loader or Button */}
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
                Login
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
