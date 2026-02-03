import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const ValidasiSertifikat = () => {
  const location = useLocation();
  // Extract certificate number from path: /validasi/1/001/BBPMP/2025 -> 1/001/BBPMP/2025
  const certificateNumber = decodeURIComponent(location.pathname.replace("/validasi/", ""));
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  console.log("Certificate number from URL:", certificateNumber);

  const handleDownloadPDF = async () => {
    try {
      setDownloading(true);
      const encodedCertNumber = encodeURIComponent(certificateNumber);
      const response = await fetch(`http://localhost:5000/api/certificates/download/${encodedCertNumber}`);

      if (!response.ok) {
        throw new Error("Gagal mengunduh sertifikat");
      }

      // Get the blob from response
      const blob = await response.blob();

      // Create a link element and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `Sertifikat-${validationData?.participant?.nama_lengkap || certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showNotification("Gagal mengunduh sertifikat: " + err.message, "error");
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    const validateCertificate = async () => {
      try {
        setLoading(true);
        const encodedCertNumber = encodeURIComponent(certificateNumber);
        const response = await fetch(`http://localhost:5000/api/certificates/validate/${encodedCertNumber}`);
        const data = await response.json();

        if (data.success && data.valid) {
          setValidationData(data.data);
          setError(null);
        } else {
          setError(data.message || "Sertifikat tidak ditemukan");
          setValidationData(null);
        }
      } catch (err) {
        console.error("Validation error:", err);
        setError("Gagal memvalidasi sertifikat. Silakan coba lagi.");
        setValidationData(null);
      } finally {
        setLoading(false);
      }
    };

    if (certificateNumber) {
      validateCertificate();
    }
  }, [certificateNumber]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memvalidasi sertifikat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex flex-col">
        {/* Header */}
        <div className="bg-white shadow-md border-b-4 border-yellow-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png"
                alt="Kemendikdasmen"
                className="h-12 w-auto"
              />
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-blue-800 uppercase leading-tight">Kemendikdasmen</h1>
                <p className="text-xs font-semibold text-gray-700">BBPMP Provinsi Jawa Tengah</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="grow flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Sertifikat Tidak Valid</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <p className="text-sm text-gray-500">
                Nomor Sertifikat: <span className="font-mono font-semibold">{certificateNumber}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kemendikdasmen</p>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png"
              alt="Kemendikdasmen"
              className="h-12 w-auto"
            />
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-blue-800 uppercase leading-tight">Kemendikdasmen</h1>
              <p className="text-xs font-semibold text-gray-700">BBPMP Provinsi Jawa Tengah</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Sertifikat Valid</h1>
            <p className="text-gray-600">Sertifikat ini terdaftar dalam sistem kami</p>
          </div>

          {/* Certificate Info Card */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Informasi Sertifikat</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nomor Sertifikat</label>
                  <p className="text-lg font-mono font-semibold text-gray-900">{validationData?.certificate?.nomor_sertifikat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-lg font-semibold text-gray-900">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        validationData?.certificate?.status === "sertifikat_terkirim" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {validationData?.certificate?.status === "sertifikat_terkirim" ? "Terkirim" : "Menunggu Pengiriman"}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Diterbitkan</label>
                  <p className="text-lg text-gray-900">{validationData?.certificate?.tanggal_diterbitkan}</p>
                </div>
                {validationData?.certificate?.tanggal_dikirim && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Dikirim</label>
                    <p className="text-lg text-gray-900">{validationData?.certificate?.tanggal_dikirim}</p>
                  </div>
                )}
              </div>

              {/* Download Button */}
              {validationData?.certificate?.certificate_path && (
                <div className="mt-6">
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition duration-200 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {downloading ? "Mengunduh..." : "Unduh Sertifikat PDF"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Participant Info Card */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Data Peserta</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                  <p className="text-lg font-semibold text-gray-900">{validationData?.participant?.nama_lengkap}</p>
                </div>
                {validationData?.participant?.nip && validationData?.participant?.nip !== "-" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">NIP</label>
                    <p className="text-lg text-gray-900">{validationData?.participant?.nip}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Unit Kerja</label>
                  <p className="text-lg text-gray-900">{validationData?.participant?.unit_kerja}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Provinsi</label>
                  <p className="text-lg text-gray-900">{validationData?.participant?.provinsi}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Kabupaten/Kota</label>
                  <p className="text-lg text-gray-900">{validationData?.participant?.kabupaten_kota}</p>
                </div>
                {validationData?.participant?.tanggal_lahir && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Lahir</label>
                    <p className="text-lg text-gray-900">{validationData?.participant?.tanggal_lahir}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Nomor HP</label>
                  <p className="text-lg text-gray-900">{validationData?.participant?.nomor_hp || "-"}</p>
                </div>
                {validationData?.participant?.pangkat_golongan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pangkat/Golongan</label>
                    <p className="text-lg text-gray-900">{validationData?.participant?.pangkat_golongan}</p>
                  </div>
                )}
                {validationData?.participant?.jabatan && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jabatan</label>
                    <p className="text-lg text-gray-900">{validationData?.participant?.jabatan}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-lg text-gray-900">{validationData?.participant?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info Card */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Informasi Kegiatan</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama Kegiatan</label>
                  <p className="text-lg font-semibold text-gray-900">{validationData?.event?.nama_kegiatan}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Mulai</label>
                    <p className="text-lg text-gray-900">{validationData?.event?.tanggal_mulai}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tanggal Selesai</label>
                    <p className="text-lg text-gray-900">{validationData?.event?.tanggal_selesai}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jam Mulai</label>
                    <p className="text-lg text-gray-900">{validationData?.event?.jam_mulai}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Jam Selesai</label>
                    <p className="text-lg text-gray-900">{validationData?.event?.jam_selesai}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center pb-4">
            <p className="text-sm text-gray-600">Halaman ini memverifikasi keaslian sertifikat yang diterbitkan oleh sistem KP BBPMP.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">© {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kemendikdasmen</p>
        </div>
      </footer>
    </div>
  );
};

export default ValidasiSertifikat;
