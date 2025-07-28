import React from "react";
import { Link } from "react-router-dom";
import { setVideoLimit } from "../store/videos.slice";
import { setCurrentUserVideoLimit } from "../store/userVideos.slice";

const Home = () => {
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
    <div className="wrapper h-[100dvh] w-screen flex flex-col">
      <div className="navbar border-b-[1px] border-gray-600">
        <div className="navbar-start">
          <a className="text-white text-xl font-semibold inline-block ml-2">
            Kadeo
          </a>
        </div>
        <div className="navbar-end flex gap-2">
          <Link to={"/register"}>
            <button className="btn bg-gray-600 text-white m-1s">
              Register
            </button>
          </Link>
          <Link to={"/login"}>
            <button className="btn text-white bg-gray-600 m-1">Log in</button>
          </Link>
        </div>
      </div>
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h2 className="text-center text-4xl font-bold text-gray-300 text-center">
          Welcome!
        </h2>
        <p className="text-md text-gray-500 mt-2 text-center">
          Glad to have you here.
        </p>
      </div>
    </div>
  );
};

export default Home;
