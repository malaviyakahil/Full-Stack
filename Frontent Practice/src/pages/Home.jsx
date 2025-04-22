import React from "react";
import { Link } from "react-router-dom";

const Home = () => {
  return (
    <>
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <div className="dropdown"></div>
          <a className="btn btn-ghost text-xl">Home</a>
        </div>
        <div className="navbar-end">
          <Link to={"/register"}>
            <button className="btn btn-primary m-1">Register</button>
          </Link>
          <Link to={"/login"}>
            <button className="btn btn-info text-white m-1">Log in</button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
