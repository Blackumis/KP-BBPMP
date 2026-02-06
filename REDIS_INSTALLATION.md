# Redis Installation Guide untuk Windows

## Option 1: Menggunakan Docker (RECOMMENDED) ⭐

### Step 1: Install Docker Desktop
1. Download Docker Desktop dari: https://www.docker.com/products/docker-desktop/
2. Install dan restart komputer
3. Buka Docker Desktop

### Step 2: Run Redis Container
```powershell
# Pull dan run Redis
docker run -d -p 6379:6379 --name redis-bbpmp redis:alpine

# Verify Redis is running
docker ps
```

### Step 3: Test Connection
```powershell
# Test from container
docker exec -it redis-bbpmp redis-cli ping
# Should return: PONG
```

### Commands untuk Manage Redis Container
```powershell
# Start Redis
docker start redis-bbpmp

# Stop Redis
docker stop redis-bbpmp

# View logs
docker logs redis-bbpmp

# Remove container (jika ingin hapus)
docker rm -f redis-bbpmp
```

---

## Option 2: Menggunakan WSL2 (Windows Subsystem for Linux)

### Step 1: Install WSL2
```powershell
# Jalankan sebagai Administrator
wsl --install
```

### Step 2: Install Redis di WSL
```bash
# Di WSL terminal
sudo apt-get update
sudo apt-get install redis-server

# Start Redis
sudo service redis-server start

# Test
redis-cli ping
# Should return: PONG
```

### Step 3: Configure Redis to start automatically
Edit `/etc/redis/redis.conf`:
```bash
sudo nano /etc/redis/redis.conf

# Find line:
# bind 127.0.0.1
# Change to:
bind 0.0.0.0

# Save and restart
sudo service redis-server restart
```

---

## Option 3: Windows Native (Tidak direkomendasikan)

⚠️ Microsoft tidak lagi maintain Redis untuk Windows.

Download dari: https://github.com/microsoftarchive/redis/releases
- Download Redis-x64-3.0.504.msi (atau versi terbaru)
- Install seperti aplikasi biasa
- Redis akan berjalan sebagai Windows Service

---

## Verification

Setelah install, test koneksi:

```bash
# Via npm script
cd backend
npm run test-redis

# Output yang diharapkan:
# ✅ Successfully connected to Redis
# ✅ Created test job with ID: 1
```

## Troubleshooting

### Error: ECONNREFUSED
Redis tidak berjalan. Start Redis:

**Docker:**
```bash
docker start redis-bbpmp
```

**WSL:**
```bash
wsl
sudo service redis-server start
```

### Error: Port 6379 already in use
Port sudah dipakai. Cek apa yang menggunakan:
```bash
netstat -ano | findstr :6379
```

Kill process atau gunakan port lain di `.env`:
```env
REDIS_PORT=6380
```

Dan update Docker command:
```bash
docker run -d -p 6380:6379 --name redis-bbpmp redis:alpine
```

## Next Steps

Setelah Redis berjalan:

1. ✅ Test connection: `npm run test-redis`
2. ✅ Start server: `npm run dev`
3. ✅ Access dashboard: http://localhost:5000/admin/queues
4. ✅ Load test data: `mysql -u root -p bbpmp_presensi < backend/database/test-3000-participants.sql`
5. ✅ Test queue dengan 3000 peserta

## Recommended Setup (Docker)

Untuk development, gunakan Docker Compose. Buat `docker-compose.yml`:

```yaml
version: '3.8'

services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes

volumes:
  redis-data:
```

Start dengan:
```bash
docker-compose up -d
```

Stop dengan:
```bash
docker-compose down
```
