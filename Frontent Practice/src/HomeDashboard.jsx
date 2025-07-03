import React, { useState } from "react";
import { Outlet } from "react-router-dom";

const HomeDashboard = () => {
  return (
      <div className="h-screen w-full overflow-y-scroll px-5">
        <Outlet/>
      </div>
  );
};

export default HomeDashboard;