import React from "react";
import { Outlet } from "react-router-dom";

const ProfileDashboard = () => {
  return (
      <div className="h-screen w-full overflow-y-auto">
        <Outlet/>
      </div>
  );
};

export default ProfileDashboard;