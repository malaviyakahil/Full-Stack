import React, { useState } from "react";
import { Outlet } from "react-router-dom";

const HomeDashboard = () => {
  return (
      <div id="scrollableDiv" className="h-full w-full overflow-y-scroll px-2 scrollbar-hidden">
        <Outlet/>
      </div>
  );
};

export default HomeDashboard;