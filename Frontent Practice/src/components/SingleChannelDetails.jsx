import React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getChannel,
  subscribeTo,
  unSubscribeTo,
} from "../apis/channel.apis.js";

const SingleChannelDetails = ({ ownerId }) => {
  let [currentChannel, setCurrentChannel] = useState({});
  const [loading, setLoading] = useState(false);
  let [subCount, setSubCount] = useState({
    count: 0,
    status: false,
    disabled: false,
  });
  let currentUser = useSelector((store) => store.currentUser);
  let [error, setError] = useState("");

  const subscribeToggle = async () => {
    const prevSubCount = { ...subCount };

    try {
      // Optimistically update
      const updated = {
        ...subCount,
        status: !subCount.status,
        count: subCount.status ? subCount.count - 1 : subCount.count + 1,
      };

      setSubCount(updated);

      // Perform the actual request
      if (subCount.status) {
        await unSubscribeTo(ownerId);
      } else {
        await subscribeTo(ownerId);
      }
    } catch (error) {
      // Rollback UI
      setSubCount(prevSubCount);
      setError(error?.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        let res = await getChannel(ownerId);
        setCurrentChannel(res?.data);
        let { subscribersCount, subStatus } = res?.data;
        setSubCount({
          ...subCount,
          count: subscribersCount,
          status: subStatus,
        });
        setLoading(false);
      } catch (error) {
        console.log(error?.message);
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

export default SingleChannelDetails;

const SingleChannelSkeleton = () => {
  return (
    <div className="w-full md:max-w-3xl xs:max-w-1xl py-5 lg:max-w-6xl border-gray-600 border-b-[1px] animate-pulse">
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
    </div>
  );
};
