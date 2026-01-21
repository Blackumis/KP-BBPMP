import React, { useState, useEffect } from "react";
import { eventsAPI, templatesAPI } from "../services/api";

const formatDate = (value) => {
  if (!value) return "";
  return value.split("T")[0];
};

const formatDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// ✅ Tambahkan onBack ke parameter props
const AdminPanel = ({ onSaveConfig, editEvent = null, onBack }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: "", description: "", image: null, preview: null });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [notification, setNotification] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, template: null });
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [formData, setFormData] = useState({
    // Data Kegiatan (matches database schema)
    nomor_surat: "",
    nama_kegiatan: "",
    tanggal_mulai: "",
    tanggal_selesai: "",
    jam_mulai: "",
    jam_selesai: "",
    batas_waktu_absensi: "",
    templateSource: "upload", // 'upload' or 'template'
    templateId: null,
    templateFile: null,
    templatePreview: null,
    templateName: null,

    // Form Config (stored as JSON in database)
    requireName: true,
    requireEmail: true,
    requirePhone: true,
    requireUnit: true,
    requireNIP: false,
    requireRank: false,
    requirePosition: false,
    requireDob: true,
    requireCity: true,
    requireProvince: true,
    requireSignature: true,
    requirePernyataan: true,
    eventPassword: "",
  });

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
  }, []);

  // Auto-dismiss notification after 4 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await templatesAPI.getAll(true);
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (err) {
      console.warn("Failed to load templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleDeleteTemplate = async (template) => {
    setDeletingTemplate(true);
    try {
      const response = await templatesAPI.delete(template.id);
      if (response.success) {
        setNotification({ type: "success", message: `Template "${template.name}" berhasil dihapus!` });
        // If the deleted template was selected, clear the selection
        if (formData.templateId === template.id) {
          setFormData((prev) => ({
            ...prev,
            templateId: null,
            templatePreview: null,
            templateName: null,
          }));
        }
        loadTemplates(); // Reload templates
      } else {
        setNotification({ type: "error", message: response.message || "Gagal menghapus template" });
      }
    } catch (err) {
      setNotification({ type: "error", message: "Gagal menghapus template: " + err.message });
    } finally {
      setDeletingTemplate(false);
      setDeleteConfirm({ show: false, template: null });
    }
  };

  useEffect(() => {
    // Revoke object URL when templatePreview changes or component unmounts
    return () => {
      if (formData.templatePreview && formData.templatePreview.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(formData.templatePreview);
          console.log("Revoked template preview on cleanup", formData.templatePreview);
        } catch (err) {
          console.warn("Failed to revoke template preview on cleanup", err);
        }
      }
    };
  }, [formData.templatePreview]);

  // If editing an existing event, populate the form fields
  useEffect(() => {
    if (!editEvent) return;

    // Build full URL for template if available
    let templatePreviewUrl = null;
    if (editEvent.template_sertifikat) {
      const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/i, "");
      templatePreviewUrl = `${apiBase}/${editEvent.template_sertifikat}`;
    }

    // Parse form_config if it's stored as JSON string
    let parsedConfig = {};
    try {
      parsedConfig = typeof editEvent.form_config === "string" ? JSON.parse(editEvent.form_config) : editEvent.form_config || {};
    } catch (err) {
      console.warn("Failed to parse editEvent.form_config", err);
      parsedConfig = editEvent.form_config || {};
    }

    setFormData((prev) => ({
      ...prev,
      nomor_surat: editEvent.nomor_surat || prev.nomor_surat,
      nama_kegiatan: editEvent.nama_kegiatan || prev.nama_kegiatan,
      tanggal_mulai: formatDate(editEvent.tanggal_mulai),
      tanggal_selesai: formatDate(editEvent.tanggal_selesai),
      batas_waktu_absensi: formatDateTimeLocal(editEvent.batas_waktu_absensi),
      jam_mulai: editEvent.jam_mulai || prev.jam_mulai,
      jam_selesai: editEvent.jam_selesai || prev.jam_selesai,
      templateSource: editEvent.template_source || "upload",
      templateId: editEvent.template_id || null,
      templateFile: null,
      templatePreview: templatePreviewUrl,
      templateName: editEvent.template_sertifikat ? editEvent.template_sertifikat.split("/").pop() : prev.templateName,

      // merge config
      requireName: parsedConfig.requireName ?? prev.requireName,
      requireEmail: parsedConfig.requireEmail ?? prev.requireEmail,
      requirePhone: parsedConfig.requirePhone ?? prev.requirePhone,
      requireUnit: parsedConfig.requireUnit ?? prev.requireUnit,
      requireNIP: parsedConfig.requireNIP ?? prev.requireNIP,
      requireRank: parsedConfig.requireRank ?? prev.requireRank,
      requirePosition: parsedConfig.requirePosition ?? prev.requirePosition,
      requireDob: parsedConfig.requireDob ?? prev.requireDob,
      requireCity: parsedConfig.requireCity ?? prev.requireCity,
      requireProvince: parsedConfig.requireProvince ?? prev.requireProvince,
      requireSignature: parsedConfig.requireSignature ?? prev.requireSignature,
      requirePernyataan: parsedConfig.requirePernyataan ?? prev.requirePernyataan,
      eventPassword: parsedConfig.eventPassword ?? prev.eventPassword,
    }));

    setActiveStep(1);
  }, [editEvent]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Build form_config object
      const form_config = {
        requireName: formData.requireName,
        requireEmail: formData.requireEmail,
        requirePhone: formData.requirePhone,
        requireUnit: formData.requireUnit,
        requireNIP: formData.requireNIP,
        requireRank: formData.requireRank,
        requirePosition: formData.requirePosition,
        requireDob: formData.requireDob,
        requireCity: formData.requireCity,
        requireProvince: formData.requireProvince,
        requireSignature: formData.requireSignature,
        requirePernyataan: formData.requirePernyataan,
        eventPassword: formData.eventPassword,
      };

      const eventData = {
        nama_kegiatan: formData.nama_kegiatan,
        nomor_surat: formData.nomor_surat,
        tanggal_mulai: formData.tanggal_mulai,
        tanggal_selesai: formData.tanggal_selesai || formData.tanggal_mulai,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
        batas_waktu_absensi: formData.batas_waktu_absensi,
        form_config,
        template_source: formData.templateSource,
        template_id: formData.templateId,
        template: formData.templateFile,
      };

      let response;
      if (editEvent && editEvent.id) {
        response = await eventsAPI.update(editEvent.id, eventData);
        if (response.success) {
          alert("Kegiatan berhasil diperbarui!");
          // Gunakan onBack atau onSaveConfig
          if (onBack) {
            onBack();
          } else if (onSaveConfig) {
            onSaveConfig(editEvent.id);
          }
        }
      } else {
        response = await eventsAPI.create(eventData);
        if (response.success) {
          alert("Kegiatan berhasil dibuat!");
          // Gunakan onBack atau onSaveConfig
          if (onBack) {
            onBack();
          } else if (onSaveConfig) {
            onSaveConfig(response.data);
          }
        }
      }
    } catch (err) {
      setError(err.message || "Gagal menyimpan kegiatan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      {/* Header with Back Button */}
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
          {editEvent ? "Edit Kegiatan" : "Konfigurasi Kegiatan"}
        </h2>
        {onBack && (
          <button 
            onClick={onBack} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-200"
          >
            Kembali
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-600 hover:text-red-800">
            ✕
          </button>
        </div>
      )}

      {/* Progress Stepper */}
      <div className="flex mb-8">
        <div
          className={`flex-1 py-2 text-center border-b-4 cursor-pointer ${activeStep === 1 ? "border-blue-600 text-blue-700 font-bold" : "border-gray-200 text-gray-500"}`}
          onClick={() => setActiveStep(1)}
        >
          1. Data Kegiatan
        </div>
        <div
          className={`flex-1 py-2 text-center border-b-4 cursor-pointer ${activeStep === 2 ? "border-blue-600 text-blue-700 font-bold" : "border-gray-200 text-gray-500"}`}
          onClick={() => setActiveStep(2)}
        >
          2. Atur Isian Absensi
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step 1: Data Kegiatan */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nomor Surat Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nomor_surat"
                  value={formData.nomor_surat}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Contoh: 001/BBPMP/2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Kegiatan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nama_kegiatan"
                  value={formData.nama_kegiatan}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nama lengkap kegiatan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="tanggal_mulai"
                  value={formData.tanggal_mulai}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  name="tanggal_selesai"
                  value={formData.tanggal_selesai}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Jam Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="jam_mulai"
                  value={formData.jam_mulai}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Jam Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  name="jam_selesai"
                  value={formData.jam_selesai}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Batas Waktu Absensi <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  name="batas_waktu_absensi"
                  value={formData.batas_waktu_absensi}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Template / Background Sertifikat</label>
              
              {/* Source Toggle - Styled like tabs */}
              <div className="flex mb-4">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, templateSource: "upload", templateId: null }))}
                  className={`flex-1 py-3 px-4 text-sm font-semibold transition-all border-b-4 ${
                    formData.templateSource === "upload"
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Baru
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, templateSource: "template", templateFile: null }))}
                  className={`flex-1 py-3 px-4 text-sm font-semibold transition-all border-b-4 ${
                    formData.templateSource === "template"
                      ? "border-blue-600 text-blue-700 bg-blue-50"
                      : "border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Pilih Template
                  </div>
                </button>
              </div>

              {/* Upload Section */}
              {formData.templateSource === "upload" && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition relative overflow-hidden group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData((prev) => {
                          if (prev.templatePreview && prev.templatePreview.startsWith('blob:')) {
                            try {
                              URL.revokeObjectURL(prev.templatePreview);
                            } catch (err) {
                              console.warn("Failed to revoke previous template preview URL", err);
                            }
                          }
                          const url = URL.createObjectURL(file);
                          return {
                            ...prev,
                            templateFile: file,
                            templatePreview: url,
                            templateName: file.name,
                            templateId: null,
                          };
                        });
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />

                  {formData.templatePreview ? (
                    <div className="relative w-full h-32 md:h-48 bg-gray-100 rounded-md overflow-hidden">
                      <img
                        src={formData.templatePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={() => setFormData((prev) => ({ ...prev, templatePreview: null, templateName: null }))}
                      />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20 pointer-events-none">
                        <span className="text-white font-medium">Klik untuk ganti gambar</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                      <div className="h-12 w-12 text-gray-400 mb-2">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Klik untuk upload gambar sertifikat</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max. 5MB)</p>
                    </div>
                  )}
                </div>
              )}

              {/* Template Selection Section */}
              {formData.templateSource === "template" && (
                <div>
                  {loadingTemplates ? (
                    <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                      <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-600" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="text-sm">Memuat template...</p>
                    </div>
                  ) : templates.length === 0 ? (
                    <div className="text-center py-10 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="h-16 w-16 mx-auto mb-4 text-gray-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <p className="text-gray-500 mb-4">Belum ada template tersimpan</p>
                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-md hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                      >
                        + Tambah Template Baru
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {templates.map((template) => {
                          const apiBase = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/api\/?$/i, "");
                          const imageUrl = `${apiBase}/${template.image_path}`;
                          const isSelected = formData.templateId === template.id;
                          return (
                            <div
                              key={template.id}
                              className={`relative cursor-pointer rounded-lg overflow-hidden transition-all shadow-sm hover:shadow-md group ${
                                isSelected 
                                  ? "ring-2 ring-blue-500 ring-offset-2 bg-white" 
                                  : "bg-white border border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <div 
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    templateId: template.id,
                                    templatePreview: imageUrl,
                                    templateName: template.name,
                                    templateFile: null,
                                  }));
                                }}
                                className="relative h-20 bg-gray-100"
                              >
                                <img src={imageUrl} alt={template.name} className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                                    <div className="bg-blue-600 text-white rounded-full p-1.5">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="p-2 border-t border-gray-100 flex items-center justify-between">
                                <p 
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      templateId: template.id,
                                      templatePreview: imageUrl,
                                      templateName: template.name,
                                      templateFile: null,
                                    }));
                                  }}
                                  className={`text-xs font-medium truncate flex-1 ${isSelected ? "text-blue-700" : "text-gray-700"}`}
                                >
                                  {template.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm({ show: true, template });
                                  }}
                                  className="ml-1 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                  title="Hapus template"
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTemplateModal(true)}
                        className="mt-3 w-full border border-dashed border-gray-300 bg-white text-gray-600 px-4 py-2.5 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition text-sm font-medium flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Tambah Template Baru
                      </button>
                    </div>
                  )}
                </div>
              )}

              {formData.templateName && formData.templateSource === "upload" && (
                <p className="text-xs text-green-600 mt-3 flex items-center bg-green-50 px-3 py-2 rounded-md">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  File terpilih: {formData.templateName}
                </p>
              )}
              {formData.templateId && formData.templateSource === "template" && (
                <p className="text-xs text-green-600 mt-3 flex items-center bg-green-50 px-3 py-2 rounded-md">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Template dipilih: {formData.templateName}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button type="button" onClick={() => setActiveStep(2)} className="bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition font-medium">
                Lanjut: Atur Absensi →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Konfigurasi Absensi */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <h3 className="text-md font-bold text-blue-800">Pengaturan Keamanan</h3>
              <p className="text-sm text-blue-700 mt-1">Anda dapat menambahkan password untuk membatasi akses ke formulir absensi ini. Jika dikosongkan, formulir dapat diakses oleh siapa saja.</p>
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password Absensi (Opsional)</label>
                <input
                  type="text"
                  name="eventPassword"
                  value={formData.eventPassword}
                  onChange={handleChange}
                  className="w-full md:w-1/2 border border-blue-200 bg-white rounded-md px-3 py-2 text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  placeholder="Contoh: SEMINAR2024"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-sm text-yellow-700">Data di bawah ini adalah kolom yang akan muncul pada form absensi peserta. Centang untuk mengaktifkan.</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: "requireName", label: "Nama", mandatory: true },
                { id: "requireUnit", label: "Unit Kerja", mandatory: true },
                { id: "requireNIP", label: "NIP", mandatory: false },
                { id: "requireCity", label: "Kabupaten/Kota Unit Kerja", mandatory: true },
                { id: "requireDob", label: "Tanggal Lahir", mandatory: true },
                { id: "requirePhone", label: "Nomor Handphone", mandatory: true },
                { id: "requireRank", label: "Pangkat/Golongan", mandatory: false },
                { id: "requirePosition", label: "Jabatan", mandatory: false },
                { id: "requireEmail", label: "E-mail", mandatory: true },
                { id: "requireSignature", label: "e-Signature atau ttd elektronik peserta", mandatory: true },
                { id: "requireProvince", label: "Provinsi Unit Kerja", mandatory: false },
              ].map((field) => (
                <label key={field.id} className={`flex items-center p-3 border rounded ${!field.mandatory ? "hover:bg-gray-50 cursor-pointer" : "bg-gray-50 cursor-not-allowed opacity-80"}`}>
                  {!field.mandatory ? (
                    <input type="checkbox" name={field.id} checked={formData[field.id]} onChange={handleChange} className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3" />
                  ) : (
                    <input type="checkbox" checked={true} readOnly disabled className="h-5 w-5 text-gray-400 border-gray-300 rounded mr-3 bg-gray-200" />
                  )}
                  <span className={`font-medium ${field.mandatory ? "text-gray-600" : "text-gray-700"}`}>{field.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t mt-6">
              <button type="button" onClick={() => setActiveStep(1)} className="text-gray-600 px-6 py-2 rounded-md hover:bg-gray-100 transition font-medium">
                ← Kembali
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition font-bold shadow-md transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : editEvent ? (
                  "Update Kegiatan"
                ) : (
                  "Simpan Kegiatan"
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Notification Component */}
      {/* Inline Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-down">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : notification.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : notification.type === "warning"
                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {notification.type === "success" && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === "error" && (
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === "warning" && (
              <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {notification.type === "info" && (
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            )}
            <span className="font-medium text-sm">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm border-t-4 border-red-500">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Hapus Template</h3>
              </div>
              <p className="text-gray-600 mb-2">
                Apakah Anda yakin ingin menghapus template <strong>"{deleteConfirm.template?.name}"</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg border-t">
              <button
                type="button"
                onClick={() => setDeleteConfirm({ show: false, template: null })}
                disabled={deletingTemplate}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition font-medium disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTemplate(deleteConfirm.template)}
                disabled={deletingTemplate}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition font-medium disabled:opacity-50 flex items-center"
              >
                {deletingTemplate ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md border-t-4 border-blue-600">
            <div className="flex items-center justify-between p-5 border-b bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Tambah Template Baru
              </h3>
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setNewTemplate({ name: "", description: "", image: null, preview: null });
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full p-1 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Contoh: Sertifikat Seminar 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  rows="2"
                  placeholder="Deskripsi singkat template (opsional)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Gambar Template <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 relative hover:border-blue-400 hover:bg-blue-50/50 transition group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        setNewTemplate((prev) => {
                          if (prev.preview) URL.revokeObjectURL(prev.preview);
                          return { ...prev, image: file, preview: url };
                        });
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {newTemplate.preview ? (
                    <div className="relative h-36 bg-gray-100 rounded-md overflow-hidden">
                      <img src={newTemplate.preview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <span className="text-white text-sm font-medium">Klik untuk ganti</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="h-12 w-12 mx-auto mb-3 text-gray-400 group-hover:text-blue-500 transition">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Klik untuk pilih gambar</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max. 5MB)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateModal(false);
                  setNewTemplate({ name: "", description: "", image: null, preview: null });
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-md transition font-medium"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={savingTemplate || !newTemplate.name || !newTemplate.image}
                onClick={async () => {
                  setSavingTemplate(true);
                  try {
                    const response = await templatesAPI.create({
                      name: newTemplate.name,
                      description: newTemplate.description,
                      image: newTemplate.image,
                    });
                    if (response.success) {
                      setNotification({ type: "success", message: "Template berhasil ditambahkan!" });
                      setShowTemplateModal(false);
                      setNewTemplate({ name: "", description: "", image: null, preview: null });
                      loadTemplates(); // Reload templates
                    }
                  } catch (err) {
                    setNotification({ type: "error", message: "Gagal menyimpan template: " + err.message });
                  } finally {
                    setSavingTemplate(false);
                  }
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium shadow-sm"
              >
                {savingTemplate ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;