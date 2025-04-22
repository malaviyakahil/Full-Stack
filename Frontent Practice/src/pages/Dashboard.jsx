import React, { useEffect } from "react";
import Videos from "../components/Videos";
import Refresh from "../components/Refresh";
import { useDispatch, useSelector } from "react-redux";
import { fetchVideos } from "../store/videos.slice";

const Dashboard = () => {
  let  videos  = useSelector((store) => store.videos);
  
  let dispatch = useDispatch();
  useEffect(() => {
    if (!videos?.data) {
      dispatch(fetchVideos());
    }
  }, []);

  return (
    <>
      <div className="h-full p-3 overflow-y-scroll">
        <div className="w-full flex items-center justify-center">
          <Refresh />
        </div>
        <Videos />
      </div>
    </>
  );
};

export default Dashboard;
