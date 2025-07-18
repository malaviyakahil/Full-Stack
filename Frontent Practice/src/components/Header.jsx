import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { clearCurrentUser, fetchCurrentUser } from "../store/user.slice.js";
import { Link, useNavigate } from "react-router-dom";
import { clearCurrentUserVideos } from "../store/userVideos.slice.js";
import { clearVideos } from "../store/videos.slice.js";
import { clearHistory } from "../store/history.slice.js";
import { clearLikedVideos } from "../store/likedVideos.slice.js";

const Header = () => {
  let currentUser = useSelector((store) => store.currentUser);
  let dispatch = useDispatch();
  let [loader, setLoader] = useState(false);
  let navigate = useNavigate();

  useEffect(() => {
    if (!currentUser.fetched) {
      dispatch(fetchCurrentUser());
    }
  }, [currentUser.fetched, dispatch]);

  let handleLogout = async () => {
    setLoader(true);
    try {
      let res = await axios.post(
        "http://localhost:8000/user/logout",
        [],
        {
          withCredentials: true,
        },
      );
        dispatch(clearCurrentUser());
        dispatch(clearCurrentUserVideos());
        dispatch(clearVideos());
        dispatch(clearHistory());
        dispatch(clearLikedVideos());
        navigate("/");
    } catch (error) {
      console.log(error?.response?.data?.message);
    } finally {
      setLoader(false);
    }
  };

  return (
    <>
      {currentUser.loading ? (
        <div className="navbar bg-base-100 shadow-sm px-6 animate-pulse ">
          <div className="flex-1">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="navbar bg-base-100 shadow-sm px-6 border-b-[1px] border-gray-600">
          <div className="flex-1">
            <Link
              className=" text-xl p-0 font-semibold"
              to="/app/dashboard/all"
            >
              Dashboard
            </Link>
          </div>
          <div className="flex gap-3 items-center">
            <h3>{currentUser?.data?.name}</h3>
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="btn btn-ghost btn-circle avatar"
              >
                <div className="w-8 rounded-full">
                  <img alt="avatar" src={currentUser?.data?.avatar} />
                </div>
              </div>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content bg-base-100 rounded-md border-[1px] border-gray-600 z-1 mt-5 w-30 md:w-52 p-2 shadow"
              >
                <li>
                  <Link className="justify-between" to="/app/profile/details">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link
                    className="justify-between"
                    to="/app/my-videos/uploaded-videos"
                  >
                    My videos
                  </Link>
                </li>
                <li>
                  <Link
                    className="justify-between"
                    to="/app/settings/edit-profile"
                  >
                    Settings
                  </Link>
                </li>
                <li>
                  <a onClick={handleLogout}>
                    {loader ? (
                      <span className="loading loading-dots loading-md"></span>
                    ) : (
                      "Logout"
                    )}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
