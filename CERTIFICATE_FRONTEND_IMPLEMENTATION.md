# Certificate Management Frontend Implementation

## Overview

This document describes the complete certificate management feature implementation for the AttendanceListPage. The implementation includes:

- **Individual participant actions**: Generate, download, and send certificates per person
- **Bulk event actions**: Generate and send certificates for all participants at once
- **Certificate history**: View and download all certificates generated for an event
- **User feedback**: Loading states, success/error notifications, and confirmation dialogs

---

## Files Modified/Created

### 1. **[frontend/src/services/api.js](frontend/src/services/api.js)** (Modified)

**Added:** `certificateAPI` object with the following endpoints:

```javascript
export const certificateAPI = {
  // Single attendance certificate operations
  generateSingle: async (attendanceId) => fetchWithAuth(`/certificate/generate/${attendanceId}`, { method: "POST" }),
  downloadSingle: async (attendanceId) => fetchWithAuth(`/certificate/download/${attendanceId}`, { method: "GET" }),
  sendSingle: async (attendanceId) => fetchWithAuth(`/certificate/send/${attendanceId}`, { method: "POST" }),

  // Event-level certificate operations
  generateEvent: async (eventId) => fetchWithAuth(`/certificate/generate-event/${eventId}`, { method: "POST" }),
  sendEvent: async (eventId) => fetchWithAuth(`/certificate/send-event/${eventId}`, { method: "POST" }),
  getHistory: async (eventId) => fetchWithAuth(`/certificate/history/${eventId}`, { method: "GET" }),
};
```

**Key Features:**

- All requests automatically include the Bearer token via `fetchWithAuth()`
- Error handling returns meaningful error messages
- Follows the existing API structure and conventions

---

### 2. **[frontend/src/utils/certificateUtils.js](frontend/src/utils/certificateUtils.js)** (New File)

**Exported Functions:**

#### `downloadPDF(source, filename)`

- Handles PDF downloads from URLs or Blobs
- Supports both direct URL opening and blob file downloads
- Usage:
  ```javascript
  downloadPDF("https://api.example.com/cert.pdf", "certificate.pdf");
  downloadPDF(blobObject, "certificate.pdf");
  ```

#### `fetchAndDownloadPDF(url, token, filename)`

- Fetches PDF from authenticated endpoint and triggers download
- Includes authorization header automatically

#### `showNotification(message, type, duration)`

- Displays toast notifications with animations
- **Types:** `"success"`, `"error"`, `"info"`, `"warning"`
- **Default duration:** 3000ms
- **Features:**
  - Auto-positioning to top-right corner
  - Slide-in/slide-out animations
  - Color-coded by message type
  - Auto-dismissal

Example:

```javascript
showNotification("Sertifikat berhasil dibuat", "success", 3000);
showNotification("Gagal membuat sertifikat", "error");
```

#### `showConfirmation(title, message)`

- Modal confirmation dialog (returns Promise<boolean>)
- **Returns:** `true` if confirmed, `false` if cancelled
- **Features:**
  - Styled modal with backdrop
  - "Lanjutkan" (Continue) and "Batal" (Cancel) buttons
  - Hover effects on buttons

Example:

```javascript
const confirmed = await showConfirmation("Buat Semua Sertifikat", "Buat sertifikat untuk semua peserta?");
if (confirmed) {
  // Proceed with action
}
```

---

### 3. **[frontend/src/components/AttendanceList.jsx](frontend/src/components/AttendanceList.jsx)** (Completely Rewritten)

**New Features:**

#### State Management

```javascript
const [loadingStates, setLoadingStates] = useState({});
const [eventLoading, setEventLoading] = useState({
  generateAll: false,
  sendAll: false,
  viewHistory: false,
});
```

- **loadingStates:** Tracks loading for individual button actions (e.g., `{123-generate: true}`)
- **eventLoading:** Tracks loading for event-level bulk operations

#### Individual Row Actions (3 buttons per participant)

##### 1. **Generate Certificate Button**

- **Function:** `handleGenerateCertificate(attendance)`
- **API Call:** `POST /certificate/generate/:attendance_id`
- **Success Behavior:**
  - Shows success notification
  - Updates local state with returned `file_path` and `nomor_sertifikat`
  - Display updates automatically in the table
