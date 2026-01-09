import React from 'react';

const Header = ({ user, onLogout, isAuthenticated }) => {
  return (
    <header className="bg-white shadow-md py-4 px-6 md:px-12 border-b-4 border-yellow-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Main Logo */}
        <div className="flex items-center gap-4">
          <img 
             src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg/800px-Logo_of_Ministry_of_Education_and_Culture_of_Republic_of_Indonesia.svg.png" 
             alt="Logo Tut Wuri Handayani" 
             className="h-16 w-auto"
          />
          <div className="flex flex-col text-left">
             <h1 className="text-2xl font-bold text-blue-800 tracking-wide uppercase leading-tight">
               Kemendikdasmen
             </h1>
             <p className="text-sm font-semibold text-gray-700">
               BBPMP Provinsi Jawa Tengah
             </p>
          </div>
        </div>

        {/* Right Side: User Info & Logout */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-800">{user.full_name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {user.full_name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <button
                onClick={onLogout}
                className="ml-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-xs text-white font-bold border-2 border-yellow-400 shadow-sm">
                A
              </div>
              <div className="flex flex-col items-center">
                 <div className="text-[10px] text-blue-900 font-bold">BBPMP Jateng</div>
                 <div className="h-1 bg-gradient-to-r from-blue-500 to-green-500 w-full mt-1"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
