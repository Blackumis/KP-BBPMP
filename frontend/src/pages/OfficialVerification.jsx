import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const OfficialVerification = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [official, setOfficial] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOfficialData();
  }, [id]);

  const fetchOfficialData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:5000/api/officials/${id}`);
      
      if (!response.ok) {
        throw new Error("Pejabat tidak ditemukan");
      }
      
      const data = await response.json();
      setOfficial(data.data);
    } catch (err) {
      console.error("Error fetching official:", err);
      setError(err.message || "Gagal memuat data pejabat");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

        {/* Loading Content */}
        <div className="grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data pejabat...</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kemendikdasmen
            </p>
          </div>
        </footer>
      </div>
    );
  }

  if (error || !official) {
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

        {/* Error Content */}
        <div className="grow flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Ditemukan</h2>
              <p className="text-gray-600 mb-6">{error || "Pejabat yang Anda cari tidak ditemukan"}</p>
              <button
                onClick={() => navigate("/")}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              © {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kemendikdasmen
            </p>
          </div>
        </footer>
      </div>
    );
  }

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
      <div className="grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Pejabat Terverifikasi</h1>
            <p className="text-gray-600">Data penandatangan sertifikat resmi</p>
          </div>

          {/* Official Info Card */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-6">
            <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Informasi Pejabat</h2>
            </div>
            <div className="px-6 py-6">
              {/* Name and Position */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{official.name}</h3>
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  {official.position}
                </span>
              </div>

              {/* Signature Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center mb-4">
                  <h4 className="text-lg font-semibold text-gray-700 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Tanda Tangan Resmi
                  </h4>
                  <p className="text-sm text-gray-500">Tanda tangan digital yang terverifikasi</p>
                </div>
                
                <div className="bg-white rounded-lg p-6 border border-gray-200 flex items-center justify-center min-h-50">
                  {official.signature_image_path ? (
                    <img
                      src={`http://localhost:5000${official.signature_image_path}`}
                      alt="Tanda Tangan"
                      className="max-h-48 max-w-full object-contain"
                      onLoad={() => console.log('Image loaded:', official.signature_image_path)}
                      onError={(e) => {
                        console.error('Image failed to load:', official.signature_image_path);
                        console.error('Full URL:', e.target.src);
                        e.target.onerror = null;
                        e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><text x="50%" y="50%" text-anchor="middle" fill="%23666" font-size="14">Gambar Gagal Dimuat</text></svg>';
                      }}
                    />
                  ) : (
                    <div className="text-gray-400 text-center">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      <p className="font-medium">Tanda Tangan Tidak Tersedia</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-l-4 border-blue-500">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Informasi ini diverifikasi dan dikelola oleh sistem manajemen sertifikat resmi. 
                  Data pejabat ini digunakan untuk penandatanganan sertifikat yang sah dan terverifikasi.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center pb-4">
            <p className="text-sm text-gray-600">
              Halaman ini memverifikasi keaslian pejabat penandatangan sertifikat.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Untuk informasi lebih lanjut, hubungi administrator sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kemendikdasmen
          </p>
        </div>
      </footer>
    </div>
  );
};

export default OfficialVerification;
