import db from "../config/database.js";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all officials
export const getAllOfficials = async (req, res) => {
  try {
    const [officials] = await db.query(
      `SELECT id, name, position, signature_image_path, signature_qr_path, is_active, created_at, updated_at 
       FROM pejabat 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: officials,
    });
  } catch (error) {
    console.error("Error fetching officials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch officials",
      error: error.message,
    });
  }
};

// Get active officials only
export const getActiveOfficials = async (req, res) => {
  try {
    const [officials] = await db.query(
      `SELECT id, name, position, signature_qr_path 
       FROM pejabat 
       WHERE is_active = true 
       ORDER BY name ASC`
    );

    res.json({
      success: true,
      data: officials,
    });
  } catch (error) {
    console.error("Error fetching active officials:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active officials",
      error: error.message,
    });
  }
};

// Get official by ID
export const getOfficialById = async (req, res) => {
  try {
    const { id } = req.params;

    const [officials] = await db.query(
      `SELECT id, name, position, signature_image_path, signature_qr_path, is_active, created_at, updated_at 
       FROM pejabat 
       WHERE id = ?`,
      [id]
    );

    if (officials.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Official not found",
      });
    }

    res.json({
      success: true,
      data: officials[0],
    });
  } catch (error) {
    console.error("Error fetching official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch official",
      error: error.message,
    });
  }
};

// Create new official
export const createOfficial = async (req, res) => {
  try {
    const { name, position, is_active } = req.body;
    const created_by = req.user.id;

    if (!name || !position) {
      return res.status(400).json({
        success: false,
        message: "Name and position are required",
      });
    }

    // Handle signature image upload
    let signature_image_path = null;
    let signature_qr_path = null;

    if (req.file) {
      signature_image_path = `/uploads/pejabat/signatures/${req.file.filename}`;

      // Generate QR code that links to official verification page
      const qrFileName = `qr_${Date.now()}.png`;
      const qrPath = path.join(__dirname, "../uploads/pejabat/qrcode", qrFileName);

      // Create QR code containing URL to official verification page
      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/official/OFFICIAL_ID_PLACEHOLDER`;
      await QRCode.toFile(qrPath, verificationUrl, {
        width: 400,
        margin: 0,
        errorCorrectionLevel: "H",
      });

      signature_qr_path = `/uploads/pejabat/qrcode/${qrFileName}`;
    }

    const [result] = await db.query(
      `INSERT INTO pejabat (name, position, signature_image_path, signature_qr_path, is_active, created_by) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, position, signature_image_path, signature_qr_path, is_active !== false, created_by]
    );

    // Update QR code with actual official ID
    if (signature_qr_path) {
      const actualVerificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/official/${result.insertId}`;
      const qrPath = path.join(__dirname, "..", signature_qr_path);
      await QRCode.toFile(qrPath, actualVerificationUrl, {
        width: 400,
        margin: 0,
        errorCorrectionLevel: "H",
      });
    }

    const [newOfficial] = await db.query(`SELECT * FROM pejabat WHERE id = ?`, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Official created successfully",
      data: newOfficial[0],
    });
  } catch (error) {
    console.error("Error creating official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create official",
      error: error.message,
    });
  }
};

// Update official
export const updateOfficial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, position, is_active } = req.body;

    // Check if official exists
    const [existing] = await db.query(`SELECT * FROM pejabat WHERE id = ?`, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Official not found",
      });
    }

    let signature_image_path = existing[0].signature_image_path;
    let signature_qr_path = existing[0].signature_qr_path;

    // Handle new signature image upload
    if (req.file) {
      // Delete old signature image and QR if they exist
      if (existing[0].signature_image_path) {
        const oldImagePath = path.join(__dirname, "..", existing[0].signature_image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      if (existing[0].signature_qr_path) {
        const oldQRPath = path.join(__dirname, "..", existing[0].signature_qr_path);
        if (fs.existsSync(oldQRPath)) {
          fs.unlinkSync(oldQRPath);
        }
      }

      // Save new signature image
      signature_image_path = `/uploads/pejabat/signatures/${req.file.filename}`;

      // Generate new QR code with URL to verification page
      const qrFileName = `qr_${Date.now()}.png`;
      const qrPath = path.join(__dirname, "../uploads/pejabat/qrcode", qrFileName);

      const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/official/${id}`;
      await QRCode.toFile(qrPath, verificationUrl, {
        width: 400,
        margin: 0,
        errorCorrectionLevel: "H",
      });

      signature_qr_path = `/uploads/pejabat/qrcode/${qrFileName}`;
    }

    await db.query(
      `UPDATE pejabat 
       SET name = ?, position = ?, signature_image_path = ?, signature_qr_path = ?, is_active = ? 
       WHERE id = ?`,
      [name || existing[0].name, position || existing[0].position, signature_image_path, signature_qr_path, is_active !== false, id]
    );

    const [updatedOfficial] = await db.query(`SELECT * FROM pejabat WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Official updated successfully",
      data: updatedOfficial[0],
    });
  } catch (error) {
    console.error("Error updating official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update official",
      error: error.message,
    });
  }
};

// Delete official
export const deleteOfficial = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if official exists
    const [existing] = await db.query(`SELECT * FROM pejabat WHERE id = ?`, [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Official not found",
      });
    }

    // Delete signature image and QR code files
    if (existing[0].signature_image_path) {
      const imagePath = path.join(__dirname, "..", existing[0].signature_image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    if (existing[0].signature_qr_path) {
      const qrPath = path.join(__dirname, "..", existing[0].signature_qr_path);
      if (fs.existsSync(qrPath)) {
        fs.unlinkSync(qrPath);
      }
    }

    // Delete from database
    await db.query(`DELETE FROM pejabat WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Official deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting official:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete official",
      error: error.message,
    });
  }
};
