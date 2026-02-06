# 📧 Email Sending Guide - Mengatasi Gmail Rate Limits

## ⚠️ Masalah yang Terjadi

### Error: "Too many login attempts"
Gmail membatasi:
- **Max 500 email/hari** untuk akun Gmail gratis
- **Max login attempts** dalam waktu singkat
- **Rate limiting** jika terlalu banyak koneksi

### Mengapa Hanya 90 Email Terkirim?
- Queue mengirim **3 email sekaligus** (concurrency: 3)
- Gmail mendeteksi sebagai **aktivitas mencurigakan**
- Setelah ~90 email, Gmail **memblokir login**

---

## ✅ Solusi yang Diterapkan

### 1. **Email Disabled by Default** ⚠️
```env
# File: backend/.env
EMAIL_ENABLED=false  # Email OFF untuk testing 3000 peserta
```

Saat disabled:
- ✓ Sertifikat tetap **digenerate**
- ✓ Sertifikat disimpan di database
- ✓ Email **TIDAK dikirim** (log saja)
- ✓ **Aman untuk testing** dengan 3000 peserta

### 2. **Rate Limiting Ditambahkan**
```javascript
// Perubahan di simpleQueue.js
emailQueue: {
  concurrency: 1,              // 1 email at a time (was 3)
  delayBetweenJobs: 2000,      // 2 second delay antar email
  backoff: {
    delay: 5000                 // 5 second delay on retry (was 3s)
  }
}
```

### 3. **Connection Pooling**
```javascript
// Perubahan di emailService.js
transporter: {
  pool: true,                   // Reuse connections
  maxConnections: 1,            // 1 connection only
  maxMessages: 100,             // Reuse for 100 messages
  rateDelta: 2000,              // Min 2s between messages
  rateLimit: 1                  // Max 1 msg per rateDelta
}
```

---

## 🚀 Cara Menggunakan

### **Skenario 1: Testing dengan 3000 Peserta (RECOMMENDED)**

```env
# File: backend/.env
EMAIL_ENABLED=false
```

**Hasil:**
- ✓ Generate 3000 sertifikat
- ✓ Simpan ke database
- ✗ Email TIDAK dikirim (log only)
- ⏱️ Waktu: ~10 menit (concurrency 5)

**Untuk kirim email nanti:**
```sql
-- Ambil data peserta yang belum terkirim
SELECT id, email, nama_lengkap 
FROM presensi 
WHERE status = 'menunggu_sertifikat' 
  AND certificate_path IS NOT NULL;

-- Update manual via API satu per satu
```

---

### **Skenario 2: Kirim Email (Small Batch - Max 100)**

```env
# File: backend/.env
EMAIL_ENABLED=true
```

**Batasan:**
- Max **100 email/batch** untuk aman
- Total **500 email/hari** (Gmail limit)
- Estimasi waktu: **100 email = ~6 menit**

**Monitor:**
```bash
# Check queue status
curl http://localhost:5000/api/queue/stats
```

---

### **Skenario 3: Mass Email dengan Batch**

Untuk 3000 peserta, bagi menjadi batch:

```javascript
// Day 1: 500 emails
// Day 2: 500 emails
// Day 3: 500 emails
// ... dst (6 hari untuk 3000 email)
```

**Script batch:**
```javascript
// Kirim 500 email per hari dengan delay
const batchSize = 500;
const delayBetweenBatches = 24 * 60 * 60 * 1000; // 24 hours

// Atau gunakan cron job
```

---

## 🔧 Alternatif Solusi

### **Option 1: Upgrade ke Google Workspace**
- **500 → 2000 email/hari**
- Lebih reliable
- Biaya: ~$6/bulan/user

### **Option 2: Gunakan Email Service**
- **SendGrid**: 100 free/day, lalu $15/month
- **Mailgun**: 1000 free/month
- **Amazon SES**: $0.10/1000 emails
- **Mailtrap** (testing): Gratis

### **Option 3: SMTP Server Sendiri**
- Setup Postfix/Sendmail
- Unlimited emails
- Perlu konfigurasi server

### **Option 4: Manual Download**
```javascript
// User download sertifikat sendiri dari portal
// Tidak perlu email sama sekali
// Berikan link: /download/certificate/{id}
```

---

## 📊 Gmail Limits Reference

| Limit | Free Gmail | Google Workspace |
|-------|-----------|------------------|
| Max emails/day | 500 | 2,000 |
| Max recipients/email | 500 | 2,000 |
| Max external/day | 500 | 10,000 |
| SMTP connections | Limited | Less limited |
| Rate limit | Strict | More relaxed |

---

## 🐛 Troubleshooting

### Error: "Too many login attempts"
**Solusi:**
```env
EMAIL_ENABLED=false  # Disable email
```
Atau wait 24 jam, Gmail will unblock.

### Error: "Daily limit exceeded"
Sudah kirim 500 email hari ini.
**Solusi:** Wait sampai besok.

### Email masuk Spam
**Solusi:**
1. Setup SPF record
2. Setup DKIM
3. Atau gunakan email service profesional

---

## ✅ Rekomendasi untuk Production

### **Small Scale (<100 peserta/event)**
```env
EMAIL_ENABLED=true
```
Gmail cukup.

### **Medium Scale (100-500 peserta/event)**
```env
EMAIL_ENABLED=true
```
Batch processing dengan delay.

### **Large Scale (>500 peserta/event)**
**Option 1:** Disable email, user download sendiri
```env
EMAIL_ENABLED=false
```

**Option 2:** Gunakan email service (SendGrid/SES)
```javascript
// Ganti SMTP dengan SendGrid API
// Max 100 free/day atau unlimited with payment
```

---

## 🎯 Next Steps

1. **Untuk testing 3000 peserta:**
   ```env
   EMAIL_ENABLED=false
   ```

2. **Generate semua sertifikat:**
   ```bash
   npm run dev
   # Tunggu sampai selesai (~10 menit)
   ```

3. **Kirim email bertahap:**
   - Enable email: `EMAIL_ENABLED=true`
   - Kirim max 100/batch
   - Wait 2-3 jam antar batch
   - Atau 500/hari sesuai limit Gmail

4. **Atau gunakan alternatif:**
   - User download sendiri
   - Upgrade ke email service
   - Setup SMTP server sendiri

---

**Status:** Email disabled untuk menghindari rate limits.  
**Sertifikat:** Tetap digenerate dan disimpan.  
**Pengiriman:** Manual atau bertahap saat production.
