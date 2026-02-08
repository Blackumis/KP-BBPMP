// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/loginPage";
import AttendancePage from "./pages/attendancePage";
import AttendancelistPage from "./pages/attendancelistPage";
import AdminPage from "./pages/adminPage";
import ValidasiSertifikat from "./pages/validasisertifikatPage";
import OfficialVerification from "./pages/officialverificationPage";
import NotFoundPage from "./pages/NotFoundPage";
import ServerErrorPage from "./pages/ServerErrorPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { authAPI } from "./services/api";
import { NotificationManager } from "./components/Notification";
import "./index.css";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    setIsAuth(authAPI.isAuthenticated());
    if (authAPI.isAuthenticated() && authAPI.getProfile) {
      (async () => {
        try {
          const p = await authAPI.getProfile();
          setUser(p?.data ?? null);
        } catch (err) {
          setUser(null);
        }
      })();
    }
  }, [location.pathname]);

  return (
    <>
      <NotificationManager />
      <Routes>
      {/* Public route - Server Error page */}
      <Route path="/error" element={<ServerErrorPage />} />
      
      {/* Public route without MainLayout - Standalone validation page */}
      <Route path="/validasi/*" element={<ValidasiSertifikat />} />
      
      {/* Public route - Official Verification (QR Code) */}
      <Route path="/official/:id" element={<OfficialVerification />} />

      {/* Public route - Login (with layout) */}
      <Route
        path="/login"
        element={
          <MainLayout
            isAuthenticated={isAuth}
            user={user}
            onLogout={() => {
              authAPI.logout();
              navigate("/login", { replace: true });
            }}
          >
            <LoginPage />
          </MainLayout>
        }
      />

      {/* Public route without MainLayout - Isolated attendance page (token-based) */}
      <Route path="/attendance/:token" element={<AttendancePage />} />

      <Route
        path="/attendancelist/:id/:name"
        element={
          <MainLayout
            isAuthenticated={isAuth}
            user={user}
            onLogout={() => {
              authAPI.logout();
              navigate("/login", { replace: true });
            }}
          >
            <ProtectedRoute>
              <AttendancelistPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      <Route
        path="/admin/*"
        element={
          <MainLayout
            isAuthenticated={isAuth}
            user={user}
            onLogout={() => {
              authAPI.logout();
              navigate("/login", { replace: true });
            }}
          >
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

      {/* Home/Root - redirects to login*/}
      <Route
        path="/"
        element={
          <MainLayout
            isAuthenticated={isAuth}
            user={user}
            onLogout={() => {
              authAPI.logout();
              navigate("/login", { replace: true });
            }}
          >
            <LoginPage />
          </MainLayout>
        }
      />

        {/* Catch-all - 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
