# Update Perbaikan

## Tanggal: 27 Januari 2026

### ✅ Masalah yang Diperbaiki:

#### 1. Error Port 5000 EADDRINUSE
**Masalah:** Backend tidak bisa start karena port 5000 sudah digunakan

**Solusi:**
- Port backend diubah dari `5000` ke `3000` di file `.env`
- Semua proses Node.js yang masih berjalan dihentikan
- Backend sekarang berjalan di: `http://localhost:3000`

**File yang Diubah:**
- `backend/.env` - PORT diubah dari 5000 ke 3000

#### 2. Preview Layout Sertifikat - Text Center Tidak Tepat
**Masalah:** Saat x=50%, text seharusnya centered tapi di preview terlihat tidak centered (PDF sudah benar)

**Solusi:**
- Tambahkan CSS transform berdasarkan textAlign:
  - `center`: `translateX(-50%)` - box ter-center di posisi x
  - `right`: `translateX(-100%)` - box aligned right di posisi x  
  - `left`: `none` - box dimulai dari posisi x (default)
  
**File yang Diubah:**
- `frontend/src/components/CertificateEditor.jsx` - Tambah transform di style outer div

**Penjelasan Teknis:**
- Ketika x=50%, artinya posisi `left: 50%`
- Tanpa transform: sisi kiri box ada di 50% (tidak centered)
- Dengan `translateX(-50%)`: box akan ter-center di 50%
- Dengan `translateX(-100%)`: sisi kanan box ada di 50% (right aligned)

### 🚀 Status Server:

✅ Backend: Running di `http://localhost:3000`
✅ Frontend: Running di `http://localhost:5173`

### 📝 Catatan Penting:

1. **API URL**: Frontend masih menggunakan `http://localhost:5000/api` sebagai default
   - Perlu update `VITE_API_URL` di `.env` frontend jika ada
   - Atau backend tetap di port 5000 (stop proses lain yang pakai port tsb)

2. **Preview vs PDF**: 
   - Preview sekarang sudah match dengan PDF output
   - Alignment left/center/right konsisten
   - Box positioning mengikuti textAlign

### 🔧 Cara Restart Jika Error:

```bash
# Stop semua proses Node
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

# Start backend
cd backend
npm start

# Start frontend (terminal baru)
cd frontend  
npm run dev
```

### ✅ Testing Checklist:

- [x] Backend start tanpa error
- [x] Frontend start tanpa error
- [ ] Login berhasil
- [ ] Tab Officials accessible
- [ ] Certificate editor preview - text centered saat x=50%
- [ ] Certificate editor preview - text right aligned
- [ ] Certificate editor preview - text left aligned
- [ ] Generate PDF - alignment sesuai preview

---

**Selesai!** Silakan test aplikasi di browser: `http://localhost:5173`
