import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="wrapper h-screen flex flex-col">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown"></div>
          <a className="btn btn-ghost text-xl">Kadeo</a>
        </div>
        <div className="navbar-end flex gap-1">
          <Link to={"/register"}>
            <button className="btn bg-gray-600 m-1s">Register</button>
          </Link>
          <Link to={"/login"}>
            <button className="btn bg-gray-600 m-1">Log in</button>
          </Link>
        </div>
      </div>
      <div className="h-full w-full flex flex-col items-center justify-center">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-300">
          Welcome!
        </h2>
        <p className="text-sm text-gray-500 mt-2">Glad to have you here.</p>
      </div>
    </div>
  );
};

export default Home;
