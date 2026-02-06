# 🚀 Setup Queue System untuk Sertifikat Massal

## Ringkasan Perubahan

Sistem queue (antrian) telah ditambahkan untuk menangani pembuatan dan pengiriman sertifikat secara massal dengan lebih efisien. Sistem ini menggunakan:

- ✅ **Bull Queue** - Library queue berbasis Redis untuk background jobs
- ✅ **Bull Board** - Dashboard monitoring untuk queue
- ✅ **Redis** - In-memory database untuk menyimpan queue
- ✅ **Worker System** - Background workers untuk memproses jobs

## 📁 File yang Ditambahkan/Diubah

### File Baru:
```
backend/
├── config/
│   └── queue.js                          # Konfigurasi queue (certificate & email)
├── workers/
│   └── certificateWorker.js              # Worker untuk proses certificate & email
├── database/
│   └── test-3000-participants.sql        # SQL script untuk 3000 peserta test
├── scripts/
│   ├── test-redis.js                     # Script test koneksi Redis
│   └── verify_test_data.py               # Script verifikasi data test
├── QUEUE_GUIDE.md                        # Dokumentasi lengkap queue system
├── start-with-queue.bat                  # Quick start script (Windows)
└── start-with-queue.sh                   # Quick start script (Linux/Mac)

QUEUE_SYSTEM.md                           # Quick guide (root folder)
```

### File yang Dimodifikasi:
```
backend/
├── server.js                             # + Import queue & Bull Board
├── controllers/certificateController.js  # + Queue integration & monitoring APIs
├── routes/certificateRoutes.js           # + Queue monitoring routes
├── .env                                  # + Redis configuration
├── .env.example                          # + Redis configuration template
└── package.json                          # + Bull dependencies & scripts
```

## 🔧 Instalasi & Setup

### 1. Install Redis

**Windows (Menggunakan Docker - RECOMMENDED):**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### 2. Update .env

File `.env` sudah otomatis diupdate. Pastikan konfigurasi Redis:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Install Dependencies

```bash
cd backend
npm install
```

Dependencies yang ditambahkan:
- `bull` - Queue library
- `@bull-board/api` - Bull Board core
- `@bull-board/express` - Bull Board Express adapter
- `redis` - Redis client

### 4. Test Redis Connection

```bash
npm run test-redis
```

Jika berhasil, akan muncul:
```
✅ Successfully connected to Redis
✅ Created test job with ID: 1
📊 Queue stats...
✅ Redis connection test successful!
```

### 5. Start Server

```bash
npm run dev
```

Server akan start dengan queue workers aktif.

## 📊 Dashboard Monitoring

Buka browser:
```
http://localhost:5000/admin/queues
```

Dashboard menampilkan:
- Real-time job status (waiting, active, completed, failed)
- Job details dan logs
- Progress bar untuk setiap job
- Tombol retry untuk failed jobs
- Statistics dan graphs

## 🧪 Testing dengan 3000 Peserta

### Step 1: Import Test Data

```bash
# Windows
mysql -u root -p bbpmp_presensi < backend\database\test-3000-participants.sql

# Linux/Mac
mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql
```

Script ini akan membuat:
- 1 event test: "Kegiatan Test 3000 Peserta"
- 3000 peserta dengan email palsu: test1@fakemail-bbpmp-test.com hingga test3000@...

### Step 2: Verifikasi Data (Opsional)

```bash
# Pastikan Python dan mysql-connector-python terinstall
pip install mysql-connector-python

# Jalankan verifikasi
npm run verify-test-data
```

atau langsung:
```bash
python backend/scripts/verify_test_data.py
```

Output:
```
✅ Test Event Found
   ID: 5
   Name: Kegiatan Test 3000 Peserta
✅ Total Participants: 3000
📋 Sample Participants...
```

### Step 3: Generate Sertifikat untuk 3000 Peserta

**Via Postman/API Client:**

```http
POST http://localhost:5000/api/certificates/generate-event/5
Authorization: Bearer YOUR_JWT_TOKEN
```

Ganti `5` dengan event_id yang sesuai dari hasil verifikasi.

**Response:**
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

### Step 4: Monitor Progress

**Via Dashboard:**
- Buka: http://localhost:5000/admin/queues
- Lihat tab "certificate-generation"
- Monitor progress real-time

**Via API:**
```http
GET http://localhost:5000/api/certificates/queue/status/5
Authorization: Bearer YOUR_JWT_TOKEN
```

