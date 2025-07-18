import React, { useEffect } from "react";
import Videos from "../components/Videos";
import { useDispatch, useSelector } from "react-redux";
import { fetchVideos } from "../store/videos.slice";
import Panel from "../components/Panel";

const Dashboard = () => {
  let { fetched, limit } = useSelector((store) => store.videos);
  let dispatch = useDispatch();

  useEffect(() => {
    if (!fetched) {
      dispatch(fetchVideos());
    }
  }, [fetched, dispatch, limit]);

  return (
    <div className="h-full w-full py-5">
      <Panel />
      <Videos />
    </div>
  );
};

export default Dashboard;
