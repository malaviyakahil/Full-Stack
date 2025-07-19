import React from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import InfiniteScroll from "react-infinite-scroll-component";

const SingleChannelVideos = ({ ownerId }) => {

  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("latest"); 
  const [total, setTotal] = useState(0);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const calculateLimit = () => {
      const width = window.innerWidth;
      const lim = width >= 1200 ? 6 : width >= 768 ? 4 : 3;
      setLimit(lim);
    };

    calculateLimit();
    window.addEventListener("resize", calculateLimit);

    return () => window.removeEventListener("resize", calculateLimit);
  }, []);

  const fetchVideos = async () => {
    if (limit == 0 || !hasMore || loading) return;

    if (page == 1) {
      setLoading(true);
    }
    try {
      const res = await axios.get(
        `http://localhost:8000/channel/get-channel-videos/${ownerId}?page=${page}&limit=${limit}&filter=${filter}`,
        { withCredentials: true },
      );

      const { videos: newVideos, pages, total } = res.data.data;

      setVideos((prev) => [...prev, ...newVideos]);
      setTotal(total);
      if (page >= pages || newVideos.length < limit) {
        setHasMore(false);
      }

      setPage((prev) => prev + 1);
    } catch (err) {
      console.error("Error fetching channel videos:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasMore(true);
    setInitialLoad(true); // mark for first fetch
  }, [filter, limit]);

  useEffect(() => {
    if (initialLoad && limit > 0) {
      fetchVideos();
      setInitialLoad(false); // only for first page
    }
  }, [initialLoad, page, filter, limit]);

  return (
    <div className="w-full py-5">
      <div className="space-x-4 w-full">
        <button className=" font-semibold hover:border-b-2 hover:border-white">
          Videos
        </button>
        {total != 0 ? (
          <div className="flex flex-wrap gap-3 text-sm mt-3">
            {["latest", "top", "oldest"].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-1 rounded-md ${
                  filter === type ? "bg-gray-700" : "bg-gray-800"
                } hover:bg-gray-600 capitalize`}
              >
                {type === "top" ? "Popular" : type}
              </button>
            ))}
          </div>
        ) : (
          ""
        )}
      </div>
      {loading ? (
        <SingleChannelVideosSkeleton limit={limit} />
      ) : (
        <InfiniteScroll
          scrollableTarget="scrollableDiv"
          dataLength={videos.length}
          next={fetchVideos}
          hasMore={hasMore}
          loader={
            <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
              {[...Array(limit)].map((_, idx) => (
                <div
                  key={idx}
                  className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[370px] cursor-pointer animate-pulse"
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
          }
          endMessage={
            videos?.length > 0 && (
              <p className="text-center text-sm py-2 text-gray-400">
                No more videos to load.
              </p>
            )
          }
        >
          <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
            {total == 0 ? (
              <h2>No videos uploaded by user</h2>
            ) : (
              <>
                {videos?.map((video) => (
                  <Link
                    key={video._id}
                    to={`/app/dashboard/single-video/${ownerId}/${video._id}`}
                  >
                    <ChannelVideoCard video={video} />
                  </Link>
                ))}
              </>
            )}
          </div>
        </InfiniteScroll>
      )}
    </div>
  );
};

export default SingleChannelVideos;

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
              {formatDistanceToNowStrict(new Date(video?.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SingleChannelVideosSkeleton = ({ limit }) => {
  return (
    <div className=" animate-pulse">
      <div className="flex flex-wrap justify-center gap-5 py-4 w-full">
        {[...Array(limit)].map((_, idx) => (
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
  );
};
