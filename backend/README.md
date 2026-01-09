# KP BBPMP Backend API

Backend system untuk Aplikasi Manajemen Absensi dan Sertifikat Kegiatan.

## Fitur Utama

- **Manajemen Admin**: Login, registrasi, dan manajemen profil admin
- **Manajemen Kegiatan**: CRUD kegiatan/event dengan konfigurasi form dinamis
- **Absensi Online**: Form absensi publik dengan validasi otomatis
- **Generate Sertifikat**: Pembuatan sertifikat PDF otomatis
- **Email Automation**: Pengiriman sertifikat otomatis ke email peserta
- **Upload Template**: Upload template/background sertifikat

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Token)
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **File Upload**: Multer

## Instalasi

### 1. Clone Repository

```bash
cd backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment

Copy file `.env.example` menjadi `.env`:

```bash
copy .env.example .env
```

Edit file `.env` sesuai konfigurasi Anda:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration (sesuaikan dengan MySQL Anda)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kp_bbpmp_db

# JWT Secret (ganti dengan random string yang aman)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (gunakan Gmail atau SMTP lainnya)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Base URL
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

### 4. Setup Database

Jalankan migrasi database:

```bash
npm run migrate
```

Ini akan:
- Membuat database `kp_bbpmp_db`
- Membuat semua tabel yang diperlukan
- Mengisi data kabupaten/kota Jawa Tengah
- Membuat admin default (username: `admin`, password: `admin123`)

### 5. Jalankan Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

Server akan berjalan di `http://localhost:5000`

## Struktur Database

### Tabel: admins
- **id**: Primary key
- **username**: Username admin (unique)
- **email**: Email admin (unique)
- **password**: Password (hashed dengan bcrypt)
- **full_name**: Nama lengkap admin

### Tabel: events
- **id**: Primary key
- **nama_kegiatan**: Nama kegiatan
- **nomor_surat**: Nomor surat kegiatan (unique)
- **tanggal_mulai**: Tanggal mulai kegiatan
- **tanggal_selesai**: Tanggal selesai kegiatan
- **jam_mulai**: Jam mulai
- **jam_selesai**: Jam selesai
- **batas_waktu_absensi**: Deadline absensi
- **template_sertifikat**: Path file template sertifikat
- **form_config**: Konfigurasi field form (JSON)
- **status**: draft | active | closed

### Tabel: attendances
- **id**: Primary key
- **event_id**: Foreign key ke events
- **nama_lengkap**: Nama lengkap peserta
- **unit_kerja**: Unit kerja peserta
- **nip**: Nomor Induk Pegawai
- **provinsi**: Jawa Tengah | Luar Jawa Tengah
- **kabupaten_kota**: Kabupaten/Kota
- **tanggal_lahir**: Tanggal lahir
- **nomor_hp**: Nomor HP
- **pangkat_golongan**: Pangkat/Golongan
- **jabatan**: Jabatan
- **email**: Email peserta
- **signature_url**: URL tanda tangan elektronik
- **urutan_absensi**: Urutan absensi (auto increment)
- **nomor_sertifikat**: Nomor sertifikat (format: urutan/nomor_surat)
- **status**: menunggu_sertifikat | sertifikat_terkirim
- **certificate_path**: Path file sertifikat PDF
- **sent_at**: Waktu pengiriman sertifikat

### Tabel: kabupaten_kota
- **id**: Primary key
- **nama**: Nama kabupaten/kota
- **tipe**: kabupaten | kota

## API Endpoints

### Authentication

#### POST /api/auth/login
Login admin

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token-here",
    "admin": {
      "id": 1,
      "username": "admin",
      "email": "admin@kpbbpmp.com",
      "full_name": "Administrator"
    }
  }
}
```

#### GET /api/auth/profile
Get profil admin (requires authentication)

**Headers:**
```
Authorization: Bearer <token>
```

#### PUT /api/auth/change-password
Ubah password (requires authentication)

**Request Body:**
```json
{
  "currentPassword": "admin123",
  "newPassword": "newpassword123"
}
```

### Events (Kegiatan)

#### POST /api/events
Buat kegiatan baru (admin only)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- nama_kegiatan: string
- nomor_surat: string
- tanggal_mulai: date (YYYY-MM-DD)
- tanggal_selesai: date
- jam_mulai: time (HH:MM:SS)
- jam_selesai: time
- batas_waktu_absensi: datetime (YYYY-MM-DD HH:MM:SS)
- template: file (optional, image/PDF)
- form_config: JSON string (optional)

#### GET /api/events
Get semua kegiatan (admin only)

**Query Parameters:**
- status: draft | active | closed (optional)
- page: number (default: 1)
- limit: number (default: 10)

#### GET /api/events/:id
Get detail kegiatan (admin only)

#### PUT /api/events/:id
Update kegiatan (admin only)

#### DELETE /api/events/:id
Hapus kegiatan (admin only)

#### POST /api/events/:id/generate-link
Generate link form absensi (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Form link generated successfully",
  "data": {
    "link": "http://localhost:5173/attendance/1",
    "event_id": 1,
    "nama_kegiatan": "Workshop ABC"
  }
}
```

### Attendance (Absensi)

