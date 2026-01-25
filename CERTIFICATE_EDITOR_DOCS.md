# Certificate Editor - Dokumentasi Fitur

## 📋 Overview

Fitur **Certificate Editor** memungkinkan admin untuk mendesain layout sertifikat secara visual menggunakan antarmuka drag-and-drop. Admin dapat mengatur posisi, ukuran, alignment, dan styling untuk setiap elemen teks pada sertifikat.

## ✨ Fitur Utama

### 1. **Drag & Drop Interface**
- Seret field ke posisi yang diinginkan pada template
- Real-time preview saat mengedit
- Visual feedback saat field dipilih

### 2. **Customizable Text Properties**
- **Font Size**: 8px - 36px (adjustable dengan slider)
- **Font Weight**: Normal atau Bold
- **Text Alignment**: Left, Center, atau Right
- **Position**: Fine-tune dengan input X/Y (persentase)

### 3. **Field Types**

#### Field Statis (Static Text)
Teks yang sama untuk semua sertifikat:
- Judul Sertifikat (default: "SERTIFIKAT")
- Subjudul (default: "Diberikan kepada:")
- Teks Kegiatan (default: "Telah mengikuti kegiatan:")

#### Field Dinamis (Dynamic Data)
Otomatis terisi dari database:
- **Nama Peserta** (`nama_lengkap`)
- **Unit Kerja** (`unit_kerja`)
- **Kabupaten/Kota** (`kabupaten_kota`)
- **Nama Kegiatan** (`nama_kegiatan`)
- **Tanggal Kegiatan** (`tanggal`)
- **Nomor Sertifikat** (`nomor_sertifikat`)

## 🎨 Cara Menggunakan

### Step-by-Step Guide

#### 1. Masuk ke Admin Panel
```
Login → Admin → Buat Kegiatan Baru / Edit Kegiatan
```

#### 2. Step 1: Data Kegiatan
- Isi informasi kegiatan (nama, nomor surat, tanggal, dll)
- **Upload template sertifikat** atau pilih dari library
- Klik "Lanjut: Layout Sertifikat"

#### 3. Step 2: Layout Sertifikat
**Canvas Area** (kiri):
- Template sertifikat ditampilkan sebagai background
- Field-field teks ditampilkan di atas template
- Klik dan drag field untuk memindahkan posisi

**Control Panel** (kanan):
- **Field Settings**: Edit properties field yang dipilih
  - Konten (untuk static text)
  - Ukuran Font (slider)
  - Font Weight (dropdown)
  - Text Align (buttons)
  - Posisi X dan Y (input number)
- **Daftar Field**: List semua field yang tersedia

**Tips**:
- Klik field untuk edit properties-nya
- Field yang dipilih akan highlight dengan border biru
- Hover field untuk preview selection

#### 4. Mengatur Text Alignment

**Left Align**:
```
Posisi X = mulai dari kiri
Text akan mulai dari posisi X
```

**Center Align**:
```
Posisi X = 50 (untuk center horizontal)
Text akan di-center pada posisi X
Width field menentukan lebar area text
```

**Right Align**:
```
Posisi X = akhir text
Text akan berakhir di posisi X
```

#### 5. Step 3: Atur Absensi
- Konfigurasi field form absensi
- Klik "Simpan Kegiatan"

### Contoh Pengaturan Layout

#### Judul Centered
```json
{
  "id": "title",
  "content": "SERTIFIKAT",
  "x": 50,        // center horizontal
  "y": 15,        // 15% dari atas
  "fontSize": 28,
  "fontWeight": "bold",
  "textAlign": "center",
  "width": 100    // full width
}
```

#### Nama Peserta (Large, Centered)
```json
{
  "id": "participant_name",
  "field": "nama_lengkap",
  "x": 50,
  "y": 32,
  "fontSize": 24,
  "fontWeight": "bold",
  "textAlign": "center",
  "width": 100
}
```

## 🔧 Technical Details

### Data Structure

Layout disimpan sebagai JSON array di kolom `certificate_layout`:

