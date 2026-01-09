# KP-BBPMP - Sistem Manajemen Kehadiran & Sertifikat

Aplikasi manajemen kehadiran dan sertifikat untuk BBPMP Provinsi Jawa Tengah. Dibangun dengan React + Vite (Frontend) dan Express.js + MySQL (Backend).

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm atau yarn

### Installation

1. **Clone & Install Dependencies**
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

2. **Setup Environment**
```bash
# Frontend (.env)
VITE_API_URL=http://localhost:5000/api

# Backend (backend/.env)
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kp_bbpmp_db
JWT_SECRET=your-secret-key
```

3. **Run Database Migration**
```bash
cd backend
npm run migrate
```

4. **Start Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev -- --port 2000
```

5. **Access Application**
- Frontend: http://localhost:2000
- Backend API: http://localhost:5000/api

---

## 🎮 Demo Data

### Default Admin Login
| Username | Password | Email |
|----------|----------|-------|
| `admin` | `admin123` | admin@kpbbpmp.com |

### Demo Events (Kegiatan)

Jalankan SQL berikut di MySQL untuk membuat data demo:

```sql
USE kp_bbpmp_db;

-- Demo Event 1: Workshop Kurikulum Merdeka (Active)
INSERT INTO events (nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, batas_waktu_absensi, status, created_by, form_config) VALUES
('Workshop Implementasi Kurikulum Merdeka Tahun 2026', 
 'SURAT/001/BBPMP/I/2026', 
 '2026-01-15', 
 '2026-01-17', 
 '08:00:00', 
 '16:00:00', 
 '2026-01-17 23:59:59', 
 'active', 
 1,
 '{"fields": ["nama_lengkap", "unit_kerja", "nip", "provinsi", "kabupaten_kota", "tanggal_lahir", "nomor_hp", "pangkat_golongan", "jabatan", "email", "signature_url"]}'
);

-- Demo Event 2: Bimtek Digitalisasi (Active)
INSERT INTO events (nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, batas_waktu_absensi, status, created_by, form_config) VALUES
('Bimbingan Teknis Digitalisasi Sekolah', 
 'SURAT/002/BBPMP/I/2026', 
 '2026-01-20', 
 '2026-01-21', 
 '09:00:00', 
 '15:00:00', 
 '2026-01-21 23:59:59', 
 'active', 
 1,
 '{"fields": ["nama_lengkap", "unit_kerja", "nip", "provinsi", "kabupaten_kota", "nomor_hp", "jabatan", "email", "signature_url"]}'
);

-- Demo Event 3: Pelatihan Guru (Draft)
INSERT INTO events (nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, batas_waktu_absensi, status, created_by, form_config) VALUES
('Pelatihan Guru Penggerak Batch 3', 
 'SURAT/003/BBPMP/I/2026', 
 '2026-02-01', 
 '2026-02-05', 
 '08:00:00', 
 '17:00:00', 
 '2026-02-05 23:59:59', 
 'draft', 
 1,
 '{"fields": ["nama_lengkap", "unit_kerja", "nip", "provinsi", "kabupaten_kota", "tanggal_lahir", "nomor_hp", "pangkat_golongan", "jabatan", "email", "signature_url"]}'
);

-- Demo Event 4: Seminar Pendidikan (Closed)
INSERT INTO events (nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, batas_waktu_absensi, status, created_by, form_config) VALUES
('Seminar Nasional Pendidikan Inklusi', 
 'SURAT/004/BBPMP/XII/2025', 
 '2025-12-10', 
 '2025-12-10', 
 '08:00:00', 
 '12:00:00', 
 '2025-12-10 23:59:59', 
 'closed', 
 1,
 '{"fields": ["nama_lengkap", "unit_kerja", "provinsi", "kabupaten_kota", "nomor_hp", "email", "signature_url"]}'
);
```

### Demo Attendances (Peserta)

```sql
-- Peserta untuk Event 1 (Workshop Kurikulum Merdeka)
INSERT INTO attendances (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, status) VALUES
(1, 'Budi Santoso, S.Pd., M.Pd.', 'SMPN 1 Semarang', '198501152010011001', 'Jawa Tengah', 'Semarang', '1985-01-15', '081234567890', 'III/c - Penata', 'Guru', 'budi.santoso@gmail.com', 'https://example.com/signatures/budi.png', 1, 'menunggu_sertifikat'),
(1, 'Siti Rahayu, S.Pd.', 'SMAN 3 Surakarta', '199003202015012001', 'Jawa Tengah', 'Surakarta', '1990-03-20', '081345678901', 'III/b - Penata Muda Tk. I', 'Guru', 'siti.rahayu@gmail.com', 'https://example.com/signatures/siti.png', 2, 'menunggu_sertifikat'),
(1, 'Ahmad Wijaya, M.Pd.', 'SMPN 2 Magelang', '198207102008011002', 'Jawa Tengah', 'Magelang', '1982-07-10', '082456789012', 'III/d - Penata Tk. I', 'Wakil Kepala Sekolah', 'ahmad.wijaya@gmail.com', 'https://example.com/signatures/ahmad.png', 3, 'sertifikat_terkirim'),
(1, 'Dewi Lestari, S.Pd.', 'SDN Karangayu 01', '199112252018012001', 'Jawa Tengah', 'Semarang', '1991-12-25', '083567890123', 'III/a - Penata Muda', 'Guru Kelas', 'dewi.lestari@gmail.com', 'https://example.com/signatures/dewi.png', 4, 'menunggu_sertifikat'),
(1, 'Rudi Hermawan, S.Pd.', 'SMKN 1 Kudus', '198809152012011001', 'Jawa Tengah', 'Kudus', '1988-09-15', '084678901234', 'III/b - Penata Muda Tk. I', 'Guru Produktif', 'rudi.hermawan@gmail.com', 'https://example.com/signatures/rudi.png', 5, 'menunggu_sertifikat');

