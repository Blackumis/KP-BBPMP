import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { eventsAPI } from "../../services/api";

const ListEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await eventsAPI.getAll();
        if (res.success) setEvents(res.data.events || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await eventsAPI.getAll();
      if (res.success) setEvents(res.data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (eventId, eventName) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kegiatan "${eventName}"?`)) {
      return;
    }

    try {
      const res = await eventsAPI.delete(eventId);
      if (res.success) {
        setEvents(events.filter((e) => e.id !== eventId));
        alert("Kegiatan berhasil dihapus");
      } else {
        alert("Gagal menghapus kegiatan");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat menghapus kegiatan");
    }
  };

  const handleActivate = async (eventId, eventName) => {
    if (!window.confirm(`Apakah Anda yakin ingin mengaktifkan kegiatan "${eventName}"?`)) {
      return;
    }

    try {
      await eventsAPI.activate(eventId);
      setEvents(events.map((e) => (e.id === eventId ? { ...e, status: "active" } : e)));

      alert("Kegiatan berhasil diaktifkan");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengaktifkan kegiatan");
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
      active: { label: "Aktif", className: "bg-green-100 text-green-700" },
      closed: { label: "Selesai", className: "bg-red-100 text-red-700" },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>{config.label}</span>;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
          Daftar Kegiatan
        </h2>
        <div className="flex gap-2">
          <button onClick={handleRefresh} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded shadow transition duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <Link to="/admin/create" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Buat Kegiatan Baru
          </Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg">Belum ada kegiatan yang dibuat.</p>
          <Link to="/admin/create" className="mt-2 text-blue-600 hover:text-blue-800 font-medium inline-block">
            Buat sekarang
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100 border-b-2 border-gray-200">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">No</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Kegiatan</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nomor Surat</th>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tanggal</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Peserta</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event, index) => (
                <tr key={event.id} className="hover:bg-gray-50 transition duration-150">
                  <td className="py-4 px-4 text-sm text-gray-500">{index + 1}</td>
                  <td className="py-4 px-4 text-sm font-medium text-gray-900">{event.nama_kegiatan}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">{event.nomor_surat || "-"}</td>
                  <td className="py-4 px-4 text-sm text-gray-500">
                    {event.tanggal_mulai ? new Date(event.tanggal_mulai).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" }) : "-"}
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{event.total_attendances || 0}</span>
                  </td>
                  <td className="py-4 px-4 text-center">{getStatusBadge(event.status)}</td>
                  <td className="py-4 px-4 text-center">
                    <div className="flex justify-center gap-2 flex-wrap">
                      {event.status === "draft" && (
                        <button
                          onClick={() => handleActivate(event.id, event.nama_kegiatan)}
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200"
                          title="Aktifkan Kegiatan"
                        >
                          Aktifkan
                        </button>
                      )}
                      {event.status === "active" && (
                        <a
                          href={`/attendance/${event.id}/${event.nama_kegiatan}`}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200"
                          title="Buka Form Absensi"
                        >
                          Form
                        </a>
                      )}
                      <Link
                        to={`/admin/edit/${event.id}`}
                        className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-200"
                        title="Edit Kegiatan"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/attendancelist/${event.id}/${encodeURIComponent(event.nama_kegiatan)}`}
                        className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium hover:bg-purple-200"
                        title="Lihat Daftar Hadir"
                      >
                        Peserta
                      </Link>
                      <button
                        onClick={() => handleDelete(event.id, event.nama_kegiatan)}
                        className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200"
                        title="Hapus Kegiatan"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListEvents;
