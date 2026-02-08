import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ValidasiSertifikat = () => {
  const location = useLocation();
  // Extract certificate number from path: /validasi/1/001/BBPMP/2025 -> 1/001/BBPMP/2025
  const certificateNumber = decodeURIComponent(location.pathname.replace("/validasi/", ""));
  const [loading, setLoading] = useState(true);
  const [validationData, setValidationData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  console.log("Certificate number from URL:", certificateNumber);
  const formatJam = (jam) => jam?.slice(0, 5);

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
      console.error("Download error:", err);
      alert("Gagal mengunduh sertifikat: " + err.message);
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
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <Header isAuthenticated={false} user={null} onLogout={() => {}} />
        <main className="grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memvalidasi sertifikat...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
        <Header isAuthenticated={false} user={null} onLogout={() => {}} />

        {/* Content */}
        <main className="grow flex items-center justify-center p-4">
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
        </main>

        <Footer />
      </div>
    );
  }

  // Check if tanggal_mulai and tanggal_selesai are the same
  const isSameDate = validationData?.event?.tanggal_mulai === validationData?.event?.tanggal_selesai;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header isAuthenticated={false} user={null} onLogout={() => {}} />

      {/* Content */}
      <main className="grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Icon */}
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Informasi Sertifikat</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nomor Sertifikat</label>
                  <p className="text-lg font-mono font-semibold text-gray-900">{validationData?.certificate?.nomor_sertifikat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tanggal Diterbitkan</label>
                  <p className="text-lg text-gray-900">{validationData?.certificate?.tanggal_diterbitkan}</p>
                </div>
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Data Peserta</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama Lengkap</label>
                  <p className="text-lg font-semibold text-gray-900">{validationData?.participant?.nama_lengkap}</p>
                </div>
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
                {validationData?.participant?.pangkat_golongan && validationData?.participant?.pangkat_golongan !== "-" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pangkat/Golongan</label>
                    <p className="text-lg text-gray-900">{validationData?.participant?.pangkat_golongan}</p>
                  </div>
                )}
                {validationData?.participant?.jabatan && validationData?.participant?.jabatan !== "-" && (
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
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Informasi Kegiatan</h2>
            </div>
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nama Kegiatan</label>
                  <p className="text-lg font-semibold text-gray-900">{validationData?.event?.nama_kegiatan}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isSameDate ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tanggal</label>
                      <p className="text-lg text-gray-900">{validationData?.event?.tanggal_mulai}</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tanggal Mulai</label>
                        <p className="text-lg text-gray-900">{validationData?.event?.tanggal_mulai}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tanggal Selesai</label>
                        <p className="text-lg text-gray-900">{validationData?.event?.tanggal_selesai}</p>
                      </div>
                    </>
                  )}

                  {isSameDate ? (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Pukul</label>
                      <p className="text-lg text-gray-900">
                        {formatJam(validationData?.event?.jam_mulai)} - {formatJam(validationData?.event?.jam_selesai)} WIB
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Jam Mulai</label>
                        <p className="text-lg text-gray-900">{formatJam(validationData?.event?.jam_mulai)} WIB</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Jam Selesai</label>
                        <p className="text-lg text-gray-900">{formatJam(validationData?.event?.jam_selesai)} WIB</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center pb-4">
            <p className="text-sm text-gray-600">Halaman ini memverifikasi keaslian sertifikat yang diterbitkan oleh sistem KP BBPMP.</p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ValidasiSertifikat;
