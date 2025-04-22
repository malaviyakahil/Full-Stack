import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const SettingDashboard = () => {
  return (
    <div className="h-full w-full overflow-y-auto p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto h-full">
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-1/4 flex flex-row lg:flex-col gap-4 lg:gap-2 mb-4 lg:mb-0">
          <NavLink
            className={({ isActive }) =>
              `text-sm font-medium px-4 py-2 rounded-md ${
                isActive ? "bg-gray-700 text-white" : ""
              }`
            }
            to="/app/settings/edit-profile"
          >
            Edit profile
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `text-sm font-medium px-4 py-2 rounded-md ${
                isActive ? "bg-gray-700 text-white" : ""
              }`
            }
            to="/app/settings/change-password"
          >
            Change password
          </NavLink>
        </div>

        {/* Content Area */}
        <div className="w-full f-full lg:w-3/4 overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingDashboard;
