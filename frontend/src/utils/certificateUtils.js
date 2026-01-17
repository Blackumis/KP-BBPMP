/**
 * Certificate Utility Functions
 * Handles PDF downloads, file handling, and notifications
 */

/**
 * Download PDF from URL or blob
 * @param {string|Blob} source - URL string or Blob object
 * @param {string} filename - Name for the downloaded file
 */
export const downloadPDF = (source, filename = "certificate.pdf") => {
  try {
    if (source instanceof Blob) {
      // Handle Blob
      const url = window.URL.createObjectURL(source);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } else if (typeof source === "string") {
      // Handle URL string
      window.open(source, "_blank");
    }
  } catch (error) {
    console.error("Error downloading PDF:", error);
    showNotification("Gagal mengunduh sertifikat", "error");
  }
};

/**
 * Fetch and download PDF as blob
 * @param {string} url - API endpoint URL
 * @param {string} token - Authorization token
 * @param {string} filename - Name for the downloaded file
 */
export const fetchAndDownloadPDF = async (url, token, filename = "certificate.pdf") => {
  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }

    const blob = await response.blob();
    downloadPDF(blob, filename);
  } catch (error) {
    console.error("Error fetching PDF:", error);
    showNotification("Gagal mengunduh sertifikat", "error");
  }
};

/**
 * Show toast/notification message
 * @param {string} message - Message to display
 * @param {string} type - "success" | "error" | "info" | "warning"
 * @param {number} duration - Duration in milliseconds (default 3000)
 */
export const showNotification = (message, type = "info", duration = 3000) => {
  // Check if notification container exists, if not create it
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    info: "#3b82f6",
    warning: "#f59e0b",
  };

  notification.style.cssText = `
    background-color: ${colors[type] || colors.info};
    color: white;
    padding: 16px;
    margin-bottom: 10px;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    animation: slideIn 0.3s ease-in-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  notification.textContent = message;
  container.appendChild(notification);

  // Add animation
  const style = document.createElement("style");
  if (!document.getElementById("notification-animation")) {
    style.id = "notification-animation";
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Remove notification after duration
  setTimeout(() => {
    notification.style.animation = "slideOut 0.3s ease-in-out";
    setTimeout(() => {
      container.removeChild(notification);
    }, 300);
  }, duration);
};

/**
 * Show confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @returns {Promise<boolean>} - True if confirmed, false if cancelled
 */
export const showConfirmation = (title, message) => {
  return new Promise((resolve) => {
    const dialog = document.createElement("div");
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    dialog.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      ">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">
          ${title}
        </h3>
        <p style="margin: 0 0 24px 0; color: #6b7280; line-height: 1.5;">
          ${message}
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="cancel-btn" style="
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='white'">
            Batal
          </button>
          <button id="confirm-btn" style="
            padding: 8px 16px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          " onmouseover="this.style.backgroundColor='#2563eb'" onmouseout="this.style.backgroundColor='#3b82f6'">
            Lanjutkan
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dialog);

    const confirmBtn = dialog.querySelector("#confirm-btn");
    const cancelBtn = dialog.querySelector("#cancel-btn");

    confirmBtn.addEventListener("click", () => {
      document.body.removeChild(dialog);
      resolve(true);
    });

    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(dialog);
      resolve(false);
    });
  });
};
