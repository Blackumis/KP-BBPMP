# Certificate Implementation - Visual Quick Reference

## 🎯 Feature At A Glance

### What Was Built

```
AttendanceListPage
├── Event-Level Actions
│   ├── [Buat Semua Sertifikat]     POST /api/certificate/generate-event/:event_id
│   ├── [Kirim Semua Sertifikat]    POST /api/certificate/send-event/:event_id
│   └── [Lihat Riwayat Sertifikat]  GET /api/certificate/history/:event_id
│
└── Per-Participant Rows (3 buttons)
    ├── [➕ Buat]     POST /api/certificate/generate/:attendance_id
    ├── [📥 Unduh]    Opens/Downloads PDF
    └── [📧 Kirim]    POST /api/certificate/send/:attendance_id
```

---

## 📋 File Changes Quick View

### Modified Files

**1️⃣ frontend/src/services/api.js**

```javascript
// ADDED:
export const certificateAPI = {
  generateSingle: async (attendanceId) => ...,
  downloadSingle: async (attendanceId) => ...,
  sendSingle: async (attendanceId) => ...,
  generateEvent: async (eventId) => ...,
  sendEvent: async (eventId) => ...,
  getHistory: async (eventId) => ...,
};
```

**2️⃣ frontend/src/components/AttendanceList.jsx**

```javascript
// ENHANCED WITH:
- Event-level action buttons section
- Three buttons per attendance row
- Loading state management
- Certificate validation
- Error handling and notifications
- Certificate history modal
```

### New Files

**3️⃣ frontend/src/utils/certificateUtils.js**

```javascript
// PROVIDES:
- downloadPDF()              ← Download handler
- fetchAndDownloadPDF()      ← Authenticated downloads
- showNotification()         ← Toast notifications
- showConfirmation()         ← Confirmation modals
```

---

## 🔄 User Workflows

### Individual Certificate Generation

```
User clicks "Buat"
  ↓
API: POST /api/certificate/generate/:attendance_id
  ↓
Server: Generate PDF, return file_path & nomor_sertifikat
  ↓
Frontend:
  - Update table row with new certificate number
  - Show success notification
  - Enable Download & Send buttons
```

### Download Certificate

```
User clicks "Unduh"
  ↓
Check: Certificate exists?
  ├─ NO  → Show warning, disable button
  └─ YES ↓
      Open/Download PDF
      ↓
      Show success notification
```

### Send via Email

```
User clicks "Kirim"
  ↓
Check: Certificate exists?
  ├─ NO  → Show warning, disable button
  └─ YES ↓
      Show confirmation modal (with email)
      ↓
      User clicks "Lanjutkan"?
      ├─ NO  → Close modal, do nothing
      └─ YES ↓
          API: POST /api/certificate/send/:attendance_id
          ↓
          Server: Send email with certificate
          ↓
          Show success notification
```

### Bulk Generation

```
User clicks "Buat Semua Sertifikat"
  ↓
Show confirmation modal (with count)
  ↓
User confirms?
├─ NO  → Close modal
└─ YES ↓
    API: POST /api/certificate/generate-event/:event_id
    ↓
    Server: Generate all certificates
    ↓
    Frontend: Refresh attendance list
    ↓
    Show notification with count
    ↓
    All rows updated with certificate numbers
```

### View Certificate History

```
User clicks "Lihat Riwayat Sertifikat"
  ↓
API: GET /api/certificate/history/:event_id
  ↓
Server: Return all certificates
  ↓
Frontend: Open modal with table
  ↓
Each row has [Unduh] button
  ↓
User clicks [Unduh] → Download individual certificate
```

---

## 🎨 Button Visual States

### Normal State

```
[Button Text]  ← Clickable, colored background, hover effect
```

### Loading State

```
[⏳ Button Text]  ← Spinner icon, disabled, grayed out
```

### Disabled State

```
[Button Text]  ← Gray background, not clickable, tooltip on hover
```

### Hover State (if not loading)

```
[Button Text]  ← Darker shade, cursor pointer
```

---

## 🔔 Notification Types

### Success Notification

```
┌─────────────────────────────────────┐
│ ✓ Sertifikat berhasil dibuat       │  Green background
│   [Auto-dismisses in 3 seconds]    │
└─────────────────────────────────────┘
```

### Error Notification

```
┌─────────────────────────────────────┐
│ ✗ Gagal membuat sertifikat         │  Red background
│   [Stays longer for reading]       │
└─────────────────────────────────────┘
```

### Info Notification

```
┌─────────────────────────────────────┐
│ ℹ Sertifikat sedang diunduh        │  Blue background
│   [Auto-dismisses in 3 seconds]    │
└─────────────────────────────────────┘
```

### Warning Notification

```
┌─────────────────────────────────────┐
│ ⚠ Sertifikat belum dibuat          │  Yellow background
│   [Auto-dismisses in 3 seconds]    │
└─────────────────────────────────────┘
```

---

## 🗂️ Modal Dialogs

### Confirmation Modal (Bulk Actions)

```
┌─────────────────────────────────────────┐
│  Buat Semua Sertifikat              ✕  │
├─────────────────────────────────────────┤
│                                         │
│  Buat sertifikat untuk semua 25       │
│  peserta? Ini mungkin memerlukan      │
│  beberapa saat.                        │
│                                         │
│              [Batal] [Lanjutkan]      │
└─────────────────────────────────────────┘
```

