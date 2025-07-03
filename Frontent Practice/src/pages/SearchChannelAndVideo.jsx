import React, { useEffect, useState } from "react";
import Panel from "../components/Panel";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { formatDistanceToNow } from "date-fns";

const SearchChannelAndVideo = () => {
  
  let { name } = useParams();
  let [loading, setLoading] = useState(false);
  let [data, setData] = useState({ channel: [], video: [] });
  let currentUser = useSelector((store) => store.currentUser);

  let formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const subscribeToggle = (id, status) => {
    if (status) {
      setData({
        ...data,
        channel: data.channel.map((e) => {
          if (e._id == id) {
            return {
              ...e,
              subStatus: false,
              subscribersCount: e.subscribersCount - 1,
            };
          }
        }),
        video: [...data.video],
      });
      axios.post(`http://localhost:8000/user/unsubscribe-to/${id}`, [], {
        withCredentials: true,
      });
    } else {
      setData({
        ...data,
        channel: data.channel.map((e) => {
          if (e._id == id) {
            return {
              ...e,
              subStatus: true,
              subscribersCount: e.subscribersCount + 1,
            };
          }
        }),
        video: [...data.video],
      });
      axios.post(`http://localhost:8000/user/subscribe-to/${id}`, [], {
        withCredentials: true,
      });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      let res = await axios.get(
        `http://localhost:8000/user/search-channel-and-video/${name}`,
        {
          withCredentials: true,
        },
      );
      setData({
        ...data,
        channel: res.data.data.channel || [],
        video: res.data.data.video || [],
      });
      setLoading(false);
    })();
  }, [name]);

  return (
    <>
      <div className=" w-full py-3">
        <Panel />
        <div className="flex flex-col items-center pt-5">
          {loading ? (
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
              {data.channel.map((profile) => (
                <div key={profile._id}>
                  <div className=" flex flex-col sm:flex-row items-center w-full max-w-5xl gap-6 border-b-[1px] border-gray-600 py-5">
                    <div className="w-48 h-48 relative overflow-hidden rounded-full bg-gray-800">
                      <Link
                        to={`/app/dashboard/single-channel/${profile?._id}`}
                      >
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          className="object-cover w-full h-full"
                        />
                      </Link>
                    </div>

                    <div className="flex-1">
                      <Link
                        to={`/app/dashboard/single-channel/${profile?._id}`}
                      >
                        <h1 className="text-2xl font-bold">{profile.name}</h1>
                      </Link>
                      <p className="text-gray-400">
                        @{profile.name} • {profile.subscribersCount} subscribers
                      </p>
                    </div>

                    <div>
                      {profile?._id == currentUser.data?._id ? (
                        ""
                      ) : (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => {
                              subscribeToggle(profile?._id, profile?.subStatus);
                            }}
                            className={`text-white px-4 py-1 rounded-4xl text-md ${
                              profile?.subStatus
                                ? "bg-gray-800"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                          >
                            {profile?.subStatus ? "Subscribed" : "Subscribe"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-full max-w-5xl pt-5">
                    <h2 className="text-xl font-semibold">
                      Latest from {profile?.name}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-5 py-5  border-b-[1px] border-gray-600">
                    {profile.videos.map((video) => (
                      <div
                        key={video?._id}
                        className="md:flex w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                      >
                        <div className="relative  w-full aspect-video overflow-hidden rounded-lg bg-black flex justify-center">
                          <Link
                            to={`/app/dashboard/single-video/${profile?._id}/${video?._id}`}
                          >
                            <img
                              src={video?.thumbnail}
                              alt={video?.title}
                              className="h-full object-contain"
                            />

                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                              {formatTime(video?.duration)}
                            </div>
                          </Link>
                        </div>

                        <div className="w-full md:w-[50%] pl-5">
                          <Link
                            to={`/app/dashboard/single-video/${profile?._id}/${video?._id}`}
                          >
                            <h3 className="text-lg my-2 font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                              {video?.title}
                            </h3>
                          </Link>
                          <p className="text-gray-400 text-sm mb-2">
                            {video.views} views •{" "}
                            {formatDistanceToNow(new Date(video?.createdAt), {
                              addSuffix: true,
                            })}
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
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex flex-col gap-5 py-5">
                {data.video.map((video) => (
                  <div
                    key={video?._id}
                    className="md:flex gap-5 w-full cursor-pointer sm:w-full md:w-[536px] lg:w-[760px] xl:w-[980px]"
                  >
                    <div className="relative  w-full aspect-video overflow-hidden rounded-lg bg-black flex justify-center">
                      <Link to={`/app/dashboard/single-video/${video.owner._id}/${video?._id}`}>
                        <img
                          src={video?.thumbnail}
                          alt={video?.title}
                          className="h-full object-contain"
                        />

                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
                          {formatTime(video?.duration)}
                        </div>
                      </Link>
                    </div>

                    <div className="w-full md:w-[50%]">
                    <Link to={`/app/dashboard/single-video/${video.owner._id}/${video?._id}`}>

                      <h3 className="text-lg my-2 font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2">
                        {video?.title}
                      </h3>
                      </Link>

                      <p className="text-gray-400 text-sm mb-2">
                        {video.views} views •{" "}
                        {formatDistanceToNow(new Date(video?.createdAt), {
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
                              src={video?.owner?.avatar}
                            />
                          </div>
                        </Link>

                        <Link
                          className="text-gray-400"
                          to={`/app/dashboard/single-channel/${video.owner._id}`}
                        >
                          {video?.owner?.name}
                        </Link>
                      </div>
                      <div className="hidden md:block">
                        <p className="my-2 leading-tight text-gray-300 break-words overflow-hidden text-ellipsis line-clamp-2">
                          {video.description} 
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default SearchChannelAndVideo;
