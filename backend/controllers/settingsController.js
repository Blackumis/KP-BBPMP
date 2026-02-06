import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to settings file (stored in config folder)
const SETTINGS_FILE = path.join(__dirname, "..", "config", "smtp-settings.json");

// Default SMTP settings
const defaultSettings = {
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  fromName: "BBPMP",
};

// Helper to read settings
const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, "utf8");
      return { ...defaultSettings, ...JSON.parse(data) };
    }
  } catch (err) {
    console.error("Error reading SMTP settings:", err);
  }
  return defaultSettings;
};

// Helper to write settings
const writeSettings = (settings) => {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2));
    return true;
  } catch (err) {
    console.error("Error writing SMTP settings:", err);
    return false;
  }
};

// Get SMTP settings (mask password)
export const getSmtpSettings = async (req, res) => {
  try {
    const settings = readSettings();
    
    // Mask the password for security
    const maskedSettings = {
      ...settings,
      password: settings.password ? "********" : "",
      hasPassword: !!settings.password,
    };
    
    res.json({
      success: true,
      data: maskedSettings,
    });
  } catch (error) {
    console.error("Error getting SMTP settings:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil pengaturan SMTP",
    });
  }
};

// Update SMTP settings
export const updateSmtpSettings = async (req, res) => {
  try {
    const { host, port, secure, user, password, fromName } = req.body;
    
    // Get current settings
    const currentSettings = readSettings();
    
    // Build updated settings
    const newSettings = {
      host: host || currentSettings.host,
      port: parseInt(port) || currentSettings.port,
      secure: secure !== undefined ? secure : currentSettings.secure,
      user: user || currentSettings.user,
      fromName: fromName || currentSettings.fromName,
      // Only update password if a new one is provided (not masked)
      password: password && password !== "********" ? password : currentSettings.password,
    };
    
    if (!writeSettings(newSettings)) {
      return res.status(500).json({
        success: false,
        message: "Gagal menyimpan pengaturan SMTP",
      });
    }
    
    // Return masked settings
    res.json({
      success: true,
      message: "Pengaturan SMTP berhasil disimpan",
      data: {
        ...newSettings,
        password: newSettings.password ? "********" : "",
        hasPassword: !!newSettings.password,
      },
    });
  } catch (error) {
    console.error("Error updating SMTP settings:", error);
    res.status(500).json({
      success: false,
      message: "Gagal menyimpan pengaturan SMTP",
    });
  }
};

// Test SMTP connection
export const testSmtpConnection = async (req, res) => {
  try {
    const { host, port, secure, user, password, testEmail } = req.body;
    
    // Get current settings if needed
    const currentSettings = readSettings();
    
    // Use provided values or fall back to saved settings
    const smtpConfig = {
      host: host || currentSettings.host,
      port: parseInt(port) || currentSettings.port,
      secure: secure !== undefined ? secure : currentSettings.secure,
      auth: {
        user: user || currentSettings.user,
        pass: password && password !== "********" ? password : currentSettings.password,
      },
    };
    
    if (!smtpConfig.host || !smtpConfig.auth.user || !smtpConfig.auth.pass) {
      return res.status(400).json({
        success: false,
        message: "Konfigurasi SMTP tidak lengkap",
      });
    }
    
    // Create transporter
    const transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection
    await transporter.verify();
    
    // If testEmail provided, send a test email
    if (testEmail) {
      await transporter.sendMail({
        from: `"${currentSettings.fromName || 'BBPMP'}" <${smtpConfig.auth.user}>`,
        to: testEmail,
        subject: "Test Email - BBPMP SMTP",
        html: `
          <h2>Test Email Berhasil!</h2>
          <p>Jika Anda menerima email ini, berarti konfigurasi SMTP sudah benar.</p>
          <p>Waktu: ${new Date().toLocaleString("id-ID")}</p>
        `,
      });
      
      return res.json({
        success: true,
        message: `Koneksi berhasil dan email test terkirim ke ${testEmail}`,
      });
    }
    
    res.json({
      success: true,
      message: "Koneksi SMTP berhasil",
    });
  } catch (error) {
    console.error("SMTP test error:", error);
    res.status(400).json({
      success: false,
      message: `Koneksi SMTP gagal: ${error.message}`,
    });
  }
};
