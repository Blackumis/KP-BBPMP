-- Migration: Add certificate_templates table
-- This table stores reusable certificate background templates

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

-- Add template_id column to events table for linking to stored templates
ALTER TABLE events 
ADD COLUMN template_id INT NULL AFTER template_sertifikat,
ADD COLUMN template_source ENUM('upload', 'template') DEFAULT 'upload' AFTER template_id,
ADD FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL;
