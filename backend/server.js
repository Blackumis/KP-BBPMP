import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

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

// Simple Queue (no Redis needed!)
import { certificateQueue, emailQueue } from "./config/simpleQueue.js";
// Import workers to start processing
import "./workers/certificateWorker.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
app.use(
  compression({
    filter: (req, res) => {
      // Don't compress PDF or binary file downloads
      const contentType = res.getHeader("Content-Type");
      if (contentType && (contentType.includes("application/pdf") || contentType.includes("application/octet-stream"))) {
        return false;
      }
      // Fall back to default filter
      return compression.filter(req, res);
    },
  }),
);

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
app.get("/api/queue/stats", (req, res) => {
  res.json({
    certificate: certificateQueue.getStats(),
    email: emailQueue.getStats(),
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

// Health check

app.get('/test-db', async (req, res) => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const [rows] = await connection.execute('SELECT NOW() as waktu');
    await connection.end();

    res.json({
      status: "SUCCESS",
      message: "Database connected!",
      server_time: rows[0].waktu
    });

  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
      code: error.code
    });
  }
});

// === FRONTEND STATIC ===
const frontendPath = path.join(__dirname, "../frontend/dist");

// Serve static files (JS, CSS, assets)
app.use(express.static(frontendPath));

// SPA fallback (React/Vite router support)
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Error handler (API only)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`Production server running on port ${PORT}`);
});
