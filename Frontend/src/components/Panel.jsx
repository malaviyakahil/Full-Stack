import React from "react";
import Refresh from "./Refresh";
import Search from "./Search";
import { BiLike } from "react-icons/bi";
import { Link } from "react-router-dom";
import { TbHistoryToggle } from "react-icons/tb";

const Panel = () => {
  return (

    <div className="flex items-center w-fit relative gap-2  sm:gap-3 justify-center flex-wrap xs:flex-nowrap mx-auto">
      <Refresh />
      <Search />

      <Link
        className="flex gap-2 justify-center items-center bg-gray-700 hover:bg-gray-600 p-2 px-4 rounded-md"
        to={"/app/dashboard/liked-videos"}
      >
        <BiLike className="text-[18px]" />
      </Link>

      <Link
        className="flex gap-2 justify-center items-center bg-gray-700 hover:bg-gray-600 p-2 px-4 rounded-md"
        to={"/app/dashboard/history"}
      >
        <TbHistoryToggle className="text-[18px]" />
      </Link>
    </div>
    
  );
};

export default Panel;
