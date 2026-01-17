// src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import LoginPage from "./pages/loginPage";
import DaftarKegiatanPage from "./pages/daftarkegiatanPage";
import AttendancePage from "./pages/attendancePage";
import AttendancelistPage from "./pages/attendancelistPage";
import AdminPage from "./pages/adminPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { authAPI } from "./services/api";
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
    <MainLayout
      isAuthenticated={isAuth}
      user={user}
      onLogout={() => {
        authAPI.logout();
        navigate("/login", { replace: true });
      }}
    >
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/attendance/:id/:name" element={<AttendancePage />} />

        {/* Protected */}
        <Route
          path="/daftarkegiatan"
          element={
            <ProtectedRoute>
              <DaftarKegiatanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendancelist/:id/:name"
          element={
            <ProtectedRoute>
              <AttendancelistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}
