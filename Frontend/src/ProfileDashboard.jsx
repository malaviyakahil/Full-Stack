import React from "react";
import { Outlet } from "react-router-dom";

const ProfileDashboard = () => {
  return (
      <div className="h-full w-full overflow-y-auto px-2 scrollbar-hidden">
        <Outlet/>
      </div>
  );
};

export default ProfileDashboard;