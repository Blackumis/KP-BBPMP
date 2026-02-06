# Queue System untuk Pembuatan dan Pengiriman Sertifikat Massal

## Fitur Queue System

Sistem antrian (queue) telah ditambahkan untuk menangani pembuatan dan pengiriman sertifikat secara massal dengan lebih efisien dan reliable, terutama untuk jumlah peserta yang banyak (seperti 3000 orang).

### Keuntungan Menggunakan Queue:

1. **Reliability** - Setiap job akan diproses dan di-retry otomatis jika gagal (hingga 3x untuk certificate, 5x untuk email)
2. **Scalability** - Dapat menangani ribuan peserta tanpa timeout
3. **Monitoring** - Dashboard visual untuk memantau progress
4. **Non-blocking** - API response langsung tanpa menunggu semua proses selesai
5. **Error Handling** - Failed jobs dapat di-retry manual
6. **Background Processing** - Proses berjalan di background

## Teknologi yang Digunakan

- **Bull** - Queue library berbasis Redis
- **Bull Board** - Dashboard UI untuk monitoring queue
- **Redis** - In-memory data store untuk queue storage

## Instalasi Redis

### Windows:
```bash
# Download Redis untuk Windows dari: https://github.com/microsoftarchive/redis/releases
# Atau gunakan WSL2:
wsl --install
wsl
sudo apt-get update
sudo apt-get install redis-server
redis-server
```

### Linux/Mac:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Mac
brew install redis
brew services start redis
```

### Docker (Recommended):
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

## Konfigurasi

Tambahkan ke file `.env`:

```env
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

## API Endpoints

### 1. Generate Semua Sertifikat (Dengan Queue)
```
POST /api/certificates/generate-event/:event_id
```

Response:
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

### 2. Kirim Semua Sertifikat via Email (Dengan Queue)
```
POST /api/certificates/send-event/:event_id
```

Response:
```json
{
  "success": true,
  "message": "Added 3000 email sending jobs to queue",
  "data": {
    "total": 3000,
    "queued": 3000,
    "queue_info": {
      "name": "email-sending",
      "message": "Emails are being sent in the background..."
    }
  }
}
```

### 3. Cek Status Queue
```
GET /api/certificates/queue/status
GET /api/certificates/queue/status/:event_id
```

Response:
```json
{
  "success": true,
  "data": {
    "certificate_queue": {
      "total": {
        "waiting": 2500,
        "active": 10,
        "completed": 450,
        "failed": 40
      },
      "event": {
        "waiting": 2500,
        "active": 10,
        "completed": 450,
        "failed": 40
      }
    },
    "email_queue": {
      "total": {
        "waiting": 0,
        "active": 5,
        "completed": 2995,
        "failed": 0
      }
    }
  }
}
```

### 4. Retry Failed Jobs
```
POST /api/certificates/queue/retry/certificate
POST /api/certificates/queue/retry/email
```

### 5. Clean Completed Jobs
```
POST /api/certificates/queue/clean
```

## Queue Dashboard

Akses Bull Board Dashboard untuk monitoring visual:

```
http://localhost:3000/admin/queues
```

Dashboard menampilkan:
- Jumlah jobs (waiting, active, completed, failed)
- Detail setiap job
- Progress bar
- Error messages
- Retry manual untuk failed jobs
- Clean jobs

## Testing dengan 3000 Peserta

### 1. Import Test Data

Jalankan SQL script untuk membuat 3000 peserta test:

```bash
mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql
```

Script akan:
- Membuat event test "Kegiatan Test 3000 Peserta"
- Generate 3000 peserta dengan data palsu
- Email palsu: test1@fakemail-bbpmp-test.com hingga test3000@fakemail-bbpmp-test.com

### 2. Generate Sertifikat untuk 3000 Peserta

```bash
# Ambil event_id dari event test
# Misal event_id = 5

curl -X POST http://localhost:3000/api/certificates/generate-event/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Monitor Progress

Buka dashboard: http://localhost:3000/admin/queues

Atau cek via API:
```bash
curl http://localhost:3000/api/certificates/queue/status/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Kirim Email (Setelah semua sertifikat selesai dibuat)

