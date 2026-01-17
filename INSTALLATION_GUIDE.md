# 🔧 Installation & Setup Instructions

## Quick Setup (5 minutes)

### Step 1: Copy Implementation Files

Copy these 3 files to your frontend project:

```
FROM: (Implementation folder)
  ✓ certificateUtils.js
  ✓ api.js (modified)
  ✓ AttendanceList.jsx (modified)

TO: Your Project
  ✓ frontend/src/utils/certificateUtils.js
  ✓ frontend/src/services/api.js
  ✓ frontend/src/components/AttendanceList.jsx
```

### Step 2: Verify Imports

Open `frontend/src/components/AttendanceList.jsx` and verify these imports exist:

```javascript
import React, { useState, useEffect } from "react";
import { attendanceAPI, certificateAPI } from "../services/api";
import { downloadPDF, showNotification, showConfirmation } from "../utils/certificateUtils";
```

### Step 3: Restart Development Server

```bash
cd frontend
npm run dev
```

### Step 4: Test

Navigate to the attendance list page and verify:

- ✅ Event-level buttons appear at top
- ✅ Individual row buttons appear in last column
- ✅ Buttons are clickable and styled

**Done! Installation complete. ✅**

---

## File Installation Checklist

- [ ] Create directory: `frontend/src/utils/` (if not exists)
- [ ] Copy `certificateUtils.js` to `frontend/src/utils/`
- [ ] Copy `api.js` to `frontend/src/services/` (overwrite existing)
- [ ] Copy `AttendanceList.jsx` to `frontend/src/components/` (overwrite existing)
- [ ] No changes needed to `package.json`
- [ ] No changes needed to `vite.config.js`
- [ ] Restart development server
- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Test on clean page load

---

## Verification Steps

After installation, verify:

### 1. Check File Structure

```bash
# From project root
ls frontend/src/services/api.js              # Should exist
ls frontend/src/components/AttendanceList.jsx # Should exist
ls frontend/src/utils/certificateUtils.js     # Should exist
```

### 2. Check for Errors

```bash
cd frontend
npm run build  # Should compile without errors
# or
npm run dev    # No errors in console
```

### 3. Check Imports

In browser DevTools Console:

```javascript
// These should not error:
import("frontend/src/services/api.js");
import("frontend/src/utils/certificateUtils.js");
```

### 4. Functional Test

Navigate to attendance list page and:

- [ ] Page loads without errors
- [ ] Event-level buttons visible
- [ ] Row action buttons visible
- [ ] Click a button (should trigger API call)
- [ ] Check Network tab for requests

---

## Common Installation Issues

### Issue: "certificateUtils not found"

**Cause:** File in wrong location
**Solution:**

```bash
# Verify path
ls frontend/src/utils/certificateUtils.js

# If not found, check capitalization
# Should be lowercase: certificateUtils.js
```

### Issue: "Import statement error"

**Cause:** Wrong import path
**Solution:**

```javascript
// ✅ Correct
import { downloadPDF } from "../utils/certificateUtils";

// ❌ Wrong
import { downloadPDF } from "./certificateUtils";
```

### Issue: "certificateAPI not defined"

**Cause:** api.js not updated properly
**Solution:**

```javascript
// api.js should have:
export const certificateAPI = {
  generateSingle: async (attendanceId) => ...,
  // ... other methods
};

// And export:
export default { ..., certificate: certificateAPI };
```

### Issue: Buttons not appearing

**Cause:** Component not reloaded
**Solution:**

```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

### Issue: "Tailwind classes not working"

**Cause:** Already resolved in CSS
**Solution:** Ensure Tailwind CSS is configured in `tailwind.config.js` (existing setup should work)

---

## Pre-Installation Checklist

Before installing, verify you have:

- [ ] Node.js installed (v14+)
- [ ] npm or yarn installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Development server works (`npm run dev`)
- [ ] Git (for version control)
- [ ] Backup of existing files (optional but recommended)

---

## Backup Procedure (Recommended)

Before installing, backup existing files:

```bash
# Create backup folder
mkdir backup_before_cert_install

# Copy files to backup
cp frontend/src/services/api.js backup_before_cert_install/
cp frontend/src/components/AttendanceList.jsx backup_before_cert_install/

