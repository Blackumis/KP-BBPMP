import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email sending enabled/disabled flag
const EMAIL_ENABLED = process.env.EMAIL_ENABLED !== 'false';

// Create transporter with connection pooling to reduce login attempts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  pool: true, // Use pooled connections
  maxConnections: 1, // Limit to 1 connection at a time
  maxMessages: 100, // Reuse connection for 100 messages
  rateDelta: 2000, // Minimum 2 seconds between messages
  rateLimit: 1, // Max 1 message per rateDelta
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

// Send certificate email
export const sendCertificateEmail = async (to, subject, html, attachments = []) => {
  // Check if email sending is enabled
  if (!EMAIL_ENABLED) {
    console.log(`⚠️  Email sending disabled - would send to: ${to}`);
    return { success: true, messageId: 'disabled', disabled: true };
  }

  try {
    const mailOptions = {
      from: `"BBPMP" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    
    // Add small delay to help with rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Verify email connection
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email server error:', error);
    return false;
  }
};