```bash
curl -X POST http://localhost:3000/api/certificates/send-event/5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Performance Tips

### Concurrency Settings

Secara default, Bull memproses 1 job pada satu waktu. Untuk meningkatkan performa:

Edit `backend/workers/certificateWorker.js`:

```javascript
// Proses 5 certificate jobs secara bersamaan
certificateQueue.process(5, async (job) => {
  // ...
});

// Proses 10 email jobs secara bersamaan
emailQueue.process(10, async (job) => {
  // ...
});
```

### Estimasi Waktu

Dengan concurrency default:
- **Certificate Generation**: ~3000 sertifikat × 2 detik = ~1.6 jam
- **Email Sending**: ~3000 email × 3 detik = ~2.5 jam

Dengan concurrency 5 (certificate) dan 10 (email):
- **Certificate Generation**: ~3000 ÷ 5 × 2 detik = ~20 menit
- **Email Sending**: ~3000 ÷ 10 × 3 detik = ~15 menit

## Error Handling

### Automatic Retry

Jobs yang gagal akan otomatis di-retry dengan exponential backoff:
- Certificate jobs: 3 attempts dengan delay 2s, 4s, 8s
- Email jobs: 5 attempts dengan delay 3s, 6s, 12s, 24s, 48s

### Manual Retry

Untuk retry semua failed jobs:

```bash
curl -X POST http://localhost:3000/api/certificates/queue/retry/certificate \
  -H "Authorization: Bearer YOUR_TOKEN"

curl -X POST http://localhost:3000/api/certificates/queue/retry/email \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Troubleshooting

### Redis Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solusi**: Pastikan Redis server berjalan
```bash
# Check Redis status
redis-cli ping
# Should return: PONG

# Start Redis
redis-server

# Or with Docker
docker start redis
```

### Queue Not Processing

**Solusi**: Pastikan worker sudah dimuat di server.js
```javascript
// backend/server.js
import './workers/certificateWorker.js';
```

### Memory Issues

Untuk data sangat besar, atur job cleanup:

```javascript
// backend/config/queue.js
removeOnComplete: {
  age: 3600, // 1 jam
  count: 100
}
```

## Monitoring Production

### Queue Metrics

Monitor metrics penting:
- **Throughput**: Jobs/second
- **Latency**: Average job duration
- **Error Rate**: Failed/Total jobs
- **Queue Depth**: Waiting jobs count

### Alerts

Setup alerts untuk:
- Failed jobs > threshold
- Queue depth > threshold
- Processing time > threshold

## Cleanup Test Data

Setelah selesai testing, hapus data test:

```sql
-- Ambil event_id dari test event
SELECT id FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';

-- Hapus presensi test
DELETE FROM presensi WHERE event_id = YOUR_EVENT_ID;

-- Hapus event test
DELETE FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';
```

## Integration dengan Frontend

Update frontend untuk menampilkan status queue:

```javascript
// Poll queue status setiap 5 detik
const pollQueueStatus = async (eventId) => {
  const response = await fetch(`/api/certificates/queue/status/${eventId}`);
  const data = await response.json();
  
  // Update UI dengan progress
  const total = data.data.certificate_queue.event.waiting + 
                data.data.certificate_queue.event.active +
                data.data.certificate_queue.event.completed;
  const completed = data.data.certificate_queue.event.completed;
  const progress = (completed / total) * 100;
  
  console.log(`Progress: ${progress.toFixed(2)}%`);
};

// Polling
const intervalId = setInterval(() => pollQueueStatus(eventId), 5000);
```

## Production Deployment

### Redis Configuration

Untuk production, gunakan Redis yang reliable:
- Redis Cloud (managed)
- AWS ElastiCache
- Azure Cache for Redis
- Self-hosted dengan persistence

### Security

Lindungi queue dashboard dengan authentication:

```javascript
// backend/server.js
app.use('/admin/queues', authenticateToken, isAdmin, serverAdapter.getRouter());
```

### Scaling

Untuk menangani load tinggi:
1. Horizontal scaling: Jalankan multiple workers
2. Redis Cluster untuk high availability
3. Load balancer untuk distribute traffic