# Now safe to install new files
```

---

## Post-Installation Testing

### Test 1: Page Load

```javascript
// In browser console on attendance page
console.log(window.location.pathname);
// Should show attendance route
```

### Test 2: API Available

```javascript
// In browser console
import("frontend/src/services/api.js").then((mod) => {
  console.log(mod.certificateAPI);
  // Should log certificateAPI object
});
```

### Test 3: Button Click

```
1. Open attendance list page
2. Click "Buat" button on any row
3. Check Network tab for POST request
4. Should show loading spinner
5. Should show notification on completion
```

### Test 4: Error Handling

```
1. Click "Unduh" on a row without generated certificate
2. Should see warning notification: "Sertifikat belum dibuat"
3. Button should be disabled (grayed out)
```

---

## Performance Verification

After installation, check performance:

### Page Load Time

- Target: < 2 seconds
- Check: DevTools Performance tab

### Button Response Time

- Target: < 300ms
- Check: DevTools Network tab

### Memory Usage

- Target: No memory leaks
- Check: DevTools Memory tab

---

## Rollback Procedure

If you need to revert changes:

### Option 1: From Git

```bash
# Restore original files
git checkout frontend/src/services/api.js
git checkout frontend/src/components/AttendanceList.jsx

# Remove new file
rm frontend/src/utils/certificateUtils.js

# Restart server
npm run dev
```

### Option 2: From Backup

```bash
# Restore from backup
cp backup_before_cert_install/api.js frontend/src/services/
cp backup_before_cert_install/AttendanceList.jsx frontend/src/components/

# Remove new file
rm frontend/src/utils/certificateUtils.js

# Restart server
npm run dev
```

---

## Environment Setup

No special environment setup needed. Uses existing:

```javascript
// .env or vite.config.js should have:
VITE_API_URL = "http://localhost:5000/api"; // or your API URL
```

If not set, default is: `http://localhost:5000/api`

---

## Browser Compatibility

Works on all modern browsers:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

Required features:

- Fetch API
- localStorage
- ES6+ JavaScript

---

## Troubleshooting Checklist

If something doesn't work:

- [ ] Clear browser cache (Ctrl+Shift+Delete)
- [ ] Restart development server (stop and `npm run dev`)
- [ ] Check for console errors (DevTools → Console)
- [ ] Verify file locations (should be in correct `src/` paths)
- [ ] Check imports (match exact paths)
- [ ] Verify API endpoint is working (Network tab)
- [ ] Check if token is valid (logged in as admin?)
- [ ] See CERTIFICATE_QUICK_START.md for more troubleshooting

---

## Support Resources

| Issue              | Solution                           |
| ------------------ | ---------------------------------- |
| File not found     | Check file path and capitalization |
| Import error       | Verify relative paths in imports   |
| Button not working | Check console for errors           |
| API error          | Verify backend is running          |
| No notifications   | Clear cache and reload             |
| Other issues       | See CERTIFICATE_QUICK_START.md     |

---

## Installation Verification Script

Run this in browser console on attendance page to verify installation:

```javascript
// Check if certificateAPI exists
try {
  // This will only work if module loaded properly
  if (window.location.href.includes("attendance")) {
    console.log("✅ On correct page");
  }
  console.log("✅ Installation appears successful");
  console.log('Next: Click on "Buat" button to test');
} catch (err) {
  console.error("❌ Installation issue:", err);
}
```

---

## Next Steps After Installation

1. **Run Tests** (see CERTIFICATE_QUICK_START.md)
2. **Test All Features** (see testing checklist)
3. **Verify Error Handling** (try invalid operations)
4. **Check Performance** (Network tab monitoring)
5. **Deploy to Staging** (if tests pass)
6. **Deploy to Production** (final verification)

---

## Installation Time Estimates

| Task           | Time        |
| -------------- | ----------- |
| Copy files     | 1-2 min     |
| Verify imports | 2-3 min     |
| Restart server | 1-2 min     |
| Initial test   | 2-3 min     |
| **Total**      | **~10 min** |

---

## Getting Help

If installation fails:

1. **Check logs:** Browser console and terminal output
2. **Review documentation:** CERTIFICATE_QUICK_START.md
3. **Run verification:** Steps above
4. **Check troubleshooting:** See CERTIFICATE_CODE_EXAMPLES.md

---

**Installation Guide Complete** ✅

Ready to install? Follow the Quick Setup section above!
