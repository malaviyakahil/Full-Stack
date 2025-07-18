import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteFromHsitory, fetchHistory } from "../store/history.slice.js";
import { formatDistanceToNowStrict } from "date-fns";
import { Link } from "react-router-dom";
import { RxCross2 } from "react-icons/rx";
import axios from "axios";

const History = () => {
  let history = useSelector((store) => store.history);
  let dispatch = useDispatch();

  useEffect(() => {
    if (!history.data) {
      dispatch(fetchHistory());
    }
  }, []);

  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  let deleteVideo = async (id) => {
    dispatch(deleteFromHsitory(id));
    await axios.post(`http://localhost:8000/user/delete-history/${id}`, [], {
      withCredentials: true,
    });
  };

  return (
    <div className="flex flex-col items-center py-5">
    
        {history.loading ? (
          <>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className="md:flex py-2.5 gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px] animate-pulse"
              >
                <div className="relative w-full aspect-video overflow-hidden rounded-lg bg-gray-800 flex justify-center items-center">
                  <div className="h-full w-full bg-gray-700"></div>
                  <div className="absolute bottom-2 right-2 bg-gray-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded w-10 h-4"></div>
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
          <>
            {history.data?.length > 0 ? (
              <>
                {history.data?.map((item) => (
                  <div
                    key={item?._id}
                    className="md:flex py-2.5 gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                  >
                    <div className="relative  w-full aspect-video overflow-hidden rounded-lg bg-black flex justify-center">
                      <Link
                        to={`/app/dashboard/single-video/${item?.video?.owner._id}/${item?.video?._id}`}
                      >
                        <img
                          src={item?.video?.thumbnail}
                          alt={item?.video?.title}
                          className="h-full object-contain"
                        />

                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                          {formatTime(item?.video?.duration)}
                        </div>
                      </Link>
                    </div>

                    <div className="w-full md:w-[50%]">
                      <Link
                        to={`/app/dashboard/single-video/${item?.video?.owner._id}/${item?.video?._id}`}
                      >
                        <h3 className="text-lg my-2 font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                          {item?.video?.title}
                        </h3>
                      </Link>
                      <p className="text-gray-400 text-sm mb-2">
                        {item?.video?.views} views •{" "}
                        {formatDistanceToNowStrict(new Date(item?.video?.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      <div className="flex items-center justify-between gap-2 mb-2">
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
                            className="text-gray-400"
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
                      <div className="hidden md:block">
                        <p className="my-2 leading-tight text-gray-300 break-words overflow-hidden text-ellipsis line-clamp-2">
                          {item?.video?.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[80vh]">
                <h2 className="text-xl md:text-2xl font-semibold ">
                  No history to show
                </h2>
                <p className="text-sm text-gray-500 mt-2">Start watching videos to build your watch history.</p>
              </div>
            )}
          </>
        )}
      
    </div>
  );
};

export default History;
