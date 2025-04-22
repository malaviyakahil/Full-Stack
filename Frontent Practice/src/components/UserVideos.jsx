import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BiDislike, BiLike } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "./Skeleton";
import {
  deletOneVideo,
  fetchcurrentUserVideos,
} from "../store/userVideos.slice";
import axios from "axios";

const UserVideoCard = ({ video }) => {
  let dispatch = useDispatch();

  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };
  return (
    <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] cursor-pointer">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-black flex justify-center">
        <img
          src={video?.thumbnail}
          alt={video?.title}
          className="h-full object-contain"
        />
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
          {formatTime(video?.duration)}
        </div>
      </div>
      <div className="p-1">
        <h3 className="text-sm font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2 my-1">
          {video?.title}
        </h3>
        <div className="flex items-center justify-between gap-4 ">
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <BiLike className="text-gray-400 text-[14px]" />
              <span className="text-[12px] text-gray-400">{video?.likes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <BiDislike className="text-gray-400 text-[14px]" />
              <span className="text-[12px] text-gray-400">
                {video?.dislikes}
              </span>
            </button>
          </div>
          <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
            {video?.views} views
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
            {new Date(video?.createdAt).toDateString()}
          </p>
        </div>
        <div className="flex gap-2 pt-2">
          <Link
            to={`/app/my-videos/edit-video/${video?._id}`}
            state={{
              title: video?.title,
              description: video?.description,
              thumbnail: video?.thumbnail,
            }}
          >
            <button className="bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px]">
              Edit
            </button>
          </Link>
          <button
            onClick={() => {
              (async () => {
                dispatch(deletOneVideo(video?._id));
                await axios.post(
                  `http://localhost:8000/video/delete-video/${video?._id}`,
                  [],
                  { withCredentials: true },
                );
              })();
            }}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UserVideos = () => {
  let currentUserVideos = useSelector((store) => store.currentUserVideos);
  let navigate = useNavigate();
  return (
    <>
      <div className="h-full w-full">
        <div className="flex w-full justify-center">
          <button
            className=" bg-gray-700 hover:bg-gray-600 rounded-lg p-2 px-4"
            onClick={() => {
              navigate("/app/my-videos/upload-video");
            }}
          >
            + Upload video
          </button>
        </div>
        {currentUserVideos.loading ? (
          <Skeleton />
        ) : (
          <>
            {currentUserVideos.data?.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6 p-4">
                {currentUserVideos.data?.map((video) => (
                  <UserVideoCard key={video._id} video={video} />
                ))}
              </div>
            ) : (
              <div className="pt-70">
                <h2 className="text-center">You haven't uploaded any video</h2>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default UserVideos;
