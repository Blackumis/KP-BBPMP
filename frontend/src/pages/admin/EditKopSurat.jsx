import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { kopSuratAPI } from "../../services/api";
import { showNotification } from "../../components/Notification";

const EditKopSurat = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nama_data: "",
    periode_mulai: "",
    periode_selesai: "",
    jenis_ttd: null,
    kop_url: null,
    kop_image: null,
    kop_image_preview: null,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await kopSuratAPI.getById(id);
        if (res.success) {
          const data = res.data;
          setFormData({
            nama_data: data.nama_data || "",
            periode_mulai: data.periode_mulai ? data.periode_mulai.split("T")[0] : "",
            periode_selesai: data.periode_selesai ? data.periode_selesai.split("T")[0] : "",
            kop_url: data.kop_url,
            kop_image: null,
            kop_image_preview: null,
          });
        } else {
          setError("Data kop surat tidak ditemukan");
        }
      } catch (err) {
        setError(err.message || "Terjadi kesalahan saat memuat data");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Harap pilih file gambar yang valid");
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Ukuran gambar tidak boleh lebih dari 5MB");
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          kop_image: file,
          kop_image_preview: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const validateForm = () => {
    if (!formData.nama_data.trim()) {
      setError("Nama instansi / unit harus diisi");
      return false;
    }
    if (!formData.periode_mulai) {
      setError("Periode mulai harus diisi");
      return false;
    }
    if (!formData.periode_selesai) {
      setError("Periode selesai harus diisi");
      return false;
    }
    if (new Date(formData.periode_mulai) > new Date(formData.periode_selesai)) {
      setError("Periode mulai tidak boleh lebih dari periode selesai");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const submitData = {
        nama_data: formData.nama_data,
        periode_mulai: formData.periode_mulai,
        periode_selesai: formData.periode_selesai,
      };

      if (formData.kop_image) {
        submitData.kop_image = formData.kop_image;
      }

      const response = await kopSuratAPI.update(id, submitData);
      if (response.success) {
        showNotification("Kop surat berhasil diperbarui", "success");
        navigate("/admin/kop-surat");
      } else {
        setError(response.message || "Gagal memperbarui kop surat");
      }
    } catch (err) {
      setError(err.message || "Terjadi kesalahan saat memperbarui kop surat");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler untuk hapus gambar baru
  const handleRemoveNewImage = () => {
    setFormData({
      ...formData,
      kop_image: null,
      kop_image_preview: null,
    });
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
          Edit Kop Surat
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm font-medium">{error}</p>
        </div>
      )}

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
          <label className="block text-sm font-semibold text-gray-700 mb-2">Gambar Kop Surat</label>

          {/* Hidden File Input - SELALU ADA */}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" />

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
            {formData.kop_image_preview ? (
              // Preview gambar baru yang dipilih
              <div className="space-y-4">
                <img src={formData.kop_image_preview} alt="Kop preview" className="max-h-64 mx-auto rounded" />
                <p className="text-sm text-gray-600">{formData.kop_image?.name}</p>
                <div className="flex gap-3 justify-center">
                  <button type="button" onClick={handleRemoveNewImage} className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 transition font-medium">
                    Hapus
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition font-medium">
                    Ganti Gambar
                  </button>
                </div>
              </div>
            ) : formData.kop_url ? (
              // Tampilkan gambar yang sudah ada
              <div className="space-y-4">
                <img src={`http://localhost:5000/${formData.kop_url}`} alt="Current kop" className="max-h-64 mx-auto rounded border border-gray-200" />
                <p className="text-sm text-gray-600">Gambar saat ini</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-medium inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Ganti Gambar
                </button>
              </div>
            ) : (
              // Tidak ada gambar - upload baru
              <div>
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-12l-3-3m0 0l-3-3m3 3v10m3-7h3m0 0h3m-3 0v5" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <p className="mt-2 text-sm text-gray-600">
                  Seret dan lepas gambar kop surat di sini, atau{" "}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:text-blue-800 font-medium underline">
                    klik untuk memilih
                  </button>
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
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Menyimpan...
              </>
            ) : (
              "Simpan Perubahan"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditKopSurat;
