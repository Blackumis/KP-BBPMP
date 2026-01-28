import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Routes
import authRoutes from "./routes/authRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import referenceRoutes from "./routes/referenceRoutes.js";
import templateRoutes from "./routes/templateRoutes.js";
import kopSuratRoutes from "./routes/kopSuratRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(compression());

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
    max: 100,
  }),
);

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/certificates", express.static(path.join(__dirname, "certificates")));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/officials", officialRoutes);
app.use("/api/kop-surat", kopSuratRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK" });
});

// === FRONTEND STATIC ===
app.use(express.static(path.join(__dirname, "public")));

// Read index.html template once and reuse (fast and simple)
const indexPath = path.join(__dirname, "public", "index.html");
let indexHtmlTemplate = null;
try {
  indexHtmlTemplate = fs.readFileSync(indexPath, "utf8");
} catch (err) {
  console.error("Could not read index.html template:", err);
  indexHtmlTemplate = null;
}

function sendIndex(res) {
  if (!indexHtmlTemplate) {
    return res.status(500).send("index.html not available");
  }

  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(indexHtmlTemplate);
}

// SPA fallback: serve index.html for any non-API route so the client-side router handles navigation
app.get("*", (req, res) => {
  sendIndex(res);
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
