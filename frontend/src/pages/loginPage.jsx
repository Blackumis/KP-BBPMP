import Login from "../components/Login";
import React from "react";
import "../index.css";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // If user is already logged in, send them to /admin
  React.useEffect(() => {
    if (authAPI.isAuthenticated()) {
      navigate("/admin", { replace: true });
    }
  }, []);

  const onLogin = (user) => {
    // after login, navigate to previous destination or admin
    const state = location.state || {};
    const from = state.from?.pathname || "/admin";
    navigate(from, { replace: true });
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Login onLogin={onLogin} />
    </div>
  );
};

export default LoginPage;
