import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminPanel from "../../components/AdminPanel";
import { eventsAPI } from "../../services/api";

const EditEvent = ({ onBack }) => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Kegiatan tidak ditemukan.</p>
          <button onClick={onBack} className="mt-4 text-blue-600 hover:text-blue-800 font-medium">
            Kembali ke Daftar Kegiatan
          </button>
        </div>
      </div>
    );
  }

  return <AdminPanel mode="edit" editEvent={event} onBack={onBack} />;
};

export default EditEvent;