import React from "react";
import { Outlet } from "react-router-dom";

const VideoDashboard = () => {
  return (
      <div id='scrollableDiv' className="h-full w-full overflow-y-scroll px-5">
        <Outlet/>
      </div>
  );
};

export default VideoDashboard;