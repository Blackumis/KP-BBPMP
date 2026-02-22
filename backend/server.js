import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Ensure .env is loaded from backend directory regardless of cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import referenceRoutes from "./routes/referenceRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import kopSuratRoutes from "./routes/kopSuratRoutes.js";
import officialRoutes from "./routes/officialRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Database connection tester
import { testConnection } from "./config/database.js";

// Simple Queue (no Redis needed!)
import { certificateQueue, emailQueue } from './config/simpleQueue.js';
// Import workers to start processing
import './workers/certificateWorker.js';

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const UPLOADS_DIR = path.join(__dirname, "uploads");

["templates", "signatures", "kop-surat", "pejabat/signatures", "pejabat/qrcode"].forEach((folder) => {
  ensureDir(path.join(UPLOADS_DIR, folder));
});

const app = express();
const PORT = process.env.PORT || 3000;

// Security - skip compression for binary/PDF responses to prevent corruption
app.use(compression({
  filter: (req, res) => {
    // Don't compress PDF or binary file downloads
    const contentType = res.getHeader('Content-Type');
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
      return false;
    }
    // Fall back to default filter
    return compression.filter(req, res);
  }
}));

// CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? true : ["http://localhost:5173", "http://localhost:2000", "http://localhost:3000"],
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Rate limit API
app.use(
  "/api/",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    },
  }),
);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

