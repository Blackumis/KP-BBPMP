import { certificateQueue, emailQueue } from '../config/simpleQueue.js';
import pool from '../config/database.js';
import { generateCertificate } from '../utils/pdfGenerator.js';
import { sendCertificateEmail } from '../utils/emailService.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process certificate generation jobs
certificateQueue.process(async (job) => {
  const { attendance_id, event_data } = job.data;

  try {
    // Update job progress
    await job.progress(10);

    // Get attendance data
    const [attendances] = await pool.query(
      'SELECT * FROM presensi WHERE id = ?',
      [attendance_id]
    );

    if (attendances.length === 0) {
      throw new Error(`Attendance ${attendance_id} not found`);
    }

    const attendance = attendances[0];
    await job.progress(30);

    // Parse certificate_layout if it's a JSON string
    let certificateLayout = null;
    try {
      if (event_data.certificate_layout) {
        certificateLayout = typeof event_data.certificate_layout === 'string' 
          ? JSON.parse(event_data.certificate_layout) 
          : event_data.certificate_layout;
      }
    } catch (err) {
      console.warn('Failed to parse certificate_layout:', err);
    }

    await job.progress(50);

    // Generate PDF certificate
    const result = await generateCertificate(
      attendance,
      {
        nama_kegiatan: event_data.nama_kegiatan,
        tanggal_mulai: event_data.tanggal_mulai,
        tanggal_selesai: event_data.tanggal_selesai,
        certificate_layout: certificateLayout,
        official_qr_path: event_data.official_qr_path
      },
      event_data.template_sertifikat
    );

    if (!result.success) {
      throw new Error('Failed to generate certificate');
    }

    await job.progress(80);

    // Update attendance record
    await pool.query(
      'UPDATE presensi SET certificate_path = ?, status = ? WHERE id = ?',
      [result.filepath, 'menunggu_sertifikat', attendance_id]
    );

    await job.progress(100);

    return {
      success: true,
      attendance_id,
      certificate_path: result.filepath,
      nama: attendance.nama_lengkap
    };

  } catch (error) {
    console.error(`Certificate generation failed for attendance ${attendance_id}:`, error);
    throw error;
  }
});

// Process email sending jobs
emailQueue.process(async (job) => {
  const { attendance_id, event_name } = job.data;

  try {
    await job.progress(10);

    // Get attendance data with certificate
    const [attendances] = await pool.query(
      `SELECT a.*, e.nama_kegiatan
       FROM presensi a
       JOIN kegiatan e ON a.event_id = e.id
       WHERE a.id = ?`,
      [attendance_id]
    );

    if (attendances.length === 0) {
      throw new Error(`Attendance ${attendance_id} not found`);
    }

    const attendance = attendances[0];

    if (!attendance.certificate_path) {
      throw new Error('Certificate not generated yet');
    }

    await job.progress(30);

    // Prepare email content
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

    await job.progress(50);

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

    await job.progress(80);

    // Update status
    await pool.query(
      'UPDATE presensi SET status = ?, sent_at = NOW() WHERE id = ?',
      ['sertifikat_terkirim', attendance_id]
    );

    await job.progress(100);

    return {
      success: true,
      attendance_id,
      email: attendance.email,
      nama: attendance.nama_lengkap
    };

  } catch (error) {
    console.error(`Email sending failed for attendance ${attendance_id}:`, error);
    throw error;
  }
});

console.log('Certificate and Email workers started');

export { certificateQueue, emailQueue };
