# Certificate Editor Feature - Setup Instructions

## Fitur Baru
Fitur editor sertifikat dengan drag-and-drop telah ditambahkan! Admin sekarang dapat:
- ✅ Mengatur layout sertifikat secara visual dengan drag & drop
- ✅ Mengatur posisi, ukuran font, dan alignment setiap field
- ✅ Text dapat di-center, left, atau right align
- ✅ Preview real-time saat mengedit layout

## Setup Database

Jalankan migration berikut di database MySQL Anda:

```sql
USE kp_bbpmp_db;

-- Add certificate_layout column
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS certificate_layout JSON NULL COMMENT 'Custom certificate layout configuration' 
AFTER template_sertifikat;

-- Add template_id column (jika belum ada)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS template_id INT NULL COMMENT 'Reference to certificate_templates table'
AFTER template_sertifikat;

-- Add template_source column (jika belum ada)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS template_source ENUM('upload', 'template') DEFAULT 'upload' COMMENT 'Source of certificate template'
AFTER template_id;

-- Add index for template_id
ALTER TABLE events
ADD INDEX IF NOT EXISTS idx_template_id (template_id);
```

## Cara Menggunakan

### 1. Buat atau Edit Kegiatan
- Buka halaman Admin Panel
- Pilih "Buat Kegiatan Baru" atau edit kegiatan yang sudah ada

### 2. Step 1: Data Kegiatan
- Isi data kegiatan seperti biasa
- **Upload atau pilih template sertifikat** (wajib untuk menggunakan editor)

### 3. Step 2: Layout Sertifikat (BARU!)
- Halaman editor akan menampilkan template yang dipilih
- **Drag field-field** di canvas untuk mengatur posisi
- Klik field untuk mengatur:
  - Ukuran font (8-36px)
  - Font weight (Normal/Bold)
  - Text alignment (Left/Center/Right)
  - Posisi X dan Y (dalam persentase)
  
### 4. Step 3: Atur Absensi
- Konfigurasi field absensi seperti biasa
- Simpan kegiatan

### 5. Generate Sertifikat
- Sertifikat akan otomatis menggunakan layout yang sudah Anda atur
- Jika tidak ada custom layout, akan menggunakan layout default

## Field yang Tersedia di Editor

### Field Statis (dapat diedit teksnya):
- Judul Sertifikat
- Subjudul
- Teks Kegiatan

### Field Dinamis (otomatis terisi data):
- Nama Peserta (dari data absensi)
- Unit Kerja (dari data absensi)
- Kabupaten/Kota (dari data absensi)
- Nama Kegiatan (dari data event)
- Tanggal Kegiatan (dari data event)
- Nomor Sertifikat (auto-generated)

## Tips Penggunaan

1. **Centered Text**: 
   - Set "Text Align" ke "Center"
   - Posisi X di 50% untuk center horizontal
   
2. **Preview**: 
   - Ukuran font di preview lebih kecil (60% dari ukuran asli)
   - PDF final akan menggunakan ukuran font yang sebenarnya

3. **Fine Tuning**:
   - Gunakan input X/Y untuk posisi presisi
   - Gunakan slider untuk ukuran font yang tepat

## File yang Diubah

### Frontend:
- ✅ `frontend/src/components/CertificateEditor.jsx` (BARU)
- ✅ `frontend/src/components/AdminPanel.jsx` (Updated - tambah step 2)

### Backend:
- ✅ `backend/controllers/eventController.js` (Updated - handle certificate_layout)
- ✅ `backend/utils/pdfGenerator.js` (Updated - render custom layout)
- ✅ `backend/migrations/add_certificate_layout.sql` (BARU)

## Troubleshooting

### Layout tidak tersimpan?
- Pastikan migration sudah dijalankan
- Cek kolom `certificate_layout` ada di tabel `events`

### Field tidak muncul di PDF?
- Pastikan field tidak di luar canvas (0-100%)
- Cek console browser untuk error

### Template tidak muncul di editor?
- Pastikan template sudah dipilih di Step 1
- Refresh halaman jika perlu

## Catatan Teknis

- Layout disimpan sebagai JSON array di database
- Posisi menggunakan persentase (responsif terhadap ukuran PDF)
- PDF generator mendukung fallback ke layout default jika tidak ada custom layout
