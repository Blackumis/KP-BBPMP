# 🚀 Quick Start - Queue System (Bahasa Indonesia)

Panduan cepat untuk menggunakan sistem queue untuk pembuatan dan pengiriman sertifikat massal.

---

## 📋 Langkah 1: Install Redis

> **💡 Kenapa Redis?** Bull queue memerlukan tempat menyimpan data jobs. Redis dipilih karena cepat, reliable, dan **100% GRATIS** (open source). Bisa self-hosted atau pakai cloud free tier. [Lihat alternatif lain](QUEUE_ALTERNATIVES.md)

### Pilih salah satu metode:

#### A. Docker (RECOMMENDED) ⭐
```bash
# Install Docker Desktop dulu dari: https://www.docker.com/products/docker-desktop/

# Jalankan Redis
docker run -d -p 6379:6379 --name redis-bbpmp redis:alpine

# Cek status
docker ps
```

#### B. Windows (Native)
Lihat: [REDIS_INSTALLATION.md](REDIS_INSTALLATION.md)

---

## 📋 Langkah 2: Test Redis Connection

```bash
cd backend

# Test Redis
npm run test-redis
```

**Output yang diharapkan:**
```
✅ Successfully connected to Redis
✅ Created test job with ID: 1
📊 Queue stats...
✅ Redis connection test successful!
```

Jika error, pastikan Redis sudah running:
```bash
docker start redis-bbpmp
```

---

## 📋 Langkah 3: Start Server

```bash
npm run dev
```

Server akan berjalan dengan queue workers aktif.

---

## 📋 Langkah 4: Akses Queue Dashboard

Buka browser:
```
http://localhost:5000/admin/queues
```

Dashboard ini menampilkan:
- ⏳ Jobs yang sedang antri (waiting)
- ▶️ Jobs yang sedang diproses (active)
- ✅ Jobs yang selesai (completed)
- ❌ Jobs yang gagal (failed)

---

## 📋 Langkah 5: Load Test Data (3000 Peserta)

```bash
# Windows
mysql -u root -p bbpmp_presensi < backend\database\test-3000-participants.sql

# Linux/Mac
mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql
```

**Apa yang terjadi:**
- Membuat 1 event test: "Kegiatan Test 3000 Peserta"
- Generate 3000 peserta dengan data random
- Email palsu: test1@fakemail-bbpmp-test.com, test2@..., dst

---

## 📋 Langkah 6: Verifikasi Data (Opsional)

```bash
# Install Python MySQL connector dulu (jika belum)
pip install mysql-connector-python

# Jalankan verifikasi
python backend\scripts\verify_test_data.py
```

**Output:**
```
✅ Test Event Found
   ID: 5
   Name: Kegiatan Test 3000 Peserta
✅ Total Participants: 3000
📋 Sample Participants:
1. Ahmad Saputra
   Email: test1@fakemail-bbpmp-test.com
   ...
```

**Catat event_id yang muncul (misal: 5)**

---

## 📋 Langkah 7: Generate Sertifikat

### Via Postman atau API Client:

```http
POST http://localhost:5000/api/certificates/generate-event/5
Authorization: Bearer YOUR_JWT_TOKEN
```

**Ganti:**
- `5` dengan event_id dari Langkah 6
- `YOUR_JWT_TOKEN` dengan token setelah login

### Response:
```json
{
  "success": true,
  "message": "Added 3000 certificate generation jobs to queue",
  "data": {
    "total": 3000,
    "queued": 3000,
    "queue_info": {
      "name": "certificate-generation",
      "message": "Jobs are being processed in the background..."
    }
  }
}
```

✅ **Response langsung!** Tidak perlu menunggu 1-2 jam!

---

## 📋 Langkah 8: Monitor Progress

### A. Via Dashboard (Visual)

Buka: http://localhost:5000/admin/queues

Klik tab **"certificate-generation"** untuk melihat:
- Progress bar
- Jumlah waiting/active/completed/failed
- Detail setiap job
- Logs dan errors

### B. Via API

```http
GET http://localhost:5000/api/certificates/queue/status/5
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificate_queue": {
      "total": {
        "waiting": 2500,
        "active": 1,
        "completed": 499,
        "failed": 0
      },
      "event": {
        "waiting": 2500,
        "active": 1,
        "completed": 499,
        "failed": 0
      }
    }
  }
}
```

**Arti:**
- `waiting: 2500` → 2500 jobs masih antri
- `active: 1` → 1 job sedang diproses
- `completed: 499` → 499 jobs sudah selesai
- `failed: 0` → 0 jobs gagal

---

## 📋 Langkah 9: Tunggu Sampai Selesai

### Estimasi Waktu:

| Concurrency | Waktu |
|-------------|-------|
| 1 (default) | ~1.6 jam |
| 5 | ~20 menit |
| 10 | ~10 menit |

