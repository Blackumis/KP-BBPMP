import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, useNavigate } from "react-router-dom";

import ListEvents from "./admin/ListEvents";
import CreateEvent from "./admin/CreateEvent";
import EditEvent from "./admin/EditEvent";
import "../index.css";

const AdminPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Routes>
        <Route index element={<ListEvents />} />
        <Route path="create" element={<CreateEvent onBack={() => navigate("/admin")} />} />
        <Route path="edit/:id" element={<EditEvent onBack={() => navigate("/admin")} />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </div>
  );
};

export default AdminPage;
