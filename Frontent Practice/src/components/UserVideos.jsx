import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { BiDislike, BiLike } from "react-icons/bi";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "./Skeleton";
import { deletOneVideo } from "../store/userVideos.slice";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { incrementView } from "../store/userVideos.slice.js";
import { RiEditBoxLine } from "react-icons/ri";
import { MdDeleteOutline } from "react-icons/md";

const UserVideoCard = ({ video }) => {

  let dispatch = useDispatch();

  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const deleteVideo = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(deletOneVideo(video?._id));
    await axios.post(
      `http://localhost:8000/video/delete-video/${video?._id}`,
      [],
      { withCredentials: true },
    );
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

        <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
          {video?.views} views •{" "}
          {formatDistanceToNow(new Date(video?.createdAt), {
            addSuffix: true,
          })}
        </p>

        <div className="flex gap-2 pt-2">
          <Link
            to={`/app/my-videos/edit-video/${video?._id}`}
            state={{
              title: video?.title,
              description: video?.description,
              thumbnail: video?.thumbnail,
            }}
          >
            <button className="bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] flex gap-2 justify-center items-center ">
             <RiEditBoxLine/> Edit
            </button>
          </Link>
          <button
            onClick={deleteVideo}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-0.5 rounded-md text-[14px] flex gap-2 justify-center items-center "
          >
           <MdDeleteOutline className="text-[16px]"/> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const UserVideos = () => {

  let currentUserVideos = useSelector((store) => store.currentUserVideos);
  let currentUser = useSelector((store) => store.currentUser);
  let dispatch = useDispatch();
  let navigate = useNavigate();
  
  return (
    <>
      <div className="mx-auto max-w-6xl flex w-full items-center justify-center flex-wrap gap-5">
        <button
          className=" bg-gray-700 hover:bg-gray-600 rounded-lg p-2 px-4 "
          onClick={() => {
            navigate("/app/my-videos/upload-video");
          }}
        >
          + Upload video
        </button>
        <button className=" bg-gray-700 hover:bg-gray-600 rounded-lg p-2 px-4">
          {currentUser?.data?.subs} subscribers • {" "}
          {currentUser?.data?.totalViews} Total views
        </button>
      </div>
      {currentUserVideos.loading ? (
        <Skeleton />
      ) : (
        <>
          {currentUserVideos.data?.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6 py-4">
              {currentUserVideos.data?.map((video) => (
                <Link
                  key={video._id}
                  to={`/app/dashboard/single-video/${currentUser.data._id}/${video._id}`}
                  onClick={() => {
                    dispatch(incrementView(video._id));
                  }}
                >
                  <UserVideoCard video={video} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="pt-70">
              <h2 className="text-center">You haven't uploaded any video</h2>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default UserVideos;
