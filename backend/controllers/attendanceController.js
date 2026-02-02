import pool from "../config/database.js";
import { body, validationResult } from "express-validator";

// Get event form (public - for users to see the form)
export const getEventForm = async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.query(
      `SELECT id, nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, 
              jam_mulai, jam_selesai, batas_waktu_absensi, form_config, status
       FROM kegiatan WHERE id = ? AND status = 'active'`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found or not active",
      });
    }

    const event = events[0];

    // Check if deadline has passed
    const now = new Date();
    const deadline = new Date(event.batas_waktu_absensi);

    if (now > deadline) {
      return res.status(403).json({
        success: false,
        message: "Attendance deadline has passed",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Get event form error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Submit attendance (public - for users)
export const submitAttendance = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, email_konfirmasi, pernyataan } = req.body;

    // If a file was uploaded under 'signature', build the public URL and use that
    let signature_url = null;
    if (req.file) {
      // Extract relative path from the full file path (includes event subfolder)
      const relativePath = req.file.path.split('uploads').pop();
      signature_url = `${req.protocol}://${req.get("host")}/uploads${relativePath}`;
    } else if (req.body.signature_url) {
      // Fallback for legacy clients that send a URL in the body
      signature_url = req.body.signature_url;
    }

    // Validation
    if (!nama_lengkap || !unit_kerja || !provinsi || !kabupaten_kota || !nomor_hp || !email || !email_konfirmasi || !signature_url || !pernyataan) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be filled",
      });
    }

    // Check email match
    if (email !== email_konfirmasi) {
      return res.status(400).json({
        success: false,
        message: "Email and email confirmation do not match",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check checkbox agreement
    if (!pernyataan) {
      return res.status(400).json({
        success: false,
        message: "You must agree to the terms",
      });
    }

    // Check if event exists and is active
    const [events] = await pool.query("SELECT id, status, batas_waktu_absensi, nomor_surat FROM kegiatan WHERE id = ?", [event_id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (events[0].status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Event is not active",
      });
    }

    // Check deadline
    const now = new Date();
    const deadline = new Date(events[0].batas_waktu_absensi);
    if (now > deadline) {
      return res.status(403).json({
        success: false,
        message: "Attendance deadline has passed",
      });
    }

    // Check for duplicate attendance
    const [existing] = await pool.query("SELECT id FROM presensi WHERE event_id = ? AND email = ?", [event_id, email]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted attendance for this event",
      });
    }

    // Get next attendance order
    const [countResult] = await pool.query("SELECT COUNT(*) as count FROM presensi WHERE event_id = ?", [event_id]);
    const urutan_absensi = countResult[0].count + 1;

    // Generate certificate number format: urutan/nomor_surat with 4-digit padding (0001, 0002, etc.)
    const paddedUrutan = String(urutan_absensi).padStart(4, '0');
    const nomor_sertifikat = `${paddedUrutan}/${events[0].nomor_surat}`;

    // Sanitize optional fields - convert empty strings or "-" to null
    const sanitizedNIP = nip && nip.trim() !== '' && nip.trim() !== '-' ? nip.trim() : null;
    const sanitizedPangkat = pangkat_golongan && pangkat_golongan.trim() !== '' && pangkat_golongan.trim() !== '-' ? pangkat_golongan.trim() : null;
    const sanitizedJabatan = jabatan && jabatan.trim() !== '' && jabatan.trim() !== '-' ? jabatan.trim() : null;
    const sanitizedTanggalLahir = tanggal_lahir && tanggal_lahir.trim() !== '' ? tanggal_lahir : null;

    // Insert attendance
    const [result] = await pool.query(
      `INSERT INTO presensi 
       (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir,
        nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, nomor_sertifikat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_id, nama_lengkap, unit_kerja, sanitizedNIP, provinsi, kabupaten_kota, sanitizedTanggalLahir, nomor_hp, sanitizedPangkat, sanitizedJabatan, email, signature_url, urutan_absensi, nomor_sertifikat]
    );

    res.status(201).json({
      success: true,
      message: "Absensi berhasil disimpan",
      data: {
        id: result.insertId,
        nomor_sertifikat,
        urutan_absensi,
      },
    });
  } catch (error) {
    console.error("Submit attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get all attendances for an event (admin only)
export const getEventAttendances = async (req, res) => {
  try {
    const { event_id } = req.params;
    const { page = 1, limit = 50, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM presensi 
      WHERE event_id = ?
    `;
    const params = [event_id];

    if (status) {
      query += " AND status = ?";
      params.push(status);
    }

    query += " ORDER BY urutan_absensi ASC LIMIT ? OFFSET ?";
    params.push(parseInt(limit), parseInt(offset));

    const [attendances] = await pool.query(query, params);

    // Get total count
    let countQuery = "SELECT COUNT(*) as total FROM presensi WHERE event_id = ?";
    const countParams = [event_id];
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    const [countResult] = await pool.query(countQuery, countParams);

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          totalPages: Math.ceil(countResult[0].total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Get attendances error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Get single attendance (admin only)
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [attendances] = await pool.query("SELECT * FROM presensi WHERE id = ?", [id]);

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    res.json({
      success: true,
      data: attendances[0],
    });
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Update attendance (admin only - for corrections)
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email } = req.body;

    // Check if attendance exists
    const [existing] = await pool.query("SELECT * FROM presensi WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    // Update attendance
    await pool.query(
      `UPDATE presensi SET 
       nama_lengkap = ?, unit_kerja = ?, nip = ?, provinsi = ?, kabupaten_kota = ?,
       tanggal_lahir = ?, nomor_hp = ?, pangkat_golongan = ?, jabatan = ?, email = ?
       WHERE id = ?`,
      [nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, id]
    );

    res.json({
      success: true,
      message: "Attendance updated successfully",
    });
  } catch (error) {
    console.error("Update attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// Delete attendance (admin only)
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT * FROM presensi WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    await pool.query("DELETE FROM presensi WHERE id = ?", [id]);

    res.json({
      success: true,
      message: "Attendance deleted successfully",
    });
  } catch (error) {
    console.error("Delete attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
