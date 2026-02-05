import db from "../config/database.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { processSignatureImage } from "../utils/imageProcessor.js";

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

    if (req.file) {
      const uploadedPath = path.join(__dirname, "../uploads/pejabat/signatures", req.file.filename);
      
      // Process the signature image (remove background if not QR code)
      const processResult = await processSignatureImage(uploadedPath);
      
      if (processResult.success) {
        signature_image_path = `/uploads/pejabat/signatures/${processResult.filename}`;
        console.log(`Signature processed: QR=${processResult.isQRCode}, Background Removed=${processResult.backgroundRemoved}`);
      } else {
        // Fallback to original file if processing fails
        signature_image_path = `/uploads/pejabat/signatures/${req.file.filename}`;
        console.warn("Image processing failed, using original:", processResult.error);
      }
    }

    const [result] = await db.query(
      `INSERT INTO pejabat (name, position, signature_image_path, is_active, created_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, position, signature_image_path, is_active !== false, created_by]
    );

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

    // Handle new signature image upload
    if (req.file) {
      // Delete old signature image if it exists
      if (existing[0].signature_image_path) {
        const oldImagePath = path.join(__dirname, "..", existing[0].signature_image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Process the signature image (remove background if not QR code)
      const uploadedPath = path.join(__dirname, "../uploads/pejabat/signatures", req.file.filename);
      const processResult = await processSignatureImage(uploadedPath);
      
      if (processResult.success) {
        signature_image_path = `/uploads/pejabat/signatures/${processResult.filename}`;
        console.log(`Signature updated: QR=${processResult.isQRCode}, Background Removed=${processResult.backgroundRemoved}`);
      } else {
        // Fallback to original file if processing fails
        signature_image_path = `/uploads/pejabat/signatures/${req.file.filename}`;
        console.warn("Image processing failed, using original:", processResult.error);
      }
    }

    await db.query(
      `UPDATE pejabat 
       SET name = ?, position = ?, signature_image_path = ?, is_active = ? 
       WHERE id = ?`,
      [name || existing[0].name, position || existing[0].position, signature_image_path, is_active !== false, id]
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

    // Delete signature image file
    if (existing[0].signature_image_path) {
      const imagePath = path.join(__dirname, "..", existing[0].signature_image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
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
