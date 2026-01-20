import React, { useState, useEffect, useRef } from "react";
import { attendanceAPI, referenceAPI } from "../services/api";

const AttendanceForm = ({ eventId, onReset }) => {
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
  // Keep file reference when user uploads an image; drawn signatures will be converted to Blob on submit
  const [signatureFile, setSignatureFile] = useState(null); // File | null

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

      // Save existing drawing if any
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      const rect = container.getBoundingClientRect();

      // Set canvas internal size
      canvas.width = rect.width;
      canvas.height = 200;

      // Restore drawing
      const ctx = canvas.getContext("2d");
      ctx.drawImage(tempCanvas, 0, 0);

      // Set drawing style
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    };

    resizeCanvas();

    // Add small delay for resize to ensure container has proper size
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

    // Hitung rasio antara ukuran atribut internal dan ukuran tampilan CSS
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
      // Do not create or store Base64. We will convert to Blob when submitting.
      setSignatureFile(null);
      setHasSignature(true);
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

        // Keep the original file to send to backend; do NOT store Base64
        setSignatureFile(file);
        setHasSignature(true);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
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
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "provinsi") setProvinceType(value);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const formConfig = typeof config.form_config === "string" ? JSON.parse(config.form_config) : config.form_config || {};

    if (passwordInput === formConfig.eventPassword) {
      setAccessGranted(true);
      setPasswordError("");
    } else {
      setPasswordError("Password salah. Silakan coba lagi.");
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
    setFormError(null);

    if (config.requireEmail !== false && formData.email !== formData.email_konfirmasi) {
      setFormError("Email dan konfirmasi email tidak sama.");
      setIsSubmitting(false);
      return;
    }

    if (config.requirePernyataan !== false && !formData.pernyataan) {
      setFormError("Anda harus menyetujui pernyataan untuk melanjutkan.");
      setIsSubmitting(false);
      return;
    }

    if (config.requireSignature !== false && !hasSignature) {
      setFormError("Silakan unggah atau gambar tanda tangan.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Build multipart form data
      const fd = new FormData();
      const fields = {
        ...formData,
        provinsi: formData.provinsi || provinceType,
      };

      // Append text fields (exclude email_konfirmasi and any internal-only fields)
      Object.keys(fields).forEach((k) => {
        if (typeof fields[k] === "boolean") {
          fd.append(k, fields[k] ? "1" : "0");
        } else if (fields[k] !== null && fields[k] !== undefined) {
          fd.append(k, fields[k]);
        }
      });

      // Signature file: if user uploaded an image, use it; otherwise convert canvas to Blob
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
      setFormError(err.message);
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
          <button onClick={onReset} className="text-blue-600 hover:text-blue-800 font-medium">
            Kembali
          </button>
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
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full text-center tracking-widest px-4 py-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Masukkan Password"
                autoFocus
              />
            </div>
            {passwordError && <p className="text-red-600 text-sm font-medium">{passwordError}</p>}
            <button type="submit" className="w-full bg-blue-700 text-white font-bold py-2 px-4 rounded hover:bg-blue-800 transition">
              Buka Absensi
            </button>
          </form>
          <button onClick={onReset} className="mt-4 text-sm text-gray-500 hover:text-gray-800">
            Kembali
          </button>
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
              <strong>Nomor Urut:</strong> {submitResult.urutan_absensi}
              <br />
              <strong>No. Sertifikat:</strong> {submitResult.nomor_sertifikat}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm mb-8">Sertifikat akan dikirimkan ke email terdaftar setelah kegiatan selesai.</p>
        <button
          onClick={() => {
            setSubmitted(false);
            onReset();
          }}
          className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition"
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    );
  }

  return (
    // Container: padding horizontal (px-4) ditambahkan agar tidak menempel di pinggir layar HP
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
              <div className="flex items-start sm:items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500 mt-0.5 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span className="break-all">
                  Surat No: <span className="font-semibold text-gray-800">{config.nomor_surat || "-"}</span>
                </span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                {formatDate(config.tanggal_mulai)}
              </div>
            </div>
          </div>

          <div className="p-5 md:p-8">
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">{formError}</div>}

            <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
              {/* Input Fields - Menggunakan stack mobile, grid di desktop */}
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400 text-sm md:text-base"
                      placeholder="Sesuai gelar untuk sertifikat"
                      required
                    />
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all text-sm md:text-base"
                      placeholder="Nama Sekolah / Dinas / Lembaga"
                      required
                    />
                  </div>
                )}
              </div>

              {/* Grid 2 Kolom di Tablet/Desktop, 1 Kolom di HP */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {config.requireNIP && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">NIP</label>
                    <input
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base"
                      placeholder="Nomor Induk Pegawai"
                    />
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
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base"
                      required
                    />
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
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base"
                    placeholder="08..."
                    required
                  />
                </div>
              )}
              {config.requireEmail !== false && (
                <div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base"
                      required
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Konfirmasi Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email_konfirmasi"
                      value={formData.email_konfirmasi}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Province Selector - Responsive Radio Buttons */}
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
                          className="w-full appearance-none px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white text-sm md:text-base"
                          required
                        >
                          <option value="">-- Pilih Kabupaten / Kota --</option>
                          {kabupatenList.map((kab) => (
                            <option key={kab.id} value={kab.nama}>
                              {kab.tipe === "kota" ? "Kota" : "Kab."} {kab.nama}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        name="kabupaten_kota"
                        value={formData.kabupaten_kota}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-sm md:text-base"
                        placeholder="Tuliskan nama provinsi & kota..."
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* e-Signature - Responsive Canvas */}
              {config.requireSignature !== false && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    e-Signature / TTD Elektronik <span className="text-red-500">*</span>
                  </label>
                  <div className="border-2 border-gray-200 rounded-lg p-3 md:p-4 bg-gray-50">
                    <div ref={containerRef} className="bg-white rounded-lg overflow-hidden mb-3 border-2 border-dashed border-gray-300 aspect-3/1 min-h-150px">
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
                <div className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <input
                    id="pernyataan"
                    type="checkbox"
                    name="pernyataan"
                    checked={formData.pernyataan}
                    onChange={handleChange}
                    className="h-5 w-5 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    required
                  />
                  <label htmlFor="pernyataan" className="ml-3 text-xs md:text-sm text-gray-700 leading-relaxed">
                    Menyetujui bahwa seluruh data yang tertera sesuai dengan identitas asli dan penulisan dalam standar penulisan <strong>EYD v5</strong> <span className="text-red-500">*</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-base md:text-lg py-4 rounded-xl shadow-lg transition-all transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
                >
                  {isSubmitting ? "Mengirim..." : "Kirim Kehadiran"}
                  {!isSubmitting && (
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
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
                })}{" "}
                WIB
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
