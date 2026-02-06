# 📋 Queue System - Certificate Generation & Email Sending

## 🚀 Quick Start

### 1. Install Redis

**Windows (Docker - Recommended):**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Linux/Mac:**
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

### 2. Configure Environment

Update `backend/.env`:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
```

### 3. Start Server

```bash
cd backend
npm install
npm run dev
```

## 📊 Queue Dashboard

Access the monitoring dashboard at:
```
http://localhost:5000/admin/queues
```

Features:
- Real-time job monitoring
- Progress tracking
- Error logs
- Manual retry for failed jobs
- Job statistics

## 🧪 Testing with 3000 Participants

### Import Test Data

```bash
mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql
```

This creates:
- 1 test event: "Kegiatan Test 3000 Peserta"
- 3000 participants with fake emails (test1@fakemail-bbpmp-test.com, test2@..., etc.)

### Generate Certificates

```bash
# Replace {event_id} with your test event ID
curl -X POST http://localhost:5000/api/certificates/generate-event/{event_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Monitor Progress

Visit dashboard or check via API:
```bash
curl http://localhost:5000/api/certificates/queue/status/{event_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Send Emails

```bash
curl -X POST http://localhost:5000/api/certificates/send-event/{event_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/certificates/generate-event/:event_id` | POST | Queue certificate generation |
| `/api/certificates/send-event/:event_id` | POST | Queue email sending |
| `/api/certificates/queue/status` | GET | Get all queues status |
| `/api/certificates/queue/status/:event_id` | GET | Get event-specific status |
| `/api/certificates/queue/retry/:queue_type` | POST | Retry failed jobs |
| `/api/certificates/queue/clean` | POST | Clean completed jobs |

## ⚙️ Configuration

### Adjust Concurrency

Edit `backend/workers/certificateWorker.js`:

```javascript
// Process 5 certificate jobs at once
certificateQueue.process(5, async (job) => { ... });

// Process 10 email jobs at once
emailQueue.process(10, async (job) => { ... });
```

### Performance Estimates

| Configuration | Certificate Gen | Email Sending |
|---------------|----------------|---------------|
| Concurrency 1 | ~1.6 hours | ~2.5 hours |
| Concurrency 5/10 | ~20 minutes | ~15 minutes |

## 🔧 Troubleshooting

### Redis Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution:**
```bash
# Test Redis
redis-cli ping
# Should return: PONG

# Start Redis
redis-server

# Or with Docker
docker start redis
```

### Queue Not Processing

Check that worker is loaded in `server.js`:
```javascript
import './workers/certificateWorker.js';
```

## 🧹 Cleanup Test Data

```sql
-- Get test event ID
SELECT id FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';

-- Delete participants
DELETE FROM presensi WHERE event_id = YOUR_EVENT_ID;

-- Delete event
DELETE FROM kegiatan WHERE nomor_surat = 'TEST-3000/2026';
```

## 📚 Full Documentation

See [QUEUE_GUIDE.md](backend/QUEUE_GUIDE.md) for detailed documentation.

## 🎯 Benefits

✅ Handles thousands of participants without timeout  
✅ Automatic retry on failure (3x for certificates, 5x for emails)  
✅ Real-time monitoring and progress tracking  
✅ Non-blocking API responses  
✅ Background processing  
✅ Manual retry for failed jobs  
