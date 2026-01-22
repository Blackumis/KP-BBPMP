import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#1e3a8a] text-white py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-6 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} BBPMP Provinsi Jawa Tengah - Kementerian Pendidikan Dasar dan Menengah.</p>
      </div>
    </footer>
  );
};

export default Footer;
