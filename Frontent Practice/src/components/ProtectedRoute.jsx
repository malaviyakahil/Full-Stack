import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
    <div className="h-[100vh] w-full flex items-center justify-center">
        <div className="h-[250px] w-full justify-center flex items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    </div>
    );
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
