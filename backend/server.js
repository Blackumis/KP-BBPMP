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

