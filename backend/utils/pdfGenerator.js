import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure certificates directory exists
const certificatesDir = path.join(__dirname, '../certificates');
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

export const generateCertificate = async (attendanceData, eventData, templatePath = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 50
      });

      // Generate filename
      const filename = `certificate-${attendanceData.id}-${Date.now()}.pdf`;
      const filepath = path.join(certificatesDir, filename);

      // Pipe to file
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // If template exists, use it as background
      if (templatePath && fs.existsSync(path.join(__dirname, '..', templatePath))) {
        try {
          doc.image(path.join(__dirname, '..', templatePath), 0, 0, {
            width: doc.page.width,
            height: doc.page.height
          });
        } catch (err) {
          console.error('Error loading template:', err);
        }
      }

      // Add certificate content
      // Title
      doc.fontSize(28)
         .font('Helvetica-Bold')
         .text('SERTIFIKAT', 0, 150, { align: 'center' });

      doc.fontSize(14)
         .font('Helvetica')
         .text('Diberikan kepada:', 0, 200, { align: 'center' });

      // Participant name
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text(attendanceData.nama_lengkap, 0, 230, { align: 'center' });

      // Event details
      doc.fontSize(12)
         .font('Helvetica')
         .text(`${attendanceData.unit_kerja}`, 0, 270, { align: 'center' })
         .text(`${attendanceData.kabupaten_kota}`, 0, 290, { align: 'center' });

      doc.fontSize(14)
         .text('Telah mengikuti kegiatan:', 0, 330, { align: 'center' });

      doc.fontSize(18)
         .font('Helvetica-Bold')
         .text(eventData.nama_kegiatan, 0, 360, { align: 'center' });

      // Date
      const startDate = new Date(eventData.tanggal_mulai).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      const endDate = new Date(eventData.tanggal_selesai).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      doc.fontSize(12)
         .font('Helvetica')
         .text(`${startDate} - ${endDate}`, 0, 400, { align: 'center' });

      // Certificate number
      doc.fontSize(10)
         .text(`Nomor Sertifikat: ${attendanceData.nomor_sertifikat}`, 0, 450, { align: 'center' });

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
      doc.fontSize(9)
         .text(`NIP: ${attendanceData.nip || '-'}`, 100, 520, { align: 'left' });

      if (attendanceData.pangkat_golongan) {
        doc.text(`Pangkat/Golongan: ${attendanceData.pangkat_golongan}`, 100, 535);
      }

      if (attendanceData.jabatan) {
        doc.text(`Jabatan: ${attendanceData.jabatan}`, 100, 550);
      }

      // Finalize PDF
      doc.end();

      writeStream.on('finish', () => {
        resolve({
          success: true,
          filename,
          filepath: `certificates/${filename}`
        });
      });

      writeStream.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
};
