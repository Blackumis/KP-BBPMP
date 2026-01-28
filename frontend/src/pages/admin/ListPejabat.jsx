import React from "react";
import { Link } from "react-router-dom";
import OfficialsManagement from "../../components/OfficialsManagement";

const ListPejabat = () => {
  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
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
      </div>

      <OfficialsManagement />
    </div>
  );
};

export default ListPejabat;
