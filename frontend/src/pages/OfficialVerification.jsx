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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Memuat data pejabat...</p>
        </div>
      </div>
    );
  }

  if (error || !official) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Data Tidak Ditemukan</h1>
          <p className="text-gray-600 mb-6">{error || "Pejabat yang Anda cari tidak ditemukan"}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-lg mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-green-700 font-semibold">Terverifikasi</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Informasi Pejabat</h1>
          <p className="text-gray-600">Data penandatangan sertifikat resmi</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 h-32 relative">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-white rounded-t-[3rem]"></div>
          </div>

          {/* Content */}
          <div className="px-8 pb-12 -mt-8 relative">
            {/* Name and Position */}
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{official.name}</h2>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 rounded-full">
                <span className="text-indigo-700 font-semibold text-lg">{official.position}</span>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 mb-8">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-gray-700 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Tanda Tangan Resmi
                </h3>
                <p className="text-sm text-gray-500">Tanda tangan digital yang terverifikasi</p>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-inner flex items-center justify-center min-h-[200px]">
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

            {/* Footer Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Informasi ini diverifikasi dan dikelola oleh sistem manajemen sertifikat resmi. 
                    Data pejabat ini digunakan untuk penandatanganan sertifikat yang sah dan terverifikasi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfficialVerification;
