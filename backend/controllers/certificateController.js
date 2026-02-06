import pool from '../config/database.js';
import { generateCertificate } from '../utils/pdfGenerator.js';
import { sendCertificateEmail } from '../utils/emailService.js';
import { certificateQueue, emailQueue } from '../config/simpleQueue.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate certificate for single attendance
export const generateSingleCertificate = async (req, res) => {
  try {
    const { attendance_id } = req.params;

    // Get attendance and event data with official information
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan, e.tanggal_mulai, e.tanggal_selesai, 
              e.template_sertifikat, e.nomor_surat, e.certificate_layout, e.official_id,
              o.signature_image_path as official_signature_path
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
       LEFT JOIN pejabat o ON e.official_id = o.id
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

    // Parse certificate_layout if it's a JSON string
    let certificateLayout = null;
    try {
      if (attendance.certificate_layout) {
        certificateLayout = typeof attendance.certificate_layout === 'string' 
          ? JSON.parse(attendance.certificate_layout) 
          : attendance.certificate_layout;
      }
    } catch (err) {
      console.warn('Failed to parse certificate_layout:', err);
    }

    // Generate PDF certificate
    const result = await generateCertificate(
      attendance,
      {
        nama_kegiatan: attendance.nama_kegiatan,
        tanggal_mulai: attendance.tanggal_mulai,
        tanggal_selesai: attendance.tanggal_selesai,
        certificate_layout: certificateLayout,
        official_signature_path: attendance.official_signature_path
      },
      attendance.template_sertifikat
    );

    if (!result.success) {
      throw new Error('Failed to generate certificate');
    }

    // Update attendance record
    await pool.query(
      'UPDATE presensi SET certificate_path = ?, status = ? WHERE id = ?',
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

    // Get event details with official information
    const [events] = await pool.query(
      `SELECT e.*, o.signature_image_path as official_signature_path
       FROM kegiatan e
       LEFT JOIN pejabat o ON e.official_id = o.id
       WHERE e.id = ?`,
      [event_id]
    );

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const event = events[0];

    // Parse certificate_layout if it's a JSON string
    let certificateLayout = null;
    try {
      if (event.certificate_layout) {
        certificateLayout = typeof event.certificate_layout === 'string' 
          ? JSON.parse(event.certificate_layout) 
          : event.certificate_layout;
      }
    } catch (err) {
      console.warn('Failed to parse certificate_layout:', err);
    }

    // Get all attendances for the event
    const [attendances] = await pool.query(
      'SELECT * FROM presensi WHERE event_id = ? ORDER BY urutan_absensi ASC',
      [event_id]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No attendances found for this event'
      });
    }

    // Add jobs to queue
    const jobs = [];
    for (const attendance of attendances) {
      const job = await certificateQueue.add({
        attendance_id: attendance.id,
        event_data: {
          nama_kegiatan: event.nama_kegiatan,
          tanggal_mulai: event.tanggal_mulai,
          tanggal_selesai: event.tanggal_selesai,
          certificate_layout: certificateLayout,
          official_qr_path: event.official_qr_path,
          official_signature_path: event.official_signature_path,
          template_sertifikat: event.template_sertifikat
        }
      });
      jobs.push(job);
    }

    res.json({
      success: true,
      message: `Added ${jobs.length} certificate generation jobs to queue`,
      data: {
        total: attendances.length,
        queued: jobs.length,
        queue_info: {
          name: 'certificate-generation',
          message: 'Jobs are being processed in the background. Check queue status for progress.'
        }
      }
    });

  } catch (error) {
    console.error('Generate event certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to queue certificate generation jobs'
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
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
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
        message: 'sertifikat belum dibuat'
      });
    }

    const subject = `Sertifikat - ${attendance.nama_kegiatan}`;
    const html = `
      <h2>Sertifikat Kegiatan</h2>
      <p>Kepada Yth. ${attendance.nama_lengkap},</p>
      <p>Terlampir sertifikat untuk kegiatan <strong>${attendance.nama_kegiatan}</strong>.</p>
      <p>Nomor Sertifikat: <strong>${attendance.nomor_sertifikat}</strong></p>
      <br>
      <p>Terima kasih atas partisipasi Anda.</p>
      <br>
      <p>Salam,<br>BBPMP</p>
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
      'UPDATE presensi SET status = ?, sent_at = NOW() WHERE id = ?',
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
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
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

    // Add jobs to email queue
    const jobs = [];
    for (const attendance of attendances) {
      const job = await emailQueue.add({
        attendance_id: attendance.id,
        event_name: attendance.nama_kegiatan
      });
      jobs.push(job);
    }

    res.json({
      success: true,
      message: `Added ${jobs.length} email sending jobs to queue`,
      data: {
        total: attendances.length,
        queued: jobs.length,
        queue_info: {
          name: 'email-sending',
          message: 'Emails are being sent in the background. Check queue status for progress.'
        }
      }
    });

  } catch (error) {
    console.error('Send event certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to queue email sending jobs'
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
       FROM presensi
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

// Validate certificate by certificate number
export const validateCertificate = async (req, res) => {
  try {
    const { certificate_number } = req.params;
    
    console.log('Validating certificate:', certificate_number);

    // Get certificate data from database
    const [attendances] = await pool.query(
      `SELECT 
        a.id,
        a.nama_lengkap,
        a.unit_kerja,
        a.nip,
        a.provinsi,
        a.kabupaten_kota,
        a.tanggal_lahir,
        a.nomor_hp,
        a.pangkat_golongan,
        a.jabatan,
        a.email,
        a.nomor_sertifikat,
        a.status,
        a.certificate_path,
        a.sent_at,
        a.created_at,
        e.nama_kegiatan,
        e.nomor_surat,
        e.tanggal_mulai,
        e.tanggal_selesai,
        e.jam_mulai,
        e.jam_selesai
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
       WHERE a.nomor_sertifikat = ?`,
      [certificate_number]
    );

    console.log('Found attendances:', attendances.length);

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sertifikat tidak ditemukan',
        valid: false
      });
    }

    const data = attendances[0];

    // Format dates for response
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    res.json({
      success: true,
      valid: true,
      message: 'Sertifikat valid',
      data: {
        participant: {
          nama_lengkap: data.nama_lengkap,
          unit_kerja: data.unit_kerja,
          nip: data.nip,
          provinsi: data.provinsi,
          kabupaten_kota: data.kabupaten_kota,
          tanggal_lahir: data.tanggal_lahir ? formatDate(data.tanggal_lahir) : null,
          nomor_hp: data.nomor_hp,
          pangkat_golongan: data.pangkat_golongan,
          jabatan: data.jabatan,
          email: data.email
        },
        event: {
          nama_kegiatan: data.nama_kegiatan,
          nomor_surat: data.nomor_surat,
          tanggal_mulai: formatDate(data.tanggal_mulai),
          tanggal_selesai: formatDate(data.tanggal_selesai),
          jam_mulai: data.jam_mulai,
          jam_selesai: data.jam_selesai
        },
        certificate: {
          nomor_sertifikat: data.nomor_sertifikat,
          status: data.status,
          tanggal_diterbitkan: formatDate(data.created_at),
          tanggal_dikirim: data.sent_at ? formatDate(data.sent_at) : null,
          certificate_path: data.certificate_path
        }
      }
    });

  } catch (error) {
    console.error('Validate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      valid: false
    });
  }
};

// Download certificate PDF by certificate number
export const downloadCertificate = async (req, res) => {
  try {
    const { certificate_number } = req.params;

    // Get certificate data
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
       WHERE a.nomor_sertifikat = ?`,
      [certificate_number]
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sertifikat tidak ditemukan'
      });
    }

    const attendance = attendances[0];

    // Check if certificate file exists
    if (!attendance.certificate_path) {
      return res.status(404).json({
        success: false,
        message: 'File sertifikat belum dibuat'
      });
    }

    const certificatePath = path.join(__dirname, '..', attendance.certificate_path);

    // Check if file exists
    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({
        success: false,
        message: 'File sertifikat tidak ditemukan'
      });
    }

    // Set headers for download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Sertifikat-${attendance.nama_lengkap}.pdf"`);

    // Send file
    const fileStream = fs.createReadStream(certificatePath);
    
    fileStream.on('error', (err) => {
      console.error('File stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Gagal membaca file sertifikat'
        });
      }
    });

    fileStream.pipe(res);

  } catch (error) {
    console.error('Download certificate error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Gagal mengunduh sertifikat'
      });
    }
  }
};

