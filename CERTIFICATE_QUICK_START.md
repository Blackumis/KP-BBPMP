# Certificate Frontend Implementation - Quick Start

## What's New

The AttendanceListPage now has a complete certificate management system with:

- ✅ Generate certificates (single & bulk)
- ✅ Download certificates as PDF
- ✅ Send certificates via email
- ✅ View certificate history
- ✅ Loading states and error handling
- ✅ User confirmation dialogs
- ✅ Toast notifications

## Files Changed

1. **frontend/src/services/api.js** - Extended with `certificateAPI`
2. **frontend/src/components/AttendanceList.jsx** - Complete rewrite with certificate features
3. **frontend/src/utils/certificateUtils.js** - NEW utility functions for downloads and notifications

## Installation Steps

1. **No new dependencies needed** - uses existing React and Tailwind CSS

2. **Verify directory structure:**

   ```
   frontend/src/
   ├── components/
   │   ├── AttendanceList.jsx (✏️ modified)
   │   └── ...
   ├── services/
   │   └── api.js (✏️ modified)
   ├── utils/
   │   └── certificateUtils.js (✨ new)
   └── ...
   ```

3. **Restart development server:**
   ```bash
   cd frontend
   npm run dev
   ```

## Testing the Implementation

### Prerequisites

- Admin user logged in
- Event with attendances exists

### Test Scenarios

1. **Generate Single Certificate:**

   - Navigate to attendance list
   - Click "➕ Buat" for a participant
   - Wait for spinner to complete
   - Should see success notification
   - Certificate number should appear in table

2. **Generate All Certificates:**

   - Click "Buat Semua Sertifikat" button
   - Confirm in modal
   - Should show success with count
   - All participants should get certificate numbers

3. **Download Certificate:**

   - Click "📥 Unduh" button (only enabled if certificate exists)
   - PDF should open in new tab or download

4. **Send via Email:**

   - Click "📧 Kirim" button
   - Confirm in modal with email address
   - Should show success notification

5. **View Certificate History:**
   - Click "Lihat Riwayat Sertifikat"
   - Modal opens with table of all certificates
   - Can download each certificate individually

## API Endpoints Required

Your backend must support these routes (you already have them):

```
POST   /api/certificate/generate/:attendance_id      - Generate single
POST   /api/certificate/generate-event/:event_id     - Generate all
POST   /api/certificate/send/:attendance_id          - Send single
POST   /api/certificate/send-event/:event_id         - Send all
GET    /api/certificate/history/:event_id            - View history
```

All requests automatically include `Authorization: Bearer <token>` header.

## Response Format Expected

### Generate endpoints should return:

```json
{
  "success": true,
  "data": {
    "file_path": "/uploads/certificates/...",
    "certificate_url": "https://api.example.com/uploads/...",
    "nomor_sertifikat": "CERT-2024-001"
  }
}
```

### Send endpoints should return:

```json
{
  "success": true,
  "data": {
    "count": 1
  }
}
```

### History endpoint should return:

```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "nama_lengkap": "John Doe",
        "email": "john@example.com",
        "nomor_sertifikat": "CERT-2024-001",
        "file_path": "/uploads/certificates/..."
      }
    ]
  }
}
```

## Customization

### Change button colors:

Edit AttendanceList.jsx line colors (bg-blue-600, bg-green-600, etc.)

### Change notification duration:

Modify `showNotification("message", "type", 5000)` last parameter

### Change button labels:

Modify button text in the JSX (all labels are in Indonesian)

### Change modal styles:

Edit certificateUtils.js `showConfirmation()` and modal styling

## Troubleshooting

### "Sertifikat belum dibuat" error when trying to download/send:

- First generate the certificate using the "Buat" button
- The backend must return `file_path` or `certificate_url` in response

### Notifications not showing:

- Check browser console for JavaScript errors
- Ensure notification container isn't hidden by other elements
- CSS z-index is 9999 for notifications

### Download not working:

- Check if URL is valid and accessible
- Verify Authorization header is being sent
- Check browser security policies (CORS issues?)

### Buttons not responding:

- Check Redux/Context if you're using state management
- Verify event ID and attendance ID are correct
- Check network tab in DevTools for API errors

## Performance Notes

- Bulk operations (Generate All/Send All) may take time - show progress feedback
- Consider implementing pagination if table has 100+ rows
- PDF downloads large files may take time depending on file size

## Security Notes

- All requests use Bearer token authentication
- Passwords/tokens never logged to console
- Certificate URLs should be generated with temporary tokens if needed
- Email addresses displayed only to authenticated admins

## Next Steps

1. Test thoroughly in development
2. Verify all backend responses match expected format
3. Deploy to staging for UAT
4. Monitor error logs in production
5. Gather user feedback for improvements

---

For detailed documentation, see: `CERTIFICATE_FRONTEND_IMPLEMENTATION.md`
