import React, { useState } from "react";
import { Outlet } from "react-router-dom";

const HomeDashboard = () => {
  return (
      <div id="scrollableDiv" className="h-full w-full overflow-y-auto px-5">
        <Outlet/>
      </div>
  );
};

export default HomeDashboard;