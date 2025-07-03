import React, { useEffect } from "react";
import Videos from "../components/Videos";
import { useDispatch, useSelector } from "react-redux";
import { fetchVideos } from "../store/videos.slice";
import Panel from "../components/Panel";

const Dashboard = () => {

  let videos = useSelector((store) => store.videos);
  let dispatch = useDispatch();
  
  useEffect(() => {
    if (!videos?.data) {
      dispatch(fetchVideos());
    }
  }, []);

  return (
    <>
      <div className="h-full py-3">
        <Panel />
        <Videos />
      </div>
    </>
  );
};

export default Dashboard;