// Get queue status for an event
export const getQueueStatus = async (req, res) => {
  try {
    const { event_id } = req.params;

    // Get certificate queue stats
    const certWaiting = await certificateQueue.getWaiting();
    const certActive = await certificateQueue.getActive();
    const certCompleted = await certificateQueue.getCompleted();
    const certFailed = await certificateQueue.getFailed();

    // Get email queue stats
    const emailWaiting = await emailQueue.getWaiting();
    const emailActive = await emailQueue.getActive();
    const emailCompleted = await emailQueue.getCompleted();
    const emailFailed = await emailQueue.getFailed();

    // Filter jobs for specific event if needed
    let eventCertJobs = { waiting: 0, active: 0, completed: 0, failed: 0 };
    let eventEmailJobs = { waiting: 0, active: 0, completed: 0, failed: 0 };

    if (event_id) {
      // Get attendances for this event
      const [attendances] = await pool.query(
        'SELECT id FROM presensi WHERE event_id = ?',
        [event_id]
      );
      const attendanceIds = attendances.map(a => a.id);

      // Count jobs for this event
      eventCertJobs.waiting = certWaiting.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventCertJobs.active = certActive.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventCertJobs.completed = certCompleted.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventCertJobs.failed = certFailed.filter(j => attendanceIds.includes(j.data.attendance_id)).length;

      eventEmailJobs.waiting = emailWaiting.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventEmailJobs.active = emailActive.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventEmailJobs.completed = emailCompleted.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
      eventEmailJobs.failed = emailFailed.filter(j => attendanceIds.includes(j.data.attendance_id)).length;
    }

    res.json({
      success: true,
      data: {
        certificate_queue: {
          total: {
            waiting: certWaiting.length,
            active: certActive.length,
            completed: certCompleted.length,
            failed: certFailed.length
          },
          event: event_id ? eventCertJobs : null
        },
        email_queue: {
          total: {
            waiting: emailWaiting.length,
            active: emailActive.length,
            completed: emailCompleted.length,
            failed: emailFailed.length
          },
          event: event_id ? eventEmailJobs : null
        }
      }
    });

  } catch (error) {
    console.error('Get queue status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get queue status'
    });
  }
};

// Retry failed jobs
export const retryFailedJobs = async (req, res) => {
  try {
    const { queue_type } = req.params; // 'certificate' or 'email'
    
    const queue = queue_type === 'certificate' ? certificateQueue : emailQueue;
    const failedJobs = await queue.getFailed();

    let retriedCount = 0;
    for (const job of failedJobs) {
      await job.retry();
      retriedCount++;
    }

    res.json({
      success: true,
      message: `Retried ${retriedCount} failed jobs`,
      data: {
        queue: queue_type,
        retried: retriedCount
      }
    });

  } catch (error) {
    console.error('Retry failed jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retry jobs'
    });
  }
};

// Clean completed jobs
export const cleanCompletedJobs = async (req, res) => {
  try {
    const certCleaned = await certificateQueue.clean(0, 'completed');
    const emailCleaned = await emailQueue.clean(0, 'completed');

    res.json({
      success: true,
      message: 'Cleaned completed jobs',
      data: {
        certificate_queue: certCleaned,
        email_queue: emailCleaned
      }
    });

  } catch (error) {
    console.error('Clean completed jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean jobs'
    });
  }
};
