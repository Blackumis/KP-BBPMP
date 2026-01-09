# Deployment Guide - Cloud Panel

Panduan lengkap deploy Backend KP BBPMP ke Cloud Panel.

## Persiapan

### 1. Server Requirements
- Node.js 18+ ✓
- MySQL 8+ ✓
- PM2 (untuk production)
- Nginx (biasanya sudah terinstall di Cloud Panel)

### 2. Akses Yang Diperlukan
- [ ] SSH access ke server
- [ ] MySQL database credentials
- [ ] Domain/subdomain untuk API

## Langkah Deployment

### Step 1: Setup Database di Cloud Panel

1. Login ke **Cloud Panel Dashboard**
2. Buka menu **Databases** > **MySQL**
3. Klik **Add Database**:
   - Database Name: `kp_bbpmp_db`
   - Username: buat user baru atau gunakan existing
   - Password: catat password ini
4. **Save** dan catat credentials:
   ```
   Host: localhost (atau IP server)
   Database: kp_bbpmp_db
   Username: [your_username]
   Password: [your_password]
   ```

### Step 2: Upload Files

**Opsi A: Via FTP/SFTP (FileZilla, WinSCP)**
1. Connect ke server menggunakan FTP credentials dari Cloud Panel
2. Upload semua file di folder `backend/` ke:
   ```
   /home/[username]/htdocs/api/
   ```

**Opsi B: Via Git (Recommended)**
```bash
# SSH ke server
ssh user@your-server.com

# Clone repository
cd /home/[username]/htdocs/
git clone [your-repo-url] api
cd api
```

### Step 3: Install Dependencies

```bash
# SSH ke server
ssh user@your-server.com

cd /home/[username]/htdocs/api
npm install --production
```

### Step 4: Setup Environment

```bash
# Copy .env example
cp .env.example .env

# Edit .env
nano .env
```

**Konfigurasi Production:**
```env
# Server
NODE_ENV=production
PORT=5000

# Database (sesuaikan dengan Step 1)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=kp_bbpmp_db

# JWT Secret (GANTI dengan random string yang kuat!)
JWT_SECRET=ganti-dengan-random-string-minimal-32-karakter-1234567890
JWT_EXPIRES_IN=7d

# Email (gunakan Gmail atau SMTP server lainnya)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# URLs (sesuaikan dengan domain Anda)
BASE_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com
```

**Cara membuat JWT Secret yang kuat:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Cara membuat Gmail App Password:**
1. Buka Google Account > Security
2. Aktifkan 2-Step Verification
3. Buka "App passwords"
4. Generate password untuk "Mail"
5. Copy password (16 digit) ke SMTP_PASSWORD

Simpan dengan: `Ctrl+X` → `Y` → `Enter`

### Step 5: Run Database Migration

```bash
npm run migrate
```

Output yang diharapkan:
```
Connected to MySQL server
Running migrations...
✓ Database schema created successfully
✓ Tables created successfully
✓ Kabupaten/Kota data inserted
✓ Default admin created (username: admin, password: admin123)
```

### Step 6: Test Server

Test apakah server bisa jalan:
```bash
npm start
```

Jika berhasil, akan muncul:
```
Server is running on port 5000
Environment: production
```

Test dengan curl:
```bash
curl http://localhost:5000/api/health
```

Tekan `Ctrl+C` untuk stop (kita akan pakai PM2 nanti).

### Step 7: Setup PM2 (Process Manager)

Install PM2 (jika belum ada):
```bash
npm install -g pm2
```

Start aplikasi dengan PM2:
```bash
cd /home/[username]/htdocs/api

# Start server
pm2 start server.js --name kp-bbpmp-api

# Auto-start on server reboot
pm2 startup
pm2 save
```

**PM2 Commands:**
```bash
pm2 status              # Cek status
pm2 logs kp-bbpmp-api   # Lihat logs
pm2 restart kp-bbpmp-api # Restart server
pm2 stop kp-bbpmp-api   # Stop server
pm2 delete kp-bbpmp-api # Delete process
```

### Step 8: Setup Nginx (Reverse Proxy)

Di Cloud Panel, setup domain/subdomain untuk API.

