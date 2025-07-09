import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../components/AuthContext"; // 🔑 Use AuthContext

const LoginForm = () => {
  const { register, handleSubmit } = useForm();
  const [error, setError] = useState(false);
  const [loader, setLoader] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();

  const submit = async (data) => {
    setLoader(true);
    setError(false);
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("email", data.email);
    formData.append("password", data.password);

    try {
      const res = await axios.post("http://localhost:8000/user/login", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      if (res.data?.success) {
        const userRes = await axios.get("http://localhost:8000/user/auth-me", {
          withCredentials: true,
        });

        setUser(userRes.data.data || { authenticated: true });

        const redirect =
          new URLSearchParams(location.search).get("redirect") || "/app/dashboard/all";
        navigate(redirect);
      }
    } catch (error) {
      setError(error?.response?.data?.message || "Login failed");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-full max-w-md justify-end p-5">
        <h1 className="text-center text-[40px] mb-5">Login Here</h1>
        <form className="w-full" onSubmit={handleSubmit(submit)} autoComplete="off">
          {/* Username */}
          <label className="input validator w-full my-2">
            <input
              type="text"
              autoComplete="off"
              required
              {...register("name")}
              placeholder="Username"
              pattern="[A-Za-z][A-Za-z0-9\-]*"
              minLength="3"
              maxLength="30"
              title="Only letters, numbers or dash"
            />
          </label>

          {/* Email */}
          <label className="input validator w-full my-2">
            <input
              type="email"
              autoComplete="off"
              placeholder="mail@site.com"
              {...register("email")}
              required
            />
          </label>

          {/* Password */}
          <label className="input validator w-full my-2">
            <input
              type="password"
              autoComplete="new-password"
              required
              {...register("password")}
              placeholder="Password"
              pattern="(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}"
              title="Must contain at least 1 number, 1 uppercase and 1 lowercase letter, and be at least 8 characters"
            />
          </label>

          {/* Error Message */}
          {error && <p className="text-red-500 text-center my-2">{error}</p>}

          {/* Loader or Button */}
          {loader ? (
            <div className="relative w-full h-[40px] rounded-lg overflow-hidden border border-gray-600 my-2">
              <div className="absolute top-[0px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-5" />
              <div className="absolute top-[9px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-3" />
              <div className="absolute top-[17px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-4" />
              <div className="absolute top-[22px] w-[16px] h-[16px] rounded-full bg-white animate-slide-left-6" />
            </div>
          ) : (
            <button className="btn bg-gray-600 w-full my-2" type="submit">
              Login
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