-- Peserta untuk Event 2 (Bimtek Digitalisasi)
INSERT INTO attendances (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, status) VALUES
(2, 'Eko Prasetyo, S.Kom.', 'SMKN 2 Semarang', '199205102019011001', 'Jawa Tengah', 'Semarang', '1992-05-10', '085789012345', 'III/a - Penata Muda', 'Guru TIK', 'eko.prasetyo@gmail.com', 'https://example.com/signatures/eko.png', 1, 'menunggu_sertifikat'),
(2, 'Rina Kusuma, S.Pd.', 'SMPN 1 Salatiga', '198706202011012001', 'Jawa Tengah', 'Salatiga', '1987-06-20', '086890123456', 'III/c - Penata', 'Guru', 'rina.kusuma@gmail.com', 'https://example.com/signatures/rina.png', 2, 'menunggu_sertifikat'),
(2, 'Hendra Gunawan, M.T.', 'SMAN 1 Pekalongan', '198004152006011001', 'Jawa Tengah', 'Pekalongan', '1980-04-15', '087901234567', 'IV/a - Pembina', 'Kepala Sekolah', 'hendra.gunawan@gmail.com', 'https://example.com/signatures/hendra.png', 3, 'menunggu_sertifikat');

-- Peserta untuk Event 4 (Seminar - Closed)
INSERT INTO attendances (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, nomor_sertifikat, status) VALUES
(4, 'Maria Agustina, S.Pd.', 'SLB Negeri Semarang', '198508102010012001', 'Jawa Tengah', 'Semarang', '1985-08-10', '088012345678', 'III/c - Penata', 'Guru SLB', 'maria.agustina@gmail.com', 'https://example.com/signatures/maria.png', 1, 'CERT/001/BBPMP/XII/2025', 'sertifikat_terkirim'),
(4, 'Joko Susilo, M.Pd.', 'SMPN 3 Cilacap', '197912252005011001', 'Jawa Tengah', 'Cilacap', '1979-12-25', '089123456789', 'IV/a - Pembina', 'Kepala Sekolah', 'joko.susilo@gmail.com', 'https://example.com/signatures/joko.png', 2, 'CERT/002/BBPMP/XII/2025', 'sertifikat_terkirim'),
(4, 'Ani Suryani, S.Pd.', 'SDN Inklusi Brebes', '199201152017012001', 'Jawa Tengah', 'Brebes', '1992-01-15', '081234509876', 'III/a - Penata Muda', 'Guru Pendamping', 'ani.suryani@gmail.com', 'https://example.com/signatures/ani.png', 3, 'CERT/003/BBPMP/XII/2025', 'sertifikat_terkirim');
```

### Quick Demo Script

Simpan sebagai `demo-data.sql` dan jalankan:

```bash
mysql -u root -p kp_bbpmp_db < demo-data.sql
```

Atau copy-paste semua SQL di atas ke MySQL client.

---

## 📱 Demo Walkthrough

### 1. Admin Login
1. Buka http://localhost:2000
2. Login dengan `admin` / `admin123`
3. Anda akan melihat Dashboard dengan daftar kegiatan

### 2. Melihat Daftar Kegiatan
- **Workshop Kurikulum Merdeka** - Status: Active (5 peserta)
- **Bimtek Digitalisasi** - Status: Active (3 peserta)
- **Pelatihan Guru Penggerak** - Status: Draft (belum ada peserta)
- **Seminar Pendidikan Inklusi** - Status: Closed (3 peserta, sertifikat terkirim)

### 3. Membuat Kegiatan Baru
1. Klik "Buat Kegiatan Baru"
2. Isi form dengan data kegiatan
3. Pilih field yang akan ditampilkan di form absensi
4. Klik "Simpan" (status = draft)

### 4. Mengaktifkan Kegiatan
1. Pada kegiatan dengan status "Draft", klik "Aktifkan"
2. Kegiatan akan berubah status menjadi "Active"
3. Link absensi publik akan dibuat otomatis

### 5. Form Absensi Publik
1. Copy link kegiatan yang aktif
2. Buka link di browser (incognito untuk test)
3. Isi form absensi sebagai peserta
4. Upload/link tanda tangan elektronik
5. Submit absensi

### 6. Melihat Daftar Peserta
1. Klik "Lihat Peserta" pada kegiatan
2. Lihat semua peserta yang sudah absen
3. Status: Menunggu Sertifikat / Sertifikat Terkirim

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Express.js, Node.js |
| Database | MySQL 8.0 |
| Auth | JWT (JSON Web Token) |

---

## 📁 Project Structure

```
KP-BBPMP/
├── src/                    # Frontend source
│   ├── components/         # React components
│   │   ├── AdminPanel.jsx      # Form buat kegiatan
│   │   ├── AttendanceForm.jsx  # Form absensi publik
│   │   ├── AttendanceList.jsx  # Daftar peserta
│   │   ├── DaftarKegiatan.jsx  # Dashboard kegiatan
│   │   ├── Header.jsx          # Navbar
│   │   ├── Footer.jsx          # Footer
│   │   └── Login.jsx           # Login page
│   ├── services/
│   │   └── api.js          # API service layer
│   └── App.jsx             # Main app component
├── backend/                # Backend source
│   ├── controllers/        # Route controllers
│   ├── routes/            # API routes
│   ├── middleware/        # Auth middleware
│   ├── database/          # Schema & migrations
│   └── server.js          # Express server
├── DOCUMENTATION.md       # Full documentation
└── README.md              # This file
```

---

## 📄 License

MIT License - BBPMP Provinsi Jawa Tengah © 2026

