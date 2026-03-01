import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'bbpmp_presensi',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  connectTimeout: 10000,
};

console.log(`[DB] Connecting to ${dbConfig.host}:${dbConfig.port} database=${dbConfig.database} user=${dbConfig.user}`);

const pool = mysql.createPool(dbConfig);

// Validate connection on startup
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    console.log('[DB] ✓ Database connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('[DB] ✗ Database connection FAILED:', error.code, error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('[DB]   → MySQL server is not running or not accessible at', dbConfig.host + ':' + dbConfig.port);
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('[DB]   → Invalid credentials. Check DB_USER and DB_PASSWORD in .env');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('[DB]   → Database "' + dbConfig.database + '" does not exist. Run the setup SQL script.');
    }
    return false;
  }
}

export default pool;