#### GET /api/attendance/form/:id
Get form kegiatan (public - untuk user)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_kegiatan": "Workshop ABC",
    "nomor_surat": "001/ABC/2026",
    "tanggal_mulai": "2026-02-01",
    "tanggal_selesai": "2026-02-02",
    "form_config": {}
  }
}
```

#### POST /api/attendance/submit/:event_id
Submit absensi (public - untuk user)

**Request Body:**
```json
{
  "nama_lengkap": "Dr. John Doe, M.Pd",
  "unit_kerja": "BBPMP Jawa Tengah",
  "nip": "198501012010011001",
  "provinsi": "Jawa Tengah",
  "kabupaten_kota": "Kota Semarang",
  "tanggal_lahir": "1985-01-01",
  "nomor_hp": "081234567890",
  "pangkat_golongan": "Pembina / IV-a",
  "jabatan": "Kepala Seksi",
  "email": "johndoe@example.com",
  "email_konfirmasi": "johndoe@example.com",
  "signature_url": "https://example.com/signature.png",
  "pernyataan": true
}
```

**Validasi:**
- Semua field wajib terisi (kecuali yang optional: nip, tanggal_lahir, pangkat_golongan, jabatan)
- Email dan email_konfirmasi harus sama
- Email harus format valid
- Checkbox pernyataan harus true
- Tidak boleh absensi ganda (cek berdasarkan email)
- Deadline belum terlewati

#### GET /api/attendance/event/:event_id
Get semua absensi untuk kegiatan tertentu (admin only)

**Query Parameters:**
- page: number
- limit: number
- status: menunggu_sertifikat | sertifikat_terkirim (optional)

#### GET /api/attendance/:id
Get detail absensi (admin only)

#### PUT /api/attendance/:id
Update absensi (admin only - untuk koreksi data)

#### DELETE /api/attendance/:id
Hapus absensi (admin only)

### Certificates (Sertifikat)

#### POST /api/certificates/generate/:attendance_id
Generate sertifikat untuk 1 peserta (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Certificate generated successfully",
  "data": {
    "certificate_path": "certificates/certificate-1-1234567890.pdf",
    "download_url": "http://localhost:5000/certificates/certificate-1-1234567890.pdf"
  }
}
```

#### POST /api/certificates/generate-event/:event_id
Generate sertifikat untuk semua peserta dalam 1 kegiatan (admin only)

**Response:**
```json
{
  "success": true,
  "message": "Generated 50 certificates",
  "data": {
    "total": 50,
    "success": 50,
    "failed": 0,
    "results": [...],
    "errors": []
  }
}
```

#### POST /api/certificates/send/:attendance_id
Kirim sertifikat ke 1 peserta via email (admin only)

#### POST /api/certificates/send-event/:event_id
Kirim sertifikat ke semua peserta dalam 1 kegiatan via email (admin only)

#### GET /api/certificates/history/:event_id
Get riwayat sertifikat untuk 1 kegiatan (admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 50,
      "menunggu_sertifikat": 10,
      "sertifikat_terkirim": 40
    },
    "attendances": [...]
  }
}
```

### Reference Data

#### GET /api/reference/kabupaten-kota
Get daftar kabupaten/kota Jawa Tengah (public)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nama": "Kab. Banjarnegara",
      "tipe": "kabupaten"
    },
    {
      "id": 33,
      "nama": "Kota Semarang",
      "tipe": "kota"
    }
  ]
}
```

## Deployment ke Cloud Panel

### Persiapan

1. **Server Requirements:**
   - Node.js 18+ terinstall
   - MySQL 8+ terinstall
   - PM2 untuk process management

2. **Database Setup:**
   - Buat database MySQL di Cloud Panel
   - Catat credentials (host, user, password, database name)

### Langkah Deployment

1. **Upload Files:**
   Upload semua file backend ke server via FTP/SSH

2. **Install Dependencies:**
   ```bash
   cd /path/to/backend
   npm install --production
   ```

3. **Setup Environment:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   
   Edit dengan konfigurasi production:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_HOST=your-db-host
   DB_USER=your-db-user
   DB_PASSWORD=your-db-password
   DB_NAME=your-db-name
   BASE_URL=https://yourdomain.com/api
   FRONTEND_URL=https://yourdomain.com
   ```

4. **Run Migration:**
   ```bash
   npm run migrate
   ```

5. **Start with PM2:**
   ```bash
   pm2 start server.js --name kp-bbpmp-api
   pm2 save
   pm2 startup
   ```

6. **Setup Nginx (jika diperlukan):**
   ```nginx
   location /api {
       proxy_pass http://localhost:5000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
   }
   ```

## Keamanan

- Password di-hash menggunakan bcrypt
- JWT untuk autentikasi
- Rate limiting untuk mencegah spam
- Helmet.js untuk security headers
- CORS configuration
- Input validation
- File upload restrictions

## Troubleshooting

### Database Connection Error
- Pastikan MySQL running
- Cek credentials di .env
- Cek firewall settings

### Email Not Sending
- Cek SMTP credentials
- Untuk Gmail, gunakan App Password (bukan password biasa)
- Cek firewall untuk port 587

### File Upload Error
- Cek permissions folder uploads/
- Cek MAX_FILE_SIZE di .env

## Support

Untuk bantuan lebih lanjut, silakan hubungi tim developer.
