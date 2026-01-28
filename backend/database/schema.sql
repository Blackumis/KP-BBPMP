-- KP BBPMP Database Schema
-- Attendance and Certificate Management System

-- Create Database
CREATE DATABASE IF NOT EXISTS kp_bbpmp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kp_bbpmp_db;

-- Table: admins
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: officials (pejabat penanda tangan sertifikat)
CREATE TABLE IF NOT EXISTS officials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL COMMENT 'Nama pejabat',
  position VARCHAR(255) NOT NULL COMMENT 'Jabatan pejabat',
  signature_image_path VARCHAR(500) NULL COMMENT 'Path gambar tanda tangan basah',
  signature_qr_path VARCHAR(500) NULL COMMENT 'Path QR code untuk verifikasi',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif pejabat',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: events (kegiatan)
CREATE TABLE IF NOT EXISTS events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kegiatan VARCHAR(255) NOT NULL,
  nomor_surat VARCHAR(100) UNIQUE NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  batas_waktu_absensi DATETIME NOT NULL,
  template_sertifikat VARCHAR(255) NULL,
  template_id INT NULL COMMENT 'Reference to certificate_templates table',
  template_source ENUM('upload', 'template') DEFAULT 'upload' COMMENT 'Source of certificate template',
  certificate_layout JSON NULL COMMENT 'Custom certificate layout configuration',
  official_id INT NULL COMMENT 'Reference to officials table for certificate signing',
  form_config JSON NULL COMMENT 'Configuration for dynamic form fields',
  status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
  FOREIGN KEY (official_id) REFERENCES officials(id) ON DELETE SET NULL,
  INDEX idx_nomor_surat (nomor_surat),
  INDEX idx_status (status),
  INDEX idx_tanggal (tanggal_mulai, tanggal_selesai),
  INDEX idx_template_id (template_id),
  INDEX idx_official_id (official_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: attendances (absensi)
CREATE TABLE IF NOT EXISTS attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  nama_lengkap VARCHAR(255) NOT NULL,
  unit_kerja VARCHAR(255) NOT NULL,
  nip VARCHAR(50) NULL,
  provinsi ENUM('Jawa Tengah', 'Luar Jawa Tengah') NOT NULL,
  kabupaten_kota VARCHAR(100) NOT NULL,
  tanggal_lahir DATE NULL,
  nomor_hp VARCHAR(20) NOT NULL,
  pangkat_golongan VARCHAR(100) NULL,
  jabatan VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  signature_url VARCHAR(500) NOT NULL COMMENT 'URL/Link to electronic signature',
  urutan_absensi INT NOT NULL COMMENT 'Order of attendance submission',
  nomor_sertifikat VARCHAR(100) NULL COMMENT 'Auto-generated certificate number',
  status ENUM('menunggu_sertifikat', 'sertifikat_terkirim') DEFAULT 'menunggu_sertifikat',
  certificate_path VARCHAR(255) NULL,
  sent_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_attendance (event_id, email),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id),
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_urutan (event_id, urutan_absensi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: certificate_config
CREATE TABLE IF NOT EXISTS certificate_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  format_nomor JSON NOT NULL COMMENT 'Certificate number format configuration',
  template_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  INDEX idx_event_id (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: kabupaten_kota (reference data)
CREATE TABLE IF NOT EXISTS kabupaten_kota (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  tipe ENUM('kabupaten', 'kota') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Kabupaten/Kota data
INSERT INTO kabupaten_kota (nama, tipe) VALUES
('Banjarnegara', 'kabupaten'),
('Banyumas', 'kabupaten'),
('Batang', 'kabupaten'),
('Blora', 'kabupaten'),
('Boyolali', 'kabupaten'),
('Brebes', 'kabupaten'),
('Cilacap', 'kabupaten'),
('Demak', 'kabupaten'),
('Grobogan', 'kabupaten'),
('Jepara', 'kabupaten'),
('Karanganyar', 'kabupaten'),
('Kebumen', 'kabupaten'),
('Kendal', 'kabupaten'),
('Klaten', 'kabupaten'),
('Kudus', 'kabupaten'),
('Magelang', 'kabupaten'),
('Pati', 'kabupaten'),
('Pekalongan', 'kabupaten'),
('Pemalang', 'kabupaten'),
('Purbalingga', 'kabupaten'),
('Purworejo', 'kabupaten'),
('Rembang', 'kabupaten'),
('Semarang', 'kabupaten'),
('Sragen', 'kabupaten'),
('Sukoharjo', 'kabupaten'),
('Tegal', 'kabupaten'),
('Temanggung', 'kabupaten'),
('Wonogiri', 'kabupaten'),
('Wonosobo', 'kabupaten'),
('Magelang', 'kota'),
('Pekalongan', 'kota'),
('Salatiga', 'kota'),
('Semarang', 'kota'),
('Surakarta', 'kota'),
('Tegal', 'kota');

-- Table: certificate_templates (reusable certificate backgrounds)
CREATE TABLE IF NOT EXISTS certificate_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_path VARCHAR(500) NOT NULL,
  thumbnail_path VARCHAR(500) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: kop_surat (Letterhead configuration based on active period)
CREATE TABLE IF NOT EXISTS kop_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_data VARCHAR(255) NOT NULL COMMENT 'Nama instansi/unit, contoh: BBPMP Provinsi Jawa Tengah',
  periode_mulai DATE NOT NULL COMMENT 'Tanggal mulai berlaku kop',
  periode_selesai DATE NOT NULL COMMENT 'Tanggal akhir berlaku kop',
  kop_url VARCHAR(500) NOT NULL COMMENT 'Path atau URL gambar kop surat',
  jenis_ttd ENUM('QR', 'BASAH') DEFAULT 'QR' COMMENT 'Jenis tanda tangan yang digunakan',
  is_active BOOLEAN DEFAULT TRUE COMMENT 'Status aktif kop',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_periode (periode_mulai, periode_selesai),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Note: Run 'npm run create-admin' to create the default admin user