Response:
```json
{
  "success": true,
  "data": {
    "certificate_queue": {
      "total": {
        "waiting": 2800,
        "active": 1,
        "completed": 199,
        "failed": 0
      },
      "event": {
        "waiting": 2800,
        "active": 1,
        "completed": 199,
        "failed": 0
      }
    }
  }
}
```

### Step 5: Kirim Email ke 3000 Peserta

Setelah semua sertifikat selesai dibuat:

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

## 📡 API Endpoints Baru

| Endpoint | Method | Deskripsi |
|----------|--------|-----------|
| `/api/certificates/queue/status` | GET | Status semua queue |
| `/api/certificates/queue/status/:event_id` | GET | Status queue untuk event tertentu |
| `/api/certificates/queue/retry/certificate` | POST | Retry failed certificate jobs |
| `/api/certificates/queue/retry/email` | POST | Retry failed email jobs |
| `/api/certificates/queue/clean` | POST | Hapus completed jobs |
| `/admin/queues` | GET | Bull Board dashboard |

## ⚙️ Konfigurasi Performance

### Mengubah Concurrency

Edit `backend/workers/certificateWorker.js`:

```javascript
// Proses 5 certificate jobs sekaligus
certificateQueue.process(5, async (job) => {
  // ...
});

// Proses 10 email jobs sekaligus
emailQueue.process(10, async (job) => {
  // ...
});
```

### Estimasi Waktu Proses

| Concurrency | Certificate (3000) | Email (3000) | Total |
|-------------|-------------------|--------------|-------|
| 1 (default) | ~1.6 jam | ~2.5 jam | ~4.1 jam |
| 5 / 10      | ~20 menit | ~15 menit | ~35 menit |
| 10 / 20     | ~10 menit | ~7.5 menit | ~17.5 menit |

## 🔍 Monitoring & Troubleshooting

### Cek Status Queue via API

```bash
curl http://localhost:5000/api/certificates/queue/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Retry Failed Jobs

```bash
# Retry certificate generation yang gagal
curl -X POST http://localhost:5000/api/certificates/queue/retry/certificate \
  -H "Authorization: Bearer YOUR_TOKEN"

# Retry email sending yang gagal
curl -X POST http://localhost:5000/api/certificates/queue/retry/email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Clean Completed Jobs

```bash
curl -X POST http://localhost:5000/api/certificates/queue/clean \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Common Issues

**1. Redis Connection Error**
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
✅ Solusi: Pastikan Redis running
```bash
redis-cli ping  # Harus return "PONG"
```

**2. Queue Tidak Memproses Jobs**
✅ Solusi: Pastikan worker sudah diimport di `server.js`:
```javascript
import './workers/certificateWorker.js';
```

**3. Memory Issues**
✅ Solusi: Kurangi concurrency atau tambah RAM

## 🧹 Cleanup Test Data

**Via SQL:**
```sql
-- Cek event test
SELECT id FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';

-- Hapus peserta (ganti 5 dengan event_id yang sesuai)
DELETE FROM presensi WHERE event_id = 5;

-- Hapus event
DELETE FROM kegiatan WHERE id = 5;
```

**Via Python Script:**
```bash
python backend/scripts/verify_test_data.py cleanup
```

## 📚 Dokumentasi Lengkap

- **[QUEUE_SYSTEM.md](QUEUE_SYSTEM.md)** - Quick guide
- **[backend/QUEUE_GUIDE.md](backend/QUEUE_GUIDE.md)** - Dokumentasi lengkap dengan contoh kode

## 🎯 Keuntungan Queue System

✅ **Scalability** - Dapat handle ribuan peserta tanpa timeout  
✅ **Reliability** - Auto-retry jika gagal (3x certificate, 5x email)  
✅ **Monitoring** - Real-time dashboard dan API  
✅ **Non-blocking** - API response cepat, proses di background  
✅ **Error Handling** - Failed jobs dapat di-retry manual  
✅ **Visibility** - Track progress setiap job  

## 🚨 Important Notes

1. **Redis harus running** sebelum start server
2. **Email palsu** di test data tidak akan terkirim (fake domain)
3. **Concurrency** dapat disesuaikan berdasarkan spec server
4. **Dashboard** `/admin/queues` sebaiknya dilindungi auth di production
5. **Cleanup** completed jobs secara berkala untuk menghemat memory

## 📞 Support

Jika ada masalah:
1. Cek Redis: `redis-cli ping`
2. Cek logs di console server
3. Cek Bull Board dashboard
4. Lihat dokumentasi lengkap di `backend/QUEUE_GUIDE.md`
