import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

    console.log('Running migrations...');
    await connection.query(schema);
    
    console.log('✓ Database schema created successfully');
    console.log('✓ Tables created successfully');
    console.log('✓ Kabupaten/Kota data inserted');

    // Create default admin
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
