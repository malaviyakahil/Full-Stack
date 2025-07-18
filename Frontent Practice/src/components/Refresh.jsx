import React from "react";
import { clearVideos } from "../store/videos.slice.js";
import { useDispatch } from "react-redux";
import { TbRefresh } from "react-icons/tb";

const Refresh = () => {
  let dispatch = useDispatch();
  let refresh = () => {
    dispatch(clearVideos());
  };
  return (
    <button
      className=" bg-gray-700 hover:bg-gray-600 rounded-md p-2 px-4 flex items-center justify-center gap-2"
      onClick={refresh}
    >
      <TbRefresh className="text-[18px]" />
    </button>
  );
};

export default Refresh;
