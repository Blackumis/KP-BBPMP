import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
dotenv.config();

// Resolve __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure directory exists
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Upload directories
const UPLOADS_DIR = path.join(__dirname, "uploads");
ensureDir(UPLOADS_DIR);
["templates", "signatures", "kop-surat", "pejabat/signatures", "pejabat/qrcode"].forEach((folder) => ensureDir(path.join(UPLOADS_DIR, folder)));

// Download directories
const DOWNLOADS_DIR = path.join(__dirname, "downloads");
ensureDir(DOWNLOADS_DIR);
["certificates", "reports"].forEach((folder) => ensureDir(path.join(DOWNLOADS_DIR, folder)));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Enable security headers
app.use(helmet());

// Enable compression
app.use(compression());

// Configure CORS
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? true : ["http://localhost:5173", "http://localhost:2000", "http://localhost:3000"],
    credentials: true,
  }),
);

// Parse JSON body
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded body
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to API
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        success: false,
        message: "Too many requests, please try again later.",
      });
    },
  }),
);

// Serve downloadable files
app.use("/downloads", express.static(DOWNLOADS_DIR));

// Import API routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import referenceRoutes from "./routes/referenceRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import kopSuratRoutes from "./routes/kopSuratRoutes.js";
import officialRoutes from "./routes/officialRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/kop-surat", kopSuratRoutes);
app.use("/api/settings", settingsRoutes);

// API health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK" });
});

// Serve frontend build
app.use(express.static(path.join(__dirname, "../frontend/dist")));

// Read index.html for SPA
const indexPath = path.join(__dirname, "public", "index.html");
let indexHtmlTemplate = null;

try {
  indexHtmlTemplate = fs.readFileSync(indexPath, "utf8");
} catch (err) {
  console.error("Failed to load index.html:", err);
}

// SPA fallback route
app.get("*", (_req, res) => {
  if (!indexHtmlTemplate) {
    return res.status(500).send("index.html not available");
  }
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(indexHtmlTemplate);
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
