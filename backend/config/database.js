import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure .env is loaded from the backend directory, regardless of where node was started
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '..', '.env');
dotenv.config({ path: envPath });

console.log('[DB] Loaded .env from:', envPath);

// Railway provides MYSQL_URL as a single connection string
// Fall back to individual DB_* variables for local development
const MYSQL_URL = process.env.MYSQL_URL || process.env.DATABASE_URL;

let dbConfig;

if (MYSQL_URL) {
  console.log('[DB] Using MYSQL_URL connection string (Railway)');
  const url = new URL(MYSQL_URL);
  dbConfig = {
    host: url.hostname,
    port: parseInt(url.port, 10) || 3306,
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    connectTimeout: 10000,
  };
} else {
  console.log('[DB] Using individual DB_* env variables (local)');
  dbConfig = {
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
}

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
