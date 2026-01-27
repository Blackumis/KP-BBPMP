import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DaftarKegiatan from "../components/DaftarKegiatan";
import { eventsAPI } from "../services/api";
import { showNotification } from "../components/Notification";
import "../index.css";

const DaftarKegiatanPage = () => {
  const [kegiatanList, setKegiatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadEvents = async () => {
    try {
      const res = await eventsAPI.getAll();
      if (res.success) setKegiatanList(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const onViewAbsensi = (k) => {
    // Navigate to public attendance page
    navigate(`/attendance/${k.id}`);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Daftar Kegiatan</h1>
      <DaftarKegiatan
        kegiatanList={kegiatanList}
        onCreateNew={() => navigate("/admin/create")}
        onViewAbsensi={onViewAbsensi}
        onViewAttendances={() => {}}
        onDelete={() => showNotification("Harap login untuk menghapus", "warning")}
        onActivate={() => showNotification("Harap login untuk mengaktifkan", "warning")}
        onRefresh={loadEvents}
        onEdit={() => showNotification("Harap login untuk mengedit", "warning")}
        isAuthenticated={false}
      />
    </div>
  );
};

export default DaftarKegiatanPage;
