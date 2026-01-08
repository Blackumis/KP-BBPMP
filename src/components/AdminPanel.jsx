import React, { useState } from 'react';

const AdminPanel = ({ onSaveConfig }) => {
  const [activeStep, setActiveStep] = useState(1);
  const [formData, setFormData] = useState({
    // Data Kegiatan
    nomorSurat: '',
    namaKegiatan: '',
    tanggalKegiatan: '',
    batasWaktu: '',
    template: 'default',
    
    // Isian Absensi Config (toggles)
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
    eventPassword: '', // Password for the event (optional)
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    alert("Konfigurasi Kegiatan berhasil disimpan dan dipublikasikan!");
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg border-t-4 border-blue-600 my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center border-b pb-4">
        <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded text-sm mr-3">Admin</span>
        Konfigurasi Kegiatan 
      </h2>

      {/* Progress Stepper */}
      <div className="flex mb-8">
        <div 
          className={`flex-1 py-2 text-center border-b-4 cursor-pointer ${activeStep === 1 ? 'border-blue-600 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
          onClick={() => setActiveStep(1)}
        >
          1. Data Kegiatan
        </div>
        <div 
          className={`flex-1 py-2 text-center border-b-4 cursor-pointer ${activeStep === 2 ? 'border-blue-600 text-blue-700 font-bold' : 'border-gray-200 text-gray-500'}`}
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor Surat Kegiatan</label>
                <input 
                  type="text" 
                  name="nomorSurat" 
                  value={formData.nomorSurat} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Contoh: 001/BBPMP/2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kegiatan</label>
                <input 
                  type="text" 
                  name="namaKegiatan" 
                  value={formData.namaKegiatan} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="Nama lengkap kegiatan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Kegiatan</label>
                <input 
                  type="date" 
                  name="tanggalKegiatan" 
                  value={formData.tanggalKegiatan} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Batas Waktu Absensi</label>
                <input 
                  type="datetime-local" 
                  name="batasWaktu" 
                  value={formData.batasWaktu} 
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>
            </div>
            
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-2">Template / Background Sertifikat</label>
               <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition relative overflow-hidden group">
                 <input 
                   type="file" 
                   accept="image/*"
                   onChange={(e) => {
                      const file = e.target.files[0];
                      if(file) {
                        // Create a preview URL
                        setFormData(prev => ({ ...prev, template: URL.createObjectURL(file), templateName: file.name })); 
                      }
                   }}
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                 />
                 
                 {formData.template && formData.template !== 'default' ? (
                    <div className="relative w-full h-32 md:h-48 bg-gray-100 rounded-md overflow-hidden">
                       <img src={formData.template} alt="Preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20 pointer-events-none">
                          <span className="text-white font-medium">Klik untuk ganti gambar</span>
                       </div>
                    </div>
                 ) : (
                    <div className="flex flex-col items-center pointer-events-none">
                       <div className="h-12 w-12 text-gray-400 mb-2">
                         <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                       </div>
                       <p className="text-sm text-gray-600 font-medium">Klik untuk upload gambar sertifikat</p>
                       <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG (Max. 5MB)</p>
                    </div>
                 )}
               </div>
               {formData.templateName && (
                  <p className="text-xs text-green-600 mt-2 flex items-center">
                    <span className="mr-1">✓</span> File terpilih: {formData.templateName}
                  </p>
               )}
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="button" 
                onClick={() => setActiveStep(2)}
                className="bg-blue-700 text-white px-6 py-2 rounded-md hover:bg-blue-800 transition font-medium"
              >
                Lanjut: Atur Absensi &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Konfigurasi Absensi */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
               <h3 className="text-md font-bold text-blue-800">Pengaturan Keamanan</h3>
               <p className="text-sm text-blue-700 mt-1">
                 Anda dapat menambahkan password untuk membatasi akses ke formulir absensi ini. 
                 Jika dikosongkan, formulir dapat diakses oleh siapa saja.
               </p>
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
              <p className="text-sm text-yellow-700">
                Data di bawah ini adalah kolom yang akan muncul pada form absensi peserta. Centang untuk mengaktifkan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'requireName', label: 'Nama (wajib)', mandatory: true },
                { id: 'requireUnit', label: 'Unit Kerja (wajib)', mandatory: true },
                { id: 'requireNIP', label: 'NIP', mandatory: false },
                { id: 'requireCity', label: 'Kabupaten/Kota Unit Kerja (wajib)', mandatory: true },
                { id: 'requireDob', label: 'Tanggal Lahir (wajib)', mandatory: true },
                { id: 'requirePhone', label: 'Nomor Handphone (wajib)', mandatory: true },
                { id: 'requireRank', label: 'Pangkat/Golongan', mandatory: false },
                { id: 'requirePosition', label: 'Jabatan', mandatory: false },
                { id: 'requireEmail', label: 'E-mail (wajib)', mandatory: true },
                { id: 'requireSignature', label: 'e-Signature atau ttd elektronik peserta (wajib)', mandatory: true },
                { id: 'requirePernyataan', label: 'Check box pernyataan (wajib)', mandatory: true },
                { id: 'requireProvince', label: 'Provinsi Unit Kerja', mandatory: false },
              ].map((field) => (
                <label key={field.id} className={`flex items-center p-3 border rounded ${!field.mandatory ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50 cursor-not-allowed opacity-80'}`}>
                  { !field.mandatory ? (
                    <input 
                      type="checkbox" 
                      name={field.id} 
                      checked={formData[field.id]} 
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3"
                    />
                  ) : (
                    <input 
                      type="checkbox" 
                      checked={true} 
                      readOnly
                      disabled
                      className="h-5 w-5 text-gray-400 border-gray-300 rounded mr-3 bg-gray-200"
                    />
                  )}
                  <span className={`font-medium ${field.mandatory ? 'text-gray-600' : 'text-gray-700'}`}>
                    {field.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex justify-between pt-6 border-t mt-6">
              <button 
                type="button" 
                onClick={() => setActiveStep(1)}
                className="text-gray-600 px-6 py-2 rounded-md hover:bg-gray-100 transition font-medium"
              >
                &larr; Kembali
              </button>
              <button 
                type="submit" 
                className="bg-green-600 text-white px-8 py-2 rounded-md hover:bg-green-700 transition font-bold shadow-md transform hover:-translate-y-0.5"
              >
                Simpan & Publikasikan
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default AdminPanel;
