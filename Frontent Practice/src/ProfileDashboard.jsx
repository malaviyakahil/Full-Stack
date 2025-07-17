import React from "react";
import { Outlet } from "react-router-dom";

const ProfileDashboard = () => {
  return (
      <div className="h-full w-full overflow-y-auto px-5">
        <Outlet/>
      </div>
  );
};

export default ProfileDashboard;