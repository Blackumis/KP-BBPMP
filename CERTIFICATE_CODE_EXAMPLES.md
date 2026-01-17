# Certificate Implementation - Code Examples

This document provides code snippets and examples for common use cases and customizations.

---

## 1. Using Certificate API Directly

### In any React component:

```javascript
import { certificateAPI } from "../services/api";

// Generate single certificate
const generateCert = async (attendanceId) => {
  try {
    const response = await certificateAPI.generateSingle(attendanceId);
    console.log("Certificate:", response.data.file_path);
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Get certificate history for event
const viewHistory = async (eventId) => {
  try {
    const response = await certificateAPI.getHistory(eventId);
    response.data.certificates.forEach((cert) => {
      console.log(cert.nama_lengkap, cert.nomor_sertifikat);
    });
  } catch (error) {
    console.error("Error:", error.message);
  }
};
```

---

## 2. Using Utility Functions Independently

### Download PDF without component:

```javascript
import { downloadPDF, showNotification } from "../utils/certificateUtils";

// Direct URL download
downloadPDF("https://api.example.com/cert.pdf", "my-certificate.pdf");

// Blob download
const blob = new Blob(["PDF content"], { type: "application/pdf" });
downloadPDF(blob, "generated-cert.pdf");

// Show notification
showNotification("Operation completed successfully", "success", 5000);
showNotification("Something went wrong!", "error");
showNotification("Processing...", "info", 10000);
```

### Show confirmation dialog:

```javascript
import { showConfirmation } from "../utils/certificateUtils";

// Usage in async function
const proceedWithAction = async () => {
  const confirmed = await showConfirmation("Delete Certificate", "Are you sure you want to delete this certificate? This action cannot be undone.");

  if (confirmed) {
    // User clicked "Lanjutkan" (Continue)
    await deleteCertificate();
  } else {
    // User clicked "Batal" (Cancel)
    console.log("Action cancelled");
  }
};
```

---

## 3. Customizing Buttons and Styling

### Change button colors and styles:

```jsx
// In AttendanceList.jsx, modify button styles:

// Current: Blue button
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Buat
</button>

// Change to red for danger action:
<button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
  Hapus
</button>

// Add custom styling with inline styles:
<button style={{
  backgroundColor: '#8b5cf6',
  color: 'white',
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'background-color 0.2s'
}}>
  Aksi Custom
</button>
```

### Change notification colors:

```javascript
// In certificateUtils.js, modify showNotification function:

const colors = {
  success: "#10b981", // Green
  error: "#ef4444", // Red
  info: "#3b82f6", // Blue
  warning: "#f59e0b", // Yellow
  custom: "#8b5cf6", // Purple
};

// Call with custom type:
showNotification("Custom message", "custom");
```

---

## 4. Adding New Certificate Actions

### Example: Resend Certificate

Add to `api.js`:

```javascript
export const certificateAPI = {
  // ... existing methods ...
  resendCertificate: async (attendanceId) => fetchWithAuth(`/certificate/resend/${attendanceId}`, { method: "POST" }),
};
```

Add to component:

```javascript
const handleResendCertificate = async (attendance) => {
  const confirmed = await showConfirmation("Kirim Ulang Sertifikat", `Kirim ulang sertifikat ke ${attendance.email}?`);

  if (!confirmed) return;

  try {
    setButtonLoading(attendance.id, "resend", true);
    const response = await certificateAPI.resendCertificate(attendance.id);

    if (response.success) {
      showNotification("Sertifikat berhasil dikirim ulang", "success");
    }
  } catch (err) {
    showNotification(err.message || "Gagal mengirim ulang sertifikat", "error");
  } finally {
    setButtonLoading(attendance.id, "resend", false);
  }
};

// Add button to JSX:
<button onClick={() => handleResendCertificate(a)} disabled={isButtonLoading(a.id, "resend")} className="px-2 py-1 bg-purple-600 text-white text-xs rounded">
  Kirim Ulang
</button>;
```

---

## 5. Batch Processing with Progress

### Add progress tracking for bulk operations:

```javascript
const [progress, setProgress] = useState({
  current: 0,
  total: 0,
  isProcessing: false,
});

const handleGenerateAllWithProgress = async () => {
  const confirmed = await showConfirmation("Buat Semua Sertifikat", `Buat sertifikat untuk semua ${attendances.length} peserta?`);

  if (!confirmed) return;

  try {
    setProgress({ current: 0, total: attendances.length, isProcessing: true });

    // Option 1: Sequential (safer, slower)
    for (let i = 0; i < attendances.length; i++) {
      try {
        await certificateAPI.generateSingle(attendances[i].id);
        setProgress((prev) => ({ ...prev, current: i + 1 }));
      } catch (err) {
        console.error(`Failed for ${attendances[i].id}:`, err);
      }
    }

    showNotification(`Selesai! ${progress.current} dari ${progress.total} berhasil`, "success");
  } finally {
    setProgress({ current: 0, total: 0, isProcessing: false });
  }
};

// Add progress bar to JSX:
{
  progress.isProcessing && (
    <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
      <p className="text-sm text-gray-600 mt-2">
        {progress.current} / {progress.total} sertifikat dibuat
      </p>
    </div>
  );
}
```

---

## 6. Export Certificates to Excel

### Example: Add export functionality

