import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTemplateMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kp_bbpmp_db',
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Create certificate_templates table
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ certificate_templates table created');

    // Add template_id column to events table if not exist
    try {
      await connection.query(`ALTER TABLE events ADD COLUMN template_id INT NULL AFTER template_sertifikat`);
      console.log('✓ template_id column added to events table');
    } catch(e) { 
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      console.log('→ template_id column already exists');
    }

    // Add template_source column to events table if not exist
    try {
      await connection.query(`ALTER TABLE events ADD COLUMN template_source ENUM('upload', 'template') DEFAULT 'upload' AFTER template_id`);
      console.log('✓ template_source column added to events table');
    } catch(e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e;
      console.log('→ template_source column already exists');
    }

    // Add foreign key constraint
    try {
      await connection.query(`ALTER TABLE events ADD CONSTRAINT fk_events_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL`);
      console.log('✓ Foreign key constraint added');
    } catch(e) {
      if (e.code === 'ER_DUP_KEYNAME' || e.code === 'ER_FK_DUP_NAME') {
        console.log('→ Foreign key constraint already exists');
      } else {
        console.log('→ Foreign key note:', e.message);
      }
    }

    console.log('\n✓ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runTemplateMigration();
