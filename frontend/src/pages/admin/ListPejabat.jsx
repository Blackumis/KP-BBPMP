import React, { useState } from "react";
import { Link } from "react-router-dom";
import OfficialsManagement from "../../components/OfficialsManagement";
import SmtpSettingsModal from "../../components/SmtpSettingsModal";

const ListPejabat = () => {
  const [showSmtpSettings, setShowSmtpSettings] = useState(false);

  return (
    <>
    <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      {/* Admin Navigation Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Link to="/admin" className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-semibold hover:text-blue-600 hover:bg-gray-50">
          Kegiatan
        </Link>
        <Link to="/admin/kop-surat" className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-semibold hover:text-blue-600 hover:bg-gray-50">
          Kop Surat
        </Link>
        <Link to="/admin/pejabat" className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-semibold hover:bg-gray-50">
          Pejabat
        </Link>
        <div className="flex-1"></div>
        <button
          onClick={() => setShowSmtpSettings(true)}
          className="px-3 py-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition flex items-center gap-1"
          title="Pengaturan SMTP"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      <OfficialsManagement />
    </div>

    {/* SMTP Settings Modal */}
    <SmtpSettingsModal
      isOpen={showSmtpSettings}
      onClose={() => setShowSmtpSettings(false)}
    />
    </>
  );
};

export default ListPejabat;
