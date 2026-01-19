# Panduan Menjalankan Aplikasi KP-BBPMP

Sistem Manajemen Absensi dan Sertifikat Kegiatan BBPMP

## Persiapan

### 1. Install Prerequisites

Pastikan Anda sudah menginstall:
- **Node.js** (versi 18 atau lebih baru) - [Download di sini](https://nodejs.org/)
- **MySQL** (versi 8 atau lebih baru) - [Download di sini](https://dev.mysql.com/downloads/mysql/)
- **Git** (opsional) - [Download di sini](https://git-scm.com/)

Cara mengecek apakah sudah terinstall:
```bash
node --version
npm --version
mysql --version
```

### 2. Setup Database MySQL

1. Buka MySQL Command Line atau MySQL Workbench
2. Login sebagai root atau user dengan privilege yang cukup
3. Database akan dibuat otomatis saat menjalankan migration

## Langkah-langkah Menjalankan Aplikasi

### A. Setup Backend (API Server)

#### 1. Masuk ke folder backend
```bash
cd backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Konfigurasi Environment Variables

Buat file `.env` di folder `backend` dengan menyalin dari `.env.example`:
```bash
copy .env.example .env
```

Kemudian edit file `.env` dan sesuaikan dengan konfigurasi Anda:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=kp_bbpmp_db

# JWT Secret (ganti dengan string random yang aman)
JWT_SECRET=ganti-dengan-kunci-rahasia-yang-kuat-dan-random
JWT_EXPIRES_IN=7d

# Email Configuration (untuk pengiriman sertifikat)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email-anda@gmail.com
SMTP_PASSWORD=app-password-gmail-anda

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Base URL - PENTING untuk link validasi sertifikat
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

**Catatan penting untuk Email:**
- Jika menggunakan Gmail, Anda perlu membuat App Password
- Caranya: Google Account → Security → 2-Step Verification → App passwords
- Jangan gunakan password Gmail biasa

#### 4. Jalankan Migration Database

Perintah ini akan membuat database, tabel, dan data awal:
```bash
npm run migrate
```

Jika berhasil, Anda akan melihat pesan:
```
✓ Database created successfully
✓ Tables created successfully
✓ Seed data inserted successfully
```

#### 5. Buat Admin User

Untuk membuat user admin pertama kali:
```bash
npm run create-admin
```

Ikuti prompt untuk memasukkan:
- Username
- Email
- Password
- Nama Lengkap

Atau jika muncul error, buat manual melalui MySQL:
```sql
USE kp_bbpmp_db;
INSERT INTO admins (username, email, password, full_name) 
VALUES ('admin', 'admin@bbpmp.com', '$2a$10$YourHashedPasswordHere', 'Administrator');
```

#### 6. Jalankan Backend Server

Mode development (dengan auto-reload):
```bash
npm run dev
```

Atau mode production:
```bash
npm start
```

Server akan berjalan di: **http://localhost:5000**

Jika berhasil, akan muncul:
```
Server running on port 5000
Connected to MySQL database
```

### B. Setup Frontend (React Application)

Buka terminal/command prompt baru (jangan tutup yang backend):

#### 1. Masuk ke folder frontend
```bash
cd frontend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Konfigurasi API URL (Opsional)

Jika backend tidak berjalan di port 5000, edit file `frontend/src/services/api.js`:
```javascript
const BASE_URL = 'http://localhost:5000/api';
```

#### 4. Jalankan Frontend Development Server
```bash
npm run dev
```

Frontend akan berjalan di: **http://localhost:5173**

Browser akan otomatis terbuka. Jika tidak, buka manual di browser.

## Cara Mengakses Aplikasi

### 1. Halaman Login Admin
```
http://localhost:5173/login
```
Gunakan kredensial admin yang dibuat sebelumnya.

### 2. Dashboard Admin
Setelah login, Anda akan masuk ke dashboard untuk:
- Mengelola kegiatan
- Melihat daftar absensi
- Generate dan kirim sertifikat

### 3. Halaman Absensi Publik
```
http://localhost:5173/attendance/{event_id}/{event_name}
```
URL ini akan digenerate otomatis untuk setiap kegiatan.
Peserta dapat mengisi absensi tanpa login.

### 4. Halaman Validasi Sertifikat (BARU!)
```
http://localhost:5173/validasi/{nomor_sertifikat}
```
Halaman ini untuk memvalidasi keaslian sertifikat.
Link akan otomatis muncul di PDF sertifikat yang digenerate.

**Cara kerja:**
- Setiap PDF sertifikat memiliki link validasi yang unik
- Klik link tersebut akan membuka halaman validasi
- Halaman akan menampilkan data peserta yang sesuai dengan database
- Jika sertifikat tidak valid, akan muncul pesan error

## Cara Menggunakan Aplikasi

### Untuk Admin:

1. **Login** ke sistem dengan kredensial admin
2. **Buat Kegiatan Baru**:
   - Klik "Buat Kegiatan"
   - Isi form (nama, tanggal, jam, dll)
   - Upload template sertifikat (opsional)
   - Submit
3. **Bagikan Link Absensi**:
   - Copy link absensi dari daftar kegiatan
   - Bagikan kepada peserta via WA/email
4. **Monitor Absensi**:
   - Lihat daftar peserta yang sudah absensi
   - Export data jika perlu
5. **Generate Sertifikat**:
   - Setelah kegiatan selesai, klik "Generate Sertifikat"
   - Tunggu proses selesai
   - PDF sertifikat akan tersimpan di folder `backend/certificates/`
6. **Kirim Sertifikat via Email**:
   - Klik "Kirim Sertifikat" 
   - Email akan dikirim otomatis ke semua peserta
   - Sertifikat disertakan sebagai attachment

### Untuk Peserta:

1. **Buka Link Absensi** yang dibagikan admin
2. **Isi Form Absensi**:
   - Nama lengkap
   - Unit kerja
   - NIP (jika ada)
   - Data lainnya
   - Upload tanda tangan digital
3. **Submit** form
4. **Terima Email Sertifikat** (setelah kegiatan selesai)
5. **Validasi Sertifikat**:
   - Buka PDF sertifikat yang diterima
   - Klik link validasi yang ada di sertifikat
   - Sistem akan menampilkan data lengkap dari database

## Troubleshooting

### Backend tidak bisa connect ke database
**Error**: `ER_ACCESS_DENIED_ERROR` atau `ECONNREFUSED`

**Solusi**:
1. Pastikan MySQL server berjalan:
   ```bash
   # Windows
   net start MySQL80
   
   # Atau lewat Services (services.msc)
   ```
2. Cek kredensial di file `.env`
3. Pastikan user MySQL punya akses ke database

### Port sudah digunakan
**Error**: `EADDRINUSE: address already in use :::5000`

**Solusi**:
1. Ubah port di `.env`:
   ```env
   PORT=5001
   ```
2. Atau kill proses yang menggunakan port tersebut:
   ```bash
   # Windows
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

### Migration error
**Error**: Saat menjalankan `npm run migrate`

**Solusi**:
1. Drop database manual dan coba lagi:
   ```sql
   DROP DATABASE IF EXISTS kp_bbpmp_db;
   ```
2. Jalankan migration lagi:
   ```bash
   npm run migrate
   ```

### Email tidak terkirim
**Error**: Sertifikat generate tapi email gagal

**Solusi**:
1. Pastikan konfigurasi SMTP di `.env` benar
2. Jika pakai Gmail, pastikan sudah setting App Password
3. Cek firewall tidak block port 587
4. Test dengan email service lain (Mailtrap, SendGrid)

### Sertifikat tidak muncul link validasi
**Solusi**:
1. Pastikan `BASE_URL` di `.env` sudah diisi dengan benar
2. Contoh: `BASE_URL=http://localhost:5000`
3. Jika deploy ke production, ganti dengan domain sebenarnya
4. Generate ulang sertifikat setelah update `.env`

### Halaman validasi error 404
**Solusi**:
1. Pastikan backend sudah running
2. Cek route `/api/certificates/validate/:certificate_number` tersedia
3. Test endpoint manual di browser atau Postman:
   ```
   http://localhost:5000/api/certificates/validate/NOMOR_SERTIFIKAT
   ```

## File dan Folder Penting

```
KP-BBPMP/
├── backend/
│   ├── certificates/          # PDF sertifikat yang digenerate
│   ├── uploads/              # File upload (template, signature)
│   ├── config/               # Konfigurasi database
│   ├── controllers/          # Logic aplikasi
│   ├── routes/               # Route API
│   ├── utils/                # Utilities (PDF generator, email)
│   ├── .env                  # Environment variables (BUAT MANUAL)
│   └── server.js             # Entry point backend
│
└── frontend/
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/           # Pages including ValidasiSertifikat.jsx
    │   ├── services/        # API services
    │   └── App.jsx          # Main app routing
    └── package.json
```

## Build untuk Production

### Backend
```bash
cd backend
npm start
```
Atau deploy ke hosting seperti:
- Heroku
- Railway
- VPS (DigitalOcean, AWS, dll)

### Frontend
```bash
cd frontend
npm run build
```
Hasil build ada di folder `frontend/dist/`
Upload ke hosting seperti:
- Netlify
- Vercel  
- GitHub Pages
- cPanel

**Penting saat deploy:**
1. Update `BASE_URL` di backend `.env` dengan domain production
2. Update API URL di frontend `services/api.js`
3. Setup MySQL database di server
4. Jalankan migration di server
5. Upload SSL certificate untuk HTTPS

## Fitur Baru: Validasi Sertifikat

### Cara Kerja:
1. Saat generate sertifikat, PDF akan otomatis include link validasi
2. Link format: `http://domain.com/validasi/NOMOR_SERTIFIKAT`
3. Siapa saja bisa klik link untuk validasi
4. Sistem akan query database berdasarkan nomor sertifikat
5. Jika valid, tampilkan data lengkap peserta dan kegiatan
6. Jika tidak valid, tampilkan pesan error

### Data yang Ditampilkan:
- **Informasi Sertifikat**: Nomor, status, tanggal terbit
- **Data Peserta**: Nama, NIP, unit kerja, jabatan, dll (sesuai database)
- **Informasi Kegiatan**: Nama kegiatan, tanggal, nomor surat

### Keamanan:
- Endpoint validasi bersifat publik (tidak perlu login)
- Hanya menampilkan data read-only
- Tidak ada operasi edit/delete
- Nomor sertifikat harus unique di database

## Support

Jika ada pertanyaan atau masalah:
1. Cek dokumentasi ini
2. Cek error message di console
3. Lihat log server untuk detail error
4. Hubungi developer/admin sistem

---

**Selamat menggunakan Sistem KP-BBPMP!** 🎉
