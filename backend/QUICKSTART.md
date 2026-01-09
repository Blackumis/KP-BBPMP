# Quick Start Guide - KP BBPMP Backend

## Setup Cepat (5 Menit)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Setup Environment
```bash
copy .env.example .env
```

Edit `.env` dan sesuaikan konfigurasi database:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=kp_bbpmp_db
```

### 3. Setup Database
```bash
npm run migrate
```

Output yang diharapkan:
```
✓ Database schema created successfully
✓ Tables created successfully
✓ Kabupaten/Kota data inserted
✓ Default admin created (username: admin, password: admin123)
```

### 4. Jalankan Server
```bash
npm run dev
```

Server berjalan di: http://localhost:5000

### 5. Test API

**Health Check:**
```bash
curl http://localhost:5000/api/health
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

## Alur Kerja Lengkap

### A. Admin - Membuat Kegiatan

1. **Login** ke sistem (gunakan Postman atau frontend)
2. **Buat Event** dengan informasi:
   - Nama kegiatan
   - Nomor surat
   - Tanggal & jam
   - Batas waktu absensi
   - Upload template sertifikat (optional)

3. **Generate Link Absensi** 
4. **Bagikan link** ke peserta

### B. User - Mengisi Absensi

1. **Buka link** absensi yang dibagikan admin
2. **Isi form** dengan data lengkap:
   - Nama lengkap (dengan gelar)
   - Unit kerja
   - NIP (optional)
   - Provinsi & Kabupaten/Kota
   - Tanggal lahir
   - Nomor HP
   - Pangkat/Golongan (optional)
   - Jabatan (optional)
   - Email (isi 2x untuk konfirmasi)
   - Link signature/TTD elektronik
   - Centang checkbox pernyataan

3. **Submit** - sistem akan validasi:
   - ✓ Semua field wajib terisi
   - ✓ Email sama dengan konfirmasi
   - ✓ Tidak boleh absensi ganda
   - ✓ Deadline belum lewat

### C. Admin - Generate & Kirim Sertifikat

1. **Lihat daftar peserta** yang sudah absen
2. **Koreksi data** jika diperlukan
3. **Generate sertifikat**:
   - Per peserta: `/api/certificates/generate/:attendance_id`
   - Semua peserta: `/api/certificates/generate-event/:event_id`

4. **Kirim via email**:
   - Per peserta: `/api/certificates/send/:attendance_id`
   - Semua peserta: `/api/certificates/send-event/:event_id`

5. **Lihat riwayat** pengiriman sertifikat

## Testing dengan Postman

1. Import file `KP-BBPMP-API.postman_collection.json`
2. Jalankan request "Login" terlebih dahulu
3. Token akan otomatis tersimpan untuk request berikutnya
4. Test semua endpoint sesuai kebutuhan

## Struktur Folder

```
backend/
├── config/           # Konfigurasi database
├── controllers/      # Business logic
├── routes/          # API routes
├── middleware/      # Auth & upload middleware
├── utils/           # Email & PDF generator
├── database/        # Schema SQL
├── migrations/      # Migration scripts
├── scripts/         # Helper scripts
├── uploads/         # File upload (template)
├── certificates/    # Generated certificates
└── server.js        # Entry point
```

## Environment Variables Penting

```env
# Database (WAJIB diisi)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=kp_bbpmp_db

# Email (untuk kirim sertifikat)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# JWT Secret (ganti dengan random string)
JWT_SECRET=your-super-secret-key

# URLs
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

## Troubleshooting

### Error: ER_NOT_SUPPORTED_AUTH_MODE
**Solusi:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

### Error: ECONNREFUSED
- Pastikan MySQL running
- Cek DB_HOST dan DB_PORT di .env

### Email tidak terkirim
- Untuk Gmail, aktifkan "App Password" (bukan password biasa)
- Cek SMTP_USER dan SMTP_PASSWORD di .env

### File upload error
- Pastikan folder `uploads/` dan `certificates/` memiliki write permission
- Windows: klik kanan > Properties > Security > Edit
- Linux: `chmod 755 uploads certificates`

## Next Steps

1. ✓ Backend API siap
2. ⏭ Integrate dengan frontend React
3. ⏭ Deploy ke Cloud Panel
4. ⏭ Setup domain & SSL

## Support

Jika ada pertanyaan atau error, dokumentasi lengkap ada di `README.md`
