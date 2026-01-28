import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'kp_bbpmp_db'
    });

    console.log('Connected to database');

    // Check and add columns one by one
    const columnsToAdd = [
      {
        name: 'template_id',
        definition: 'INT NULL COMMENT "Reference to certificate_templates table"',
        after: 'template_sertifikat'
      },
      {
        name: 'template_source',
        definition: 'ENUM("upload", "template") DEFAULT "upload" COMMENT "Source of certificate template"',
        after: 'template_id'
      },
      {
        name: 'certificate_layout',
        definition: 'JSON NULL COMMENT "Custom certificate layout configuration"',
        after: 'template_source'
      }
    ];

    for (const col of columnsToAdd) {
      // Check if column exists
      const [rows] = await connection.query(
        `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() 
         AND TABLE_NAME = 'events' 
         AND COLUMN_NAME = ?`,
        [col.name]
      );

      if (rows[0].count === 0) {
        await connection.query(
          `ALTER TABLE events ADD COLUMN ${col.name} ${col.definition} AFTER ${col.after}`
        );
        console.log(`✓ Added column: ${col.name}`);
      } else {
        console.log(`⚠ Column already exists: ${col.name}`);
      }
    }

    // Check and add index
    const [indexRows] = await connection.query(
      `SELECT COUNT(*) as count FROM information_schema.STATISTICS 
       WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'events' 
       AND INDEX_NAME = 'idx_template_id'`
    );

    if (indexRows[0].count === 0) {
      await connection.query('ALTER TABLE events ADD INDEX idx_template_id (template_id)');
      console.log('✓ Added index: idx_template_id');
    } else {
      console.log('⚠ Index already exists: idx_template_id');
    }

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
