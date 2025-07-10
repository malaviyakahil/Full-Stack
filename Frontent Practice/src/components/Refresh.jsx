import React from "react";
import { RiRefreshLine } from "react-icons/ri";
import { clearVideos, fetchVideos } from "../store/videos.slice.js";
import { useDispatch } from "react-redux";

const Refresh = () => {
  let dispatch = useDispatch();
  let refresh = () => {
    dispatch(clearVideos());
  };
  return (
    <button
      className=" bg-gray-700 hover:bg-gray-600 rounded-lg p-2 px-4 flex items-center justify-center gap-2"
      onClick={refresh}
    >
      <RiRefreshLine className="text-[18px]" />
    </button>
  );
};

export default Refresh;
