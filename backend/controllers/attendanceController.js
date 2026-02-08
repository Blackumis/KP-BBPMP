import pool from "../config/database.js";
import { body, validationResult } from "express-validator";
import { verifyAttendanceToken, generateAttendanceToken } from "../utils/attendanceToken.js";

// Admin: generate a stateless attendance token for an activity
export const generateAttendanceTokenHandler = async (req, res) => {
  try {
    const { event_id } = req.params;
    // Check event exists
    const [events] = await pool.query("SELECT id, status FROM kegiatan WHERE id = ?", [event_id]);
    if (events.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }
    // Token generation is allowed regardless of event status (start time may be in future)

    const token = generateAttendanceToken(event_id);
    res.json({ success: true, token });
  } catch (err) {
    console.error("Generate attendance token error:", err);
    // Provide a clearer message when secret is not configured
    if (err && err.message && err.message.includes("ATTENDANCE_JWT_SECRET")) {
      return res.status(500).json({ success: false, message: "Server misconfiguration: ATTENDANCE_JWT_SECRET is not set" });
    }
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get event form (public - for users to see the form)
export const getEventForm = async (req, res) => {
  try {
    const { token } = req.params;

    let decoded;
    try {
      decoded = verifyAttendanceToken(token);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid attendance token" });
    }

    const activity_id = decoded.activity_id;

    const [events] = await pool.query(
      `SELECT id, nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai,
              jam_mulai, jam_selesai, batas_waktu_absensi, mulai_waktu_absensi, form_config, status
       FROM kegiatan WHERE id = ?`,
      [activity_id],
    );

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const event = events[0];

    // Determine time phases
    const now = new Date();
    const start = event.mulai_waktu_absensi ? new Date(event.mulai_waktu_absensi) : null;
    const deadline = event.batas_waktu_absensi ? new Date(event.batas_waktu_absensi) : null;

    if (deadline && now > deadline) {
      return res.status(403).json({ success: false, message: "Absensi telah berakhir" });
    }

    // If not started yet, still return event data but include flag so frontend can show message
    const started = !start || now >= start;

    res.json({
      success: true,
      data: {
        ...event,
        started,
      },
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
    const { token } = req.params;
    const { nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, email_konfirmasi, pernyataan } = req.body;

    let decoded;
    try {
      decoded = verifyAttendanceToken(token);
    } catch (err) {
      return res.status(400).json({ success: false, message: "Invalid attendance token" });
    }

    const event_id = decoded.activity_id;

    // If a file was uploaded under 'signature', build the public URL and use that
    let signature_url = null;
    if (req.file) {
      // Extract relative path from the full file path (includes event subfolder)
      const relativePath = req.file.path.split("uploads").pop();
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

    // Check if event exists
    const [events] = await pool.query("SELECT id, status, batas_waktu_absensi, mulai_waktu_absensi, nomor_surat FROM kegiatan WHERE id = ?", [event_id]);

    if (events.length === 0) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Time-based validation: ensure now >= start (if provided) and now <= deadline
    const now = new Date();
    const start = events[0].mulai_waktu_absensi ? new Date(events[0].mulai_waktu_absensi) : null;
    const deadline = events[0].batas_waktu_absensi ? new Date(events[0].batas_waktu_absensi) : null;

    if (start && now < start) {
      return res.status(403).json({ success: false, message: "Absensi belum dimulai" });
    }

    if (deadline && now > deadline) {
      return res.status(403).json({ success: false, message: "Absensi telah berakhir" });
    }

    // Check for duplicate attendance
    const [existing] = await pool.query("SELECT id FROM presensi WHERE event_id = ? AND email = ?", [event_id, email]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Anda Telah Melakukan Absensi Pada Kegiatan Ini",
      });
    }

    // Get next attendance order
    const [countResult] = await pool.query("SELECT COUNT(*) as count FROM presensi WHERE event_id = ?", [event_id]);
    const urutan_absensi = countResult[0].count + 1;

    // Generate certificate number format: urutan/nomor_surat with 4-digit padding (0001, 0002, etc.)
    const paddedUrutan = String(urutan_absensi).padStart(4, "0");
    const nomor_sertifikat = `${paddedUrutan}/${events[0].nomor_surat}`;

    // Sanitize optional fields - convert empty strings or "-" to null
    const sanitizedNIP = nip && nip.trim() !== "" && nip.trim() !== "-" ? nip.trim() : null;
    const sanitizedPangkat = pangkat_golongan && pangkat_golongan.trim() !== "" && pangkat_golongan.trim() !== "-" ? pangkat_golongan.trim() : null;
    const sanitizedJabatan = jabatan && jabatan.trim() !== "" && jabatan.trim() !== "-" ? jabatan.trim() : null;
    const sanitizedTanggalLahir = tanggal_lahir && tanggal_lahir.trim() !== "" ? tanggal_lahir : null;

    // Insert attendance
    const [result] = await pool.query(
      `INSERT INTO presensi 
       (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir,
        nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, nomor_sertifikat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id,
        nama_lengkap,
        unit_kerja,
        sanitizedNIP,
        provinsi,
        kabupaten_kota,
        sanitizedTanggalLahir,
        nomor_hp,
        sanitizedPangkat,
        sanitizedJabatan,
        email,
        signature_url,
        urutan_absensi,
        nomor_sertifikat,
      ],
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
    const { page = 1, limit = 10000, status } = req.query; // Increased default limit to 10000
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

    // Only apply LIMIT if it's not "all"
    if (limit === 'all') {
      query += " ORDER BY urutan_absensi ASC";
    } else {
      query += " ORDER BY urutan_absensi ASC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

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
      [nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, id],
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
