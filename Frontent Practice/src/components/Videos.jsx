import React from "react";
import { useSelector } from "react-redux";
import Skeleton from "./Skeleton";
import { Link } from "react-router-dom";

const VideoCard = ({ video }) => {
  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };
  return (
    <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] cursor-pointer ">
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
      <div className="flex flex-row mt-3 gap-3">
        <div className="w-9 h-9 overflow-hidden rounded-full">
          <img
            className="object-cover h-full w-full"
            src={video?.owner?.avatar}
          />
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-sm font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
            {video?.title}
          </h3>
          <p className="text-xs text-gray-400 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
            {video?.owner?.name}
          </p>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
              {video?.views} views
            </p>
            <p className="text-[12px] text-gray-400">•</p>
            <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
              {new Date(video?.createdAt).toDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Videos = () => {
  let videos = useSelector((store) => store.videos);

  return (
    <>
      {videos.loading ? (
        <Skeleton />
      ) : (
        <div className="flex flex-wrap justify-center gap-6 p-4">
          {videos.data?.map((video) => (
            <Link key={video._id}
              to={`/app/dashboard/single-video/${video.owner._id}/${video._id}`}
            >
              <VideoCard key={video._id} video={video} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
};

export default Videos;
