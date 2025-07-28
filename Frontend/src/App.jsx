import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setVideoLimit } from "./store/videos.slice.js";
import Header from "./components/Header";
import { Outlet } from "react-router-dom";
import { setCurrentUserVideoLimit } from "./store/userVideos.slice.js";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const calculateLimit = () => {
      const width = window.innerWidth;
      const limit = width >= 768 ? 6 : 3;
      dispatch(setVideoLimit(limit));
      dispatch(setCurrentUserVideoLimit(limit));    
    };

    calculateLimit();
    window.addEventListener("resize", calculateLimit);

    return () => window.removeEventListener("resize", calculateLimit);
  }, []);

  return (
    <div className="wrapper h-[100dvh] w-full flex flex-col">
      <Header />
      <Outlet />
    </div>
  );
};

export default App;
