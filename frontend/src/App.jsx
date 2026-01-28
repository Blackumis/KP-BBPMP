// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/loginPage";
import DaftarKegiatanPage from "./pages/daftarkegiatanPage";
import AttendancePage from "./pages/attendancePage";
import AttendancelistPage from "./pages/attendancelistPage";
import AdminPage from "./pages/adminPage";
import ValidasiSertifikat from "./pages/ValidasiSertifikat";
import OfficialVerification from "./pages/OfficialVerification";
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

      {/* Public route - Attendance (with layout) */}
      <Route
        path="/attendance/:id/:name"
        element={
          <MainLayout
            isAuthenticated={isAuth}
            user={user}
            onLogout={() => {
              authAPI.logout();
              navigate("/login", { replace: true });
            }}
          >
            <AttendancePage />
          </MainLayout>
        }
      />

      {/* Protected routes (with layout) */}
      <Route
        path="/daftarkegiatan"
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
              <DaftarKegiatanPage />
            </ProtectedRoute>
          </MainLayout>
        }
      />

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

      {/* Home/Root - redirects to login or daftarkegiatan */}
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

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
