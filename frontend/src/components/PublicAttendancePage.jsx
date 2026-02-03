import React from "react";
import AttendanceForm from "./AttendanceForm";
import Header from "./Header";
import Footer from "./Footer";

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
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <Header isAuthenticated={false} user={null} onLogout={() => {}} />

      {/* Content */}
      <main className="grow">
        <div className="max-w-6xl mx-auto w-full p-1">
          <AttendanceForm eventId={eventId} onReset={goHome} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicAttendancePage;
