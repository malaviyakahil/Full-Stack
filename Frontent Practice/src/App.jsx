import React  from "react";
import Header from "./components/Header";
import { Outlet, useNavigate } from "react-router-dom";

const App = () => {


  return (
    <>
      <div className="wrapper h-screen flex flex-col">
        <Header />
        <Outlet />
      </div>
    </>
  );
};

export default App;
