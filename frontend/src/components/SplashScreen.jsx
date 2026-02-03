import React, { useEffect, useState } from "react";

const SplashScreen = ({ onFinish, duration = 2000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 500);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onFinish]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        {/* Logo atau Icon */}
        <div className="mb-8 animate-bounce">
          <div className="mx-auto w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
            <svg
              className="w-12 h-12 text-blue-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-white mb-2">
          Sistem Sertifikat Digital
        </h1>
        <p className="text-xl text-blue-200 mb-6">
          BBPMP Provinsi Jawa Tengah
        </p>

        {/* Loading Indicator */}
        <div className="flex justify-center items-center space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-75"></div>
          <div className="w-3 h-3 bg-white rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
