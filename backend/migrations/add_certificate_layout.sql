-- Migration: Add certificate_layout column to events table
-- This allows storing custom certificate layouts created in the editor

USE kp_bbpmp_db;

-- Add certificate_layout column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS certificate_layout JSON NULL COMMENT 'Custom certificate layout configuration' 
AFTER template_sertifikat;

-- Add template_id column if it doesn't exist (for template library)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS template_id INT NULL COMMENT 'Reference to certificate_templates table'
AFTER template_sertifikat;

-- Add template_source column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS template_source ENUM('upload', 'template') DEFAULT 'upload' COMMENT 'Source of certificate template'
AFTER template_id;

-- Add index for template_id
ALTER TABLE events
ADD INDEX IF NOT EXISTS idx_template_id (template_id);