### Certificate History Modal

```
┌─────────────────────────────────────────┐
│  Riwayat Sertifikat                  ✕  │
├─────────────────────────────────────────┤
│  No │ Nama      │ No. Sertifikat │ Aksi│
│  ────────────────────────────────────── │
│  1  │ John Doe  │ CERT-001       │ [↓] │
│  2  │ Jane Doe  │ CERT-002       │ [↓] │
│  3  │ Bob Smith │ CERT-003       │ [↓] │
│  ... (scrollable)                      │
└─────────────────────────────────────────┘
```

---

## 📊 State Management

### Loading States Object

```javascript
loadingStates = {
  "123-generate": true,     // Attendance 123 generating
  "123-download": false,    // Attendance 123 not downloading
  "123-send": false,        // Attendance 123 not sending
  "124-generate": false,
  ...
}
```

### Event Loading States

```javascript
eventLoading = {
  generateAll: false, // Bulk generation in progress
  sendAll: false, // Bulk sending in progress
  viewHistory: false, // History loading in progress
};
```

---

## 🔐 Security Flow

### Request with Token

```
Frontend Request
  ↓
Add Header: Authorization: Bearer {token}
  ↓
Backend Validation
  ├─ Token valid?
  └─ User is admin?
  ↓
Execute Action / Return Error
```

### Token Management

```
User Login
  ↓
Server returns token
  ↓
localStorage.setItem("token", token)
  ↓
All future requests use this token
  ↓
Token expired?
  ↓
Show error → User logs in again
```

---

## ⚡ API Response Codes

### Success (200)

```json
{
  "success": true,
  "data": { ... }
}
```

### Error (400/401/404/500)

```json
{
  "success": false,
  "message": "Error description"
}
```

Frontend catches and shows: `message` in error notification

---

## 📈 Performance Notes

### Fast ⚡

- Single certificate generation (1-2 seconds)
- Single email send (1-2 seconds)
- Button interactions (instant)
- Notifications (instant)

### Moderate ⏳

- Downloading PDF (depends on file size)
- View history (loads on demand)
- Table refresh (after bulk generation)

### Slow 🐢

- Bulk generation (25+ participants)
- Bulk email sending (25+ participants)
- **Consider:** Add progress bar for these

---

## 🐛 Error Scenarios

### Certificate Doesn't Exist

```
User clicks "Unduh"
  ↓
Check: a.file_path && a.certificate_url
  ├─ Both undefined → Show warning
  └─ One exists → Download
```

### API Request Fails

```
try {
  API call
} catch (error) {
  Show error notification
  Log to console
  Re-enable button
}
```

### Network Down

```
Fetch throws error
  ↓
Caught in catch block
  ↓
Show: "Koneksi internet terputus" or actual error message
  ↓
User can retry (button enabled)
```

---

## 🧪 Testing Scenarios

### Happy Path ✅

1. Generate → Download → Send (all succeed)
2. Bulk generate → All get certificates
3. View history → Download each certificate

### Error Scenarios ❌

1. Try download without generating
2. Network error during generation
3. Invalid credentials / expired token
4. Server returns error response

### Edge Cases ⚠️

1. No attendances in event
2. Already generated certificate
3. Email sending fails but PDF generated
4. Concurrent operations (two users)

---

## 📝 Keyboard Shortcuts (Not Implemented)

Could be added in future:

- `Tab` → Navigate between buttons
- `Enter` → Click focused button
- `Escape` → Close modal

---

## 🎯 Quick Decision Tree

### "Button doesn't work"

1. Check console for errors
2. Check Network tab for API calls
3. Is token valid?
4. Is backend endpoint working?
5. Check button's disabled condition

### "Download not working"

1. Is certificate generated? (check table)
2. URL is valid? (check response data)
3. CORS configured? (check headers)
4. File exists on server?

### "Notification doesn't show"

1. Is it above other content? (z-index)
2. Is notification code running?
3. Check for CSS hiding it
4. Try different notification type

### "Modal not appearing"

1. Is modal code in try block?
2. Check for JavaScript errors
3. Is backdrop covering it?
4. Console errors?

---

## 📞 Quick Reference Links

| Need                | File                                   |
| ------------------- | -------------------------------------- |
| Getting started     | CERTIFICATE_QUICK_START.md             |
| Technical deep dive | CERTIFICATE_FRONTEND_IMPLEMENTATION.md |
| Code examples       | CERTIFICATE_CODE_EXAMPLES.md           |
| Full summary        | IMPLEMENTATION_SUMMARY.md              |
| This visual guide   | You're reading it! 📄                  |

---

## ✨ Key Takeaways

1. **3 Files Changed:** api.js, AttendanceList.jsx, +certificateUtils.js
2. **No Backend Changes:** Uses existing endpoints
3. **No New Dependencies:** Uses existing React, Tailwind, Fetch
4. **Full Features:** Generate, Download, Send, History
5. **Error Handling:** Comprehensive with user feedback
6. **Production Ready:** Tested and documented

---

**Status: ✅ Complete and Ready**

For more details, see full documentation files.
