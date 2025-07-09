import React, { useEffect } from "react";
import Videos from "../components/Videos";
import { useDispatch, useSelector } from "react-redux";
import { fetchVideos } from "../store/videos.slice";
import Panel from "../components/Panel";

const Dashboard = () => {

  let {fetched} = useSelector((store) => store.videos);
  let dispatch = useDispatch();
  
  useEffect(() => {
    if (!fetched) {
      dispatch(fetchVideos());
    }
  }, [fetched,dispatch]);

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
