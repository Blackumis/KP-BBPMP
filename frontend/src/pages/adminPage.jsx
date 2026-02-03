import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";

import ListEvents from "./admin/ListEvents";
import CreateEvent from "./admin/CreateEvent";
import EditEvent from "./admin/EditEvent";
import ListKopSurat from "./admin/ListKopSurat";
import CreateKopSurat from "./admin/CreateKopSurat";
import EditKopSurat from "./admin/EditKopSurat";
import ListPejabat from "./admin/ListPejabat";
import "../index.css";

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Routes>
        <Route index element={<ListEvents />} />
        <Route path="create" element={<CreateEvent onBack={() => navigate("/admin")} />} />
        <Route path="edit/:id" element={<EditEvent onBack={() => navigate("/admin")} />} />
        <Route path="kop-surat" element={<ListKopSurat />} />
        <Route path="kop-surat/create" element={<CreateKopSurat />} />
        <Route path="kop-surat/edit/:id" element={<EditKopSurat />} />
        <Route path="pejabat" element={<ListPejabat />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;