// Queue monitoring endpoint
app.get('/api/queue/stats', (req, res) => {
  res.json({
    certificate: certificateQueue.getStats(),
    email: emailQueue.getStats()
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/kop-surat", kopSuratRoutes);
app.use("/api/settings", settingsRoutes);

// Health check with DB status
app.get("/api/health", async (req, res) => {
  const dbOk = await testConnection();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? "OK" : "DEGRADED",
    database: dbOk ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Version marker - proves which code is deployed
app.get("/api/version", (req, res) => {
  res.json({ version: "v7", deployedAt: new Date().toISOString() });
});

// Database migration - adds missing columns to existing tables
// Visit: /api/migrate?secret=MIGRATE_SECRET_2026
app.get("/api/migrate", async (req, res) => {
  if (req.query.secret !== "MIGRATE_SECRET_2026") {
    return res.status(403).json({ error: "Invalid secret" });
  }

  const results = { migrations: [], errors: [] };

  try {
    const pool = (await import('./config/database.js')).default;

    // Define expected columns for each table
    const migrations = [
      {
        table: "kegiatan",
        column: "mulai_waktu_absensi",
        definition: "DATETIME NULL COMMENT 'Start time for attendance' AFTER jam_selesai",
      },
      // Add more migrations here as needed
    ];

    for (const m of migrations) {
      try {
        // Check if column exists
        const [cols] = await pool.query(`SHOW COLUMNS FROM \`${m.table}\` LIKE ?`, [m.column]);
        
        if (cols.length === 0) {
          // Column doesn't exist - add it
          await pool.query(`ALTER TABLE \`${m.table}\` ADD COLUMN \`${m.column}\` ${m.definition}`);
          results.migrations.push({ table: m.table, column: m.column, status: "ADDED" });
        } else {
          results.migrations.push({ table: m.table, column: m.column, status: "EXISTS" });
        }
      } catch (err) {
        results.errors.push({ table: m.table, column: m.column, error: err.message });
      }
    }

    res.json({ success: results.errors.length === 0, ...results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, ...results });
  }
});

// Test event INSERT — diagnoses exact SQL errors when creating kegiatan
// Now uses dynamic column detection (same as the real controller)
app.get("/api/test-event-insert", async (req, res) => {
  const results = { steps: [] };
  try {
    const pool = (await import('./config/database.js')).default;
    results.steps.push("pool_imported");

    // Check kegiatan table columns first
    const [cols] = await pool.query("SHOW COLUMNS FROM kegiatan");
    const columnNames = cols.map(c => c.Field);
    results.kegiatanColumns = columnNames;
    results.steps.push("columns_checked");
    
    // Check which optional columns exist
    const hasMulaiWaktuAbsensi = columnNames.includes("mulai_waktu_absensi");
    results.hasMulaiWaktuAbsensi = hasMulaiWaktuAbsensi;

    // Check if admin exists (needed for created_by)
    const [[admin]] = await pool.query("SELECT id FROM admin LIMIT 1");
    if (!admin) {
      return res.json({ ...results, error: "No admin user found for created_by FK" });
    }
    results.adminId = admin.id;
    results.steps.push("admin_found");

    // Build INSERT dynamically based on available columns
    const columns = [
      "nama_kegiatan", "nomor_surat", "tanggal_mulai", "tanggal_selesai",
      "jam_mulai", "jam_selesai"
    ];
    const values = [
      "TEST_EVENT_" + Date.now(),
      "TEST_SURAT_" + Date.now(),
      "2026-01-01",
      "2026-01-02",
      "08:00:00",
      "17:00:00"
    ];

    // Optional column: mulai_waktu_absensi
    if (hasMulaiWaktuAbsensi) {
      columns.push("mulai_waktu_absensi");
      values.push(null);
    }

    // Required columns
    columns.push(
      "batas_waktu_absensi", "template_sertifikat", "certificate_layout",
      "template_id", "template_source", "form_config", "official_id", "created_by", "status"
    );
    values.push(
      "2026-01-02 17:00:00", null, null, null, "upload", "{}", null, admin.id, "draft"
    );

    const placeholders = columns.map(() => "?").join(", ");
    const sql = `INSERT INTO kegiatan (${columns.join(", ")}) VALUES (${placeholders})`;
    results.generatedSQL = sql;

    const [insertResult] = await pool.query(sql, values);
    results.steps.push("insert_success");
    results.insertedId = insertResult.insertId;

    // Clean up test data
    await pool.query("DELETE FROM kegiatan WHERE id = ?", [insertResult.insertId]);
    results.steps.push("cleanup_done");

    res.json({ success: true, ...results, verdict: "INSERT_WORKS" });
  } catch (err) {
    res.json({
      success: false,
      ...results,
      error: {
        code: err.code,
        errno: err.errno,
        sqlState: err.sqlState,
        sqlMessage: err.sqlMessage,
        message: err.message,
      },
      verdict: "INSERT_FAILED"
    });
  }
});

// ONE-TIME admin password reset - removes itself after use
// Visit: /api/reset-admin?secret=RESET_SECRET_2026
app.get("/api/reset-admin", async (req, res) => {
  if (req.query.secret !== "RESET_SECRET_2026") {
    return res.status(403).json({ error: "Invalid secret" });
  }
  try {
    const bcrypt = (await import('bcryptjs')).default;
    const pool = (await import('./config/database.js')).default;
    const newHash = await bcrypt.hash('admin123', 10);
    const [result] = await pool.query(
      'UPDATE admin SET password = ? WHERE username = ?',
      [newHash, 'admin']
    );
    res.json({
      success: true,
      message: "Admin password reset to 'admin123'",
      rowsUpdated: result.affectedRows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct login test - bypasses frontend, tests exact login flow
app.get("/api/login-test", async (req, res) => {
  const results = { steps: [] };
  try {
    results.steps.push("1_import_pool");
    const pool = (await import('./config/database.js')).default;

    results.steps.push("2_query_admin");
    const [admins] = await pool.query('SELECT id, username, LENGTH(password) as pl FROM admin WHERE username = ?', ['admin']);
    results.adminFound = admins.length > 0;
    if (admins.length === 0) return res.json({ ...results, error: "admin not found" });

    results.passwordHashLength = admins[0].pl;
    results.steps.push("3_bcrypt_compare");

    const bcrypt = (await import('bcryptjs')).default;
    const match = await bcrypt.compare('admin123', admins[0].password || '');
    results.passwordMatch_admin123 = match;
    results.steps.push("4_jwt_sign");

    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign({ id: 1, isAdmin: true }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
    results.jwtOk = true;
    results.tokenLength = token.length;
    results.steps.push("5_complete");

    res.json({ ...results, verdict: match ? "LOGIN_SHOULD_WORK" : "WRONG_PASSWORD_HASH" });
  } catch (err) {
    res.json({ ...results, error: { code: err.code, message: err.message, stack: err.stack?.split('\n').slice(0, 4) } });
  }
});

// Diagnostic endpoint - check DB, tables, admin user, JWT config
app.get("/api/diagnose", async (req, res) => {
  const results = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV || "(not set)",
      PORT: process.env.PORT || "(not set)",
      HAS_MYSQL_URL: !!process.env.MYSQL_URL,
      HAS_DB_HOST: !!process.env.DB_HOST,
      HAS_JWT_SECRET: !!process.env.JWT_SECRET,
      JWT_SECRET_LENGTH: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
      HAS_JWT_EXPIRES_IN: !!process.env.JWT_EXPIRES_IN,
    },
    database: { connected: false },
    tables: {},
    adminUser: { exists: false },
  };

  try {
    const pool = (await import('./config/database.js')).default;

    // Test connection
    const conn = await pool.getConnection();
    await conn.ping();
    results.database.connected = true;

    // Check which database we're connected to
    const [dbResult] = await conn.query('SELECT DATABASE() as db');
    results.database.name = dbResult[0].db;

    // Check tables exist
    const [tables] = await conn.query('SHOW TABLES');
    results.tables.list = tables.map(t => Object.values(t)[0]);

    // Check admin table
    if (results.tables.list.includes('admin')) {
      const [admins] = await conn.query('SELECT id, username, email, LENGTH(password) as pwd_length FROM admin');
      results.adminUser.exists = admins.length > 0;
      results.adminUser.count = admins.length;
      results.adminUser.rows = admins.map(a => ({
        id: a.id,
        username: a.username,
        email: a.email,
        passwordHashLength: a.pwd_length,
      }));
    } else {
      results.adminUser.error = "admin table does not exist!";
    }

    // Test JWT signing
    try {
      const jwt = (await import('jsonwebtoken')).default;
      const testToken = jwt.sign({ test: true }, process.env.JWT_SECRET, { expiresIn: '1m' });
      results.jwt = { canSign: true, tokenLength: testToken.length };
    } catch (jwtErr) {
      results.jwt = { canSign: false, error: jwtErr.message };
    }

    // Simulate full login flow with 'admin123' password
    try {
      const bcrypt = (await import('bcryptjs')).default;
      const jwt = (await import('jsonwebtoken')).default;

      const [admins] = await conn.query(
        'SELECT * FROM admin WHERE username = ?', ['admin']
      );

      if (admins.length === 0) {
        results.loginSimulation = { step: 'query', error: 'admin user not found' };
      } else {
        const admin = admins[0];
        results.loginSimulation = { step: 'bcrypt_compare', adminId: admin.id };

        let pwdMatch = false;
        try {
          pwdMatch = await bcrypt.compare('admin123', admin.password);
          results.loginSimulation.passwordMatch = pwdMatch;
          results.loginSimulation.step = 'jwt_sign';
        } catch (bcryptErr) {
          results.loginSimulation.bcryptError = bcryptErr.message;
        }

        if (pwdMatch) {
          try {
            const token = jwt.sign(
              { id: admin.id, username: admin.username, isAdmin: true },
              process.env.JWT_SECRET,
              { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
            );
            results.loginSimulation.step = 'complete';
            results.loginSimulation.jwtGenerated = true;
            results.loginSimulation.tokenLength = token.length;
          } catch (jwtSignErr) {
            results.loginSimulation.jwtError = jwtSignErr.message;
          }
        }
      }
    } catch (simErr) {
      results.loginSimulation = { error: simErr.code || simErr.message };
    }

    conn.release();
  } catch (error) {
    results.database.error = { code: error.code, message: error.message };
  }

  res.json(results);
});

// DB table inspection — checks template_sertif, pejabat, kegiatan column structure
app.get("/api/db-tables", async (req, res) => {
  try {
    const pool = (await import('./config/database.js')).default;
    const results = {};

    const tablesToCheck = ['admin', 'pejabat', 'template_sertif', 'kegiatan', 'presensi', 'kabupaten_kota', 'kop_surat'];

    for (const table of tablesToCheck) {
      try {
        const [cols] = await pool.query(`SHOW COLUMNS FROM \`${table}\``);
        results[table] = { exists: true, columns: cols.map(c => c.Field) };
      } catch (e) {
        results[table] = { exists: false, error: e.message };
      }
    }

    // Count rows in key tables
    for (const table of ['pejabat', 'template_sertif', 'kegiatan', 'admin']) {
      if (results[table]?.exists) {
        try {
          const [[row]] = await pool.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
          results[table].rowCount = row.cnt;
        } catch (e) {
          results[table].rowCountError = e.message;
        }
      }
    }

    res.json({ success: true, tables: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// === FRONTEND STATIC ===
// Serve static assets with long cache (CSS/JS files are fingerprinted by Vite)
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    // Never cache index.html so updates are picked up immediately
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// SPA fallback: serve index.html for navigation requests only (not for static assets)
const indexPath = path.join(__dirname, "public", "index.html");

app.get("*", (req, res) => {
  // If the request looks like a static file (has a file extension), return 404
  // This prevents serving index.html with wrong MIME type for missing assets
  if (path.extname(req.path)) {
    return res.status(404).send("Not found");
  }

  try {
    const html = fs.readFileSync(indexPath, "utf8");
    res.set("Content-Type", "text/html; charset=utf-8");
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.send(html);
  } catch (err) {
    console.error("Could not read index.html:", err.message);
    res.status(500).send("index.html not available");
  }
});

// Error handler (API only)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errorCode: err.code || null,
    errorSource: "global_handler",
    stack: err.stack?.split('\n').slice(0, 6),
  });
});

app.listen(PORT, async () => {
  console.log(`Production server running on port ${PORT}`);
  // Validate DB connection on startup
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('\n========================================');
    console.error('WARNING: Database connection failed!');
    console.error('The server is running but login/API will fail.');
    console.error('Please check your .env DB_* settings and ensure MySQL is running.');
    console.error('========================================\n');
  }
});

