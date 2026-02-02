import React, { useState, useEffect, useRef } from "react";
import { attendanceAPI, referenceAPI } from "../services/api";
import { showNotification } from "./Notification";

const AttendanceForm = ({ eventId }) => {
  const [config, setConfig] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formError, setFormError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  const [accessGranted, setAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [provinceType, setProvinceType] = useState("Jawa Tengah");
  const [kabupatenList, setKabupatenList] = useState([]);

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    nama_lengkap: "",
    unit_kerja: "",
    nip: "",
    provinsi: "Jawa Tengah",
    kabupaten_kota: "",
    tanggal_lahir: "",
    nomor_hp: "",
    pangkat_golongan: "",
    jabatan: "",
    email: "",
    email_konfirmasi: "",
    pernyataan: false,
  });

  // Canvas signature refs
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);

  // Helper: convert canvas to Blob (PNG)
  const canvasToBlob = (canvas) =>
    new Promise((resolve, reject) => {
      if (!canvas || !canvas.toBlob) return reject(new Error("Canvas or toBlob not available"));
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert canvas to Blob"));
      }, "image/png");
    });

  // Initialize canvas with proper resolution
  const containerRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;

      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      const rect = container.getBoundingClientRect();

      canvas.width = rect.width;
      canvas.height = 200;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(tempCanvas, 0, 0);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();

    const timer = setTimeout(resizeCanvas, 100);
    window.addEventListener("resize", resizeCanvas);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if (e.type.includes("touch")) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);

    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureFile(null);
      setHasSignature(true);
      // Clear signature validation error when user draws
      setValidationErrors((prev) => ({ ...prev, signature: "" }));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureFile(null);
    setHasSignature(false);
  };

  const handleSignatureUpload = (file) => {
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        setSignatureFile(file);
        setHasSignature(true);
        // Clear signature validation error when user uploads
        setValidationErrors((prev) => ({ ...prev, signature: "" }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };
  // Validasi nomor telepon hanya angka
  const validatePhoneNumber = (value) => {
    return /^[0-9]*$/.test(value);
  };
  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await attendanceAPI.getEventForm(eventId);
        if (response.success) {
          const formConfig = typeof response.data.form_config === "string" ? JSON.parse(response.data.form_config) : response.data.form_config || {};
          setConfig({ ...response.data, ...formConfig });
          if (!formConfig.eventPassword) {
            setAccessGranted(true);
          }
        }
      } catch (err) {
        showNotification(err.message || "Gagal memuat form kegiatan", "error");
        setFormError(err.message);
      } finally {
        setIsLoadingForm(false);
      }
    };

    const loadKabupaten = async () => {
      try {
        const response = await referenceAPI.getKabupatenKota();
        if (response.success) {
          setKabupatenList(response.data || []);
        }
      } catch (err) {
        console.error("Failed to load kabupaten list:", err);
      }
    };

    loadForm();
    loadKabupaten();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Validasi khusus untuk nomor HP
    if (name === "nomor_hp") {
      if (!validatePhoneNumber(value)) {
        return; // Jangan update state jika bukan angka
      }
    }
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear email mismatch error when user types in either email field
    if ((name === "email" || name === "email_konfirmasi") && validationErrors.email_mismatch) {
      setValidationErrors((prev) => ({ ...prev, email_mismatch: "" }));
    }

    // Clear pernyataan error when checked
    if (name === "pernyataan" && checked) {
      setValidationErrors((prev) => ({ ...prev, pernyataan: "" }));
    }

    if (name === "provinsi") setProvinceType(value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const formConfig = typeof config.form_config === "string" ? JSON.parse(config.form_config) : config.form_config || {};

    if (passwordInput === formConfig.eventPassword) {
      setAccessGranted(true);
      setPasswordError("");
    } else {
      setPasswordError("Password yang Anda masukkan salah");
      showNotification("Password salah. Silakan coba lagi.", "error");
    }
  };

  const formatDate = (dateString) => {
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return dateString ? new Date(dateString).toLocaleDateString("id-ID", options) : "";
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    return timeString.substring(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Clear previous validation errors
    const errors = {};
    // Validasi required fields
    if (config.requireName !== false && !formData.nama_lengkap.trim()) {
      errors.nama_lengkap = "Nama lengkap wajib diisi";
    }

    if (config.requireUnit !== false && !formData.unit_kerja.trim()) {
      errors.unit_kerja = "Unit kerja wajib diisi";
    }
    if (config.requirePangkat !== false && !formData.pangkat_golongan.trim()) {
      errors.pangkat_golongan = "Pangkat/Golongan wajib diisi";
    }
    if (config.requireJabatan !== false && !formData.jabatan.trim()) {
      errors.jabatan = "Jabatan wajib diisi";
    }
    if (config.requireNIP !== false && !formData.nip.trim()) {
      errors.nip = "NIP wajib diisi";
    }
    if (config.requireDob !== false && !formData.tanggal_lahir) {
      errors.tanggal_lahir = "Tanggal lahir wajib diisi";
    }

    if (config.requirePhone !== false && !formData.nomor_hp.trim()) {
      errors.nomor_hp = "Nomor HP wajib diisi";
    } else if (config.requirePhone !== false && formData.nomor_hp.length < 10) {
      errors.nomor_hp = "Nomor HP minimal 10 digit";
    } else if (config.requirePhone !== false && formData.nomor_hp.length > 15) {
      errors.nomor_hp = "Nomor HP maksimal 15 digit";
    }

    if (config.requireEmail !== false && !formData.email.trim()) {
      errors.email = "Email wajib diisi";
    }

    if (config.requireEmail !== false && !formData.email_konfirmasi.trim()) {
      errors.email_konfirmasi = "Konfirmasi email wajib diisi";
    }

    if (config.requireProvince !== false && !formData.kabupaten_kota.trim()) {
      errors.kabupaten_kota = "Kabupaten/Kota wajib diisi";
    }
    // Validate email match
    if (config.requireEmail !== false && formData.email !== formData.email_konfirmasi) {
      errors.email_mismatch = "Email dan konfirmasi email tidak cocok";
      errors.email = "Email tidak cocok";
      errors.email_konfirmasi = "Email tidak cocok";
    }
    // Validate pernyataan checkbox
    if (config.requirePernyataan !== false && !formData.pernyataan) {
      errors.pernyataan = "Anda harus menyetujui pernyataan untuk melanjutkan";
    }
    // Validate signature
    if (config.requireSignature !== false && !hasSignature) {
      errors.signature = "Tanda tangan diperlukan";
    }
    // If there are validation errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setIsSubmitting(false);

      // Show the first error in notification
      const firstError = Object.values(errors)[0];
      showNotification(firstError, "error");

      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`) || document.getElementById(firstErrorField);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }

      return;
    }

    try {
      const fd = new FormData();
      const fields = {
        ...formData,
        provinsi: formData.provinsi || provinceType,
      };

      Object.keys(fields).forEach((k) => {
        if (typeof fields[k] === "boolean") {
          fd.append(k, fields[k] ? "1" : "0");
        } else if (fields[k] !== null && fields[k] !== undefined) {
          fd.append(k, fields[k]);
        }
      });

      let fileToSend = signatureFile;
      if (!fileToSend) {
        const canvas = canvasRef.current;
        const blob = await canvasToBlob(canvas);
        const filename = `signature-${Date.now()}.png`;
        fileToSend = new File([blob], filename, { type: "image/png" });
      }

      if (fileToSend) {
        const filename = `signature-${Date.now()}.png`;
        fd.append("signature", fileToSend, filename);
      }

      const response = await attendanceAPI.submit(eventId, fd);
      if (response.success) {
        setSubmitted(true);
        setSubmitResult(response.data);
      }
    } catch (err) {
      showNotification(err.message || "Gagal mengirim absensi. Silakan coba lagi.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat formulir...</p>
        </div>
      </div>
    );
  }

  if (formError && !config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Dapat Mengakses</h2>
          <p className="text-gray-600 mb-6">{formError}</p>
        </div>
      </div>
    );
  }

  if (!accessGranted && config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600 mb-6">
            Kegiatan <strong>{config.nama_kegiatan}</strong> dilindungi kata sandi.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => {
                  setPasswordInput(e.target.value);
                  setPasswordError("");
                }}
                className={`w-full text-center tracking-widest px-4 py-3 border-2 rounded-lg focus:ring-2 focus:outline-none transition-all ${
                  passwordError ? "border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50" : "border-gray-300 focus:border-blue-500 focus:ring-blue-200"
                }`}
                placeholder="Masukkan Password"
                autoFocus
              />
              {passwordError && (
                <div className="mt-2 flex items-start gap-2 text-red-600 text-sm animate-pulse">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>

                  <span className="text-start leading-snug">{passwordError}</span>
                </div>
              )}
            </div>
            <button type="submit" className="w-full bg-blue-700 text-white font-bold py-2 px-4 rounded hover:bg-blue-800 transition">
              Buka Absensi
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-white p-10 rounded-xl shadow-2xl text-center my-12 border-t-8 border-green-600">
        <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-2">Absensi Berhasil!</h3>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Data kehadiran Anda untuk kegiatan <strong>{config.nama_kegiatan}</strong> telah berhasil disimpan.
        </p>
        {submitResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>No. Sertifikat:</strong> {submitResult.nomor_sertifikat}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm">Sertifikat akan dikirimkan ke email terdaftar setelah kegiatan selesai.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-4 md:my-8 px-4 flex flex-col lg:flex-row gap-6 md:gap-8 items-start">
      {/* Left Column: Form & Activity Info */}
      <div className="flex-1 w-full order-2 lg:order-1">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
          {/* Kop Kegiatan / Header Form */}
          <div className="bg-slate-50 p-5 md:p-8 border-b border-gray-200 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-[10px] md:text-xs font-bold rounded-full mb-3 tracking-wider">FORMULIR KEHADIRAN</span>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight">{config.nama_kegiatan || "Nama Kegiatan"}</h1>

            <div className="flex flex-col sm:flex-row sm:flex-wrap text-sm text-gray-600 gap-y-3 gap-x-6 mt-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {formatDate(config.tanggal_mulai)}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Input Fields */}
              <div className="grid grid-cols-1 gap-5">
                {config.requireName !== false && (
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      Nama Lengkap Peserta <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm md:text-base ${
                        validationErrors.nama_lengkap ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Sesuai gelar untuk sertifikat"
                    />
                    {validationErrors.nama_lengkap && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.nama_lengkap}
                      </p>
                    )}
                  </div>
                )}

                {config.requireUnit !== false && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Unit Kerja / Instansi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="unit_kerja"
                      value={formData.unit_kerja}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm md:text-base ${
                        validationErrors.unit_kerja ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Nama Sekolah / Dinas / Lembaga"
                    />
                    {validationErrors.unit_kerja && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.unit_kerja}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* Grid 2 Kolom di Tablet/Desktop, 1 Kolom di HP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {config.requirePangkat !== false && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Pangkat / Golongan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="pangkat_golongan"
                      value={formData.pangkat_golongan}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                        validationErrors.pangkat_golongan ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Contoh: Penata Muda / III/a"
                    />
                    {validationErrors.pangkat_golongan && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.pangkat_golongan}
                      </p>
                    )}
                  </div>
                )}

                {config.requireJabatan !== false && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Jabatan <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="jabatan"
                      value={formData.jabatan}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                        validationErrors.jabatan ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Contoh: Guru / Kepala Sekolah / Staff"
                    />
                    {validationErrors.jabatan && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.jabatan}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {/* Grid 2 Kolom di Tablet/Desktop, 1 Kolom di HP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {config.requireNIP && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      NIP <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                        validationErrors.nip ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                      placeholder="Nomor Induk Pegawai"
                    />
                    {validationErrors.nip && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.nip}
                      </p>
                    )}
                  </div>
                )}
                {config.requireDob !== false && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                        validationErrors.tanggal_lahir ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {validationErrors.tanggal_lahir && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.tanggal_lahir}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Phone & Email Grid */}
              {config.requirePhone !== false && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Nomor Handphone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="nomor_hp"
                    value={formData.nomor_hp}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                      validationErrors.nomor_hp ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="08xxxxxxxxxx"
                  />
                  {validationErrors.nomor_hp && (
                    <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {validationErrors.nomor_hp}
                    </p>
                  )}
                </div>
              )}
              {config.requireEmail !== false && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                        validationErrors.email ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {validationErrors.email && !validationErrors.email_mismatch && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.email}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Konfirmasi Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email_konfirmasi"
                      value={formData.email_konfirmasi}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all ${
                        validationErrors.email_konfirmasi ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                      }`}
                    />
                    {validationErrors.email_konfirmasi && !validationErrors.email_mismatch && (
                      <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {validationErrors.email_konfirmasi}
                      </p>
                    )}
                  </div>
                  {validationErrors.email_mismatch && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg animate-pulse">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-red-800">{validationErrors.email_mismatch}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Province Selector */}
              {config.requireProvince !== false && (
                <div className="bg-blue-50/50 p-4 md:p-6 rounded-xl border border-blue-100">
                  <label className="block text-sm font-bold text-blue-900 mb-3">
                    Asal Provinsi Unit Kerja <span className="text-red-500">*</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <label
                      className={`flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${
                        provinceType === "Jawa Tengah" ? "border-blue-500 bg-white text-blue-700 font-semibold shadow-sm" : "border-transparent bg-gray-100/50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="province_type"
                        value="Jawa Tengah"
                        checked={provinceType === "Jawa Tengah"}
                        onChange={(e) => {
                          setProvinceType(e.target.value);
                          setFormData((prev) => ({ ...prev, provinsi: e.target.value }));
                        }}
                        className="hidden"
                      />
                      <span className="text-sm">Jawa Tengah</span>
                    </label>
                    <label
                      className={`flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${
                        provinceType === "Luar Jawa Tengah" ? "border-blue-500 bg-white text-blue-700 font-semibold shadow-sm" : "border-transparent bg-gray-100/50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="province_type"
                        value="Luar Jawa Tengah"
                        checked={provinceType === "Luar Jawa Tengah"}
                        onChange={(e) => {
                          setProvinceType(e.target.value);
                          setFormData((prev) => ({ ...prev, provinsi: e.target.value }));
                        }}
                        className="hidden"
                      />
                      <span className="text-sm">Luar Jawa Tengah</span>
                    </label>
                  </div>

                  <div className="relative">
                    {provinceType === "Jawa Tengah" ? (
                      <div className="relative">
                        <select
                          name="kabupaten_kota"
                          value={formData.kabupaten_kota}
                          onChange={handleChange}
                          className={`w-full appearance-none px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm md:text-base ${
                            validationErrors.kabupaten_kota ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                          }`}
                        >
                          <option value="">-- Pilih Kabupaten / Kota --</option>
                          {kabupatenList.map((kab) => (
                            <option key={kab.id} value={kab.nama}>
                              {kab.nama}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        {validationErrors.kabupaten_kota && (
                          <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {validationErrors.kabupaten_kota}
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          name="kabupaten_kota"
                          value={formData.kabupaten_kota}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base ${
                            validationErrors.kabupaten_kota ? "border-red-500 focus:border-red-500 bg-red-50" : "border-gray-300 focus:border-blue-500"
                          }`}
                          placeholder="Tuliskan nama provinsi & kota..."
                        />
                        {validationErrors.kabupaten_kota && (
                          <p className="mt-2 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {validationErrors.kabupaten_kota}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* e-Signature */}
              {config.requireSignature !== false && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    e-Signature / TTD Elektronik <span className="text-red-500">*</span>
                  </label>
                  <div className={`border-2 rounded-lg p-3 md:p-4 transition-all ${validationErrors.signature ? "border-red-500 bg-red-50" : "border-gray-200 bg-gray-50"}`}>
                    <div
                      ref={containerRef}
                      className={`bg-white rounded-lg overflow-hidden mb-3 border-2 border-dashed min-h-150px ${validationErrors.signature ? "border-red-300" : "border-gray-300"}`}
                    >
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                    </div>
                    {validationErrors.signature && (
                      <div className="mb-3 flex items-center gap-2 text-red-600 text-sm animate-pulse">
                        <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{validationErrors.signature}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="flex-1 sm:flex-none px-4 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-sm font-semibold transition"
                      >
                        Hapus
                      </button>
                      <label className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer text-sm font-semibold transition text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleSignatureUpload(f);
                          }}
                          className="hidden"
                        />
                        Upload Gambar
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Checkbox Pernyataan */}
              {config.requirePernyataan !== false && (
                <div className="mt-4">
                  <div
                    id="pernyataan"
                    className={`flex items-start p-4 rounded-lg border-2 transition-all ${validationErrors.pernyataan ? "bg-red-50 border-red-500" : "bg-yellow-50 border-yellow-200"}`}
                  >
                    <input
                      id="pernyataan-checkbox"
                      type="checkbox"
                      name="pernyataan"
                      checked={formData.pernyataan}
                      onChange={handleChange}
                      className={`h-5 w-5 mt-0.5 rounded border-2 focus:ring-2 focus:ring-offset-0 transition-all ${
                        validationErrors.pernyataan ? "border-red-500 text-red-600 focus:ring-red-200" : "border-gray-300 text-blue-600 focus:ring-blue-200"
                      }`}
                    />
                    <div className="ml-3 flex-1">
                      <label htmlFor="pernyataan-checkbox" className="text-xs md:text-sm text-gray-700 leading-relaxed cursor-pointer">
                        Menyetujui bahwa seluruh data yang tertera sesuai dengan identitas asli dan penulisan dalam standar penulisan <strong>EYD v5</strong> <span className="text-red-500">*</span>
                      </label>
                    </div>
                  </div>
                  {validationErrors.pernyataan && (
                    <p className="flex mt-2 items-center gap-2 text-red-600 text-sm animate-pulse">
                      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>{validationErrors.pernyataan}</span>
                    </p>
                  )}
                </div>
              )}
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-base md:text-lg py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Kehadiran
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Sidebar Info */}
      <div className="w-full lg:w-80 shrink-0 space-y-4 md:space-y-6 order-1 lg:order-2">
        {/* Deadline Card */}
        {config.batas_waktu_absensi && (
          <div className="bg-linear-to-br from-red-500 to-pink-600 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <h3 className="font-bold text-base mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Batas Waktu
            </h3>
            <div className="bg-white/20 rounded-lg p-3 text-center backdrop-blur-sm">
              <span className="font-mono text-base md:text-lg font-bold tracking-wider block">
                {new Date(config.batas_waktu_absensi).toLocaleString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }).replace(/\./g, ":")} WIB
              </span>
            </div>
          </div>
        )}

        {/* Event Info Card */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider flex items-center">
            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Info Kegiatan
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-gray-50 pb-2">
              <span className="text-gray-500">Tanggal</span>
              <span className="text-gray-900 font-semibold">{formatDate(config.tanggal_mulai)}</span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-gray-500">Waktu</span>
              <span className="text-gray-900 font-semibold">
                {formatTime(config.jam_mulai)} - {formatTime(config.jam_selesai)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceForm;
