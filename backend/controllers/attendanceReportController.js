import path from "path";
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

    const safeEventTitle = eventTitle.replace(/[<>:"/\\|?*]+/g, "").trim();
    const downloadName = `Laporan Absensi - ${safeEventTitle} (${eventDate}).pdf`;

    // Kirim file
    res.download(result.filepath, downloadName, (err) => {
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: "Failed to download PDF",
          });
        }
      }
    });
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
