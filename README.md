# KP-BBPMP - Sistem Manajemen Kehadiran & Sertifikat

Aplikasi manajemen kehadiran dan sertifikat untuk **BBPMP Provinsi Jawa Tengah**.

## 📋 Daftar Isi

- [Tentang Aplikasi](#-tentang-aplikasi)
- [Teknologi](#-teknologi)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi](#-instalasi)
- [Konfigurasi](#-konfigurasi)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Struktur Folder](#-struktur-folder)
- [Fitur](#-fitur)

---

## Tentang Aplikasi

KP-BBPMP adalah sistem manajemen kehadiran dan sertifikat yang memungkinkan:
- Admin membuat kegiatan/event dengan form absensi kustom
- Peserta mengisi absensi secara online
- Sertifikat otomatis digenerate dan dikirim via email
- Pengelolaan data kehadiran peserta

---

## Teknologi

| Komponen | Teknologi |
|----------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **Database** | MySQL |
| **Email** | Nodemailer (SMTP) |
| **PDF** | PDFKit |

---

## Persyaratan Sistem

Sebelum instalasi, pastikan komputer Anda memiliki:

- **Node.js** versi 18 atau lebih baru ([Download](https://nodejs.org/))
- **MySQL** versi 8.0 atau lebih baru ([Download](https://dev.mysql.com/downloads/))
- **Git** (opsional, untuk clone repository)

Untuk mengecek versi Node.js:
```bash
node --version
```

---

## Instalasi

### 1. Clone atau Download Repository

```bash
git clone <url-repository>
cd KP-BBPMP
```

### 2. Install Dependencies Backend

```bash
cd backend
npm install
```

### 3. Install Dependencies Frontend

```bash
cd ../frontend
npm install
```

### 4. Setup Database

Buka MySQL dan jalankan perintah berikut:

```sql
-- Buat database
CREATE DATABASE kp_bbpmp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Atau import file schema langsung:

```bash
mysql -u root -p < backend/database/schema.sql
```

### 5. Jalankan Migrasi Database

```bash
cd backend
npm run migrate
```

### 6. Buat Akun Admin

```bash
npm run create-admin
```

Ikuti instruksi untuk membuat username dan password admin.

---

## Konfigurasi

### Backend Environment

Buat file `.env` di folder `backend/` dengan isi:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password_mysql_anda
DB_NAME=kp_bbpmp_db

# JWT Secret (ganti dengan string random yang aman)
JWT_SECRET=ganti-dengan-secret-key-yang-aman-dan-panjang
JWT_EXPIRES_IN=7d

# Email Configuration (SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=email-anda@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Base URL
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### Konfigurasi Email Gmail

Untuk menggunakan Gmail sebagai SMTP:

1. **Aktifkan 2-Factor Authentication** di akun Google Anda
2. Buka [Google App Passwords](https://myaccount.google.com/apppasswords)
3. Buat App Password baru untuk "Mail"
4. Salin password 16 karakter yang diberikan
5. Gunakan password tersebut di `SMTP_PASSWORD` (bukan password Gmail biasa!)

> **Penting**: Jangan gunakan password Gmail biasa. Harus menggunakan App Password!

---

## Menjalankan Aplikasi

### Mode Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend akan berjalan di `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend akan berjalan di `http://localhost:5173`

### Mode Production

**Build Frontend:**
```bash
cd frontend
npm run build
```

**Jalankan Backend:**
```bash
cd backend
npm start
```

Akses aplikasi di `http://localhost:5000`

---

## Struktur Folder

```
KP-BBPMP/
├── backend/
│   ├── certificates/       # Sertifikat yang digenerate
│   ├── config/             # Konfigurasi database
│   ├── controllers/        # Logic handler
│   ├── database/           # Schema SQL
│   ├── middleware/         # Auth & upload middleware
│   ├── migrations/         # Database migrations
│   ├── routes/             # API routes
│   ├── scripts/            # Utility scripts
│   ├── uploads/            # File uploads
│   │   ├── signatures/     # Tanda tangan peserta
│   │   └── templates/      # Template sertifikat
│   ├── utils/              # Helper functions
│   ├── .env                # Environment variables
│   ├── package.json
│   └── server.js           # Entry point
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── layouts/        # Layout components
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Protected routes
│   │   ├── services/       # API services
│   │   └── utils/          # Helper functions
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```



## Troubleshooting

### Error: "Failed to fetch"
- Pastikan backend sudah berjalan di port 5000
- Cek CORS configuration di `backend/server.js`

### Error: "ECONNREFUSED" (Database)
- Pastikan MySQL sudah berjalan
- Cek kredensial database di `.env`

### Error: "Failed to send certificate"
- Pastikan `SMTP_HOST` adalah `smtp.gmail.com` (bukan email Anda)
- Gunakan App Password, bukan password Gmail biasa
- Pastikan 2FA sudah aktif di akun Google

### Port sudah digunakan
```bash
# Windows - Cari proses yang menggunakan port
netstat -ano | findstr :5000

# Matikan proses
taskkill /PID <PID> /F
```


**© 2026 BBPMP Provinsi Jawa Tengah**