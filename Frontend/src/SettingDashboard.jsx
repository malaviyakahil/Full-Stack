import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const SettingDashboard = () => {

  const location = useLocation();
  const isRoot = location.pathname === "/settings";

  return (
    <div className="w-full h-full overflow-y-auto px-5 scrollbar-hidden">
      {isRoot ? <SettingsHome /> : <Outlet />}
    </div>
  );
};

export default SettingDashboard;