```javascript
import { utils as XLSXUtils, writeFile } from "xlsx"; // npm install xlsx

const handleExportCertificates = async () => {
  try {
    const response = await certificateAPI.getHistory(event.id);

    if (response.success && response.data?.certificates) {
      const data = response.data.certificates.map((cert) => ({
        Nama: cert.nama_lengkap,
        Email: cert.email,
        "No. Sertifikat": cert.nomor_sertifikat,
        Tanggal: new Date().toLocaleDateString("id-ID"),
      }));

      const worksheet = XLSXUtils.json_to_sheet(data);
      const workbook = XLSXUtils.book_new();
      XLSXUtils.book_append_sheet(workbook, worksheet, "Certificates");

      writeFile(workbook, `sertifikat_${event.nama_kegiatan}.xlsx`);
      showNotification("Riwayat sertifikat berhasil diekspor", "success");
    }
  } catch (err) {
    showNotification("Gagal mengekspor riwayat", "error");
  }
};

// Add button:
<button onClick={handleExportCertificates} className="px-4 py-2 bg-cyan-600 text-white rounded-lg">
  📊 Export ke Excel
</button>;
```

---

## 7. Advanced: Custom Certificate Modal

### Create a detailed certificate preview modal:

```jsx
const showCertificatePreview = (attendance) => {
  const modal = document.createElement("div");
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    ">
      <div style="
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 600px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
      ">
        <h2 style="margin-top: 0;">Detail Sertifikat</h2>
        
        <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Nama:</strong> ${attendance.nama_lengkap}</p>
          <p><strong>Email:</strong> ${attendance.email}</p>
          <p><strong>No. Sertifikat:</strong> ${attendance.nomor_sertifikat || "Belum dibuat"}</p>
          <p><strong>Status:</strong> ${attendance.status}</p>
        </div>
        
        <div style="display: flex; gap: 12px; margin-top: 24px;">
          <button id="close-preview" style="
            flex: 1;
            padding: 10px;
            background: #e5e7eb;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">
            Tutup
          </button>
          <button id="download-preview" style="
            flex: 1;
            padding: 10px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          ">
            Unduh PDF
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("close-preview").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  document.getElementById("download-preview").addEventListener("click", () => {
    if (attendance.certificate_url || attendance.file_path) {
      downloadPDF(attendance.certificate_url || attendance.file_path);
    }
    document.body.removeChild(modal);
  });
};
```

---

## 8. Error Handling Patterns

### Comprehensive error handling:

```javascript
const handleOperation = async (attendance) => {
  try {
    setButtonLoading(attendance.id, "action", true);

    // Validate before API call
    if (!attendance.id) {
      throw new Error("Attendance ID tidak ditemukan");
    }

    // API call
    const response = await certificateAPI.generateSingle(attendance.id);

    // Validate response
    if (!response.success) {
      throw new Error(response.message || "Operasi gagal");
    }

    // Process response
    if (!response.data?.file_path) {
      console.warn("Warning: file_path not in response");
    }

    showNotification("Berhasil!", "success");
  } catch (err) {
    // Different error types
    if (err.message.includes("401")) {
      showNotification("Sesi berakhir. Silakan login ulang.", "error");
    } else if (err.message.includes("404")) {
      showNotification("Data tidak ditemukan.", "error");
    } else if (err.message.includes("Network")) {
      showNotification("Koneksi internet terputus.", "error");
    } else {
      showNotification(err.message || "Terjadi kesalahan", "error");
    }

    console.error("Operation error:", {
      action: "generateCertificate",
      attendanceId: attendance.id,
      error: err,
    });
  } finally {
    setButtonLoading(attendance.id, "action", false);
  }
};
```

---

## 9. Localization/Translation

### Support multiple languages:

```javascript
const translations = {
  id: {
    generateBtn: "Buat",
    downloadBtn: "Unduh",
    sendBtn: "Kirim",
    successMsg: "Sertifikat berhasil dibuat",
    errorMsg: "Gagal membuat sertifikat",
  },
  en: {
    generateBtn: "Generate",
    downloadBtn: "Download",
    sendBtn: "Send",
    successMsg: "Certificate generated successfully",
    errorMsg: "Failed to generate certificate",
  },
};

const lang = localStorage.getItem("language") || "id";
const t = (key) => translations[lang][key] || key;

// Use in JSX:
<button>{t("generateBtn")}</button>;
```

---

## 10. Testing Examples

### Jest/React Testing Library:

```javascript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AttendanceList from "../components/AttendanceList";
import * as certificateAPI from "../services/api";

jest.mock("../services/api");

describe("Certificate Features", () => {
  it("generates certificate on button click", async () => {
    certificateAPI.certificateAPI.generateSingle.mockResolvedValue({
      success: true,
      data: { nomor_sertifikat: "CERT-001", file_path: "/path/cert.pdf" },
    });

    render(<AttendanceList event={{ id: 1, nama_kegiatan: "Test Event" }} />);

    const generateBtn = screen.getByText("Buat");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(certificateAPI.certificateAPI.generateSingle).toHaveBeenCalled();
    });
  });

  it("shows error on failed generation", async () => {
    certificateAPI.certificateAPI.generateSingle.mockRejectedValue(new Error("Server error"));

    render(<AttendanceList event={{ id: 1, nama_kegiatan: "Test" }} />);

    const generateBtn = screen.getByText("Buat");
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Server error/)).toBeInTheDocument();
    });
  });
});
```

---

These examples should cover most common use cases and customizations. For more details, refer to the main implementation documentation.
