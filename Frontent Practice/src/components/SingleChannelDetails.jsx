import React from "react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";

const SingleChannelDetails = ({ ownerId }) => {
  let [currentChannel, setCurrentChannel] = useState({});
  const [loading, setLoading] = useState(false);
  let [subCount, setSubCount] = useState({
    count: 0,
    status: false,
    disabled: false,
  });
  let currentUser = useSelector((store) => store.currentUser);

  const subscribeToggle = () => {
    if (subCount.status) {
      setSubCount({
        ...subCount,
        status: false,
        count: subCount.count - 1,
      });
      axios.post(`http://localhost:8000/channel/unsubscribe-to/${ownerId}`, [], {
        withCredentials: true,
      });
    } else {
      setSubCount({
        ...subCount,
        status: true,
        count: subCount.count + 1,
      });
      axios.post(`http://localhost:8000/user/subscribe-to/${ownerId}`, [], {
        withCredentials: true,
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        let res = await axios.get(
          `http://localhost:8000/channel/get-channel/${ownerId}`,
          {
            withCredentials: true,
          },
        );
        setCurrentChannel(res?.data?.data);
        let { subscribersCount, subStatus } = res.data?.data;
        setSubCount({
          ...subCount,
          count: subscribersCount,
          status: subStatus,
        });
        setLoading(false);
      } catch (error) {
        console.log(error.response?.data?.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {loading ? (
        <SingleChannelSkeleton />
      ) : (
        <div className="w-full md:max-w-3xl xs:max-w-1xl py-5 lg:max-w-6xl border-gray-600 border-b-[1px]">
          <div className="w-full bg-black aspect-[4/1] overflow-hidden flex justify-center items-center rounded-lg">
            {currentChannel?.coverImage && (
              <img
                src={currentChannel?.coverImage}
                alt="Cover"
                className="w-full"
              />
            )}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start mt-6 px-4 w-full">
            <div className="w-24 h-24 overflow-hidden rounded-full">
              <img
                src={currentChannel?.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="md:ml-6 text-center md:text-left mt-4 md:mt-0">
              <h2 className="text-2xl font-bold">{currentChannel?.name}</h2>
              <p className="text-gray-400">
                @{currentChannel?.name} • {subCount?.count} subscribers •{" "}
                {currentChannel?.totalVideos} videos
              </p>
              {currentChannel?._id == currentUser.data?._id ? (
                ""
              ) : (
                <div className="flex gap-4 mt-4 justify-center md:justify-start">
                  <button
                    disabled={subCount.disabled}
                    onClick={subscribeToggle}
                    className={`text-white px-4 py-1 rounded-4xl text-md ${
                      subCount?.status
                        ? "bg-gray-800"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  >
                    {subCount.status ? "Subscribed" : "Subscribe"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SingleChannelDetails


const SingleChannelSkeleton = () => {
  return (
    <div className="mx-auto flex flex-col items-center text-white max-w-6xl animate-pulse">
      <div className="w-full md:max-w-3xl xs:max-w-1xl py-5 lg:max-w-6xl border-gray-600 border-b-[1px]">
        <div className="w-full aspect-[4/1] bg-gray-800 rounded-lg"></div>
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
        <div className="py-5">
          <div className="flex space-x-4 w-full px-4">
            <div className="h-8 w-20 bg-gray-700 rounded"></div>
          </div>

          <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[370px] cursor-pointer"
              >
                <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800"></div>
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
      </div>
    </div>
  );
};
