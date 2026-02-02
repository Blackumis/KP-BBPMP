import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
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
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          {/* 404 Icon */}
          <div className="mb-6">
            <svg
              className="mx-auto h-24 w-24 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          {/* 404 Text */}
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-8">
            Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan atau tidak ada.
          </p>
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

export default NotFoundPage;
