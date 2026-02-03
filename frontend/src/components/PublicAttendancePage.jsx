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
    <div className="min-h-screen flex flex-col bg-linear-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-yellow-500">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center gap-1">
            <img
              src="/Logo_BBPMP_JATENG.png"
              alt="Kemendikdasmen"
              className="h-20 w-auto"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grow">
        <div className="max-w-6xl mx-auto w-full p-1">
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
