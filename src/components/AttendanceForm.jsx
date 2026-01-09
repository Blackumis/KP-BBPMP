import React, { useState, useEffect } from 'react';
import { attendanceAPI, referenceAPI } from '../services/api';

const AttendanceForm = ({ eventId, onReset }) => {
  const [config, setConfig] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [formError, setFormError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  
  // Password gating
  const [accessGranted, setAccessGranted] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [provinceType, setProvinceType] = useState('Jawa Tengah');
  const [kabupatenList, setKabupatenList] = useState([]);

  // Form data state
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    unit_kerja: '',
    nip: '',
    provinsi: 'Jawa Tengah',
    kabupaten_kota: '',
    tanggal_lahir: '',
    nomor_hp: '',
    pangkat_golongan: '',
    jabatan: '',
    email: '',
    email_konfirmasi: '',
    signature_url: '',
    pernyataan: false,
  });

  // Load event form data
  useEffect(() => {
    const loadForm = async () => {
      try {
        const response = await attendanceAPI.getEventForm(eventId);
        if (response.success) {
          setConfig(response.data);
          // Parse form_config if it's a string
          const formConfig = typeof response.data.form_config === 'string' 
            ? JSON.parse(response.data.form_config) 
            : response.data.form_config || {};
          setConfig({ ...response.data, ...formConfig });
          
          // Check if password is required
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
        console.error('Failed to load kabupaten list:', err);
      }
    };

    loadForm();
    loadKabupaten();
  }, [eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle password submission for access
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const formConfig = typeof config.form_config === 'string' 
      ? JSON.parse(config.form_config) 
      : config.form_config || {};
    
    if (passwordInput === formConfig.eventPassword) {
      setAccessGranted(true);
      setPasswordError('');
    } else {
      setPasswordError('Password salah. Silakan coba lagi.');
    }
  };

  // Helper date formatter
  const formatDate = (dateString) => {
     const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
     return dateString ? new Date(dateString).toLocaleDateString('id-ID', options) : '';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const submitData = {
        ...formData,
        provinsi: provinceType,
      };

      const response = await attendanceAPI.submit(eventId, submitData);
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

  // Loading state
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

  // Error state
  if (formError && !config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Tidak Dapat Mengakses</h2>
          <p className="text-gray-600 mb-6">{formError}</p>
          <button onClick={onReset} className="text-blue-600 hover:text-blue-800 font-medium">Kembali</button>
        </div>
      </div>
    );
  }

  if (!accessGranted && config) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
            <p className="text-gray-600 mb-6">Kegiatan <strong>{config.nama_kegiatan}</strong> dilindungi kata sandi.</p>
            
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
                
                <button 
                  type="submit"
                  className="w-full bg-blue-700 text-white font-bold py-2 px-4 rounded hover:bg-blue-800 transition"
                >
                  Buka Absensi
                </button>
            </form>
            <button onClick={onReset} className="mt-4 text-sm text-gray-500 hover:text-gray-800">Kembali</button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto bg-white p-10 rounded-xl shadow-2xl text-center my-12 border-t-8 border-green-600 animate-in zoom-in-95 duration-300">
        <div className="h-24 w-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h3 className="text-3xl font-bold text-gray-800 mb-2">Absensi Berhasil!</h3>
        <p className="text-gray-600 mb-4 leading-relaxed">
          Data kehadiran Anda untuk kegiatan <strong>{config.nama_kegiatan}</strong> telah berhasil disimpan ke dalam sistem kami.
        </p>
        {submitResult && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Nomor Urut:</strong> {submitResult.urutan_absensi}<br/>
              <strong>No. Sertifikat:</strong> {submitResult.nomor_sertifikat}
            </p>
          </div>
        )}
        <p className="text-gray-500 text-sm mb-8">
          Sertifikat akan dikirimkan ke email terdaftar setelah acara selesai.
        </p>
        <button 
          onClick={() => { setSubmitted(false); onReset(); }}
          className="bg-blue-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-900 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto my-8 flex flex-col md:flex-row gap-8 items-start">
      
      {/* Left Column: Form & Activity Info */}
      <div className="flex-1 w-full">
         <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
            {/* Kop Kegiatan / Header Form */}
            <div className="bg-slate-50 p-8 border-b border-gray-200 relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
               <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full mb-3 tracking-wider">
                  FORMULIR KEHADIRAN
               </span>
               <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-snug">
                 {config.nama_kegiatan || 'Nama Kegiatan'}
               </h1>
               <div className="flex flex-wrap text-sm text-gray-600 gap-y-2 gap-x-6 mt-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Surat No: <span className="font-semibold ml-1 text-gray-800">{config.nomor_surat || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {formatDate(config.tanggal_mulai)}
                  </div>
               </div>
            </div>

            <div className="p-8">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {(config.requireName !== false) && (
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      Nama Lengkap Peserta <span className="text-red-500">*</span>
                    </label>
                    <input 
                       type="text"
                       name="nama_lengkap"
                       value={formData.nama_lengkap}
                       onChange={handleChange}
                       className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400" 
                       placeholder="Sesuai gelar untuk sertifikat" 
                       required 
                    />
                  </div>
                )}
                
                {(config.requireUnit !== false) && (
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Unit Kerja / Instansi <span className="text-red-500">*</span></label>
                    <input 
                      type="text"
                      name="unit_kerja"
                      value={formData.unit_kerja}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="Nama Sekolah / Dinas / Lembaga" 
                      required 
                    />
                  </div>
                )}

                {config.requireNIP && (
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">NIP</label>
                    <input 
                      type="text"
                      name="nip"
                      value={formData.nip}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                      placeholder="Nomor Induk Pegawai" 
                    />
                  </div>
                )}

                {(config.requireCity !== false) && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Kabupaten/Kota Unit Kerja <span className="text-red-500">*</span></label>
                      <input 
                        type="text"
                        name="kabupaten_kota"
                        value={formData.kabupaten_kota}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                        required 
                      />
                    </div>
                )}

                {(config.requireDob !== false) && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Lahir <span className="text-red-500">*</span></label>
                      <input 
                        type="date"
                        name="tanggal_lahir"
                        value={formData.tanggal_lahir}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                        required 
                      />
                    </div>
                )}

                {(config.requirePhone !== false) && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Handphone <span className="text-red-500">*</span></label>
                      <input 
                        type="tel"
                        name="nomor_hp"
                        value={formData.nomor_hp}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                        placeholder="08..." 
                        required 
                      />
                    </div>
                )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.requireRank && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pangkat/Golongan</label>
                            <input 
                              type="text"
                              name="pangkat_golongan"
                              value={formData.pangkat_golongan}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                            />
                        </div>
                    )}
                    {config.requirePosition && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan</label>
                            <input 
                              type="text"
                              name="jabatan"
                              value={formData.jabatan}
                              onChange={handleChange}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                            />
                        </div>
                    )}
                 </div>

                {(config.requireEmail !== false) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <input 
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                        required 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Email <span className="text-red-500">*</span></label>
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

                {(config.requireProvince !== false) && (
                  <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                     <label className="block text-sm font-bold text-blue-900 mb-3">
                        Asal Provinsi Unit Kerja <span className="text-red-500">*</span>
                     </label>
                     
                     <div className="flex flex-col sm:flex-row gap-4 mb-4">
                       <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${provinceType === 'Jawa Tengah' ? 'border-blue-500 bg-white text-blue-700 font-semibold shadow-sm' : 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                         <input 
                          type="radio" 
                          name="province_type" 
                          value="Jawa Tengah"
                          checked={provinceType === 'Jawa Tengah'}
                          onChange={(e) => {
                            setProvinceType(e.target.value);
                            setFormData(prev => ({ ...prev, provinsi: e.target.value }));
                          }}
                          className="hidden"
                         />
                         <span className="flex items-center">
                            <span className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${provinceType === 'Jawa Tengah' ? 'border-blue-500' : 'border-gray-400'}`}>
                              {provinceType === 'Jawa Tengah' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            </span>
                            Jawa Tengah
                         </span>
                       </label>
                       
                       <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${provinceType === 'Luar Jawa Tengah' ? 'border-blue-500 bg-white text-blue-700 font-semibold shadow-sm' : 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                         <input 
                          type="radio" 
                          name="province_type" 
                          value="Luar Jawa Tengah" 
                          checked={provinceType === 'Luar Jawa Tengah'}
                          onChange={(e) => {
                            setProvinceType(e.target.value);
                            setFormData(prev => ({ ...prev, provinsi: e.target.value }));
                          }}
                          className="hidden"
                         />
                         <span className="flex items-center">
                            <span className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${provinceType === 'Luar Jawa Tengah' ? 'border-blue-500' : 'border-gray-400'}`}>
                              {provinceType === 'Luar Jawa Tengah' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            </span>
                            Luar Jawa Tengah
                         </span>
                       </label>
                     </div>

                     <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                       {provinceType === 'Jawa Tengah' ? (
                         <div className="relative">
                           <select 
                             name="kabupaten_kota"
                             value={formData.kabupaten_kota}
                             onChange={handleChange}
                             className="w-full appearance-none px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white font-medium text-gray-700"
                             required
                           >
                             <option value="">-- Pilih Kabupaten / Kota --</option>
                             {kabupatenList.map((kab) => (
                               <option key={kab.id} value={kab.nama}>
                                 {kab.tipe === 'kota' ? 'Kota' : 'Kab.'} {kab.nama}
                               </option>
                             ))}
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                           </div>
                         </div>
                       ) : (
                         <input 
                           type="text"
                           name="kabupaten_kota"
                           value={formData.kabupaten_kota}
                           onChange={handleChange} 
                           className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                           placeholder="Tuliskan nama provinsi dan kabupaten/kota Anda..."
                           required
                         />
                       )}
                     </div>
                  </div>
                )}
                
                {(config.requireSignature !== false) && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">e-Signature / Tanda Tangan (URL) <span className="text-red-500">*</span></label>
                        <input 
                          type="url"
                          name="signature_url"
                          value={formData.signature_url}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                          placeholder="https://link-ke-tanda-tangan-anda.com/signature.png"
                          required
                        />
                        <p className="text-xs text-gray-500 mt-1">Masukkan URL/link ke gambar tanda tangan elektronik Anda</p>
                    </div>
                )}

                {(config.requirePernyataan !== false) && (
                    <div className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex h-6 items-center">
                            <input 
                              id="pernyataan" 
                              type="checkbox"
                              name="pernyataan"
                              checked={formData.pernyataan}
                              onChange={handleChange} 
                              className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" 
                              required 
                            />
                        </div>
                        <div className="ml-3">
                            <label htmlFor="pernyataan" className="text-sm text-gray-700 font-medium">
                                Menyetujui bahwa seluruh data yang tertera sesuai dengan identitas asli dan penulisan dalam standar penulisan EYD v5 <span className="text-red-500">*</span>
                            </label>
                        </div>
                    </div>
                )}

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <span>Kirim Kehadiran</span>
                        <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">
                     Dengan mengirimkan formulir ini, Anda menyatakan bahwa data yang diisi adalah benar.
                  </p>
                </div>
              </form>
            </div>
         </div>
      </div>

      {/* Right Column: Info & Certificate Preview */}
      <div className="w-full md:w-80 flex-shrink-0 space-y-6">
         
         {/* Deadline Card */}
         {config.batas_waktu_absensi && (
           <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
              <h3 className="font-bold text-lg mb-1 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 Batas Waktu
              </h3>
              <p className="text-red-100 text-sm mb-3">Formulir akan ditutup pada:</p>
              <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                 <span className="font-mono text-lg font-bold tracking-wider block">
                    {new Date(config.batas_waktu_absensi).toLocaleString('id-ID', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                 </span>
                 <span className="text-xs text-white/90">WIB</span>
              </div>
           </div>
         )}

         {/* Event Info Card */}
         <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
           <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center">
             <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             Info Kegiatan
           </h3>
           <div className="space-y-2 text-sm">
             <div className="flex justify-between">
               <span className="text-gray-500">Tanggal:</span>
               <span className="text-gray-700 font-medium">{formatDate(config.tanggal_mulai)}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-500">Waktu:</span>
               <span className="text-gray-700 font-medium">{formatTime(config.jam_mulai)} - {formatTime(config.jam_selesai)} WIB</span>
             </div>
           </div>
         </div>
      </div>

    </div>
  );
};

export default AttendanceForm;
