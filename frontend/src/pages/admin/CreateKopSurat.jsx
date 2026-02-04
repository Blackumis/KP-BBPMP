import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { kopSuratAPI } from "../../services/api";
import { showNotification } from "../../components/Notification";

const CreateKopSurat = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    nama_data: "",
    periode_mulai: "",
    periode_selesai: "",
    is_active: false,
    kop_image: null,
    kop_image_preview: null,
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        showNotification("Harap pilih file gambar yang valid", "error");
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showNotification("Ukuran gambar tidak boleh lebih dari 5MB", "error");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          kop_image: file,
          kop_image_preview: reader.result,
        }));
        showNotification("Gambar berhasil diunggah", "success");
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    if (!formData.nama_data.trim()) {
      showNotification("Nama instansi / unit harus diisi", "error");
      return false;
    }
    if (!formData.periode_mulai) {
      showNotification("Periode mulai harus diisi", "error");
      return false;
    }
    if (!formData.periode_selesai) {
      showNotification("Periode selesai harus diisi", "error");
      return false;
    }
    if (new Date(formData.periode_mulai) > new Date(formData.periode_selesai)) {
      showNotification("Periode mulai tidak boleh lebih dari periode selesai", "error");
      return false;
    }
    if (!formData.kop_image) {
      showNotification("Gambar kop surat harus diunggah", "error");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await kopSuratAPI.create(formData);
      if (response.success) {
        showNotification("Kop surat berhasil dibuat", "success");
        navigate("/admin/kop-surat");
      } else {
        showNotification(response.message || "Gagal membuat kop surat", "error");
      }
    } catch (err) {
      showNotification(err.message || "Terjadi kesalahan saat membuat kop surat", "error");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      kop_image: null,
      kop_image_preview: null,
    });
    showNotification("Gambar berhasil dihapus", "info");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
          Buat Kop Surat Baru
        </h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Nama Instansi / Unit */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nama Instansi / Unit <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="nama_data"
            value={formData.nama_data}
            onChange={handleInputChange}
            placeholder="Contoh: BBPMP Provinsi Jawa Tengah"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Periode Mulai */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Periode Mulai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="periode_mulai"
            value={formData.periode_mulai}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Periode Selesai */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Periode Selesai <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            name="periode_selesai"
            value={formData.periode_selesai}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>

        {/* Gambar Kop Surat */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Gambar Kop Surat <span className="text-red-500">*</span>
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
            {formData.kop_image_preview ? (
              <div className="space-y-4">
                <img src={formData.kop_image_preview} alt="Kop preview" className="max-h-64 mx-auto rounded" />
                <p className="text-sm text-gray-600">{formData.kop_image?.name}</p>
                <button type="button" onClick={handleRemoveImage} className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition">
                  Hapus
                </button>
              </div>
            ) : (
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-12l-3-3m0 0l-3-3m3 3v10m3-7h3m0 0h3m-3 0v5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Seret dan lepas gambar kop surat di sini, atau{" "}
                  <label className="text-blue-600 hover:text-blue-800 cursor-pointer font-medium">
                    klik untuk memilih
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF hingga 5MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-end pt-6 border-t">
          <button type="button" onClick={() => navigate("/admin/kop-surat")} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium">
            Batal
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              "Simpan Kop Surat"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateKopSurat;
