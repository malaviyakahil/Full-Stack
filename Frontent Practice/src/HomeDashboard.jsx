import React from "react";
import { Outlet } from "react-router-dom";

const HomeDashboard = () => {
  return (
    <>
      <div className="h-screen w-full overflow-y-auto">
        <Outlet/>
      </div>
    </>
  );
};

export default HomeDashboard;