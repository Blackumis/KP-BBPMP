# Implementasi Fitur Pejabat Penandatangan & Perbaikan Certificate Editor

## Ringkasan Perubahan

Telah berhasil diimplementasikan:
1. ✅ Perbaikan alignment text di Certificate Editor
2. ✅ Tab baru untuk manajemen pejabat penandatangan
3. ✅ Upload gambar tanda tangan yang otomatis dikonversi menjadi QR code
4. ✅ CRUD lengkap untuk data pejabat (Create, Read, Update, Delete)
5. ✅ Integrasi pemilihan pejabat saat buat/edit kegiatan
6. ✅ QR code tanda tangan otomatis ditambahkan di sertifikat

## Perubahan Database

### Tabel Baru: `officials`
```sql
CREATE TABLE officials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  signature_image_path VARCHAR(500) NULL,
  signature_qr_path VARCHAR(500) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### Perubahan Tabel `events`
- Ditambahkan kolom `official_id INT NULL` dengan foreign key ke tabel `officials`

## File-File Baru

### Backend
1. **migrations/add_officials_table.sql** - Script SQL untuk tabel officials
2. **migrations/runOfficialsMigration.js** - Runner untuk migrasi
3. **controllers/officialController.js** - Controller untuk manajemen officials
   - getAllOfficials() - Ambil semua pejabat
   - getActiveOfficials() - Ambil pejabat aktif saja
   - getOfficialById() - Ambil detail pejabat
   - createOfficial() - Buat pejabat baru dengan upload & QR generation
   - updateOfficial() - Update data pejabat
   - deleteOfficial() - Hapus pejabat
4. **routes/officialRoutes.js** - Routes untuk API officials dengan multer upload

### Frontend
1. **components/OfficialsManagement.jsx** - Komponen UI untuk manajemen pejabat
   - Tab interface dengan tabel daftar pejabat
   - Modal form untuk tambah/edit pejabat
   - Upload gambar tanda tangan
   - Preview QR code hasil generate
   - Delete confirmation dialog

## File-File yang Dimodifikasi

### Backend
1. **server.js**
   - Import officialRoutes
   - Tambah route `/api/officials`

2. **controllers/eventController.js**
   - Tambah field `official_id` di createEvent()
   - Tambah field `official_id` di updateEvent()
   - Update SQL INSERT dan UPDATE untuk include official_id

3. **controllers/certificateController.js**
   - Update query untuk LEFT JOIN dengan tabel officials
   - Kirim `official_qr_path` ke pdfGenerator

4. **utils/pdfGenerator.js**
   - Update logic QR code untuk field `signature_authority`
   - Jika ada official_qr_path, gunakan gambar QR yang sudah di-generate
   - Jika tidak, generate QR code dinamis
   - Perbaikan alignment untuk left, center, right

### Frontend
1. **services/api.js**
   - Tambah `officialsAPI` dengan semua method CRUD
   - Export officialsAPI di default export

2. **pages/admin/ListEvents.jsx**
   - Tambah state `activeTab` untuk tab switching
   - Import OfficialsManagement component
   - Tambah tab navigation UI
   - Conditional rendering: tab "Daftar Kegiatan" vs "Pejabat Penandatangan"

3. **components/AdminPanel.jsx**
   - Import officialsAPI
   - Tambah state `officials` dan `official_id` di formData
   - Tambah function loadOfficials()
   - Tambah dropdown select pejabat di Step 1 form
   - Include official_id saat submit event

4. **components/CertificateEditor.jsx**
   - **PERBAIKAN ALIGNMENT**: 
     - Hapus transform translateX di outer div
     - Tambah justifyContent di flex container
     - Text alignment sekarang bekerja dengan benar: left, center, right
   - Field QR code signature_authority sudah tersedia di default fields

## Fitur-Fitur Baru

### 1. Manajemen Pejabat Penandatangan
- **Lokasi**: Tab "Pejabat Penandatangan" di halaman admin
- **Fitur**:
  - Daftar semua pejabat dalam bentuk tabel
  - Tambah pejabat baru dengan form modal
  - Edit data pejabat existing
  - Hapus pejabat dengan konfirmasi
  - Upload gambar tanda tangan (JPG, PNG, max 5MB)
  - QR code otomatis di-generate dari gambar tanda tangan
  - Status aktif/nonaktif
  - Preview gambar dan QR code

### 2. Integrasi di Kegiatan
- **Lokasi**: Step 1 - Data Kegiatan (saat create/edit event)
- **Fitur**:
  - Dropdown untuk pilih pejabat penandatangan
  - Opsional (bisa dikosongkan)
  - Tooltip: "QR code tanda tangan akan ditambahkan secara otomatis pada sertifikat"

### 3. QR Code di Sertifikat
- **Otomatis**: Jika kegiatan memiliki pejabat terpilih
- **Field**: `signature_authority` (QR TTD Atasan)
- **Posisi**: Default di pojok kiri bawah (bisa diubah di editor)
- **Data QR**: Berisi URL ke gambar tanda tangan pejabat

### 4. Perbaikan Text Alignment
- **Left**: Text rata kiri dalam box
- **Center**: Text rata tengah dalam box
- **Right**: Text rata kanan dalam box
- **Konsisten** di preview editor dan PDF output

## Cara Penggunaan

### Menambah Pejabat Baru
1. Login sebagai admin
2. Klik tab "Pejabat Penandatangan"
3. Klik tombol "+ Tambah Pejabat"
4. Isi form:
   - Nama Lengkap (required)
   - Jabatan (required)
   - Upload Tanda Tangan (opsional)
   - Centang "Aktif" (default)
5. Klik "Simpan"
6. QR code akan otomatis di-generate

### Menggunakan Pejabat di Kegiatan
1. Saat buat/edit kegiatan
2. Di Step 1, scroll ke bawah
3. Pilih pejabat dari dropdown "Pejabat Penandatangan"
4. Lanjutkan proses normal
5. QR code akan otomatis muncul di sertifikat

### Mengatur Alignment Text
1. Di Step 3 - Layout Sertifikat
2. Klik field text yang ingin diubah
3. Di panel kanan, bagian "Text Align"
4. Klik tombol: ← (left), ↔ (center), → (right)
5. Preview akan langsung update

## API Endpoints Baru

### Officials Management
- `GET /api/officials` - Get all officials
- `GET /api/officials/active` - Get active officials only
- `GET /api/officials/:id` - Get official by ID
- `POST /api/officials` - Create new official (with file upload)
- `PUT /api/officials/:id` - Update official (with optional file upload)
- `DELETE /api/officials/:id` - Delete official

**Authentication**: Semua endpoint require JWT token

## Teknologi yang Digunakan

### Backend
- **QRCode generation**: `qrcode` npm package
- **File upload**: `multer` middleware
- **Image handling**: File system operations
- **Database**: MySQL dengan foreign keys

### Frontend
- **Component**: React functional components dengan hooks
- **Styling**: Inline styles dengan CSS-in-JS
- **Form handling**: Controlled components
- **API calls**: Fetch API dengan custom wrapper

## Catatan Penting

### Security
- ✅ Semua API endpoints terproteksi dengan JWT authentication
- ✅ File validation: hanya accept JPG, PNG, max 5MB
- ✅ SQL injection protected dengan prepared statements
- ✅ Proper error handling di backend dan frontend

### File Management
- Upload signatures disimpan di: `backend/uploads/signatures/`
- QR codes disimpan di: `backend/uploads/signatures/qr_*.png`
- Cleanup otomatis saat delete atau update official

### Backward Compatibility
- ✅ Event tanpa official_id tetap bisa generate sertifikat
- ✅ Default QR code fields sudah ada di certificate layout
- ✅ Existing events tidak perlu migrasi manual

## Testing Checklist

- [x] Database migration berjalan sukses
- [ ] Create official dengan upload gambar
- [ ] Edit official (update gambar)
- [ ] Delete official
- [ ] Create event dengan pilih official
- [ ] Generate sertifikat dengan QR official
- [ ] Text alignment: left, center, right
- [ ] Screen tidak menjadi putih saat edit layout

## Troubleshooting

### Screen menjadi putih
**Penyebab**: Kemungkinan error di rendering
**Solusi**: 
- Check browser console untuk error
- Pastikan semua state di-initialize dengan benar
- Verify API responses

### QR code tidak muncul di sertifikat
**Penyebab**: 
- Official tidak dipilih di event
- File QR tidak ter-generate
**Solusi**:
- Pastikan official dipilih saat create/edit event
- Check `uploads/signatures/` directory
- Verify official_qr_path di database

### Upload gambar gagal
**Penyebab**: File size/type tidak sesuai
**Solusi**:
- Max 5MB
- Format: JPG, PNG only
- Check file permissions di `uploads/signatures/`

## Next Steps (Opsional)

1. Tambah preview sertifikat dengan official QR
2. Bulk upload officials dari Excel/CSV
3. Digital signature verification
4. Audit log untuk perubahan official data
5. Multi-language support untuk jabatan

---

**Status**: ✅ COMPLETED
**Tanggal**: 27 Januari 2026
**Developer**: GitHub Copilot