**Opsi A: Via Cloud Panel Dashboard**
1. Buka **Domains** > **Add Domain**
2. Domain: `api.yourdomain.com`
3. Document Root: `/home/[username]/htdocs/api`
4. SSL: Enable (Let's Encrypt)

**Opsi B: Manual Nginx Config**

Edit Nginx config:
```bash
nano /etc/nginx/sites-available/api.yourdomain.com.conf
```

Tambahkan:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (Cloud Panel biasanya auto-generate)
    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;

    # Proxy to Node.js
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files
    location /uploads {
        alias /home/[username]/htdocs/api/uploads;
        expires 30d;
        access_log off;
    }

    location /certificates {
        alias /home/[username]/htdocs/api/certificates;
        expires 30d;
        access_log off;
    }
}
```

Test & reload Nginx:
```bash
nginx -t
systemctl reload nginx
```

### Step 9: Setup Firewall

Pastikan port yang diperlukan terbuka:
```bash
# Jika pakai ufw
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 5000/tcp  # Untuk development saja
```

Di Cloud Panel, firewall biasanya sudah dikonfigurasi otomatis.

### Step 10: Test Deployment

**Test Health Check:**
```bash
curl https://api.yourdomain.com/api/health
```

**Test Login:**
```bash
curl -X POST https://api.yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Jika berhasil, Anda akan mendapat response dengan token.

## Maintenance

### Update Code

```bash
cd /home/[username]/htdocs/api

# Pull latest code
git pull

# Install dependencies (jika ada perubahan)
npm install

# Restart server
pm2 restart kp-bbpmp-api
```

### Backup Database

```bash
# Manual backup
mysqldump -u username -p kp_bbpmp_db > backup-$(date +%Y%m%d).sql

# Setup auto backup (crontab)
crontab -e

# Tambahkan (backup setiap hari jam 2 pagi):
0 2 * * * mysqldump -u username -p'password' kp_bbpmp_db > /path/to/backup/kp-$(date +\%Y\%m\%d).sql
```

### Monitor Logs

```bash
# PM2 logs
pm2 logs kp-bbpmp-api

# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs
tail -f /var/log/nginx/error.log
```

### Monitoring Resource

```bash
# CPU & Memory usage
pm2 monit

# Disk usage
df -h

# Process status
htop
```

## Troubleshooting

### Server tidak bisa diakses
1. Cek PM2 status: `pm2 status`
2. Cek logs: `pm2 logs kp-bbpmp-api`
3. Cek Nginx: `nginx -t` dan `systemctl status nginx`
4. Cek firewall

### Database connection error
1. Cek credentials di `.env`
2. Test koneksi: `mysql -u username -p -h localhost kp_bbpmp_db`
3. Pastikan MySQL running: `systemctl status mysql`

### Email tidak terkirim
1. Cek SMTP credentials di `.env`
2. Test dari server: `telnet smtp.gmail.com 587`
3. Pastikan App Password sudah benar (Gmail)

### Permission denied untuk upload
```bash
# Set permissions
chmod 755 /home/[username]/htdocs/api/uploads
chmod 755 /home/[username]/htdocs/api/certificates

# Set ownership
chown -R www-data:www-data /home/[username]/htdocs/api/uploads
chown -R www-data:www-data /home/[username]/htdocs/api/certificates
```

## Security Checklist

- [ ] Ganti default admin password
- [ ] Ganti JWT_SECRET dengan random string yang kuat
- [ ] Enable HTTPS/SSL
- [ ] Setup firewall
- [ ] Disable directory listing di Nginx
- [ ] Regular security updates: `npm audit fix`
- [ ] Setup backup otomatis
- [ ] Monitor logs secara berkala

## Performance Optimization

### Enable Compression
Sudah aktif via middleware `compression` di server.js

### PM2 Cluster Mode
```bash
# Stop current instance
pm2 delete kp-bbpmp-api

# Start in cluster mode (4 instances)
pm2 start server.js -i 4 --name kp-bbpmp-api
pm2 save
```

### Database Indexing
Sudah dikonfigurasi di schema.sql untuk performa optimal.

### Cache Static Files
Sudah dikonfigurasi di Nginx config (`expires 30d`).

## Support

Jika mengalami kesulitan:
1. Cek logs: `pm2 logs kp-bbpmp-api`
2. Review dokumentasi: `README.md`
3. Hubungi tim developer

---

**Selamat! Backend API sudah deployed dan siap digunakan!** 🚀
