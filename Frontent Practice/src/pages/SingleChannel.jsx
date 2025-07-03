import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { changePrevId, fetchCurrentChannel, subscribeToggle } from "../store/currentChannel.js";

// Skeleton component
const SingleChannelSkeleton = () => {
  return (
    <div className="mx-auto flex flex-col items-center text-white max-w-6xl animate-pulse">
      {/* Banner */}
      <div className="w-full md:max-w-3xl xs:max-w-1xl lg:max-w-6xl border-gray-600 border-b-[1px]">
        <div className="w-full aspect-[4/1] bg-gray-800 rounded-lg"></div>

        {/* Profile Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start mt-6 px-4 w-full">
          <div className="w-24 h-24 bg-gray-800 rounded-full"></div>
          <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0 space-y-3 w-full max-w-md">
            <div className="h-6 bg-gray-700 rounded w-48 mx-auto md:mx-0"></div>
            <div className="h-4 bg-gray-600 rounded w-72 mx-auto md:mx-0"></div>
            <div className="flex gap-4 mt-4 justify-center md:justify-start">
              <div className="h-8 w-24 bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-8 w-full px-4">
          <div className="h-8 w-20 bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[370px] cursor-pointer"
          >
            {/* Thumbnail Skeleton */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800"></div>

            {/* Title + Meta */}
            <div className="flex flex-row mt-3 pl-3 gap-3">
              <div className="flex flex-col flex-1 overflow-hidden space-y-2">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="flex gap-2">
                  <div className="h-3 w-16 bg-gray-600 rounded"></div>
                  <div className="h-3 w-3 bg-gray-600 rounded-full"></div>
                  <div className="h-3 w-24 bg-gray-600 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SingleChannel = () => {
  let { ownerId } = useParams();

  let currentChannel = useSelector((store) => store.currentChannel);
  let dispatch = useDispatch();

  useEffect(() => {
    if (ownerId != currentChannel.prevId) {
      dispatch(fetchCurrentChannel(ownerId));
      dispatch(changePrevId(ownerId));
    }
  }, []);

  if (currentChannel.loading) {
    return <SingleChannelSkeleton />;
  }

  return (
    <div className="mx-auto flex flex-col items-center text-white max-w-6xl">
      {/* ... your existing rendering logic */}
      {/* Banner */}
      <div className="w-full md:max-w-3xl xs:max-w-1xl lg:max-w-6xl border-gray-600 border-b-[1px]">
        <div className="w-full bg-black aspect-[4/1] overflow-hidden flex justify-center items-center rounded-lg">
          {currentChannel.data?.coverImage && (
            <img
              src={currentChannel.data?.coverImage}
              alt="Cover"
              className="w-full"
            />
          )}
        </div>

        {/* Profile Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start mt-6 px-4 w-full">
          <div className="w-24 h-24 overflow-hidden rounded-full">
            <img
              src={currentChannel.data?.avatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0">
            <h2 className="text-2xl font-bold">{currentChannel.data?.name}</h2>
            <p className="text-gray-400">
              @{currentChannel.data?.name} •{" "}
              {currentChannel.data?.subscribersCount} subscribers •{" "}
              {currentChannel.data?.videos?.length} videos
            </p>
            <div className="flex gap-4 mt-4 justify-center md:justify-start">
              <button
                onClick={() => {
                  dispatch(
                    subscribeToggle({
                      id: currentChannel.data?._id,
                      status: currentChannel.data?.subStatus,
                    }),
                  );
                }}
                className={`text-white px-4 py-1 rounded-4xl text-md ${
                  currentChannel.data?.subStatus
                    ? "bg-gray-800"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {currentChannel.data?.subStatus ? "Subscribed" : "Subscribe"}
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-8 w-full">
          <button className="pb-2 font-semibold hover:border-b-2 hover:border-white">
            Videos
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
        {currentChannel.data?.videos?.length > 0 ? (
          <>
            {currentChannel.data?.videos?.map((video) => (
              <Link
                key={video._id}
                to={`/app/dashboard/single-video/${ownerId}/${video._id}`}
              >
                <ChannelVideoCard video={video} />
              </Link>
            ))}
          </>
        ) : (
          <h2>No videos uploaded by user</h2>
        )}
      </div>
    </div>
  );
};

export default SingleChannel;

const ChannelVideoCard = ({ video }) => {
  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[370px] cursor-pointer">
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
      <div className="flex flex-row mt-3 pl-3 gap-3">
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
            {video?.title}
          </h3>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
              {video?.views} views
            </p>
            <p className="text-[12px] text-gray-400">•</p>
            <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
              {formatDistanceToNow(new Date(video?.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
