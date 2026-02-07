import path from "path";
import fs from "fs";
import pool from "../config/database.js";
import { generateAttendanceReport } from "../utils/pdfGenerator.js";

export const generateEventAttendanceReport = async (req, res) => {
  try {
    const { event_id } = req.params;

    /* ====================== GET EVENT DATA ====================== */
    const [events] = await pool.query("SELECT id, nama_kegiatan, tanggal_mulai FROM kegiatan WHERE id = ?", [event_id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = events[0];

    /* ====================== GET ATTENDANCES ====================== */
    const [attendances] = await pool.query(
      `SELECT 
        urutan_absensi,
        nama_lengkap,
        unit_kerja,
        kabupaten_kota,
        signature_url
      FROM presensi
      WHERE event_id = ?
      ORDER BY urutan_absensi ASC`,
      [event_id],
    );

    if (attendances.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No attendance data found",
      });
    }

    /* ====================== GET ACTIVE KOP SURAT ====================== */
    const [kopRows] = await pool.query("SELECT kop_url FROM kop_surat WHERE is_active = 1 LIMIT 1");

    const kopPath = kopRows.length ? kopRows[0].kop_url : null;

    /* ====================== FORMAT DATA ====================== */
    const eventTitle = event.nama_kegiatan;
    const eventDate = new Date(event.tanggal_mulai).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    /* ====================== GENERATE PDF ====================== */
    const result = await generateAttendanceReport(eventTitle, eventDate, attendances, kopPath);

    if (!result.success) {
      throw new Error("PDF generation failed");
    }

    // Tunggu sedikit untuk memastikan file benar-benar siap
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the file exists and is readable
    if (!fs.existsSync(result.filepath)) {
      throw new Error("Generated PDF file not found");
    }

    const stats = fs.statSync(result.filepath);
    if (stats.size === 0) {
      throw new Error("Generated PDF file is empty");
    }

    const safeEventTitle = eventTitle.replace(/[<>:"/\\|?*]+/g, "").trim();
    const downloadName = `Laporan Absensi - ${safeEventTitle} (${eventDate}).pdf`;

    // Set proper headers for PDF download
    // NOTE: Do NOT set Content-Length when compression middleware is active
    // as it causes size mismatch and corrupted downloads
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(downloadName)}"`);
    res.setHeader('Content-Length', stats.size);
    // Disable compression for this binary response
    res.setHeader('Content-Encoding', 'identity');

    // Stream the file
    const fileStream = fs.createReadStream(result.filepath);
    
    fileStream.on('error', (err) => {
      console.error("File stream error:", err);
      // Destroy the stream to prevent hanging
      fileStream.destroy();
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to stream PDF file",
        });
      }
    });

    // Clean up the temp file after sending
    res.on('finish', () => {
      try {
        if (fs.existsSync(result.filepath)) {
          fs.unlinkSync(result.filepath);
        }
      } catch (e) {
        // ignore cleanup errors
      }
    });
    
    fileStream.pipe(res);
  } catch (err) {
    console.error("Controller error:", err);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Failed to generate attendance report",
        error: err.message,
      });
    }
  }
};
