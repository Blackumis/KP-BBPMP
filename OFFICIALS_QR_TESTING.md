# Testing Guide - Official QR Code Verification

## Fitur yang Ditambahkan

### 1. **Text Alignment Fix** ✅
- Alignment (kiri/tengah/kanan) sekarang hanya mengubah posisi teks dalam box
- Box tetap di tempatnya dan tidak bergerak saat alignment diubah
- Implementasi menggunakan CSS `textAlign` dan `justifyContent` tanpa `transform` pada box

### 2. **QR Code untuk Pejabat** ✅
- QR code sekarang berisi URL ke halaman verifikasi pejabat
- URL Format: `http://localhost:5173/official/{id}`
- Saat di-scan, QR code akan membuka halaman yang menampilkan:
  - Nama pejabat
  - Jabatan
  - Tanda tangan (signature image)
  - Status aktif/tidak aktif
  - Tanggal terdaftar
  - UI modern dengan gradient dan animasi

### 3. **Drag & Drop Improvement** ✅
- Menggunakan `requestAnimationFrame` untuk update yang lebih smooth
- Posisi di-round ke 2 decimal places untuk menghindari lompat-lompat
- Cursor berubah dari `grab` ke `grabbing` saat drag

## Cara Testing

### Test 1: Text Alignment
1. Buka halaman admin → Edit/Create Event → Certificate Editor
2. Pilih salah satu text field
3. Coba ubah alignment dari kiri → tengah → kanan
4. **Expected**: Box tetap di posisinya, hanya teks dalam box yang berubah alignment
5. **Fixed**: Sebelumnya box ikut bergerak karena ada transform

### Test 2: QR Code Verification Page
1. Login sebagai admin
2. Buka tab "Pejabat"
3. Tambah pejabat baru dengan upload tanda tangan
4. QR code akan otomatis ter-generate
5. Scan QR code menggunakan smartphone atau QR reader
6. **Expected**: Browser membuka `http://localhost:5173/official/{id}` 
7. Halaman menampilkan:
   - Header dengan badge "Terverifikasi"
   - Nama pejabat dengan icon
   - Jabatan dalam badge
   - Tanda tangan dalam box dengan styling
   - Info status dan tanggal registrasi
   - Tombol kembali ke beranda

### Test 3: Drag & Drop Smoothness
1. Buka Certificate Editor
2. Pilih text field
3. Drag field ke berbagai posisi
4. **Expected**: Movement smooth tanpa lompat-lompat
5. **Fixed**: Menggunakan requestAnimationFrame dan rounding

### Test 4: Direct URL Access
1. Buka browser
2. Ketik manual: `http://localhost:5173/official/1` (ganti 1 dengan ID pejabat yang ada)
3. **Expected**: Halaman verification muncul dengan data pejabat
4. Jika ID tidak ada, muncul error page dengan tombol kembali

## Technical Changes

### Frontend Files Modified:
- ✅ `frontend/src/components/CertificateEditor.jsx` - Fixed alignment & drag smoothness
- ✅ `frontend/src/pages/OfficialVerification.jsx` - NEW: Beautiful verification page
- ✅ `frontend/src/App.jsx` - Added route `/official/:id`

### Backend Files Modified:
- ✅ `backend/controllers/officialController.js` - QR now contains verification URL instead of image URL

### Environment Variables:
- Add to `.env`: `FRONTEND_URL=http://localhost:5173`

## QR Code URL Format

**Old QR Content:**
```
http://localhost:3000/uploads/signatures/signature-123.jpg
```

**New QR Content:**
```
http://localhost:5173/official/1
```

## Screenshots Test Checklist

- [ ] Text alignment center - box tidak bergeser
- [ ] Text alignment right - box tidak bergeser
- [ ] Drag field - movement smooth
- [ ] QR scan - membuka halaman verifikasi
- [ ] Official verification page - UI bagus dan complete
- [ ] Error page - ketika ID tidak ditemukan

## Notes

- QR code ter-generate ulang setiap kali pejabat di-create atau di-update dengan signature baru
- Halaman verifikasi adalah public page (tidak perlu login)
- UI menggunakan gradient Tailwind CSS dengan animasi modern
- Responsive untuk mobile dan desktop
