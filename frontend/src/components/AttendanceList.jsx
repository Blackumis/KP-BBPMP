import React, { useState, useEffect } from "react";
import { attendanceAPI, certificateAPI, reportAPI } from "../services/api";
import { downloadPDF} from "../utils/certificateUtils";
import { showNotification } from "../components/Notification";
import ConfirmDialog from "../components/ConfirmDialog";

const AttendanceList = ({ event, onBack }) => {
  const [attendances, setAttendances] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Loading states for individual attendance actions
  const [loadingStates, setLoadingStates] = useState({});

  // Loading states for event-level actions
  const [eventLoading, setEventLoading] = useState({
    generateAll: false,
    sendAll: false,
    viewHistory: false,
    generateReport: false,
  });

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "warning",
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch ALL attendances without limit
        const response = await attendanceAPI.getByEvent(event.id, { page: 1, limit: 'all' });
        if (response.success) {
          setAttendances(response.data.attendances || []);
        }
      } catch (err) {
        console.error("Failed to load attendances:", err);
        showNotification("Gagal memuat data peserta", "error");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [event]);

  // Helper to set loading state for a specific button action
  const setButtonLoading = (attendanceId, action, loading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [`${attendanceId}-${action}`]: loading,
    }));
  };

  const isButtonLoading = (attendanceId, action) => {
    return loadingStates[`${attendanceId}-${action}`] || false;
  };

  // ===== INDIVIDUAL ATTENDANCE ACTIONS =====

  /**
   * Generate certificate for a single attendance
   */
  const handleGenerateCertificate = async (attendance) => {
    try {
      setButtonLoading(attendance.id, "generate", true);
      const response = await certificateAPI.generateSingle(attendance.id);

      if (response.success) {
        showNotification(`Sertifikat untuk ${attendance.nama_lengkap} berhasil dibuat`, "success");

        // Update local state to reflect the generated certificate
        setAttendances((prev) =>
          prev.map((a) =>
            a.id === attendance.id
              ? {
                  ...a,
                  file_path: response.data?.file_path,
                  certificate_url: response.data?.certificate_url,
                  nomor_sertifikat: response.data?.nomor_sertifikat || a.nomor_sertifikat,
                }
              : a,
          ),
        );
      }
    } catch (err) {
      console.error("Error generating certificate:", err);
      showNotification(err.message || "Gagal membuat sertifikat", "error");
    } finally {
      setButtonLoading(attendance.id, "generate", false);
    }
  };

  /**
   * Download certificate for a single attendance
   */
  const handleDownloadCertificate = async (attendance) => {
    // Check if certificate exists
    if (!attendance.nomor_sertifikat) {
      showNotification(`Sertifikat untuk ${attendance.nama_lengkap} belum dibuat. Silakan buat terlebih dahulu.`, "warning");
      return;
    }

    try {
      setButtonLoading(attendance.id, "download", true);
      
      // Use the certificate number to download
      const blob = await certificateAPI.downloadByCertificateNumber(attendance.nomor_sertifikat);
      downloadPDF(blob, `Sertifikat-${attendance.nama_lengkap.replace(/\s+/g, "_")}.pdf`);
      showNotification("Sertifikat berhasil diunduh", "success");
    } catch (err) {
      console.error("Error downloading certificate:", err);
      showNotification(err.message || "Gagal mengunduh sertifikat", "error");
    } finally {
      setButtonLoading(attendance.id, "download", false);
    }
  };

  /**
   * Send certificate via email for a single attendance
   */
  const handleSendCertificate = (attendance) => {
    // Check if certificate exists
    if (!attendance.file_path && !attendance.certificate_url && !attendance.nomor_sertifikat) {
      showNotification(`Sertifikat untuk ${attendance.nama_lengkap} belum dibuat. Silakan buat terlebih dahulu.`, "warning");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Kirim Sertifikat",
      message: `Kirim sertifikat ke ${attendance.email}?`,
      type: "info",
      onConfirm: async () => {
        try {
          setButtonLoading(attendance.id, "send", true);
          const response = await certificateAPI.sendSingle(attendance.id);

          if (response.success) {
            showNotification(`Sertifikat berhasil dikirim ke ${attendance.email}`, "success");
          }
        } catch (err) {
          console.error("Error sending certificate:", err);
          showNotification(err.message || "Gagal mengirim sertifikat", "error");
        } finally {
          setButtonLoading(attendance.id, "send", false);
        }
      },
    });
  };

  // ===== EVENT-LEVEL ACTIONS =====

  /**
   * Generate certificates for all participants in the event
   */
  const handleGenerateAllCertificates = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Buat Semua Sertifikat",
      message: `Buat sertifikat untuk semua ${attendances.length} peserta? Ini mungkin memerlukan beberapa saat.`,
      type: "warning",
      onConfirm: async () => {
        try {
          setEventLoading((prev) => ({ ...prev, generateAll: true }));
          const response = await certificateAPI.generateEvent(event.id);

          if (response.success) {
            showNotification(`Berhasil membuat ${response.data?.count || attendances.length} sertifikat`, "success");

            // Refresh attendance list
            try {
              const refreshed = await attendanceAPI.getByEvent(event.id, { page: 1, limit: 1000 });
              if (refreshed.success) {
                setAttendances(refreshed.data.attendances || []);
              }
            } catch (err) {
              console.error("Failed to refresh attendances:", err);
            }
          }
        } catch (err) {
          console.error("Error generating all certificates:", err);
          showNotification(err.message || "Gagal membuat sertifikat", "error");
        } finally {
          setEventLoading((prev) => ({ ...prev, generateAll: false }));
        }
      },
    });
  };

  /**
   * Send certificates to all participants via email
   */
  const handleSendAllCertificates = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Kirim Semua Sertifikat",
      message: `Kirim sertifikat ke semua ${attendances.length} peserta via email?`,
      type: "warning",
      onConfirm: async () => {
        try {
          setEventLoading((prev) => ({ ...prev, sendAll: true }));
          const response = await certificateAPI.sendEvent(event.id);

          if (response.success) {
            showNotification(`Berhasil mengirim ${response.data?.count || attendances.length} sertifikat`, "success");
          }
        } catch (err) {
          console.error("Error sending all certificates:", err);
          showNotification(err.message || "Gagal mengirim sertifikat", "error");
        } finally {
          setEventLoading((prev) => ({ ...prev, sendAll: false }));
        }
      },
    });
  };

  /**
   * View and download certificates from history
   */
  const handleViewCertificateHistory = async () => {
    try {
      setEventLoading((prev) => ({ ...prev, viewHistory: true }));
      const response = await certificateAPI.getHistory(event.id);

      if (response.success && response.data?.certificates) {
        // Create a simple UI to list and download certificates
        showCertificateHistoryModal(response.data.certificates);
      } else {
        showNotification("Belum ada riwayat sertifikat", "info");
      }
    } catch (err) {
      console.error("Error fetching certificate history:", err);
      showNotification(err.message || "Gagal mengambil riwayat sertifikat", "error");
    } finally {
      setEventLoading((prev) => ({ ...prev, viewHistory: false }));
    }
  };

  /**
   * Show modal with certificate history
   */
  const showCertificateHistoryModal = (certificates) => {
    const modal = document.createElement("div");
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    let certificatesList = certificates
      .map(
        (cert, i) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: center;">${i + 1}</td>
        <td style="padding: 12px;">${cert.nama_lengkap || "N/A"}</td>
        <td style="padding: 12px;">${cert.nomor_sertifikat || "N/A"}</td>
        <td style="padding: 12px; text-align: center;">
          <button data-url="${cert.file_path}" class="cert-download-btn" style="
            background: #3b82f6;
            color: white;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
            Unduh
          </button>
        </td>
      </tr>
    `,
      )
      .join("");

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 700px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      ">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937;">
            Riwayat Sertifikat
          </h3>
          <button id="close-modal-btn" style="
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #6b7280;
          ">×</button>
        </div>
        
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f3f4f6;">
              <tr>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">No</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">Nama</th>
                <th style="padding: 12px; text-align: left; font-weight: 600; color: #374151;">No. Sertifikat</th>
                <th style="padding: 12px; text-align: center; font-weight: 600; color: #374151;">Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${certificatesList || '<tr><td colSpan="4" style="padding: 20px; text-align: center; color: #6b7280;">Tidak ada sertifikat</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Attach event listeners
    const closeBtn = modal.querySelector("#close-modal-btn");
    closeBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    const downloadBtns = modal.querySelectorAll(".cert-download-btn");
    downloadBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const url = e.target.getAttribute("data-url");
        if (url) {
          downloadPDF(url, `sertifikat_${Date.now()}.pdf`);
        }
      });
    });

    // Close modal when clicking outside
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  };

  const handleGenerateAttendanceReport = async () => {
    try {
      setEventLoading((prev) => ({ ...prev, generateReport: true }));

      const blob = await reportAPI.downloadAttendanceReport(event.id);
      
      if (blob.size === 0) {
        throw new Error("File PDF kosong");
      }

      // Verify blob type is PDF
      if (!blob.type.includes('application/pdf')) {
        throw new Error("File yang diunduh bukan PDF");
      }

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `laporan-absensi-${event.nama_kegiatan.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      showNotification("Laporan berhasil diunduh", "success");
    } catch (err) {
      console.error(err);
      showNotification(err.message || "Gagal download laporan", "error");
    } finally {
      setEventLoading((prev) => ({ ...prev, generateReport: false }));
    }
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await attendanceAPI.getByEvent(event.id, { page: 1, limit: 1000 });
      if (response.success) {
        setAttendances(response.data.attendances || []);
        showNotification("Data berhasil dimuat ulang", "success");
      }
    } catch (err) {
      console.error("Failed to load attendances:", err);
      showNotification("Gagal memuat data peserta", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
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
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
            Daftar Hadir: {event.nama_kegiatan}
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
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200">
              Kembali
            </button>
          </div>
        </div>

        {/* Event-Level Certificate Actions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Manajemen Sertifikat Kegiatan</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateAllCertificates}
              disabled={eventLoading.generateAll || isLoading || attendances.length === 0}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {eventLoading.generateAll && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Buat Semua Sertifikat
            </button>

            <button
              onClick={handleSendAllCertificates}
              disabled={eventLoading.sendAll || isLoading || attendances.length === 0}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {eventLoading.sendAll && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              Kirim Semua Sertifikat
            </button>
            <button
              onClick={handleGenerateAttendanceReport}
              disabled={eventLoading.generateReport || isLoading || attendances.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {eventLoading.generateReport && <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4 4a2 2 0 012-2h5.586A2 2 0 0113 2.586l3.414 3.414A2 2 0 0117 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm8 0v3h3l-3-3zM8 11a1 1 0 000 2h4a1 1 0 100-2H8z"
                  clipRule="evenodd"
                />
              </svg>
              PDF Report Absensi
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        {attendances.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">Belum ada peserta yang terdaftar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-100 border-b-2 border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">No</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nama</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Unit</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">No. Sertifikat</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="py-3 px-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {attendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((a, i) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition duration-150">
                    <td className="py-4 px-4 text-sm text-gray-500">{(currentPage - 1) * itemsPerPage + i + 1}</td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{a.nama_lengkap}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{a.unit_kerja}</td>
                    <td className="py-4 px-4 text-sm text-gray-500">{a.email}</td>
                    <td className="py-4 px-4 text-center">
                      {a.nomor_sertifikat ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{a.nomor_sertifikat}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          a.status === "sertifikat_terkirim" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {a.status === "menunggu_sertifikat" ? "Menunggu Sertifikat" : a.status === "sertifikat_terkirim" ? "Sertifikat Terkirim" : a.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex justify-center gap-2 flex-wrap">
                        {/* Generate Button */}
                        <button
                          onClick={() => handleGenerateCertificate(a)}
                          disabled={isButtonLoading(a.id, "generate")}
                          title="Buat sertifikat untuk peserta ini"
                          className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-150"
                        >
                          {isButtonLoading(a.id, "generate") ? <span className="inline-block w-3 h-3 border border-blue-700 border-t-transparent rounded-full animate-spin mr-1"></span> : null}
                          Buat
                        </button>

                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadCertificate(a)}
                          disabled={isButtonLoading(a.id, "download") || !a.nomor_sertifikat}
                          title={a.nomor_sertifikat ? "Unduh sertifikat" : "Sertifikat belum dibuat"}
                          className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium hover:bg-green-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-150"
                        >
                          {isButtonLoading(a.id, "download") ? <span className="inline-block w-3 h-3 border border-green-700 border-t-transparent rounded-full animate-spin mr-1"></span> : null}
                          Unduh
                        </button>

                        {/* Send Button */}
                        <button
                          onClick={() => handleSendCertificate(a)}
                          disabled={isButtonLoading(a.id, "send") || !a.nomor_sertifikat}
                          title={a.nomor_sertifikat ? "Kirim sertifikat via email" : "Sertifikat belum dibuat"}
                          className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium hover:bg-orange-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed transition duration-150"
                        >
                          {isButtonLoading(a.id, "send") ? <span className="inline-block w-3 h-3 border border-orange-700 border-t-transparent rounded-full animate-spin mr-1"></span> : null}
                          Kirim
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
        {attendances.length > itemsPerPage && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, attendances.length)} dari {attendances.length} peserta
            </div>
            <div className="flex gap-2 items-center flex-wrap justify-center">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sebelumnya"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Smart Pagination with ellipsis */}
              {(() => {
                const totalPages = Math.ceil(attendances.length / itemsPerPage);
                const pageNumbers = [];
                const maxVisible = 7; // Show max 7 page numbers
                
                if (totalPages <= maxVisible) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pageNumbers.push(i);
                  }
                } else {
                  // Smart pagination with ellipsis
                  if (currentPage <= 4) {
                    // Near start: 1 2 3 4 5 ... last
                    pageNumbers.push(1, 2, 3, 4, 5, '...', totalPages);
                  } else if (currentPage >= totalPages - 3) {
                    // Near end: 1 ... N-4 N-3 N-2 N-1 N
                    pageNumbers.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                  } else {
                    // Middle: 1 ... current-1 current current+1 ... last
                    pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                  }
                }
                
                return pageNumbers.map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">...</span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        currentPage === page 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  )
                ));
              })()}
              
              {/* Next Button */}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(attendances.length / itemsPerPage)))}
                disabled={currentPage === Math.ceil(attendances.length / itemsPerPage)}
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

export default AttendanceList;