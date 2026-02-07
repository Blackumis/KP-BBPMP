import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to SMTP settings file
const SMTP_SETTINGS_FILE = path.join(__dirname, '..', 'config', 'smtp-settings.json');

// Email sending enabled/disabled flag
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';

// Read SMTP settings from JSON file, fallback to env vars
const getSmtpSettings = () => {
  try {
    if (fs.existsSync(SMTP_SETTINGS_FILE)) {
      const data = fs.readFileSync(SMTP_SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(data);
      // Only use file settings if they have required fields
      if (settings.host && settings.user && settings.password) {
        return {
          host: settings.host,
          port: settings.port || 587,
          secure: settings.secure || false,
          user: settings.user,
          password: settings.password,
          fromName: settings.fromName || 'BBPMP'
        };
      }
    }
  } catch (err) {
    console.error('Error reading SMTP settings file:', err.message);
  }
  
  // Fallback to environment variables
  return {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || 'BBPMP'
  };
};

// Create transporter with current settings (creates fresh instance each time to pick up config changes)
const createTransporter = () => {
  const settings = getSmtpSettings();
  
  if (!settings.host || !settings.user || !settings.password) {
    return null;
  }
  
  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    pool: true,
    maxConnections: 1,
    maxMessages: 100,
    rateDelta: 2000,
    rateLimit: 1,
    auth: {
      user: settings.user,
      pass: settings.password
    }
  });
};

// Send certificate email
export const sendCertificateEmail = async (to, subject, html, attachments = []) => {
  // Check if email sending is enabled
  if (!EMAIL_ENABLED) {
    console.log(`⚠️  Email sending disabled - would send to: ${to}`);
    return { success: true, messageId: 'disabled', disabled: true };
  }

  const settings = getSmtpSettings();
  const transporter = createTransporter();
  
  if (!transporter) {
    return { success: false, error: 'SMTP not configured. Please configure SMTP settings.' };
  }

  try {
    const mailOptions = {
      from: `"${settings.fromName}" <${settings.user}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Close the transporter after sending
    transporter.close();
    
    // Add small delay to help with rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    transporter.close();
    return { success: false, error: error.message };
  }
};

// Verify email connection
export const verifyEmailConnection = async () => {
  const transporter = createTransporter();
  
  if (!transporter) {
    console.error('SMTP not configured');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    transporter.close();
    return true;
  } catch (error) {
    console.error('Email server error:', error);
    transporter.close();
    return false;
  }
};
