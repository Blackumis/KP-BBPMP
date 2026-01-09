import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../services/api';

const AttendanceList = ({ event, onBack }) => {
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

  useEffect(() => {
    loadAttendances();
  }, [event.id, pagination.page]);

  const loadAttendances = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceAPI.getByEvent(event.id, {
        page: pagination.page,
        limit: pagination.limit,
      });
      if (response.success) {
        setAttendances(response.data.attendances || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0,
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus data absensi ini?')) {
      try {
        await attendanceAPI.delete(id);
        await loadAttendances();
      } catch (err) {
        alert('Gagal menghapus: ' + err.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      menunggu_sertifikat: { label: 'Menunggu Sertifikat', className: 'bg-yellow-100 text-yellow-700' },
      sertifikat_terkirim: { label: 'Sertifikat Terkirim', className: 'bg-green-100 text-green-700' },
    };
    const config = statusConfig[status] || statusConfig.menunggu_sertifikat;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      <button 
        onClick={onBack}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mb-4"
      >
        <span>&larr; Kembali ke Dashboard</span>
      </button>

      <div className="bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600">
        <div className="flex justify-between items-start mb-6 border-b pb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <span className="bg-purple-100 text-purple-700 py-1 px-3 rounded text-sm mr-3">Peserta</span>
              Daftar Kehadiran
            </h2>
            <p className="text-gray-600 mt-2">{event.nama_kegiatan}</p>
            <p className="text-sm text-gray-500">No. Surat: {event.nomor_surat}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">{pagination.total}</div>
            <div className="text-sm text-gray-500">Total Peserta</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data...</p>
          </div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Belum ada peserta yang mengisi absensi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit Kerja</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">No. HP</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Kab/Kota</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Sertifikat</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendances.map((attendance, index) => (
                  <tr key={attendance.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="py-3 px-4 text-sm text-gray-500">{attendance.urutan_absensi}</td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{attendance.nama_lengkap}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{attendance.unit_kerja}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{attendance.email}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{attendance.nomor_hp}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{attendance.kabupaten_kota}</td>
                    <td className="py-3 px-4 text-sm text-center text-gray-500 font-mono">{attendance.nomor_sertifikat || '-'}</td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(attendance.status)}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDelete(attendance.id)}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            <p className="text-sm text-gray-600">
              Menampilkan {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} peserta
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                &larr; Prev
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
