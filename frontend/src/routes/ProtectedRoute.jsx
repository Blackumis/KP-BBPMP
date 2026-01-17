import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  if (authAPI.isAuthenticated()) return children;
  return <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
