import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";

import SplashScreen from "../components/SplashScreen";
import ListEvents from "./admin/ListEvents";
import CreateEvent from "./admin/CreateEvent";
import EditEvent from "./admin/EditEvent";
import ListKopSurat from "./admin/ListKopSurat";
import CreateKopSurat from "./admin/CreateKopSurat";
import EditKopSurat from "./admin/EditKopSurat";
import ListPejabat from "./admin/ListPejabat";
import "../index.css";

const AdminPage = () => {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(true);
  
  // Check if splash has been seen this session for faster duration
  const hasSeenSplash = sessionStorage.getItem('adminSplashSeen');
  const splashDuration = hasSeenSplash ? 600 : 1500;

  const handleSplashFinish = () => {
    sessionStorage.setItem('adminSplashSeen', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} duration={splashDuration} />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Routes>
        <Route index element={<ListEvents />} />
        <Route path="create" element={<CreateEvent onBack={() => navigate("/admin")} />} />
        <Route path="edit/:id" element={<EditEvent onBack={() => navigate("/admin")} />} />
        <Route path="kop-surat" element={<ListKopSurat />} />
        <Route path="kop-surat/create" element={<CreateKopSurat />} />
        <Route path="kop-surat/edit/:id" element={<EditKopSurat />} />
        <Route path="pejabat" element={<ListPejabat />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;
