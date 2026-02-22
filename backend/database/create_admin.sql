-- ============================================
-- Fix: Create admin table & default admin user
-- Database: Presensi (matching .env DB_NAME)
-- ============================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS Presensi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Presensi;

-- Create admin table
CREATE TABLE IF NOT EXISTS admin (
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

-- Insert default admin (password: admin123)
-- Valid bcrypt hash of 'admin123' with 10 salt rounds
INSERT INTO admin (username, email, password, full_name)
VALUES (
  'admin',
  'admin@kpbbpmp.com',
  '$2a$10$NY6eRmrH8o31gxv4PlC7Pux.7YLk8QD6nwgT2FRhljDyGqXXalUgu',
  'Administrator'
)
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  password = VALUES(password);

-- ============================================
-- NOTE: The hashed password above is a placeholder.
-- After running this SQL, run the Node.js script 
-- to set the correct bcrypt password:
--
--   cd backend
--   node scripts/createAdmin.js
--
-- Default credentials after running the script:
--   Username: admin
--   Password: admin123
-- ============================================
