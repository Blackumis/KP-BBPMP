-- Table for storing signing officials data
-- This table stores information about officials who sign certificates

CREATE TABLE IF NOT EXISTS officials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  signature_image_path VARCHAR(500) NULL COMMENT 'Path to signature image file',
  signature_qr_path VARCHAR(500) NULL COMMENT 'Path to generated QR code from signature',
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE CASCADE,
  INDEX idx_name (name),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add official_id to events table to link events with signing officials
ALTER TABLE events 
ADD COLUMN official_id INT NULL COMMENT 'ID of signing official for this event',
ADD FOREIGN KEY (official_id) REFERENCES officials(id) ON DELETE SET NULL;
