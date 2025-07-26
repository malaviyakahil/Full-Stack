import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { formatDistanceToNowStrict } from "date-fns";
import { Link } from "react-router-dom";
import { fetchLikedVideos } from "../store/likedVideos.slice.js";
import InfiniteScroll from "react-infinite-scroll-component";
import formatTime from "../utils/formatTime";
import formatNumber from "../utils/formatNumber.js";

const LikedVideos = () => {
  let { data, loading, hasMore, limit, fetched } = useSelector(
    (store) => store.likedVideos,
  );
  let dispatch = useDispatch();

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchLikedVideos());
    }
  }, []);

  return (
    <div className="flex flex-col items-center py-5">
      {data?.length > 0 && (
        <div className="w-full flex justify-start md:w-[536px] lg:w-[760px] xl:w-[980px] mb-2">
          <h2 className="text-3xl">Liked videos</h2>
        </div>
      )}
      {loading ? (
        <>
          {[...Array(limit)].map((_, index) => (
            <div
              key={index}
              className="md:flex py-2.5 gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px] animate-pulse"
            >
              <div className="relative w-full aspect-video overflow-hidden rounded-md bg-gray-800 flex justify-center items-center">
                <div className="h-full w-full bg-gray-700"></div>
                <div className="absolute bottom-2 right-2 bg-gray-600 bg-opacity-75   px-1 py-0.5 rounded w-10 h-4"></div>
              </div>

              <div className="w-full md:w-[50%] flex flex-col justify-start+">
                <div>
                  <div className="h-5 bg-gray-700 rounded my-2 w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-gray-700 rounded-full"></div>
                  <div className="h-4 bg-gray-600 rounded w-24"></div>
                </div>

                <div className="hidden md:block">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-[90%]"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <InfiniteScroll
          scrollableTarget="scrollableDiv"
          dataLength={data?.length}
          next={() => {
            if (!loading && hasMore) {
              dispatch(fetchLikedVideos());
            }
          }}
          hasMore={hasMore}
          loader={[...Array(limit)].map((_, index) => (
            <div
              key={index}
              className="md:flex py-2.5 gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]  animate-pulse"
            >
              <div className="relative w-full aspect-video overflow-hidden rounded-md bg-gray-800 flex justify-center items-center">
                <div className="h-full w-full bg-gray-700"></div>
                <div className="absolute bottom-2 right-2 bg-gray-600 bg-opacity-75   px-1 py-0.5 rounded w-10 h-4"></div>
              </div>

              <div className="w-full md:w-[50%] flex flex-col justify-start+">
                <div>
                  <div className="h-5 bg-gray-700 rounded my-2 w-3/4"></div>
                  <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 bg-gray-700 rounded-full"></div>
                  <div className="h-4 bg-gray-600 rounded w-24"></div>
                </div>

                <div className="hidden md:block">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-700 rounded w-[90%]"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          endMessage={
            data?.length != 0 && (
              <p className="text-center  py-6 text-gray-400">
                No more liked videos to show.
              </p>
            )
          }
        >
          
          {data?.length > 0 ? (
            <>
              {data?.map((item) => (
                <div
                  key={item?.video?._id}
                  className="md:flex py-2.5 gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                >
                  <div className="relative  w-full aspect-video overflow-hidden rounded-md bg-black flex justify-center">
                    <Link
                      to={`/app/dashboard/single-video/${item?.video?.owner._id}/${item?.video?._id}`}
                    >
                      <img
                        src={item?.video?.thumbnail}
                        alt={item?.video?.title}
                        className="h-full object-contain"
                      />

                      <div className="absolute text-xs md:text-sm  bottom-2 right-2 bg-black bg-opacity-75   px-1 py-0.5 rounded">
                        {formatTime(item?.video?.duration)}
                      </div>
                    </Link>
                  </div>

                  <div className="w-full md:w-[50%]">
                    <Link
                      to={`/app/dashboard/single-video/${item?.video?.owner._id}/${item?.video?._id}`}
                    >
                      <h3 className=" my-2 text-md md:text-lg font-semibold leading-tight break-all overflow-hidden text-ellipsis line-clamp-2">
                        {item?.video?.title}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-1 mb-2 text-sm md:md">
                      <Link
                        className="text-gray-400 block md:hidden"
                        to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                      >
                        {item?.video?.owner?.name} •{" "}
                      </Link>
                      <p className="text-gray-400 ">
                        {formatNumber(item?.video?.views)} views •{" "}
                        {formatDistanceToNowStrict(
                          new Date(item?.video?.createdAt),
                          {
                            addSuffix: true,
                          },
                        )}
                      </p>
                    </div>
                    <div className="items-center justify-between gap-2 hidden md:flex">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                        >
                          <div className="w-9 h-9  overflow-hidden rounded-full">
                            <img
                              className="object-cover h-full w-full"
                              src={item?.video?.owner?.avatar}
                            />
                          </div>
                        </Link>

                        <Link
                          className="text-gray-400"
                          to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                        >
                          {item?.video?.owner?.name}
                        </Link>
                      </div>
                    </div>
                    <div className="hidden md:block">
                      <p className="my-2 leading-tight text-gray-300 break-all overflow-hidden text-ellipsis line-clamp-2">
                        {item?.video?.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80vh]">
              <h2 className=" text-4xl text-center font-bold text-gray-300 ">
                You haven't liked any video yet
              </h2>
              <p className="text-md text-gray-500 mt-2 text-center">
                Explore and like videos to see them here.
              </p>
            </div>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default LikedVideos;
