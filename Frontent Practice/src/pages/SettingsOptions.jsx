import React from "react";
import { MdDeleteOutline } from "react-icons/md";
import { RiDeleteBin7Line, RiEditBoxLine } from "react-icons/ri";
import { TbArrowsExchange } from "react-icons/tb";
import { NavLink, Outlet } from "react-router-dom";
import { FiEdit } from "react-icons/fi";
import { AiOutlineDelete } from "react-icons/ai";
const SettingsOptions = () => {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center py-5">
      <h2 className="text-white text-[40px] mb-5">Settings</h2>
      <div className="w-full flex flex-col items-center max-w-md ">
        <NavLink
          className={({ isActive }) =>
            `  py-2 text-md md:text-lg  rounded-md flex items-center gap-2 ${
              isActive ? "bg-gray-700 " : ""
            }`
          }
          to="/app/settings/edit-profile"
        >
         <FiEdit className="text-lg"/> Edit profile
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            ` text-md md:text-lg  py-2 rounded-md flex items-center gap-2 ${
              isActive ? "bg-gray-700 " : ""
            }`
          }
          to="/app/settings/change-password"
        >
         <TbArrowsExchange   className="rotate-140 text-xl"/> Change password
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            ` text-md md:text-lg  py-2 rounded-md flex items-center gap-2 ${
              isActive ? "bg-gray-700 " : ""
            }`
          }
          to="/app/settings/delete-user"
        >
      <AiOutlineDelete className="text-xl" /> Delete account
        </NavLink>
      </div>
    </div>
  );
};

export default SettingsOptions;
