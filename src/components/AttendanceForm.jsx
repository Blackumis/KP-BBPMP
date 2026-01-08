import React, { useState } from 'react';

const AttendanceForm = ({ config, onReset }) => {
  const [submitted, setSubmitted] = useState(false);
  // Separate state for password gating
  const [accessGranted, setAccessGranted] = useState(!config.eventPassword);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [provinceType, setProvinceType] = useState('jawa_tengah');

  // Handle password submission for access
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === config.eventPassword) {
      setAccessGranted(true);
      setPasswordError('');
    } else {
      setPasswordError('Password salah. Silakan coba lagi.');
    }
  };

  // Helper date formatter
  const formatDate = (dateString, timeString) => {
     const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
     const date = dateString ? new Date(dateString).toLocaleDateString('id-ID', options) : '';
     const time = timeString ? new Date(timeString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
     return { date, time };
  };

  const { date, time } = formatDate(config.tanggalKegiatan, config.batasWaktu);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // In a real app, API call would go here
  };

  if (!accessGranted) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Akses Terbatas</h2>
            <p className="text-gray-600 mb-6">Kegiatan <strong>{config.namaKegiatan}</strong> dilindungi kata sandi.</p>
            
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
        <p className="text-gray-600 mb-8 leading-relaxed">
          Data kehadiran Anda untuk kegiatan <strong>{config.namaKegiatan}</strong> telah berhasil disimpan ke dalam sistem kami.
          <br/>Sertifikat akan dikirimkan ke email terdaftar.
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
                 {config.namaKegiatan || 'Nama Kegiatan Belum Diatur'}
               </h1>
               <div className="flex flex-wrap text-sm text-gray-600 gap-y-2 gap-x-6 mt-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Surat No: <span className="font-semibold ml-1 text-gray-800">{config.nomorSurat || '-'}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {date}
                  </div>
               </div>
            </div>

            <div className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {config.requireName && (
                  <div className="group">
                    <label className="block text-sm font-bold text-gray-700 mb-2 group-focus-within:text-blue-600 transition-colors">
                      Nama Lengkap Peserta <span className="text-red-500">*</span>
                    </label>
                    <input 
                       type="text" 
                       className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-gray-400" 
                       placeholder="Sesuai gelar untuk sertifikat" 
                       required 
                    />
                  </div>
                )}
                
                {config.requireUnit && (
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Unit Kerja / Instansi <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Nama Sekolah / Dinas / Lembaga" required />
                  </div>
                )}

                {config.requireNIP && (
                   <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">NIP</label>
                    <input type="number" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Nomor Induk Pegawai" />
                  </div>
                )}

                {config.requireCity && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Kabupaten/Kota Unit Kerja <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                    </div>
                )}

                {config.requireDob && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tempat Tanggal Lahir <span className="text-red-500">*</span></label>
                      <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="Kota, DD-MM-YYYY" required />
                    </div>
                )}

                {config.requirePhone && (
                     <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Nomor Handphone <span className="text-red-500">*</span></label>
                      <input type="tel" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" placeholder="08..." required />
                    </div>
                )}

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.requireRank && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Pangkat/Golongan</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>
                    )}
                    {config.requirePosition && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Jabatan</label>
                            <input type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                        </div>
                    )}
                 </div>

                {config.requireEmail && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                      <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Konfirmasi Email <span className="text-red-500">*</span></label>
                      <input type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" required />
                    </div>
                  </div>
                )}

                {config.requireProvince && (
                  <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                     <label className="block text-sm font-bold text-blue-900 mb-3">
                        Asal Provinsi Unit Kerja <span className="text-red-500">*</span>
                     </label>
                     
                     <div className="flex flex-col sm:flex-row gap-4 mb-4">
                       <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${provinceType === 'jawa_tengah' ? 'border-blue-500 bg-white text-blue-700 font-semibold shadow-sm' : 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                         <input 
                          type="radio" 
                          name="province_type" 
                          value="jawa_tengah"
                          checked={provinceType === 'jawa_tengah'}
                          onChange={(e) => setProvinceType(e.target.value)}
                          className="hidden"
                         />
                         <span className="flex items-center">
                            <span className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${provinceType === 'jawa_tengah' ? 'border-blue-500' : 'border-gray-400'}`}>
                              {provinceType === 'jawa_tengah' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            </span>
                            Jawa Tengah
                         </span>
                       </label>
                       
                       <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg cursor-pointer border-2 transition-all ${provinceType === 'luar_jawa' ? 'border-blue-500 bg-white text-blue-700 font-semibold shadow-sm' : 'border-transparent bg-transparent text-gray-600 hover:bg-gray-100'}`}>
                         <input 
                          type="radio" 
                          name="province_type" 
                          value="luar_jawa" 
                          checked={provinceType === 'luar_jawa'}
                          onChange={(e) => setProvinceType(e.target.value)}
                          className="hidden"
                         />
                         <span className="flex items-center">
                            <span className={`w-4 h-4 rounded-full border mr-2 flex items-center justify-center ${provinceType === 'luar_jawa' ? 'border-blue-500' : 'border-gray-400'}`}>
                              {provinceType === 'luar_jawa' && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                            </span>
                            Luar Jawa Tengah
                         </span>
                       </label>
                     </div>

                     <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                       {provinceType === 'jawa_tengah' ? (
                         <div className="relative">
                           <select className="w-full appearance-none px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none bg-white font-medium text-gray-700">
                             <option value="">-- Pilih Kabupaten / Kota --</option>
                             <option value="Semarang">Kota Semarang</option>
                             <option value="Surakarta">Kota Surakarta</option>
                             <option value="Banyumas">Kab. Banyumas</option>
                             <option value="Cilacap">Kab. Cilacap</option>
                             <option value="Magelang">Kota Magelang</option>
                             <option value="Pekalongan">Kota Pekalongan</option>
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                           </div>
                         </div>
                       ) : (
                         <input 
                           type="text" 
                           className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" 
                           placeholder="Tuliskan nama provinsi Anda..."
                           autoFocus
                         />
                       )}
                     </div>
                  </div>
                )}
                
                {config.requireSignature && (
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">e-Signature / Tanda Tangan <span className="text-red-500">*</span></label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition cursor-pointer relative bg-white">
                            <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                             <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            <span className="text-blue-600 font-medium">Upload gambar tanda tangan</span>
                            <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max. 2MB)</p>
                        </div>
                    </div>
                )}

                {config.requirePernyataan && (
                    <div className="flex items-start bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex h-6 items-center">
                            <input id="pernyataan" type="checkbox" className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-600" required />
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
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform active:scale-[0.98] flex items-center justify-center"
                  >
                    <span>Kirim Kehadiran</span>
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
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
         {config.batasWaktu && (
           <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white opacity-10 rounded-full"></div>
              <h3 className="font-bold text-lg mb-1 flex items-center">
                 <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                 Batas Waktu
              </h3>
              <p className="text-red-100 text-sm mb-3">Formulir akan ditutup pada:</p>
              <div className="bg-white/20 rounded-lg p-2 text-center backdrop-blur-sm">
                 <span className="font-mono text-xl md:text-2xl font-bold tracking-wider block">
                    {time}
                 </span>
                 <span className="text-xs text-white/90">WIB</span>
              </div>
           </div>
         )}

         {/* Certificate Preview Card (if template exists) */}
         {config.template && config.template !== 'default' && (
            <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100">
               <h3 className="font-bold text-gray-700 mb-3 text-sm flex items-center">
                 <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                 Preview Sertifikat
               </h3>
               <div className="aspect-video w-full rounded-lg bg-gray-100 overflow-hidden relative group cursor-help">
                  <img src={config.template} alt="Certificate Template" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Contoh Desain</span>
                  </div>
               </div>
               <p className="text-xs text-gray-500 mt-2 text-center">
                 Sertifikat akan dikirim otomatis ke email Anda setelah acara selesai.
               </p>
            </div>
         )}
      </div>

    </div>
  );
};

export default AttendanceForm;
