import pool from '../config/database.js';
import { generateCertificate } from '../utils/pdfGenerator.js';
import { sendCertificateEmail } from '../utils/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate certificate for single attendance
export const generateSingleCertificate = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    // Get attendance and event data
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan, e.tanggal_mulai, e.tanggal_selesai, 
              e.template_sertifikat, e.nomor_surat
       FROM attendances a
       JOIN events e ON a.event_id = e.id
       WHERE a.id = ?`,
      [attendance_id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }

    const attendance = attendances[0];

    // Generate PDF certificate
    const result = await generateCertificate(
      attendance,
      {
        nama_kegiatan: attendance.nama_kegiatan,
        tanggal_mulai: attendance.tanggal_mulai,
        tanggal_selesai: attendance.tanggal_selesai
      },
      attendance.template_sertifikat
    );

    if (!result.success) {
      throw new Error('Failed to generate certificate');
    }

    // Update attendance record
    await pool.query(
      'UPDATE attendances SET certificate_path = ?, status = ? WHERE id = ?',
      [result.filepath, 'menunggu_sertifikat', attendance_id]
    );

    res.json({
      success: true,
      message: 'Certificate generated successfully',
      data: {
        certificate_path: result.filepath,
        download_url: `${process.env.BASE_URL}/${result.filepath}`
      }
    });

  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificate'
    });
  }
};

// Generate certificates for all attendances in an event
export const generateEventCertificates = async (req, res) => {
  try {
    const { event_id } = req.params;

    // Get event details
    const [events] = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [event_id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = events[0];

    // Get all attendances for the event
    const [attendances] = await pool.query(
      'SELECT * FROM attendances WHERE event_id = ? ORDER BY urutan_absensi ASC',
      [event_id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendances found for this event'
      });
    }

    const results = [];
    const errors = [];

    // Generate certificate for each attendance
    for (const attendance of attendances) {
      try {
        const result = await generateCertificate(
          attendance,
          {
            nama_kegiatan: event.nama_kegiatan,
            tanggal_mulai: event.tanggal_mulai,
            tanggal_selesai: event.tanggal_selesai
          },
          event.template_sertifikat
        );

        if (result.success) {
          // Update attendance record
          await pool.query(
            'UPDATE attendances SET certificate_path = ? WHERE id = ?',
            [result.filepath, attendance.id]
          );

          results.push({
            attendance_id: attendance.id,
            nama: attendance.nama_lengkap,
            certificate_path: result.filepath
          });
        }
      } catch (err) {
        errors.push({
          attendance_id: attendance.id,
          nama: attendance.nama_lengkap,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Generated ${results.length} certificates`,
      data: {
        total: attendances.length,
        success: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Generate event certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate certificates'
    });
  }
};

// Send certificate via email
export const sendCertificate = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    // Get attendance data
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan
       FROM attendances a
       JOIN events e ON a.event_id = e.id
       WHERE a.id = ?`,
      [attendance_id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Attendance not found'
      });
    }

    const attendance = attendances[0];

    // Check if certificate exists
    if (!attendance.certificate_path) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not generated yet'
      });
    }

    // Prepare email
    const subject = `Sertifikat - ${attendance.nama_kegiatan}`;
    const html = `
      <h2>Sertifikat Kegiatan</h2>
      <p>Kepada Yth. ${attendance.nama_lengkap},</p>
      <p>Terlampir sertifikat untuk kegiatan <strong>${attendance.nama_kegiatan}</strong>.</p>
      <p>Nomor Sertifikat: <strong>${attendance.nomor_sertifikat}</strong></p>
      <br>
      <p>Terima kasih atas partisipasi Anda.</p>
      <br>
      <p>Salam,<br>Tim KP BBPMP</p>
    `;

    const certificatePath = path.join(__dirname, '..', attendance.certificate_path);

    // Send email
    const emailResult = await sendCertificateEmail(
      attendance.email,
      subject,
      html,
      [
        {
          filename: `Sertifikat-${attendance.nama_lengkap}.pdf`,
          path: certificatePath
        }
      ]
    );

    if (!emailResult.success) {
      throw new Error(emailResult.error);
    }

    // Update status
    await pool.query(
      'UPDATE attendances SET status = ?, sent_at = NOW() WHERE id = ?',
      ['sertifikat_terkirim', attendance_id]
    );

    res.json({
      success: true,
      message: 'Certificate sent successfully',
      data: {
        email: attendance.email,
        sent_at: new Date()
      }
    });

  } catch (error) {
    console.error('Send certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send certificate'
    });
  }
};

// Send all certificates for an event
export const sendEventCertificates = async (req, res) => {
  try {
    const { event_id } = req.params;

    // Get all attendances with certificates
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan
       FROM attendances a
       JOIN events e ON a.event_id = e.id
       WHERE a.event_id = ? AND a.certificate_path IS NOT NULL
       ORDER BY a.urutan_absensi ASC`,
      [event_id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No certificates found to send'
      });
    }

    const results = [];
    const errors = [];

    // Send certificate for each attendance
    for (const attendance of attendances) {
      try {
        const subject = `Sertifikat - ${attendance.nama_kegiatan}`;
        const html = `
          <h2>Sertifikat Kegiatan</h2>
          <p>Kepada Yth. ${attendance.nama_lengkap},</p>
          <p>Terlampir sertifikat untuk kegiatan <strong>${attendance.nama_kegiatan}</strong>.</p>
          <p>Nomor Sertifikat: <strong>${attendance.nomor_sertifikat}</strong></p>
          <br>
          <p>Terima kasih atas partisipasi Anda.</p>
          <br>
          <p>Salam,<br>Tim KP BBPMP</p>
        `;

        const certificatePath = path.join(__dirname, '..', attendance.certificate_path);

        const emailResult = await sendCertificateEmail(
          attendance.email,
          subject,
          html,
          [
            {
              filename: `Sertifikat-${attendance.nama_lengkap}.pdf`,
              path: certificatePath
            }
          ]
        );

        if (emailResult.success) {
          // Update status
          await pool.query(
            'UPDATE attendances SET status = ?, sent_at = NOW() WHERE id = ?',
            ['sertifikat_terkirim', attendance.id]
          );

          results.push({
            attendance_id: attendance.id,
            nama: attendance.nama_lengkap,
            email: attendance.email
          });
        } else {
          errors.push({
            attendance_id: attendance.id,
            nama: attendance.nama_lengkap,
            email: attendance.email,
            error: emailResult.error
          });
        }

        // Add delay to avoid overwhelming the SMTP server
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        errors.push({
          attendance_id: attendance.id,
          nama: attendance.nama_lengkap,
          error: err.message
        });
      }
    }

    res.json({
      success: true,
      message: `Sent ${results.length} certificates`,
      data: {
        total: attendances.length,
        success: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Send event certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send certificates'
    });
  }
};

// Get certificate history for an event
export const getCertificateHistory = async (req, res) => {
  try {
    const { event_id } = req.params;

    const [attendances] = await pool.query(
      `SELECT id, nama_lengkap, email, nomor_sertifikat, status, 
              certificate_path, sent_at, created_at
       FROM attendances
       WHERE event_id = ?
       ORDER BY urutan_absensi ASC`,
      [event_id]
    );

    const stats = {
      total: attendances.length,
      menunggu_sertifikat: attendances.filter(a => a.status === 'menunggu_sertifikat').length,
      sertifikat_terkirim: attendances.filter(a => a.status === 'sertifikat_terkirim').length
    };

    res.json({
      success: true,
      data: {
        stats,
        attendances
      }
    });

  } catch (error) {
    console.error('Get certificate history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
