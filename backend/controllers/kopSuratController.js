import pool from "../config/database.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const toTinyInt = (val, defaultValue = 1) => {
  if (val === undefined || val === null) return defaultValue;
  if (val === true || val === "true" || val === 1 || val === "1") return 1;
  return 0;
};
// Create new kop surat
export const createKopSurat = async (req, res) => {
  try {
    const { nama_data, periode_mulai, periode_selesai, is_active } = req.body;

    // Validation
    if (!nama_data || !periode_mulai || !periode_selesai) {
      return res.status(400).json({
        success: false,
        message: "Nama instansi, periode mulai, dan periode selesai harus diisi",
      });
    }

    // Validate date range
    const startDate = new Date(periode_mulai);
    const endDate = new Date(periode_selesai);
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Periode mulai harus lebih awal dari periode selesai",
      });
    }

    // Handle image upload
    let kop_url = null;
    if (req.file) {
      kop_url = "uploads/kop-surat/" + req.file.filename;
    } else if (req.body.kop_url) {
      kop_url = req.body.kop_url;
    } else {
      return res.status(400).json({
        success: false,
        message: "Gambar kop surat harus diunggah",
      });
    }

    // Insert kop surat
    const [result] = await pool.query(
      `INSERT INTO kop_surat 
       (nama_data, periode_mulai, periode_selesai, kop_url, jenis_ttd, is_active) 
       VALUES (?, ?, ?, ?, NULL, ?)`,
      [nama_data, periode_mulai, periode_selesai, kop_url, toTinyInt(is_active, 1)],
    );

    res.status(201).json({
      success: true,
      message: "Kop surat berhasil dibuat",
      data: {
        id: result.insertId,
        nama_data,
      },
    });
  } catch (error) {
    console.error("Create kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all kop surat
export const getAllKopSurat = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const [kopSurats] = await pool.query(
      `SELECT * FROM kop_surat 
       ORDER BY is_active DESC, periode_mulai DESC 
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)],
    );

    // Get total count
    const [countResult] = await pool.query("SELECT COUNT(*) as total FROM kop_surat");

    res.json({
      success: true,
      data: {
        kopSurats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get kop surat by ID
export const getKopSuratById = async (req, res) => {
  try {
    const { id } = req.params;

    const [kopSurats] = await pool.query("SELECT * FROM kop_surat WHERE id = ?", [id]);

    if (kopSurats.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kop surat tidak ditemukan",
      });
    }

    res.json({
      success: true,
      data: kopSurats[0],
    });
  } catch (error) {
    console.error("Get kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update kop surat
export const updateKopSurat = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_data, periode_mulai, periode_selesai } = req.body;

    // Validation
    if (!nama_data || !periode_mulai || !periode_selesai) {
      return res.status(400).json({
        success: false,
        message: "Nama instansi, periode mulai, dan periode selesai harus diisi",
      });
    }

    // Validate date range
    const startDate = new Date(periode_mulai);
    const endDate = new Date(periode_selesai);
    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "Periode mulai harus lebih awal dari periode selesai",
      });
    }

    // Check if kop surat exists
    const [existing] = await pool.query("SELECT * FROM kop_surat WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kop surat tidak ditemukan",
      });
    }

    // Handle image upload
    let kop_url = existing[0].kop_url;
    if (req.file) {
      // Delete old image if it exists and is not a shared resource
      if (existing[0].kop_url && fs.existsSync(path.join(__dirname, "..", existing[0].kop_url))) {
        try {
          fs.unlinkSync(path.join(__dirname, "..", existing[0].kop_url));
        } catch (err) {
          console.warn("Failed to delete old kop image:", err);
        }
      }
      kop_url = "uploads/kop-surat/" + req.file.filename;
    }

    // Update kop surat
    await pool.query(
      `UPDATE kop_surat SET
   nama_data = ?,
   periode_mulai = ?,
   periode_selesai = ?,
   kop_url = ?
   WHERE id = ?`,
      [nama_data, periode_mulai, periode_selesai, kop_url, id],
    );

    res.json({
      success: true,
      message: "Kop surat berhasil diperbarui",
    });
  } catch (error) {
    console.error("Update kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Activate kop surat
export const activateKopSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kop surat exists
    const [existing] = await pool.query("SELECT * FROM kop_surat WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kop surat tidak ditemukan",
      });
    }

    // Deactivate all other kop surat
    await pool.query("UPDATE kop_surat SET is_active = 0 WHERE id != ?", [id]);

    // Activate the specified kop surat
    await pool.query("UPDATE kop_surat SET is_active = 1 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Kop surat berhasil diaktifkan",
    });
  } catch (error) {
    console.error("Activate kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Deactivate kop surat
export const deactivateKopSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kop surat exists
    const [existing] = await pool.query("SELECT * FROM kop_surat WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kop surat tidak ditemukan",
      });
    }

    // Deactivate the specified kop surat
    await pool.query("UPDATE kop_surat SET is_active = 0 WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Kop surat berhasil dinonaktifkan",
    });
  } catch (error) {
    console.error("Deactivate kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete kop surat
export const deleteKopSurat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if kop surat exists
    const [existing] = await pool.query("SELECT * FROM kop_surat WHERE id = ?", [id]);

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Kop surat tidak ditemukan",
      });
    }

    // Delete image file if it exists
    if (existing[0].kop_url) {
      const imagePath = path.join(__dirname, "..", existing[0].kop_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (err) {
          console.warn("Failed to delete kop image:", err);
        }
      }
    }

    // Delete kop surat
    await pool.query("DELETE FROM kop_surat WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Kop surat berhasil dihapus",
    });
  } catch (error) {
    console.error("Delete kop surat error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
