import React from "react";
import { Outlet } from "react-router-dom";

const VideoDashboard = () => {
  return (
      <div id='scrollableDiv' className="h-full w-full overflow-y-auto px-3 scrollbar-hidden">
        <Outlet/>
      </div>
  );
};

export default VideoDashboard;