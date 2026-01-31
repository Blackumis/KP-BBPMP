import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = ({ user, onLogout, isAuthenticated }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <header>
      <nav className="bg-white shadow-md border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* LEFT: Logo & Title */}
            <div className="flex items-center gap-4">
              <img
                src="/Logo_BBPMP_JATENG.png"
                alt="BBPMP Jawa Tengah"
                className="h-20 w-auto"
              />
            </div>

            {/* RIGHT: User Info (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && user ? (
                <>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{user.full_name?.charAt(0).toUpperCase() || "A"}</div>
                  <button onClick={onLogout} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition">
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col leading-tight">
                  <span className="text-lg font-bold text-blue-900 tracking-wide">Portal Presensi</span>
                  <span className="text-sm font-medium text-blue-700">BBPMP Provinsi Jawa Tengah</span>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 hover:text-blue-600 focus:outline-none">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200">
            <div className="px-4 pt-2 pb-4 space-y-3">
              {/* Mobile Navigation Links */}
              {!isAuthenticated ? (
                <>
                  <Link
                    to="/daftarkegiatan"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daftar Kegiatan
                  </Link>
                  <Link to="/login" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition" onClick={() => setMobileMenuOpen(false)}>
                    Login Admin
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/admin" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <Link
                    to="/attendances"
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Daftar Hadir
                  </Link>
                </>
              )}

              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">{user.full_name?.charAt(0).toUpperCase() || "A"}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full mt-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
