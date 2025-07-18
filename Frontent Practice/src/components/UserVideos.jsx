import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "./Skeleton";
import {
  deletOneVideo,
  fetchcurrentUserVideos,
  incrementView,
  undoDeletOneVideo,
} from "../store/userVideos.slice";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import InfiniteScroll from "react-infinite-scroll-component";
import { RiEditBoxLine } from "react-icons/ri";
import { MdDeleteOutline } from "react-icons/md";
import { HiOutlineUpload } from "react-icons/hi";
const UserVideoCard = ({ video, index }) => {
  const dispatch = useDispatch();
  let [error, setError] = useState("");

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const deleteVideo = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const backup = { index, video };
    dispatch(deletOneVideo(video._id));

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/video/delete-video/${video._id}`,
        [],
        { withCredentials: true },
      );
    } catch (err) {
      dispatch(undoDeletOneVideo(backup));
      setError(error?.response?.data?.message || "Failed to delete video");
    }
  };

  return (
    <>
      {error && <p className="text-red-500 text-center my-2">{error}</p>}
      <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] cursor-pointer">
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
        <div className="p-1">
          <h3 className="text-sm font-semibold leading-tight break-words overflow-hidden text-ellipsis line-clamp-2 my-1">
            {video?.title}
          </h3>
          <p className="text-xs text-gray-400 whitespace-nowrap overflow-hidden text-ellipsis">
            {video?.views} views •{" "}
            {formatDistanceToNowStrict(new Date(video?.createdAt), {
              addSuffix: true,
            })}
          </p>
          <div className="flex gap-2 pt-2">
            <Link
              to={`/app/my-videos/edit-video/${video?._id}`}
              state={{
                title: video?.title,
                description: video?.description,
                thumbnail: video?.thumbnail,
                thumbnailPublicId: video?.thumbnailPublicId,
              }}
            >
              <button className="bg-gray-700 hover:bg-gray-600 px-3 py-0.5 rounded-md text-[14px] flex gap-2 justify-center items-center ">
                <RiEditBoxLine /> Edit
              </button>
            </Link>
            <button
              onClick={deleteVideo}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-0.5 rounded-md text-[14px] flex gap-2 justify-center items-center "
            >
              <MdDeleteOutline className="text-[16px]" /> Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const UserVideos = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    data: videos,
    loading,
    hasMore,
  } = useSelector((store) => store.currentUserVideos);

  const currentUser = useSelector((store) => store.currentUser);

  return (
    <div className="py-5">
      <div className="mx-auto max-w-6xl flex w-full items-center justify-center flex-wrap gap-3">
        <button
          className="bg-gray-700 hover:bg-gray-600 rounded-md p-2 px-4 flex flex-nowrap items-center gap-1 justify-center"
          onClick={() => navigate("/app/my-videos/upload-video")}
        >
          <HiOutlineUpload className="text-[18px]"/> Upload video
        </button>
        <button className="bg-gray-700 hover:bg-gray-600 rounded-md p-2 px-4">
          {currentUser?.data?.subs} Subscribers •{" "}
          {videos.reduce((acc, video) => acc + video.views, 0)} Total views
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <Skeleton />
      ) : (
        <InfiniteScroll
          scrollableTarget="scrollableDiv"
          dataLength={videos.length}
          next={() => {
            if (!loading && hasMore) {
              dispatch(fetchcurrentUserVideos());
            }
          }}
          hasMore={hasMore}
          loader={<Skeleton />}
        >
          {videos.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6 py-4">
              {videos.map((video, index) => (
                <Link
                  key={video._id}
                  to={`/app/dashboard/single-video/${currentUser.data?._id}/${video._id}`}
                  onClick={() => dispatch(incrementView(video._id))}
                >
                  <UserVideoCard video={video} index={index} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80vh]">
              <h2 className="text-xl md:text-2xl font-semibold ">
                You haven't uploaded any video yet
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                Upload your first video to get started.
              </p>
            </div>
          )}
        </InfiniteScroll>
      )}
    </div>
  );
};

export default UserVideos;
