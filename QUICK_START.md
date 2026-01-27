# Cara Menjalankan Aplikasi Setelah Update

## 1. Install Dependencies (jika belum)

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

## 2. Jalankan Migrasi Database

Database migration untuk tabel officials sudah dijalankan! ✅

Jika perlu jalankan ulang:
```bash
cd backend
node migrations/runOfficialsMigration.js
```

## 3. Start Backend Server

```bash
cd backend
npm start
```

atau untuk development:
```bash
npm run dev
```

Server akan berjalan di: **http://localhost:3000** (atau port dari .env)

## 4. Start Frontend Development Server

Buka terminal baru:
```bash
cd frontend
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

## 5. Login & Test Fitur Baru

1. **Login** sebagai admin
2. **Tab Pejabat**: Klik tab "Pejabat Penandatangan"
3. **Tambah Pejabat**: 
   - Klik "+ Tambah Pejabat"
   - Isi nama dan jabatan
   - Upload gambar tanda tangan
   - Klik Simpan
4. **Buat Kegiatan**:
   - Kembali ke tab "Daftar Kegiatan"
   - Klik "Buat Kegiatan Baru"
   - Di Step 1, pilih pejabat di dropdown
   - Lanjutkan normal
5. **Test Alignment**:
   - Di Step 3 (Layout Sertifikat)
   - Klik field text
   - Coba ubah alignment: left, center, right
   - Lihat preview update real-time

## Troubleshooting

### Error: Cannot find module 'qrcode'
Backend sudah memiliki qrcode di package.json, tapi jika error:
```bash
cd backend
npm install qrcode
```

### Error: ENOENT uploads/signatures
Folder akan dibuat otomatis, tapi jika error:
```bash
cd backend
mkdir -p uploads/signatures
```

### Port sudah digunakan
Edit file `.env`:
```
PORT=3001  # ubah port backend
```

## Struktur Folder Baru

```
backend/
├── controllers/
│   └── officialController.js       [BARU]
├── routes/
│   └── officialRoutes.js           [BARU]
├── migrations/
│   ├── add_officials_table.sql     [BARU]
│   └── runOfficialsMigration.js    [BARU]
└── uploads/
    └── signatures/                 [BARU - auto created]

frontend/
└── src/
    └── components/
        └── OfficialsManagement.jsx [BARU]
```

## Verifikasi Database

Cek apakah tabel officials sudah ada:
```sql
USE kp_bbpmp_db;
DESCRIBE officials;
SHOW CREATE TABLE events;  -- lihat kolom official_id
```

## Testing Scenarios

### ✅ Scenario 1: CRUD Officials
- [ ] Create official dengan gambar
- [ ] List officials muncul di tabel
- [ ] QR code terlihat di kolom
- [ ] Edit official
- [ ] Delete official dengan konfirmasi

### ✅ Scenario 2: Event dengan Official
- [ ] Create event, pilih official
- [ ] Edit event, ganti official
- [ ] Event tanpa official tetap bisa jalan

### ✅ Scenario 3: Certificate Generation
- [ ] Generate sertifikat
- [ ] QR official muncul di PDF
- [ ] Text alignment bekerja (left, center, right)

### ✅ Scenario 4: No White Screen
- [ ] Halaman admin load normal
- [ ] Switch tab Events <-> Officials smooth
- [ ] Certificate editor load tanpa error
- [ ] Semua modal buka/tutup normal

## Support

Jika menemukan masalah:
1. Check browser console (F12)
2. Check backend terminal untuk error logs
3. Verify database connection
4. Check file permissions untuk uploads/

---

**Selamat mencoba!** 🚀