- **Error Behavior:**
  - Shows error notification with error message
  - Button returns to normal state
- **Button State:**
  - Shows spinner while loading
  - Disabled while request is in progress

##### 2. **Download Certificate Button**

- **Function:** `handleDownloadCertificate(attendance)`
- **Validation:**
  - Checks if `file_path` or `certificate_url` exists
  - Shows warning notification if certificate doesn't exist
  - Button disabled if no certificate available
- **Download:**
  - Triggers PDF download via `downloadPDF()`
  - Filename format: `sertifikat_{nama_lengkap}.pdf`
  - Uses URL from `certificate_url` or `file_path`

##### 3. **Send via Email Button**

- **Function:** `handleSendCertificate(attendance)`
- **Validation:**
  - Checks if certificate exists (has `file_path`, `certificate_url`, or `nomor_sertifikat`)
  - Shows warning if not generated yet
  - Button disabled if certificate doesn't exist
- **Confirmation:**
  - Shows modal confirmation before sending
  - Displays recipient email in confirmation message
- **API Call:** `POST /certificate/send/:attendance_id`
- **Success Behavior:**
  - Shows notification: "Sertifikat berhasil dikirim ke [email]"

#### Event-Level Actions (Header Section)

Three buttons in a styled blue box at the top of the table:

##### 1. **Generate All Certificates**

- **Function:** `handleGenerateAllCertificates()`
- **Confirmation:** Shows modal with number of participants
- **API Call:** `POST /certificate/generate-event/:event_id`
- **Success Behavior:**
  - Shows notification with number of generated certificates
  - Refreshes attendance list to show updated `nomor_sertifikat`
- **Button State:**
  - Disabled if no attendances or while loading
  - Shows spinner during processing

##### 2. **Send All Certificates**

- **Function:** `handleSendAllCertificates()`
- **Confirmation:** Shows modal confirming action for all participants
- **API Call:** `POST /certificate/send-event/:event_id`
- **Success Behavior:**
  - Shows notification with count of sent certificates
- **Button State:**
  - Disabled while processing

##### 3. **Download Participant Certificates** (View History)

- **Function:** `handleViewCertificateHistory()`
- **API Call:** `GET /certificate/history/:event_id`
- **Modal Display:** Shows table with:
  - Participant name
  - Certificate number
  - Individual download button for each certificate
- **Download:**
  - Clicking download button opens/saves the PDF
  - Uses direct URL from history data

---

## UI Components and Styling

### Event-Level Action Box

```
┌─────────────────────────────────────────────────────────┐
│ Manajemen Sertifikat Kegiatan                          │
│ [Buat Semua] [Kirim Semua] [Lihat Riwayat]             │
└─────────────────────────────────────────────────────────┘
```

### Individual Row Action Buttons

```
[➕ Buat] [📥 Unduh] [📧 Kirim]
```

