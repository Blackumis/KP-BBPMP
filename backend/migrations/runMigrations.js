import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper to safely add a column if it doesn't exist
async function addColumnIfNotExists(connection, tableName, columnName, definition, after) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM information_schema.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = ? 
     AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  if (rows[0].count === 0) {
    const afterClause = after ? ` AFTER ${after}` : '';
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}${afterClause}`);
    return true;
  }
  return false;
}

// Helper to safely add an index if it doesn't exist
async function addIndexIfNotExists(connection, tableName, indexName, columns) {
  const [rows] = await connection.query(
    `SELECT COUNT(*) as count FROM information_schema.STATISTICS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = ? 
     AND INDEX_NAME = ?`,
    [tableName, indexName]
  );

  if (rows[0].count === 0) {
    await connection.query(`ALTER TABLE ${tableName} ADD INDEX ${indexName} (${columns})`);
    return true;
  }
  return false;
}

async function runMigrations() {
  let connection;
  
  try {
    // Create connection without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('Connected to MySQL server');

    // Read and execute schema
    const schemaPath = join(__dirname, '../database/schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    console.log('Running main schema...');
    await connection.query(schema);
    
    console.log('✓ Database schema created successfully');
    console.log('✓ Tables created successfully');
    console.log('✓ Kabupaten/Kota data inserted');

    // Run SQL migrations (for certificate_templates table)
    console.log('\nRunning SQL migrations...');
    const sqlMigrations = ['add_certificate_templates.sql'];
    
    for (const migrationFile of sqlMigrations) {
      const migrationPath = join(__dirname, migrationFile);
      if (existsSync(migrationPath)) {
        try {
          const migrationSql = readFileSync(migrationPath, 'utf8');
          await connection.query(migrationSql);
          console.log(`✓ ${migrationFile} executed successfully`);
        } catch (migrationError) {
          if (migrationError.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log(`⚠ ${migrationFile} - already applied (skipping)`);
          } else {
            throw migrationError;
          }
        }
      }
    }

    // Run JavaScript-based column migrations (safer for MySQL 5.7+)
    console.log('\nRunning column migrations...');
    
    const columnsToAdd = [
      { name: 'template_id', definition: 'INT NULL', after: 'template_sertifikat' },
      { name: 'template_source', definition: "ENUM('upload', 'template') DEFAULT 'upload'", after: 'template_id' },
      { name: 'certificate_layout', definition: 'JSON NULL', after: 'template_source' }
    ];

    for (const col of columnsToAdd) {
      const added = await addColumnIfNotExists(connection, 'events', col.name, col.definition, col.after);
      console.log(added ? `✓ Added column: events.${col.name}` : `⚠ Column already exists: events.${col.name}`);
    }

    // Add index
    const indexAdded = await addIndexIfNotExists(connection, 'events', 'idx_template_id', 'template_id');
    console.log(indexAdded ? '✓ Added index: idx_template_id' : '⚠ Index already exists: idx_template_id');

    // Create default admin
    console.log('\nCreating default admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await connection.query(
      `INSERT INTO admins (username, email, password, full_name) 
       VALUES ('admin', 'admin@kpbbpmp.com', ?, 'Administrator')
       ON DUPLICATE KEY UPDATE password = ?, email = 'admin@kpbbpmp.com'`,
      [hashedPassword, hashedPassword]
    );
    console.log('✓ Default admin created (username: admin, password: admin123)');
    console.log('\n⚠️  Please change the default password after first login!');
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigrations();