```json
[
  {
    "id": "title",
    "label": "Judul Sertifikat",
    "type": "text",              // "text" atau "dynamic"
    "content": "SERTIFIKAT",     // untuk type "text"
    "field": "nama_lengkap",     // untuk type "dynamic"
    "x": 50,                     // 0-100%
    "y": 15,                     // 0-100%
    "fontSize": 28,              // 8-36
    "fontWeight": "bold",        // "normal" atau "bold"
    "textAlign": "center",       // "left", "center", "right"
    "width": 100                 // 0-100%
  }
]
```

### PDF Generation Flow

1. **Backend** menerima data attendance dan event
2. Cek apakah ada `certificate_layout` di event data
3. Jika ada:
   - Render setiap field sesuai layout
   - Convert persentase posisi ke pixel absolut
   - Apply font styling dan alignment
4. Jika tidak ada:
   - Gunakan default layout (legacy)
5. Generate PDF dan simpan

### Position Calculation

```javascript
// Convert percentage to absolute position
const pageWidth = 842;   // A4 landscape
const pageHeight = 595;  // A4 landscape

const xPos = (field.x / 100) * pageWidth;
const yPos = (field.y / 100) * pageHeight;
```

## 🎯 Best Practices

### 1. Template Design
- Gunakan template dengan ruang kosong untuk teks
- Hindari background yang terlalu ramai
- Resolusi minimal: 1200x800px

### 2. Layout Tips
- **Centered elements**: Set X = 50%, width = 100%
- **Spacing**: Jarak Y minimal 5-7% antar field
- **Font size**: 
  - Title: 24-32px
  - Subtitle: 14-18px
  - Body: 10-14px
  - Footer: 8-10px

### 3. Readability
- Pastikan kontras teks dengan background
- Gunakan bold untuk emphasis
- Jangan terlalu banyak font size berbeda

### 4. Testing
- Preview layout di Step 2
- Test generate sertifikat dengan data dummy
- Cek hasil PDF sebelum digunakan untuk event

## 🐛 Troubleshooting

### Layout tidak tersimpan
**Penyebab**: Database migration belum dijalankan
**Solusi**: 
```bash
cd backend
node migrations/runCertificateLayoutMigration.js
```

### Field terpotong di PDF
**Penyebab**: Posisi X/Y melebihi 100%
**Solusi**: Adjust posisi agar dalam range 0-100%

### Text tidak center
**Penyebab**: Text align center tapi X tidak di 50
**Solusi**: 
- Set X = 50
- Set Width = 100 (atau sesuai kebutuhan)

### Preview berbeda dengan PDF
**Penyebab**: Font size di preview di-scale 60%
**Solusi**: Ini normal, PDF menggunakan ukuran asli

### Field tidak muncul di PDF
**Penyebab**: Field di luar canvas (Y > 100%)
**Solusi**: Adjust posisi Y ke dalam range 0-100%

## 📝 API Reference

### Create/Update Event dengan Layout

**Request**:
```json
{
  "nama_kegiatan": "Workshop 2024",
  "nomor_surat": "001/2024",
  // ... other fields
  "certificate_layout": [
    {
      "id": "title",
      "type": "text",
      "content": "SERTIFIKAT",
      "x": 50,
      "y": 15,
      "fontSize": 28,
      "fontWeight": "bold",
      "textAlign": "center",
      "width": 100
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": 1,
    "nama_kegiatan": "Workshop 2024"
  }
}
```

## 🔄 Migration & Updates

### Database Schema
```sql
ALTER TABLE events 
ADD COLUMN certificate_layout JSON NULL 
COMMENT 'Custom certificate layout configuration';
```

### Backward Compatibility
- Events tanpa `certificate_layout` akan gunakan default layout
- Existing certificates tetap valid
- Dapat switch antara custom dan default layout

## 📚 Resources

- [PDFKit Documentation](http://pdfkit.org/)
- [React DnD](https://react-dnd.github.io/react-dnd/)
- A4 Landscape: 842 x 595 points (at 72 DPI)