- **Buat (Generate):** Blue button (#3b82f6)
- **Unduh (Download):** Green button (#16a34a)
- **Kirim (Send):** Orange button (#ea580c)

All buttons:

- Show spinner while loading
- Disable when processing
- Have hover effects
- Include emoji icons for quick visual identification

### Notifications

- **Success:** Green background (#10b981)
- **Error:** Red background (#ef4444)
- **Info:** Blue background (#3b82f6)
- **Warning:** Yellow background (#f59e0b)

Auto-dismiss after 3 seconds with slide-out animation.

### Modals

- **Confirmation Dialog:** Simple decision dialog with two buttons
- **Certificate History:** Table-based modal for downloading multiple certificates

---

## Data Flow

### Certificate Generation Workflow

```
1. User clicks "Generate Certificate" button
2. confirmationDialog shows (optional, skipped for single generation)
3. POST /certificate/generate/:attendance_id
4. ├─ Success:
5. │  ├─ Update local state with file_path and nomor_sertifikat
6. │  ├─ Show success notification
7. │  └─ Table updates automatically
8. └─ Error:
9.    └─ Show error notification
```

### Bulk Generation Workflow

```
1. User clicks "Generate All Certificates"
2. Confirmation modal shows with participant count
3. User confirms action
4. POST /certificate/generate-event/:event_id
5. ├─ Success:
6. │  ├─ GET /attendance/event/:event_id (refresh list)
7. │  ├─ Update all attendances with new data
8. │  └─ Show success notification with count
9. └─ Error:
10.   └─ Show error notification
```

---

## Error Handling

All functions implement comprehensive error handling:

1. **Certificate Not Generated:**

   - Prevents downloading/sending if certificate doesn't exist
   - Shows clear warning message: "Sertifikat belum dibuat. Silakan buat terlebih dahulu."
   - Button remains disabled

2. **Network Errors:**

   - Caught and displayed as notifications
   - Error message from backend response shown to user
   - Button returns to normal state for retry

3. **Authorization Errors:**
   - Handled by `fetchWithAuth()` in api.js
   - Errors thrown and caught in component

---

## Integration with Backend

### Expected Backend Response Format

**Generate Single Certificate:**

```json
{
  "success": true,
  "data": {
    "file_path": "/path/to/certificate.pdf",
    "certificate_url": "https://api.example.com/path/to/certificate.pdf",
    "nomor_sertifikat": "CERT-2024-001"
  }
}
```

**Send Certificate:**

```json
{
  "success": true,
  "message": "Certificate sent successfully"
}
```

**Get History:**

```json
{
  "success": true,
  "data": {
    "certificates": [
      {
        "nama_lengkap": "John Doe",
        "email": "john@example.com",
        "nomor_sertifikat": "CERT-2024-001",
        "file_path": "/path/to/cert.pdf"
      }
    ]
  }
}
```

---

## Usage Notes

### For Developers

1. **Adding More Actions:**

   - Follow the pattern in `handleGenerateCertificate()` for individual actions
   - Use `setButtonLoading()` to manage button state
   - Always show notifications for user feedback

2. **Customizing Styles:**

   - Tailwind CSS classes used throughout
   - Inline styles for modals and notifications (for portability)
   - Color scheme: Blue (#3b82f6), Green (#16a34a), Orange (#ea580c), Purple (#9333ea)

3. **Notification Customization:**
   - Edit messages in functions for different languages
   - Adjust `duration` parameter for different auto-dismiss times
   - Add new notification types by extending `colors` object in `showNotification()`

### For Admins/Users

1. **Generating Certificates:**

   - Individual: Click "Buat" for each participant
   - Bulk: Use "Buat Semua Sertifikat" for all at once

2. **Downloading Certificates:**

   - Click "Unduh" button in participant row
   - Or use "Lihat Riwayat Sertifikat" to view and download all

3. **Sending via Email:**
   - Individual: Click "Kirim" for each participant
   - Bulk: Use "Kirim Semua Sertifikat" for all at once
   - Must generate certificate before sending

---

## Technical Stack

- **Framework:** React
- **Styling:** Tailwind CSS + Inline CSS
- **HTTP Client:** Fetch API (via api.js helper)
- **State Management:** React useState hooks
- **Authentication:** Bearer token (stored in localStorage)

---

## Future Enhancements

1. **Batch Operations:**

   - Select multiple participants for partial bulk operations
   - Progress bar for long-running bulk operations

2. **Certificate Templates:**

   - Let admins customize certificate templates
   - Preview before generation

3. **Email Templates:**

   - Customizable email messages
   - Multiple language support

4. **Audit Logging:**

   - Track who generated/sent certificates and when
   - Export logs for compliance

5. **Scheduled Sending:**
   - Schedule bulk certificate sending for specific times
   - Recurring certificate generation for recurring events

---

## Testing Checklist

- [ ] Generate single certificate - verify button disables and shows spinner
- [ ] Download certificate - verify PDF opens/downloads
- [ ] Send certificate - verify confirmation modal appears
- [ ] Generate all certificates - verify confirmation and bulk processing
- [ ] Send all certificates - verify count in notification matches
- [ ] View history - verify modal displays all certificates
- [ ] Error scenarios - test with invalid IDs, network errors
- [ ] Token expiration - test re-authentication flow
- [ ] Responsive design - test on mobile/tablet/desktop
