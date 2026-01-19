import pool from "../config/database.js";
import { body, validationResult } from "express-validator";
import { generateCertificate } from "../utils/pdfGenerator.js";
import { sendCertificateEmail } from "../utils/emailService.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get event form (public - for users to see the form)
export const getEventForm = async (req, res) => {
  try {
    const { id } = req.params;

    const [events] = await pool.query(
      `SELECT id, nama_kegiatan, nomor_surat, tanggal_mulai, tanggal_selesai, 
              jam_mulai, jam_selesai, batas_waktu_absensi, form_config, status
       FROM events WHERE id = ? AND status = 'active'`,
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
      signature_url = `${req.protocol}://${req.get("host")}/uploads/signatures/${req.file.filename}`;
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
    const [events] = await pool.query("SELECT id, status, batas_waktu_absensi, nomor_surat FROM events WHERE id = ?", [event_id]);

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
    const [existing] = await pool.query("SELECT id FROM attendances WHERE event_id = ? AND email = ?", [event_id, email]);

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already submitted attendance for this event",
      });
    }

    // Get next attendance order
    const [countResult] = await pool.query("SELECT COUNT(*) as count FROM attendances WHERE event_id = ?", [event_id]);
    const urutan_absensi = countResult[0].count + 1;

    // Generate certificate number format: urutan/nomor_surat
    const nomor_sertifikat = `${urutan_absensi}/${events[0].nomor_surat}`;

    // Insert attendance
    const [result] = await pool.query(
      `INSERT INTO attendances 
       (event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir,
        nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, nomor_sertifikat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [event_id, nama_lengkap, unit_kerja, nip, provinsi, kabupaten_kota, tanggal_lahir, nomor_hp, pangkat_golongan, jabatan, email, signature_url, urutan_absensi, nomor_sertifikat]
    );

    const attendanceId = result.insertId;

    // Get event details for certificate generation
    const [eventDetails] = await pool.query(
      `SELECT nama_kegiatan, tanggal_mulai, tanggal_selesai, template_sertifikat 
       FROM events WHERE id = ?`,
      [event_id]
    );

    const event = eventDetails[0];

    // Generate certificate automatically
    let certificateSent = false;
    let emailError = null;

    try {
      const attendanceData = {
        id: attendanceId,
        nama_lengkap,
        unit_kerja,
        nip,
        kabupaten_kota,
        pangkat_golongan,
        jabatan,
        nomor_sertifikat
      };

      const certResult = await generateCertificate(
        attendanceData,
        {
          nama_kegiatan: event.nama_kegiatan,
          tanggal_mulai: event.tanggal_mulai,
          tanggal_selesai: event.tanggal_selesai
        },
        event.template_sertifikat
      );

      if (certResult.success) {
        // Update attendance with certificate path
        await pool.query(
          'UPDATE attendances SET certificate_path = ? WHERE id = ?',
          [certResult.filepath, attendanceId]
        );

        // Send certificate via email
        const subject = `Sertifikat - ${event.nama_kegiatan}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Sertifikat Kegiatan</h2>
            <p>Kepada Yth. <strong>${nama_lengkap}</strong>,</p>
            <p>Terima kasih telah mengisi absensi untuk kegiatan:</p>
            <p style="font-size: 18px; font-weight: bold; color: #2563eb;">${event.nama_kegiatan}</p>
            <p>Terlampir sertifikat keikutsertaan Anda.</p>
            <table style="margin: 20px 0; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #666;">Nomor Sertifikat:</td>
                <td style="padding: 8px 16px; font-weight: bold;">${nomor_sertifikat}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Unit Kerja:</td>
                <td style="padding: 8px 16px;">${unit_kerja}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #666;">Kabupaten/Kota:</td>
                <td style="padding: 8px 16px;">${kabupaten_kota}</td>
              </tr>
            </table>
            <p>Terima kasih atas partisipasi Anda.</p>
            <br>
            <p style="color: #666;">Salam,<br><strong>Tim KP BBPMP</strong></p>
          </div>
        `;

        const certificatePath = path.join(__dirname, '..', certResult.filepath);

        const emailResult = await sendCertificateEmail(
          email,
          subject,
          html,
          [
            {
              filename: `Sertifikat-${nama_lengkap.replace(/\s+/g, '_')}.pdf`,
              path: certificatePath
            }
          ]
        );

        if (emailResult.success) {
          certificateSent = true;
          // Update status to certificate sent
          await pool.query(
            'UPDATE attendances SET status = ?, sent_at = NOW() WHERE id = ?',
            ['sertifikat_terkirim', attendanceId]
          );
        } else {
          emailError = emailResult.error;
          console.error('Failed to send certificate email:', emailResult.error);
        }
      }
    } catch (certError) {
      console.error('Certificate generation/sending error:', certError);
      emailError = certError.message;
    }

    res.status(201).json({
      success: true,
      message: certificateSent 
        ? "Attendance submitted successfully. Certificate has been sent to your email."
        : "Attendance submitted successfully. Certificate will be sent shortly.",
      data: {
        id: attendanceId,
        nomor_sertifikat,
        urutan_absensi,
        certificate_sent: certificateSent,
        email_sent_to: certificateSent ? email : null,
        email_error: emailError
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
      SELECT * FROM attendances 
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
    let countQuery = "SELECT COUNT(*) as total FROM attendances WHERE event_id = ?";
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

    const [attendances] = await pool.query("SELECT * FROM attendances WHERE id = ?", [id]);

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
    const [existing] = await pool.query("SELECT * FROM attendances WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    // Update attendance
    await pool.query(
      `UPDATE attendances SET 
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

    const [existing] = await pool.query("SELECT * FROM attendances WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    await pool.query("DELETE FROM attendances WHERE id = ?", [id]);

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
