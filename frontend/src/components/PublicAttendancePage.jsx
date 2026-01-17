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
    if (typeof onReset === "function") return onReset();
    if (typeof window !== "undefined") window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <div className="max-w-4xl mx-auto w-full p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Form Absensi</h2>
          {/* <button onClick={goHome} className="text-sm text-gray-600 hover:text-gray-900">
            Kembali ke Beranda
          </button> */}
        </div>
        <AttendanceForm eventId={eventId} onReset={goHome} />
      </div>
    </div>
  );
};

export default PublicAttendancePage;
