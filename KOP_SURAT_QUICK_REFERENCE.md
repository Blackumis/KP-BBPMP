# Kop Surat Management - Quick Reference Guide

## Accessing the Feature

1. **Login as Admin** - Use your admin credentials
2. **Navigate to Admin Dashboard** - Click Admin menu from header
3. **Access Kop Surat Management** - You'll see two tabs:
   - **Kegiatan** (Events) - Currently selected by default
   - **Kop Surat** - Click this to manage kop surat

## Tabs Navigation

Both the Events List page and Kop Surat List page have navigation tabs at the top for easy switching between sections.

## Available Features

### List Page (`/admin/kop-surat`)

- View all kop surats in a table format
- See: Institution name, period, signature type, status
- **Actions**:
  - **Edit** button - Modify existing kop surat
  - **Delete** button (trash icon) - Remove kop surat (with confirmation)
  - **Refresh** button - Reload the list
  - **Tambah Kop Surat** button - Create new kop surat

### Create Page (`/admin/kop-surat/create`)

- Form to create new kop surat
- Required fields:
  - Nama Instansi / Unit (e.g., "BBPMP Provinsi Jawa Tengah")
  - Periode Mulai (start date)
  - Periode Selesai (end date)
  - Gambar Kop Surat (image file)
- Optional fields:
  - Jenis TTD (QR or BASAH) - default: QR
  - Status Aktif - checkbox to enable/disable

### Edit Page (`/admin/kop-surat/edit/:id`)

- Modify existing kop surat
- Same form fields as create page
- Can replace the image or keep the existing one
- Shows current image if no new one is selected

## Form Validations

The system validates:

- All required fields must be filled
- Periode Mulai must be ≤ Periode Selesai (date range validation)
- Image must be a valid image file (PNG, JPG, GIF)
- Image must not exceed 5MB in size

## API Endpoints

### Backend Endpoints (Protected - Require Auth + Admin)

```
POST   /api/kop-surat              - Create new kop surat
GET    /api/kop-surat              - List all kop surats
GET    /api/kop-surat/:id          - Get specific kop surat
PUT    /api/kop-surat/:id          - Update kop surat
DELETE /api/kop-surat/:id          - Delete kop surat
```

All endpoints require:

- Valid JWT token in Authorization header
- Admin role

## File Structure

```
backend/
  controllers/
    kopSuratController.js          - Business logic for kop surat operations
  routes/
    kopSuratRoutes.js              - API routes and middleware configuration
  uploads/
    kop-surat/                     - Directory for storing uploaded images

frontend/
  src/
    pages/
      admin/
        ListKopSurat.jsx           - List/view all kop surats
        CreateKopSurat.jsx         - Create new kop surat
        EditKopSurat.jsx           - Edit existing kop surat
    services/
      api.js                       - API service with kopSuratAPI methods
```

## Key Features

1. **Image Upload**
   - Drag-and-drop support
   - File type validation (images only)
   - File size limit (5MB max)
   - Preview display before save

2. **Date Range Validation**
   - Ensures start date ≤ end date
   - User-friendly error messages

3. **Pagination**
   - List page shows 10 items per page
   - Navigation buttons for pages
   - Shows total count

4. **Responsive Design**
   - Works on desktop and mobile
   - Responsive table and forms
   - Mobile-friendly navigation

5. **Safety Features**
   - Confirmation dialogs before deletion
   - Safe file handling (old files are deleted when updated)
   - Error handling and user feedback

## Troubleshooting

### Image Not Uploading

- Check file type (must be PNG, JPG, or GIF)
- Check file size (must be ≤ 5MB)
- Ensure the uploads/kop-surat directory exists and is writable

### Cannot Access Kop Surat Pages

- Verify you're logged in as admin
- Check that your user has admin privileges

### Form Submission Fails

- Verify all required fields are filled
- Check that date range is valid (start ≤ end)
- Check browser console for specific error messages

### Images Not Displaying

- Verify the backend is serving static files from `/uploads` path
- Check that the image file exists in backend/uploads/kop-surat/
- Verify the database contains the correct image path

## Database Schema

The system uses the existing `kop_surat` table:

```sql
CREATE TABLE kop_surat (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_data VARCHAR(255) NOT NULL,           -- Institution/unit name
  periode_mulai DATE NOT NULL,               -- Start date
  periode_selesai DATE NOT NULL,             -- End date
  kop_url VARCHAR(500) NOT NULL,             -- Image path
  jenis_ttd ENUM('QR', 'BASAH') DEFAULT 'QR', -- Signature type
  is_active BOOLEAN DEFAULT TRUE,            -- Active status
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_periode (periode_mulai, periode_selesai),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Development Notes

- The implementation follows the same pattern as Event management for consistency
- Uses React hooks (useState, useEffect) for state management
- Uses React Router for navigation
- Forms use FormData for multipart file uploads
- All API calls include authentication token
- Error handling provides user-friendly messages
