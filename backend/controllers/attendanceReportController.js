import path from "path";
import pool from "../config/database.js";
import { generateAttendanceReport } from "../utils/pdfGenerator.js";

export const generateEventAttendanceReport = async (req, res) => {
  try {
    const { event_id } = req.params;
    console.log("🔵 CONTROLLER: Starting PDF generation");
    console.log("🔵 CONTROLLER: Request params:", req.params);
    /* ======================
       GET EVENT DATA
    ====================== */
    const [events] = await pool.query("SELECT id, nama_kegiatan, tanggal_mulai FROM events WHERE id = ?", [event_id]);

    if (events.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const event = events[0];

    /* ======================
       GET ATTENDANCES
    ====================== */
    const [attendances] = await pool.query(
      `SELECT 
        urutan_absensi,
        nama_lengkap,
        unit_kerja,
        kabupaten_kota,
        signature_url
      FROM attendances
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

    /* ======================
       FORMAT DATA
    ====================== */
    const eventTitle = event.nama_kegiatan;
    const eventDate = new Date(event.tanggal_mulai).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    /* ======================
       GENERATE PDF
    ====================== */
    console.log("🔵 CONTROLLER: Event title:", eventTitle);
    console.log("🔵 CONTROLLER: Event date:", eventDate);
    console.log("🔵 CONTROLLER: Attendances count:", attendances.length);
    console.log("🔵 CONTROLLER: First attendance:", attendances[0]);

    const result = await generateAttendanceReport(eventTitle, eventDate, attendances);

    console.log("🔵 CONTROLLER: PDF Result:", result);
    
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);

    res.download(result.filepath);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed generate attendance report" });
  }
};
