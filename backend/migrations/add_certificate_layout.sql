-- Migration: Add certificate_layout and related columns to events table
-- This allows storing custom certificate layouts created in the editor
-- 
-- NOTE: This SQL file uses stored procedures for MySQL 5.7 compatibility.
-- For programmatic migrations, use runCertificateColumnsMigration.js instead.
-- The main runMigrations.js uses JavaScript-based approach which is more reliable.

USE kp_bbpmp_db;

-- Simple approach for MySQL 8.0.28+ (uses IF NOT EXISTS)
-- For older MySQL versions, use the JavaScript migration instead.

-- These statements will fail on older MySQL but work on 8.0.28+
-- Use runMigrations.js or runCertificateColumnsMigration.js for full compatibility

-- Manual migration commands (run individually if needed):
-- ALTER TABLE events ADD COLUMN template_id INT NULL AFTER template_sertifikat;
-- ALTER TABLE events ADD COLUMN template_source ENUM('upload', 'template') DEFAULT 'upload' AFTER template_id;
-- ALTER TABLE events ADD COLUMN certificate_layout JSON NULL AFTER template_source;
-- ALTER TABLE events ADD INDEX idx_template_id (template_id);
