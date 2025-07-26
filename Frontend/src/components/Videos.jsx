import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Skeleton from "./Skeleton";
import { Link } from "react-router-dom";
import { formatDistanceToNowStrict } from "date-fns";
import InfiniteScroll from "react-infinite-scroll-component";
import { fetchVideos } from "../store/videos.slice";
import formatTime from "../utils/formatTime";
import formatNumber from "../utils/formatNumber";

const VideoCard = ({ video }) => {
  return (
    <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] cursor-pointer">
      <div className="relative w-full aspect-video overflow-hidden rounded-md bg-black flex justify-center">
        <img
          src={video?.thumbnail}
          alt={video?.title}
          className="h-full object-contain"
        />
        <div className="text-xs absolute bottom-2 right-2 bg-black bg-opacity-75 px-1 py-0.5 rounded-md">
          {formatTime(video?.duration)}
        </div>
      </div>
      <div className="flex flex-row mt-3 gap-3">
        <div className="w-9 h-9 overflow-hidden rounded-full">
          <Link to={`/app/dashboard/single-channel/${video.owner._id}`}>
            <img
              className="object-cover h-full w-full"
              src={video?.owner?.avatar}
            />
          </Link>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <h3 className="text-white font-semibold leading-tight break-all overflow-hidden text-ellipsis line-clamp-2">
            {video?.title}
          </h3>
          <div className="text-sm text-gray-400 flex md:block items-center gap-1">
            <Link to={`/app/dashboard/single-channel/${video.owner._id}`}>
              <p className="text-sm text-gray-400 md:mt-1 whitespace-nowrap overflow-hidden text-ellipsis hover:text-gray-100">
                {video?.owner?.name}
              </p>
            </Link>
            <p className="block md:hidden">•</p>
            <div className="flex items-center gap-1">
              <p className="text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                {formatNumber(video?.views)} views •{" "}
                {formatDistanceToNowStrict(new Date(video?.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Videos = () => {
  const dispatch = useDispatch();
  const {
    data: videos,
    fetched,
    loading,
    hasMore,
  } = useSelector((store) => store.videos);

  return (
    <div className="w-full">
      {loading && !fetched === 0 ? (
        <Skeleton />
      ) : (
        <InfiniteScroll
          className="w-full"
          scrollableTarget="scrollableDiv"
          dataLength={videos?.length}
          next={() => {
            if (!loading && hasMore) dispatch(fetchVideos());
          }}
          hasMore={hasMore}
          loader={<Skeleton />}
          endMessage={
            videos.length > 0 && (
              <p className="text-center text-gray-400">
                No more videos to load.
              </p>
            )
          }
        >
          {videos.length > 0 ? (
            <div className="flex flex-wrap w-full justify-center gap-6 py-4">
              {videos.map((video) => (
                <Link
                  className="block w-full"
                  key={video._id}
                  to={`/app/dashboard/single-video/${video.owner._id}/${video._id}`}
                >
                  <VideoCard video={video} />
                </Link>
              ))}
            </div>
          ) : (
            <>
              {fetched && (
                <div className="h-[80dvh] w-full flex flex-col items-center justify-center">
                  <h2 className=" text-4xl font-bold text-gray-300 text-center">
                    No videos to show
                  </h2>
                  <p className="text-md text-gray-500 mt-2">
                    Please check back later.
                  </p>
                </div>
              )}
            </>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default Videos;
