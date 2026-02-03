import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ServerErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const errorDetails = location.state?.errorDetails || {};
  
  const errorType = errorDetails.type || "server";
  const errorMessage = errorDetails.message || "Terjadi kesalahan pada server";

  const getErrorConfig = () => {
    switch (errorType) {
      case "database":
        return {
          icon: (
            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          ),
          title: "Kesalahan Database",
          description: "Tidak dapat terhubung ke database. Silakan coba beberapa saat lagi.",
        };
      case "network":
        return {
          icon: (
            <svg className="h-16 w-16 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
            </svg>
          ),
          title: "Kesalahan Jaringan",
          description: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.",
        };
      case "timeout":
        return {
          icon: (
            <svg className="h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          title: "Waktu Habis",
          description: "Server tidak merespons. Silakan coba lagi dalam beberapa saat.",
        };
      case "unauthorized":
        return {
          icon: (
            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ),
          title: "Akses Ditolak",
          description: "Username atau password yang Anda masukkan salah.",
        };
      default:
        return {
          icon: (
            <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          title: "Kesalahan Server",
          description: "Terjadi kesalahan pada server. Tim teknis kami sedang menangani masalah ini.",
        };
    }
  };

  const config = getErrorConfig();

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header isAuthenticated={false} user={null} onLogout={() => {}} />

      <main className="grow flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full">
          {/* Error Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-50 rounded-full">
              {config.icon}
            </div>
          </div>

          {/* Error Code Badge */}
          <div className="flex justify-center mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
              {config.code}
            </span>
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
            {config.title}
          </h1>

          {/* Error Description */}
          <p className="text-gray-600 text-center mb-4">
            {config.description}
          </p>

          {/* Detailed Error Message (if available) */}
          {errorMessage && errorMessage !== config.description && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                <span className="font-semibold">Detail: </span>
                {errorMessage}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={handleRetry}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Coba Lagi
            </button>
            <button
              onClick={handleGoHome}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ke Beranda
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ServerErrorPage;
