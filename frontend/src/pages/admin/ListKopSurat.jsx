import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { kopSuratAPI } from "../../services/api";
import { showNotification } from "../../components/Notification";
import ConfirmDialog from "../../components/ConfirmDialog";

const ListKopSurat = () => {
  const [kopSurats, setKopSurats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning",
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await kopSuratAPI.getAll({ limit: 1000 });
        if (res.success) setKopSurats(res.data.kopSurats || []);
      } catch (err) {
        console.error(err);
        showNotification("Gagal memuat data kop surat", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await kopSuratAPI.getAll({ limit: 1000 });
      if (res.success) {
        setKopSurats(res.data.kopSurats || []);
        showNotification("Data berhasil dimuat ulang", "success");
      }
    } catch (err) {
      console.error(err);
      showNotification("Gagal memuat ulang data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (kopSuratId, kopSuratName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Hapus Kop Surat",
      message: `Apakah Anda yakin ingin menghapus kop surat "${kopSuratName}"?`,
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await kopSuratAPI.delete(kopSuratId);
          if (res.success) {
            setKopSurats(kopSurats.filter((k) => k.id !== kopSuratId));
            showNotification("Kop surat berhasil dihapus", "success");
          } else {
            showNotification("Gagal menghapus kop surat", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification(err.message || "Terjadi kesalahan saat menghapus kop surat", "error");
        }
      },
    });
  };

  const handleActivate = async (kopSuratId, kopSuratName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Aktifkan Kop Surat",
      message: `Apakah Anda yakin ingin mengaktifkan kop surat "${kopSuratName}"?`,
      type: "info",
      onConfirm: async () => {
        try {
          const res = await kopSuratAPI.activate(kopSuratId);
          if (res.success) {
            await handleRefresh();
            showNotification("Kop surat berhasil diaktifkan", "success");
          } else {
            showNotification("Gagal mengaktifkan kop surat", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification(err.message || "Terjadi kesalahan saat mengaktifkan kop surat", "error");
        }
      },
    });
  };

  const handleDeactivate = async (kopSuratId, kopSuratName) => {
    setConfirmDialog({
      isOpen: true,
      title: "Nonaktifkan Kop Surat",
      message: `Apakah Anda yakin ingin menonaktifkan kop surat "${kopSuratName}"?`,
      type: "warning",
      onConfirm: async () => {
        try {
          const res = await kopSuratAPI.deactivate(kopSuratId);
          if (res.success) {
            await handleRefresh();
            showNotification("Kop surat berhasil dinonaktifkan", "success");
          } else {
            showNotification("Gagal menonaktifkan kop surat", "error");
          }
        } catch (err) {
          console.error(err);
          showNotification(err.message || "Terjadi kesalahan saat menonaktifkan kop surat", "error");
        }
      },
    });
  };

  const renderStatusAction = (kopSurat) => {
    if (kopSurat.is_active) {
      return (
        <button
          onClick={() => handleDeactivate(kopSurat.id, kopSurat.nama_data)}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
                   bg-green-100 text-green-700 hover:bg-green-200 transition"
          title="Nonaktifkan kop surat"
        >
          Aktif
        </button>
      );
    }

    return (
      <button
        onClick={() => handleActivate(kopSurat.id, kopSurat.nama_data)}
        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold 
                 bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition"
        title="Aktifkan kop surat"
      >
        Nonaktif
      </button>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };
  
  // Use VITE_BASE_URL with fallback to localhost:5000
  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

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
    <>
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        type={confirmDialog.type}
      />

      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
        {/* Admin Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <Link to="/admin" className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-semibold hover:text-blue-600 hover:bg-gray-50">
            Kegiatan
          </Link>
          <Link to="/admin/kop-surat" className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold hover:bg-gray-50">
            Kop Surat
          </Link>
          <Link to="/admin/pejabat" className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-semibold hover:text-blue-600 hover:bg-gray-50">
            Pejabat
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
            Daftar Kop Surat
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
            <Link to="/admin/kop-surat/create" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Tambah Kop Surat
            </Link>
          </div>
        </div>

        {kopSurats.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Belum ada kop surat yang dibuat.</p>
            <Link to="/admin/kop-surat/create" className="mt-2 text-blue-600 hover:text-blue-800 font-medium inline-block">
              Buat sekarang
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama Instansi / Unit</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Periode</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Kop</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {kopSurats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((kopSurat, index) => (
                  <tr key={kopSurat.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="py-4 px-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{kopSurat.nama_data}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(kopSurat.periode_mulai)} - {formatDate(kopSurat.periode_selesai)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {kopSurat.kop_url ? (
                        <img src={`${BASE_URL}/${kopSurat.kop_url}`} alt="Kop Surat" className="h-12 mx-auto object-contain border rounded" />
                      ) : (
                        <span className="text-xs text-gray-400">Tidak ada</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">{renderStatusAction(kopSurat)}</td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Link
                          to={`/admin/kop-surat/edit/${kopSurat.id}`}
                          className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium hover:bg-yellow-200"
                          title="Edit Kop Surat"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(kopSurat.id, kopSurat.nama_data)}
                          className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-700 rounded-full text-xs font-medium hover:bg-red-200"
                          title="Hapus Kop Surat"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {kopSurats.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, kopSurats.length)} dari {kopSurats.length} kop surat
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sebelumnya"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: Math.ceil(kopSurats.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${currentPage === page ? "bg-blue-600 text-white" : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(kopSurats.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(kopSurats.length / itemsPerPage)}
                className="p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Selanjutnya"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ListKopSurat;
