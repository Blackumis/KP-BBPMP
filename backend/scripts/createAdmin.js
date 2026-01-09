import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function createDefaultAdmin() {
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

    // Generate password hash for 'admin123'
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if admin exists
    const [existing] = await connection.query(
      'SELECT id FROM admins WHERE username = ?',
      ['admin']
    );

    if (existing.length > 0) {
      // Update existing admin
      await connection.query(
        'UPDATE admins SET password = ?, email = ?, full_name = ? WHERE username = ?',
        [hashedPassword, 'admin@kpbbpmp.com', 'Administrator', 'admin']
      );
      console.log('✓ Default admin updated');
    } else {
      // Insert new admin
      await connection.query(
        'INSERT INTO admins (username, email, password, full_name) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@kpbbpmp.com', hashedPassword, 'Administrator']
      );
      console.log('✓ Default admin created');
    }

    console.log('\nDefault Admin Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

createDefaultAdmin();
