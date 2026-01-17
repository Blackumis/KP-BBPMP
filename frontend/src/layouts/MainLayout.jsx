import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MainLayout = ({ children, isAuthenticated, user, onLogout }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <Header isAuthenticated={isAuthenticated} user={user} onLogout={onLogout} />
      <main className="grow">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
