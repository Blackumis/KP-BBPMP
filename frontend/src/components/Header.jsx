import React, { useState } from "react";
import { Link } from "react-router-dom";

const Header = ({ user, onLogout, isAuthenticated }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      <nav className="bg-white shadow-lg border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* LEFT: Logo & Title */}
            <div className="flex items-center gap-4 group">
              <div className="relative">
                <img src="/Logo_BBPMP_JATENG.png" alt="BBPMP Jawa Tengah" className="h-20 w-auto transition-transform duration-300 group-hover:scale-105" />
              </div>
            </div>

            {/* RIGHT: User Info (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-4">
                  {/* User Avatar & Info */}{" "}
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="Black" className="bi bi-person-circle" viewBox="0 0 16 16">
                          <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0" />
                          <path fillRule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1" />
                        </svg>{" "}
                      </div>
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                  </div>
                  {/* Divider */}
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                  {/* Logout Button */}
                  <button
                    onClick={onLogout}
                    className="group relative px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col leading-tight">
                  <span className="text-xl font-bold text-blue-900 tracking-wide">Portal Presensi</span>
                  <span className="text-sm font-medium text-blue-700">BBPMP Provinsi Jawa Tengah</span>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  aria-label="Toggle mobile menu"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gradient-to-b from-white to-gray-50 animate-slideDown">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className="space-y-4">
                  {/* User Card */}
                  <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-xl">{user.full_name?.charAt(0).toUpperCase() || "A"}</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900 leading-tight">{user.full_name}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{user.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar
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
