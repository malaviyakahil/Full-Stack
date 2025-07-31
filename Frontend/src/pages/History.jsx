import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  deleteFromHsitory,
  fetchHistory,
  setHistory,
} from "../store/history.slice.js";
import { formatDistanceToNowStrict } from "date-fns";
import { Link } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import formatTime from "../utils/formatTime";
import { deleteHistory } from "../apis/user.apis.js";
import formatNumber from "../utils/formatNumber.js";

const History = () => {
  const [isDeleteLocked, setIsDeleteLocked] = useState(false);
  let { data, loading } = useSelector((store) => store.history);
  let dispatch = useDispatch();
  let [error, setError] = useState("");

  useEffect(() => {
    if (!data) {
      dispatch(fetchHistory());
    }
  }, []);

  const deleteVideo = async (id) => {
    if (isDeleteLocked) return;
    setIsDeleteLocked(true);

    // Unlock after 0.5s regardless of API completion
    setTimeout(() => {
      setIsDeleteLocked(false);
    }, 500);

    const prevHistory = [...data];
    try {
      dispatch(deleteFromHsitory(id));
      await deleteHistory(id);
    } catch (error) {
      setError(error?.message);
      dispatch(setHistory(prevHistory));
    }
  };

  return (
    <div className="flex flex-col items-center py-5">
      {data?.length > 0 && (
        <div className="w-full flex justify-start md:w-[536px] lg:w-[760px] xl:w-[980px] mb-2">
          <h2 className="text-3xl">History</h2>
        </div>
      )}
      {loading ? (
        <>
          {[...Array(4)].map((_, index) => (
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
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {data?.length > 0 ? (
            <>
              {data?.map((item) => (
                <div
                  key={item?._id}
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

                      <div className="absolute text-xs md:text-sm bottom-2 right-2 bg-black bg-opacity-75   px-1 py-0.5 rounded">
                        {formatTime(item?.video?.duration)}
                      </div>
                    </Link>
                  </div>

                  <div className="md:block hidden md:w-[50%] ">
                    <Link
                      to={`/app/dashboard/single-video/${item?.video?.owner._id}/${item?.video?._id}`}
                    >
                      <h3 className=" my-2 text-md md:text-lg font-semibold leading-tight break-all overflow-hidden text-ellipsis line-clamp-2">
                        {item?.video?.title}
                      </h3>
                    </Link>
                    <p className="text-gray-400 text-sm md:text-md mb-2">
                      {formatNumber(item?.video?.views)} views •{" "}
                      {formatDistanceToNowStrict(
                        new Date(item?.video?.createdAt),
                        {
                          addSuffix: true,
                        },
                      )}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                        >
                          <div className="w-9 h-9 overflow-hidden rounded-full">
                            <img
                              className="object-cover h-full w-full"
                              src={item?.video?.owner?.avatar}
                            />
                          </div>
                        </Link>

                        <Link
                          className="text-gray-400 text-sm md:text-md"
                          to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                        >
                          {item?.video?.owner?.name}
                        </Link>
                      </div>
                      <button
                        onClick={() => {
                          deleteVideo(item?._id);
                        }}
                        className="bg-gray-700 hover:bg-gray-600 p-3 rounded-4xl"
                      >
                        <RxCross2 />
                      </button>
                    </div>
                  </div>

                  <div className="w-full  md:hidden mt-3 flex flex-nowrap gap-2">
                    <div className="flex flex-col flex-1 overflow-hidden w-full">
                      <h3 className="  font-semibold leading-tight break-all overflow-hidden text-ellipsis line-clamp-2">
                        {item?.video?.title}
                      </h3>
                      <div className="text-sm text-gray-400 flex md:block items-center gap-1">
                        <Link
                          to={`/app/dashboard/single-channel/${item?.video?.owner._id}`}
                        >
                          <p className="text-sm text-gray-400 md:mt-1 whitespace-nowrap overflow-hidden text-ellipsis hover:text-gray-100">
                            {item?.video?.owner?.name}
                          </p>
                        </Link>
                        <p className="block md:hidden">•</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(item?.video?.views)} views •{" "}
                            {formatDistanceToNowStrict(
                              new Date(item?.video?.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => deleteVideo(item?._id)}
                        disabled={isDeleteLocked}
                        className="bg-gray-700 hover:bg-gray-600 p-3 rounded-4xl disabled:opacity-50"
                      >
                        <RxCross2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {data?.length != 0 && (
                <p className="text-center pt-2 text-gray-400">
                  No more history to show.
                </p>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80vh]">
              <h2 className=" text-4xl font-bold text-gray-300 text-center ">
                No history to show
              </h2>
              <p className="text-md text-gray-500 mt-2">
                Start watching videos to build your watch history.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default History;
