import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import Skeleton from "./Skeleton";
import {
  deletOneVideo,
  fetchcurrentUserVideos,
  undoDeletOneVideo,
} from "../store/userVideos.slice";
import { formatDistanceToNowStrict } from "date-fns";
import InfiniteScroll from "react-infinite-scroll-component";
import { HiOutlineUpload } from "react-icons/hi";
import formatTime from "../utils/formatTime";
import { deleteVideo } from "../apis/video.apis";
import { AiOutlineDelete } from "react-icons/ai";
import { FiEdit } from "react-icons/fi";
import formatNumber from "../utils/formatNumber";

const UserVideoCard = ({ video, index }) => {
  const dispatch = useDispatch();
  let [error, setError] = useState("");

  const handleDeleteVideo = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const backup = { index, video };
    try {
      dispatch(deletOneVideo(video._id));
      await deleteVideo(video._id);
    } catch (error) {
      dispatch(undoDeletOneVideo(backup));
      setError(error?.message);
    }
  };

  return (
    <div className="w-full">
      {error && <p className="text-red-500 text-center mb-3">{error}</p>}
      <div className="flex flex-col w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px] cursor-pointer">
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-black flex justify-center">
          <img
            src={video?.thumbnail}
            alt={video?.title}
            className="h-full object-contain"
          />
          <div className="text-xs absolute bottom-2 right-2 bg-black bg-opacity-75 px-1 py-0.5 rounded-md">
            {formatTime(video?.duration)}
          </div>
        </div>
        <div className="p-1">
          <h3 className=" text-white font-semibold leading-tight break-all overflow-hidden text-ellipsis mt-2 line-clamp-2">
            {video?.title}
          </h3>
          <p className="text-sm text-gray-400">
            {formatNumber(video?.views)} views •{" "}
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
                <FiEdit /> Edit
              </button>
            </Link>
            <button
              onClick={handleDeleteVideo}
              className="bg-gray-700 hover:bg-gray-600 px-3 py-0.5 rounded-md text-[14px] flex gap-2 justify-center items-center "
            >
              <AiOutlineDelete className="text-[17px]" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
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
    <div className="w-full py-5">
      <div className="mx-auto w-full max-w-6xl flex items-center justify-center flex-wrap gap-3">
        <button
          className="bg-gray-700 hover:bg-gray-600 rounded-md p-2 px-4 flex flex-nowrap items-center gap-1 justify-center"
          onClick={() => navigate("/app/my-videos/upload-video")}
        >
          <HiOutlineUpload className="text-[18px] " /> Upload video
        </button>
      </div>

      {loading && videos.length === 0 ? (
        <Skeleton />
      ) : (
        <InfiniteScroll
          className="w-full"
          scrollableTarget="scrollableDiv"
          dataLength={videos.length}
          next={() => {
            if (!loading && hasMore) {
              dispatch(fetchcurrentUserVideos());
            }
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
            <div className="flex flex-wrap justify-center gap-6 py-4 w-full">
              {videos.map((video, index) => (
                <Link
                  className="block w-full sm:w-[320px] md:w-[336px] lg:w-[360px] xl:w-[380px]"
                  key={video._id}
                  to={`/app/dashboard/single-video/${currentUser.data?._id}/${video._id}`}
                >
                  <UserVideoCard video={video} index={index} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80dvh]">
              <h2 className="text-4xl font-bold text-gray-300 text-center  text-center">
                You haven't uploaded any video yet
              </h2>
              <p className=" text-md text-gray-500 mt-2 text-center">
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
