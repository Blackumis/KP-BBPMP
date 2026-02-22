import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

// Login
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Find admin
    const [admins] = await pool.query(
      'SELECT * FROM admin WHERE username = ? OR email = ?',
      [username, username]
    );

    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username Salah'
      });
    }

    const admin = admins[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Password Salah'
      });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        isAdmin: true
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          full_name: admin.full_name
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error.code, error.message);
    console.error('Full error:', error);

    // Return specific error info so the issue can be diagnosed
    let errorType = 'server';

    // Always include debug info for diagnosis (remove after fixing)
    const debugInfo = {
      code: error.code,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5)
    };

    // Build a detailed message that includes the actual error
    let message = `Server error during login [${error.code || 'NO_CODE'}]: ${error.message || 'unknown error'}`;

    // JWT errors
    if (error.message && error.message.includes('secretOrPrivateKey')) {
      message = 'JWT_SECRET is not configured. Check your .env file.';
      errorType = 'config';
    } else if (error.code === 'ECONNREFUSED') {
      message = 'Database connection refused. MySQL may not be running.';
      errorType = 'database';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'Database access denied. Check database credentials.';
      errorType = 'database';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      message = 'Database not found. Please run the setup SQL script.';
      errorType = 'database';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      message = 'Admin table not found. Please run the setup SQL script.';
      errorType = 'database';
    } else if (error.code === 'PROTOCOL_CONNECTION_LOST' || error.code === 'ENOTFOUND') {
      message = 'Database connection lost. Please try again.';
      errorType = 'database';
    } else if (error.code === 'ETIMEDOUT') {
      message = 'Database connection timed out.';
      errorType = 'timeout';
    }

    res.status(500).json({
      success: false,
      message,
      errorType,
      debug: debugInfo
    });
  }
};

// Register new admin (protected route)
export const register = async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    // Validation
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if admin exists
    const [existingAdmins] = await pool.query(
      'SELECT id FROM admin WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingAdmins.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    const [result] = await pool.query(
      'INSERT INTO admin (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, full_name]
    );

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      data: {
        id: result.insertId,
        username,
        email,
        full_name
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Get current admin profile
export const getProfile = async (req, res) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, username, email, full_name, created_at FROM admin WHERE id = ?',
      [req.user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.json({
      success: true,
      data: admins[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get admin
    const [admins] = await pool.query(
      'SELECT password FROM admin WHERE id = ?',
      [req.user.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, admins[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query(
      'UPDATE admin SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
