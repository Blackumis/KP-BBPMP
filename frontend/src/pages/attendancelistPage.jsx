import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AttendanceList from "../components/AttendanceList";
import { eventsAPI } from "../services/api";
import "../index.css";

const AttendancelistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await eventsAPI.getById(id);
        if (res.success) setEvent(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="max-w-6xl mx-auto p-8 text-center">Memuat...</div>;
  if (!event) return <div className="max-w-6xl mx-auto p-8 text-center">Kegiatan tidak ditemukan.</div>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <AttendanceList event={event} onBack={() => navigate("/admin")} />
    </div>
  );
};

export default AttendancelistPage;
