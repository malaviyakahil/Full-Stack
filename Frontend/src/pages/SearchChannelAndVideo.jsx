import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatDistanceToNowStrict } from "date-fns";
import formatTime from "../utils/formatTime";
import { searchChannelAndVideo } from "../apis/search.apis";
import { subscribeTo, unSubscribeTo } from "../apis/channel.apis";
import formatNumber from "../utils/formatNumber";

const SearchChannelAndVideo = () => {
  let { name } = useParams();
  let [loading, setLoading] = useState(false);
  let [data, setData] = useState({ channel: [], video: [] });
  let currentUser = useSelector((store) => store.currentUser);
  let [error, setError] = useState("");

  const subscribeToggle = async (id, status) => {
    // 1. Keep a full backup of the previous state
    const prevData = JSON.parse(JSON.stringify(data)); // deep copy

    try {
      // 2. Optimistic UI update
      setData({
        ...data,
        channel: data.channel.map((e) => {
          if (e._id === id) {
            return {
              ...e,
              subStatus: !status,
              subscribersCount: e.subscribersCount + (status ? -1 : 1),
            };
          }
          return e; // Always return a value
        }),
        video: [...data.video],
      });

      // 3. Perform API call
      if (status) {
        await unSubscribeTo(id);
      } else {
        await subscribeTo(id);
      }
    } catch (error) {
      // 4. Rollback on failure
      setData(prevData);
      setError(error?.message);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        let res = await searchChannelAndVideo(name);
        setData({
          ...data,
          channel: res?.data?.channel || [],
          video: res?.data?.video || [],
        });
      } catch (error) {
        setError(error?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [name]);

  return (
    <div className="flex flex-col items-center">
      {error && <p className="text-red-500 text-center my-2">{error}</p>}
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

              <div className="w-full md:w-[50%] flex flex-col justify-start">
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
        <div className="flex flex-col py-5">
          {data.channel.map((profile) => (
            <div key={profile._id}>
              <div className=" md:flex py-5 items-center gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]">
                <div className="w-full aspect-video overflow-hidden rounded-md flex justify-center items-center">
                  <div className="aspect-square w-1/2 md:w-1/3 relative  overflow-hidden rounded-[1000px] bg-gray-800">
                    <Link to={`/app/dashboard/single-channel/${profile?._id}`}>
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="object-cover w-full h-full"
                      />
                    </Link>
                  </div>
                </div>
                <div className="w-full md:w-[50%]">
                  <div className="flex-1">
                    <Link to={`/app/dashboard/single-channel/${profile?._id}`}>
                      <h1 className=" font-bold md:text-left text-xl  text-center">
                        {profile.name}
                      </h1>
                    </Link>
                    <p className="text-gray-400  md:text-left text-md md:text-lg text-center">
                      @{profile.name} • {formatNumber(profile.subscribersCount)}{" "}
                      subscribers
                    </p>
                  </div>

                  <div className="w-full mt-2.5 flex md:block justify-center">
                    {profile?._id == currentUser.data?._id ? (
                      ""
                    ) : (
                      <button
                        onClick={() => {
                          subscribeToggle(profile?._id, profile?.subStatus);
                        }}
                        className={` px-4 py-1 rounded-4xl  ${
                          profile?.subStatus
                            ? "bg-gray-800"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      >
                        {profile?.subStatus ? "Subscribed" : "Subscribe"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              {profile?.videos?.length != 0 && (
                <div className="border-t-[1px] border-gray-600">
                  {" "}
                  <div className="w-full max-w-5xl pt-5">
                    <h2 className="text-gray-400 font-semibold text-lg">
                      Latest from {profile?.name}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-5 py-5  border-b-[1px] border-gray-600">
                    {profile.videos.map((video) => (
                      <div
                        key={video?._id}
                        className="md:flex w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                      >
                        <div className="relative  w-full aspect-video overflow-hidden rounded-md bg-black flex justify-center">
                          <Link
                            to={`/app/dashboard/single-video/${profile?._id}/${video?._id}`}
                          >
                            <img
                              src={video?.thumbnail}
                              alt={video?.title}
                              className="h-full object-contain"
                            />

                            <div className="absolute text-xs md:text-sm bottom-2 right-2 bg-black bg-opacity-75   px-1 py-0.5 rounded">
                              {formatTime(video?.duration)}
                            </div>
                          </Link>
                        </div>

                        <div className="w-full md:w-[50%] pl-5 md:block hidden">
                          <Link
                            to={`/app/dashboard/single-video/${profile?._id}/${video?._id}`}
                          >
                            <h3 className=" my-2 text-md md:text-lg  font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                              {video?.title}
                            </h3>
                          </Link>
                          <p className="text-gray-400  mb-2">
                            {formatNumber(video.views)} views •{" "}
                            {formatDistanceToNowStrict(
                              new Date(video?.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>

                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              to={`/app/dashboard/single-channel/${profile?._id}`}
                            >
                              <div className="w-9 h-9 overflow-hidden rounded-full">
                                <img
                                  className="object-cover h-full w-full"
                                  src={profile?.avatar}
                                />
                              </div>
                            </Link>
                            <Link
                              className="text-gray-400 hover:text-gray-100"
                              to={`/app/dashboard/single-channel/${profile?._id}`}
                            >
                              {profile?.name}
                            </Link>
                          </div>
                          <div className="hidden md:block">
                            <p className="my-2 leading-tight text-gray-300 break-words overflow-hidden text-ellipsis line-clamp-2">
                              {video.description}
                            </p>
                          </div>
                        </div>
                        <div className=" md:hidden flex flex-row mt-3 gap-3">
                          <div className="w-9 h-9 overflow-hidden rounded-full">
                            <Link
                              to={`/app/dashboard/single-channel/${profile?._id}`}
                            >
                              <img
                                className="object-cover h-full w-full"
                                src={profile?.avatar}
                              />
                            </Link>
                          </div>
                          <div className="flex flex-col flex-1 overflow-hidden">
                            <h3 className="text-white font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                              {video?.title}
                            </h3>
                            <div className="text-sm text-gray-400 flex md:block items-center gap-1">
                              <Link
                                to={`/app/dashboard/single-channel/${profile?._id}`}
                              >
                                <p className="text-sm text-gray-400 md:mt-1 whitespace-nowrap overflow-hidden text-ellipsis hover:text-gray-100">
                                  {profile?.name}
                                </p>
                              </Link>
                              <p className="block md:hidden">•</p>
                              <div className="flex items-center gap-1">
                                <p className="text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                                  {formatNumber(video?.views)} views •{" "}
                                  {formatDistanceToNowStrict(
                                    new Date(video?.createdAt),
                                    {
                                      addSuffix: true,
                                    },
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {data.video.length != 0 && (
            <div className="flex flex-col gap-5 py-5 ">
              {data.video.map((video) => (
                <div
                  key={video?._id}
                  className="md:flex  w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                >
                  <div className="relative  w-full aspect-video overflow-hidden rounded-md bg-black flex justify-center">
                    <Link
                      to={`/app/dashboard/single-video/${video.owner._id}/${video?._id}`}
                    >
                      <img
                        src={video?.thumbnail}
                        alt={video?.title}
                        className="h-full object-contain"
                      />

                      <div className="absolute text-xs md:text-sm  bottom-2 right-2 bg-black bg-opacity-75   px-1 py-0.5 rounded">
                        {formatTime(video?.duration)}
                      </div>
                    </Link>
                  </div>

                  <div className="pl-5 w-[50%] md:block hidden">
                    <Link
                      to={`/app/dashboard/single-video/${video.owner._id}/${video?._id}`}
                    >
                      <h3 className=" my-2 text-md md:text-lg  font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                        {video?.title}
                      </h3>
                    </Link>
                    <p className="text-gray-400  mb-2">
                      {formatNumber(video.views)} views •{" "}
                      {formatDistanceToNowStrict(new Date(video?.createdAt), {
                        addSuffix: true,
                      })}
                    </p>

                    <div className="flex items-center gap-2 mb-2">
                      <Link
                        to={`/app/dashboard/single-channel/${video.owner._id}`}
                      >
                        <div className="w-9 h-9 overflow-hidden rounded-full">
                          <img
                            className="object-cover h-full w-full"
                            src={video.owner.avatar}
                          />
                        </div>
                      </Link>
                      <Link
                        className="text-gray-400 hover:text-gray-100"
                        to={`/app/dashboard/single-channel/${video.owner._id}`}
                      >
                        {video.owner.name}
                      </Link>
                    </div>
                    <div className="hidden md:block">
                      <p className="my-2 leading-tight text-gray-300 break-words overflow-hidden text-ellipsis line-clamp-2">
                        {video.description}
                      </p>
                    </div>
                  </div>

                  <div className=" md:hidden flex flex-row mt-3 gap-3">
                    <div className="w-9 h-9 overflow-hidden rounded-full">
                      <Link
                        to={`/app/dashboard/single-channel/${video.owner?._id}`}
                      >
                        <img
                          className="object-cover h-full w-full"
                          src={video.owner?.avatar}
                        />
                      </Link>
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                      <h3 className="text-white font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                        {video?.title}
                      </h3>
                      <div className="text-sm text-gray-400 flex md:block items-center gap-1">
                        <Link
                          to={`/app/dashboard/single-channel/${video.owner?._id}`}
                        >
                          <p className="text-sm text-gray-400 md:mt-1 whitespace-nowrap overflow-hidden text-ellipsis hover:text-gray-100">
                            {video.owner?.name}
                          </p>
                        </Link>
                        <p className="block md:hidden">•</p>
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
                            {formatNumber(video?.views)} views •{" "}
                            {formatDistanceToNowStrict(
                              new Date(video?.createdAt),
                              {
                                addSuffix: true,
                              },
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <p className="text-center pt-2 text-gray-400">
            No more videos to show.
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchChannelAndVideo;
