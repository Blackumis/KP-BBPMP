-- Migration: Add officials table
-- This table stores officials/pejabat who sign certificates

USE kp_bbpmp_db;

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

-- Note: Column official_id for events table is added via runMigrations.js
