import React, { useState, useEffect } from "react";
import { settingsAPI } from "../services/api";

const SmtpSettingsModal = ({ isOpen, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [showTestInput, setShowTestInput] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [formData, setFormData] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromName: "BBPMP",
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await settingsAPI.getSmtp();
      if (res.success) {
        setFormData({
          host: res.data.host || "",
          port: res.data.port || 587,
          secure: res.data.secure || false,
          user: res.data.user || "",
          password: res.data.password || "",
          fromName: res.data.fromName || "BBPMP",
        });
      }
    } catch (err) {
      console.error("Failed to load SMTP settings:", err);
      setMessage({ type: "error", text: "Gagal memuat pengaturan SMTP" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await settingsAPI.updateSmtp(formData);
      if (res.success) {
        setMessage({ type: "success", text: "Pengaturan SMTP berhasil disimpan" });
        // Update password field to masked value
        setFormData((prev) => ({
          ...prev,
          password: res.data.password || "",
        }));
      } else {
        setMessage({ type: "error", text: res.message || "Gagal menyimpan pengaturan" });
      }
    } catch (err) {
      console.error("Failed to save SMTP settings:", err);
      setMessage({ type: "error", text: err.message || "Gagal menyimpan pengaturan" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await settingsAPI.testSmtp({
        ...formData,
        testEmail: showTestInput ? testEmail : null,
      });
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setShowTestInput(false);
        setTestEmail("");
      } else {
        setMessage({ type: "error", text: res.message || "Koneksi gagal" });
      }
    } catch (err) {
      console.error("SMTP test failed:", err);
      setMessage({ type: "error", text: err.message || "Koneksi gagal" });
    } finally {
      setTesting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg border-t-4 border-blue-600">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pengaturan SMTP
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-500">Memuat pengaturan...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message */}
              {message.text && (
                <div className={`p-3 rounded-lg text-sm ${
                  message.type === "success" 
                    ? "bg-green-50 text-green-700 border border-green-200" 
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}>
                  {message.text}
                </div>
              )}

              {/* SMTP Host */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  SMTP Host <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="host"
                  value={formData.host}
                  onChange={handleChange}
                  placeholder="smtp.gmail.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Port and Secure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    placeholder="587"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="secure"
                      checked={formData.secure}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">SSL/TLS (port 465)</span>
                  </label>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Username / Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="user"
                  value={formData.user}
                  onChange={handleChange}
                  placeholder="your-email@gmail.com"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Password / App Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Untuk Gmail, gunakan App Password. Biarkan kosong jika tidak ingin mengubah.
                </p>
              </div>

              {/* From Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Pengirim
                </label>
                <input
                  type="text"
                  name="fromName"
                  value={formData.fromName}
                  onChange={handleChange}
                  placeholder="BBPMP"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Test Email Input */}
              {showTestInput && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Tujuan Test
                  </label>
                  <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex justify-between gap-3 p-4 bg-gray-50 rounded-b-lg border-t">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowTestInput(!showTestInput)}
                disabled={testing}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium text-sm"
              >
                {showTestInput ? "Batal Test" : "Test Koneksi"}
              </button>
              {showTestInput && (
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition font-medium text-sm flex items-center disabled:opacity-50"
                >
                  {testing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Testing...
                    </>
                  ) : (
                    "Kirim Test"
                  )}
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition font-medium flex items-center disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmtpSettingsModal;