**Cek apakah sudah selesai:**
- Dashboard: semua jobs di tab "Completed"
- API: `completed: 3000, waiting: 0, active: 0`

---

## 📋 Langkah 10: Kirim Email ke 3000 Peserta

Setelah SEMUA sertifikat selesai dibuat:

```http
POST http://localhost:5000/api/certificates/send-event/5
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Added 3000 email sending jobs to queue",
  "data": {
    "total": 3000,
    "queued": 3000
  }
}
```

---

## 📋 Langkah 11: Monitor Email Sending

### Dashboard:

Buka: http://localhost:5000/admin/queues

Klik tab **"email-sending"**

### API:

```http
GET http://localhost:5000/api/certificates/queue/status/5
```

Lihat bagian `email_queue`.

---

## 📋 Langkah 12: Cleanup Test Data

Setelah selesai testing:

### Via Python Script:
```bash
python backend\scripts\verify_test_data.py cleanup
```

Konfirmasi dengan ketik: `yes`

### Via SQL:
```sql
-- Login ke MySQL
mysql -u root -p

USE bbpmp_presensi;

-- Hapus peserta (ganti 5 dengan event_id Anda)
DELETE FROM presensi WHERE event_id = 5;

-- Hapus event
DELETE FROM kegiatan WHERE id = 5;
```

---

## 🔧 Troubleshooting

### ❌ Redis connection error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solusi:**
```bash
# Start Redis
docker start redis-bbpmp

# Test
docker exec -it redis-bbpmp redis-cli ping
# Harus return: PONG
```

### ❌ Queue tidak memproses
**Cek:**
1. Redis running: `docker ps | findstr redis`
2. Worker loaded: lihat console saat server start, harus ada:
   ```
   Certificate and Email workers started
   ```
3. Dashboard: http://localhost:5000/admin/queues

### ❌ Jobs failed
**Retry manual:**

Via Dashboard:
1. Buka http://localhost:5000/admin/queues
2. Klik tab yang ada failed jobs
3. Klik job yang failed
4. Klik "Retry"

Via API:
```http
POST http://localhost:5000/api/certificates/queue/retry/certificate
# atau
POST http://localhost:5000/api/certificates/queue/retry/email
```

### ❌ Test data tidak terload
```bash
# Cek apakah database exist
mysql -u root -p -e "SHOW DATABASES LIKE 'bbpmp_presensi';"

# Jika tidak ada, buat dulu
mysql -u root -p < backend\database\schema.sql

# Lalu load test data lagi
mysql -u root -p bbpmp_presensi < backend\database\test-3000-participants.sql
```

---

## 💡 Tips

### 1. Increase Concurrency untuk lebih cepat

Edit `backend/workers/certificateWorker.js`:

```javascript
// Ganti ini:
certificateQueue.process(async (job) => { ... });

// Menjadi (5 concurrent jobs):
certificateQueue.process(5, async (job) => { ... });

// Atau (10 concurrent jobs):
certificateQueue.process(10, async (job) => { ... });
```

**Restart server** setelah edit.

### 2. Monitor via Console

Lihat console saat server running:
```
Certificate job 123 completed
Email job 456 completed
Certificate job 124 failed: ...
```

### 3. Clean Completed Jobs

Untuk hemat memory:
```http
POST http://localhost:5000/api/certificates/queue/clean
```

---

## 📚 Dokumentasi Lengkap

- **[SETUP_QUEUE.md](SETUP_QUEUE.md)** - Setup guide lengkap
- **[backend/QUEUE_GUIDE.md](backend/QUEUE_GUIDE.md)** - Technical documentation
- **[REDIS_INSTALLATION.md](REDIS_INSTALLATION.md)** - Redis installation
- **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Summary perubahan

---

## ❓ Pertanyaan Umum

**Q: Apakah harus pakai Docker?**  
A: Tidak, tapi Docker paling mudah. Bisa juga pakai WSL2 atau native Windows.

**Q: Berapa lama untuk 3000 peserta?**  
A: Default ~4 jam. Dengan concurrency 5-10, bisa ~30-40 menit total.

**Q: Apakah email test benar-benar terkirim?**  
A: Tidak, karena domain `fakemail-bbpmp-test.com` tidak exist. Untuk test real email, ganti dengan email asli.

**Q: Bagaimana cara stop proses di tengah jalan?**  
A: Restart server. Jobs yang sedang diproses akan di-retry. Atau pause queue via Bull Board.

**Q: Bisakah proses multiple events bersamaan?**  
A: Ya! Queue akan memproses semua jobs dari berbagai event secara parallel.

---

**🎉 Selamat! Sistem queue sudah siap digunakan!**

Jika ada masalah, cek troubleshooting atau buka dokumentasi lengkap.
