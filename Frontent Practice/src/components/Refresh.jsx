import React from "react";
import { RiRefreshLine } from "react-icons/ri";
import { fetchVideos } from "../store/videos.slice.js";
import { useDispatch } from "react-redux";

const Refresh = () => {

  let dispatch = useDispatch();

  return (
    <button
      className=" bg-gray-700 hover:bg-gray-600 rounded-lg p-2 px-4 flex items-center justify-center gap-2"
      onClick={() => {
        dispatch(fetchVideos());
      }}
    >
      <RiRefreshLine className="text-[18px]" /> Refresh
    </button>
  );
};

export default Refresh;
