import React from "react";
import AttendanceForm from "./AttendanceForm";

const PublicAttendancePage = ({ eventId: propEventId }) => {
  // Determine event ID from prop or URL (works with standalone page or SPA)
  let eventId = propEventId;
  if (!eventId && typeof window !== "undefined") {
    const m = window.location.pathname.match(/\/attendance\/([^/]+)/);
    eventId = m ? m[1] : new URLSearchParams(window.location.search).get("event");
  }

  const goHome = () => {
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
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
      <div className="flex-grow">
        <div className="max-w-4xl mx-auto w-full p-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-800">Form Absensi</h2>
          </div>
          <AttendanceForm eventId={eventId} onReset={goHome} />
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

export default PublicAttendancePage;
