import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import QRCode from "qrcode";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure certificates directory exists
const certificatesDir = path.join(__dirname, "../certificates");
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

// Helper function to get PDFKit font name from font family setting
const getFontName = (fontFamily, fontWeight) => {
  // Map custom font families to PDFKit built-in fonts
  const fontMap = {
    "Times-Roman": fontWeight === "bold" ? "Times-Bold" : "Times-Roman",
    "Helvetica": fontWeight === "bold" ? "Helvetica-Bold" : "Helvetica",
    "Courier": fontWeight === "bold" ? "Courier-Bold" : "Courier",
    "Times-Bold": "Times-Bold",
    "Helvetica-Bold": "Helvetica-Bold",
    "Courier-Bold": "Courier-Bold",
  };
  
  return fontMap[fontFamily] || (fontWeight === "bold" ? "Helvetica-Bold" : "Helvetica");
};

export const generateCertificate = async (attendanceData, eventData, templatePath = null) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 0,
      });

      // Generate filename
      const filename = `certificate-${attendanceData.id}-${Date.now()}.pdf`;
      const filepath = path.join(certificatesDir, filename);

      // Pipe to file
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      const pageWidth = doc.page.width; // 842 for A4 landscape
      const pageHeight = doc.page.height; // 595 for A4 landscape

      // If template exists, use it as background
      if (templatePath && fs.existsSync(path.join(__dirname, "..", templatePath))) {
        try {
          doc.image(path.join(__dirname, "..", templatePath), 0, 0, {
            width: pageWidth,
            height: pageHeight,
          });
        } catch (err) {
          console.error("Error loading template:", err);
        }
      }

      // Check if custom layout exists
      const hasCustomLayout = eventData.certificate_layout && Array.isArray(eventData.certificate_layout) && eventData.certificate_layout.length > 0;

      if (hasCustomLayout) {
        // Use custom layout from certificate editor
        const layout = eventData.certificate_layout;
        
        // Helper function to get dynamic field value
        const getDynamicValue = (fieldName) => {
          switch (fieldName) {
            case "nama_lengkap":
              return attendanceData.nama_lengkap || "";
            case "unit_kerja":
              return attendanceData.unit_kerja || "";
            case "kabupaten_kota":
              return attendanceData.kabupaten_kota || "";
            case "nip":
              return attendanceData.nip ? `NIP: ${attendanceData.nip}` : "";
            case "pangkat_golongan":
              return attendanceData.pangkat_golongan ? `Pangkat/Gol: ${attendanceData.pangkat_golongan}` : "";
            case "jabatan":
              return attendanceData.jabatan ? `Jabatan: ${attendanceData.jabatan}` : "";
            case "nama_kegiatan":
              return eventData.nama_kegiatan || "";
            case "tanggal":
              const startDate = new Date(eventData.tanggal_mulai).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              const endDate = new Date(eventData.tanggal_selesai).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return `${startDate} - ${endDate}`;
            case "nomor_sertifikat":
              return `Nomor Sertifikat: ${attendanceData.nomor_sertifikat}`;
            case "validation_url":
              return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/validasi/${encodeURIComponent(attendanceData.nomor_sertifikat)}`;
            case "signature_authority":
              return `TTD_ATASAN_${attendanceData.nomor_sertifikat}`;
            default:
              return "";
          }
        };

        // Render each field based on layout
        for (const field of layout) {
          // Convert percentage positions to absolute positions
          const xPos = (field.x / 100) * pageWidth;
          const yPos = (field.y / 100) * pageHeight;
          const fieldWidth = (field.width / 100) * pageWidth;
          const fieldHeight = (field.height / 100) * pageHeight;

          if (field.type === "qr") {
            // Generate QR Code
            try {
              let qrBuffer = null;
              
              // Check if this is the signature authority QR and we have an official QR
              if (field.field === "signature_authority" && eventData.official_qr_path) {
                // Use the official's QR code image
                const qrPath = path.join(__dirname, "..", eventData.official_qr_path);
                if (fs.existsSync(qrPath)) {
                  // Calculate position based on textAlign
                  let qrX = xPos;
                  if (field.textAlign === "center") {
                    qrX = xPos - fieldWidth / 2;
                  } else if (field.textAlign === "right") {
                    qrX = xPos - fieldWidth;
                  }
                  
                  // Add QR image to PDF
                  doc.image(qrPath, qrX, yPos, {
                    width: fieldWidth,
                    height: fieldHeight,
                    fit: [fieldWidth, fieldHeight],
                  });
                  continue; // Skip to next field
                }
              }
              
              // For other QR codes (validation, etc.), generate dynamically
              const qrData = getDynamicValue(field.field);
              if (qrData) {
                // Generate QR code as buffer
                qrBuffer = await QRCode.toBuffer(qrData, {
                  errorCorrectionLevel: 'H',
                  type: 'png',
                  width: 200,
                  margin: 1
                });
                
                // Calculate position based on textAlign
                let qrX = xPos;
                if (field.textAlign === "center") {
                  qrX = xPos - fieldWidth / 2;
                } else if (field.textAlign === "right") {
                  qrX = xPos - fieldWidth;
                }
                
                // Add QR image to PDF
                doc.image(qrBuffer, qrX, yPos, {
                  width: fieldWidth,
                  height: fieldHeight,
                  fit: [fieldWidth, fieldHeight],
                });
              }
            } catch (err) {
              console.error("Error generating QR code:", err);
            }
          } else {
            // Text field (static or dynamic)
            const fontName = getFontName(field.fontFamily || "Times-Roman", field.fontWeight || "normal");
            doc.font(fontName).fontSize(field.fontSize).fillColor('black');
            
            // Get text content
            const text = field.type === "text" ? field.content : getDynamicValue(field.field);
            
            if (text) {
              // Calculate position and width based on alignment
              let textX = xPos;
              let textWidth = fieldWidth;
              let textAlign = field.textAlign || "left";
              
              // Set text options
              const textOptions = {
                width: textWidth,
                align: textAlign,
                lineBreak: field.wordWrap !== false,
              };

              // Adjust X position for center alignment
              if (textAlign === "center") {
                textX = xPos - fieldWidth / 2;
              } else if (textAlign === "right") {
                textX = xPos - fieldWidth;
              }
              
              // Render text
              doc.text(text, textX, yPos, textOptions);
            }
          }
        }
      } else {
        // Use default layout (legacy)
        // Title
        doc.fontSize(28).font("Helvetica-Bold").text("SERTIFIKAT", 0, 150, { align: "center" });

        doc.fontSize(14).font("Helvetica").text("Diberikan kepada:", 0, 200, { align: "center" });

        // Participant name
        doc.fontSize(24).font("Helvetica-Bold").text(attendanceData.nama_lengkap, 0, 230, { align: "center" });

        // Event details
        doc.fontSize(12).font("Helvetica").text(`${attendanceData.unit_kerja}`, 0, 270, { align: "center" }).text(`${attendanceData.kabupaten_kota}`, 0, 290, { align: "center" });

        doc.fontSize(14).text("Telah mengikuti kegiatan:", 0, 330, { align: "center" });

        doc.fontSize(18).font("Helvetica-Bold").text(eventData.nama_kegiatan, 0, 360, { align: "center" });

        // Date
        const startDate = new Date(eventData.tanggal_mulai).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const endDate = new Date(eventData.tanggal_selesai).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        doc.fontSize(12).font("Helvetica").text(`${startDate} - ${endDate}`, 0, 400, { align: "center" });

        // Certificate number
        doc.fontSize(10).text(`Nomor Sertifikat: ${attendanceData.nomor_sertifikat}`, 0, 450, { align: "center" });

        // Validation link - pointing to frontend
        const validationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/validasi/${encodeURIComponent(attendanceData.nomor_sertifikat)}`;
        doc.fontSize(9)
           .fillColor('blue')
           .text('Validasi Sertifikat:', 0, 470, { align: 'center', continued: false })
           .fillColor('blue')
           .text(validationUrl, 0, 485, { 
             align: 'center',
             link: validationUrl,
             underline: true
           })
           .fillColor('black');

        // Additional info at bottom
        doc.fontSize(9).text(`NIP: ${attendanceData.nip || "-"}`, 100, 520, { align: "left" });

        if (attendanceData.pangkat_golongan) {
          doc.text(`Pangkat/Golongan: ${attendanceData.pangkat_golongan}`, 100, 535);
        }

        if (attendanceData.jabatan) {
          doc.text(`Jabatan: ${attendanceData.jabatan}`, 100, 550);
        }
      }

      // Finalize PDF
      doc.end();

      writeStream.on("finish", () => {
        resolve({
          success: true,
          filename,
          filepath: `certificates/${filename}`,
        });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const reportsDir = path.join(__dirname, "../reports");
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

export const generateAttendanceReport = async (eventTitle, eventDate, attendanceList) => {
  return new Promise((resolve, reject) => {
    try {
      const safeTitle = eventTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const filename = `laporan-absensi-${safeTitle}.pdf`;
      const filepath = path.join(reportsDir, filename);

      if (fs.existsSync(filepath)) {
        return resolve({
          success: true,
          filename,
          filepath,
          alreadyExists: true,
        });
      }

      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      /* ===== KOP SURAT (HEADER IMAGE) ===== */
      // Path relatif dari file controller ini ke folder assets di backend
      const kopPath = path.join(__dirname, "..", "assets", "kop-surat.png");
      
      if (fs.existsSync(kopPath)) {
        doc.image(kopPath, 50, 30, {
          width: 495,
          align: "center",
        });
        doc.moveDown(9);
      }

      /* ===== HEADER ===== */
      doc.fontSize(14).font("Times-Bold").text(eventTitle, { align: "center" });
      doc.moveDown(0.5).fontSize(11).font("Times-Roman").text(eventDate, { align: "center" });
      doc.moveDown(2);

      /* ===== TABLE SETUP ===== */
      const tableTop = doc.y;
      const rowHeight = 35;
      const headerHeight = 25;

      const col = { 
        no: 50, 
        nama: 80, 
        unit: 200, 
        kota: 320, 
        ttd: 445 
      };

      const tableWidth = 495;

      /* ===== TABLE HEADER BACKGROUND ===== */
      doc
        .rect(50, tableTop, tableWidth, headerHeight)
        .fillAndStroke("#d3d3d3", "#000000");

      /* ===== TABLE HEADER TEXT ===== */
      doc.fillColor("#000000").font("Times-Bold").fontSize(10);
      doc.text("No", col.no, tableTop + 7, { width: 25, align: "center" });
      doc.text("Nama Lengkap", col.nama, tableTop + 7, { width: 115, align: "center" });
      doc.text("Unit Kerja", col.unit, tableTop + 7, { width: 115, align: "center" });
      doc.text("Kabupaten/Kota", col.kota, tableTop + 7, { width: 115, align: "center" });
      doc.text("Tanda Tangan", col.ttd, tableTop + 7, { width: 105, align: "center" });

      /* ===== VERTICAL LINES FOR HEADER ===== */
      doc.strokeColor("#000000");
      doc.moveTo(col.nama - 5, tableTop).lineTo(col.nama - 5, tableTop + headerHeight).stroke();
      doc.moveTo(col.unit - 5, tableTop).lineTo(col.unit - 5, tableTop + headerHeight).stroke();
      doc.moveTo(col.kota - 5, tableTop).lineTo(col.kota - 5, tableTop + headerHeight).stroke();
      doc.moveTo(col.ttd - 5, tableTop).lineTo(col.ttd - 5, tableTop + headerHeight).stroke();

      /* ===== ROWS ===== */
      doc.font("Times-Roman").fontSize(10);
      let y = tableTop + headerHeight;

      attendanceList.forEach((item, index) => {
        if (y > doc.page.height - 100) {
          doc.addPage();
          
          if (fs.existsSync(kopPath)) {
            doc.image(kopPath, 50, 30, {
              width: 495,
              align: "center",
            });
          }
          
          y = 150;
        }

        doc.strokeColor("#000000");
        doc.moveTo(50, y).lineTo(50, y + rowHeight).stroke();

        doc.fillColor("#000000");
        doc.text(index + 1, col.no, y + 7, { width: 25, align: "center" });
        doc.text(item.nama_lengkap, col.nama, y + 7, { width: 115 });
        doc.text(item.unit_kerja || "-", col.unit, y + 7, { width: 115 });
        doc.text(item.kabupaten_kota || "-", col.kota, y + 7, { width: 115 });

        const signatureField = item.signature_path || item.signature_url;

        if (signatureField) {
          let signaturePath;

          if (signatureField.startsWith("http://") || signatureField.startsWith("https://")) {
            const urlObj = new URL(signatureField);
            const relativePath = urlObj.pathname;
            signaturePath = path.join(__dirname, "..", relativePath);
          } else {
            signaturePath = path.join(__dirname, "..", signatureField);
          }

          if (fs.existsSync(signaturePath)) {
            try {
              doc.image(signaturePath, col.ttd + 10, y + 5, {
                width: 95,
                height: 30,
                fit: [95, 30],
                align: "center",
                valign: "center",
              });
            } catch (imgErr) {
              doc.text("-", col.ttd, y + 7, { width: 105, align: "center" });
            }
          } else {
            doc.text("-", col.ttd, y + 7, { width: 105, align: "center" });
          }
        } else {
          doc.text("-", col.ttd, y + 7, { width: 105, align: "center" });
        }

        doc.strokeColor("#000000");
        doc.moveTo(col.nama - 5, y).lineTo(col.nama - 5, y + rowHeight).stroke();
        doc.moveTo(col.unit - 5, y).lineTo(col.unit - 5, y + rowHeight).stroke();
        doc.moveTo(col.kota - 5, y).lineTo(col.kota - 5, y + rowHeight).stroke();
        doc.moveTo(col.ttd - 5, y).lineTo(col.ttd - 5, y + rowHeight).stroke();
        
        doc.moveTo(545, y).lineTo(545, y + rowHeight).stroke();
        doc.moveTo(50, y + rowHeight).lineTo(545, y + rowHeight).stroke();

        y += rowHeight;
      });

      doc.end();

      writeStream.on("finish", () => {
        resolve({
          success: true,
          filename,
          filepath,
          alreadyExists: false,
        });
      });

      writeStream.on("error", (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};
