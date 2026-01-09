# API Testing Guide

Panduan testing API menggunakan berbagai tools.

## 1. Testing dengan cURL

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Simpan token dari response untuk request berikutnya:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Profile
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Create Event
```bash
curl -X POST http://localhost:5000/api/events \
  -H "Authorization: Bearer $TOKEN" \
  -F "nama_kegiatan=Workshop Test" \
  -F "nomor_surat=001/TEST/2026" \
  -F "tanggal_mulai=2026-02-01" \
  -F "tanggal_selesai=2026-02-02" \
  -F "jam_mulai=08:00:00" \
  -F "jam_selesai=16:00:00" \
  -F "batas_waktu_absensi=2026-02-02 17:00:00"
```

### Get Kabupaten/Kota
```bash
curl http://localhost:5000/api/reference/kabupaten-kota
```

### Submit Attendance (Public)
```bash
curl -X POST http://localhost:5000/api/attendance/submit/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nama_lengkap": "Dr. John Doe, M.Pd",
    "unit_kerja": "BBPMP Jawa Tengah",
    "provinsi": "Jawa Tengah",
    "kabupaten_kota": "Kota Semarang",
    "nomor_hp": "081234567890",
    "email": "test@example.com",
    "email_konfirmasi": "test@example.com",
    "signature_url": "https://example.com/sign.png",
    "pernyataan": true
  }'
```

## 2. Testing dengan Postman

### Import Collection
1. Buka Postman
2. Klik **Import**
3. Pilih file `KP-BBPMP-API.postman_collection.json`
4. Collection akan muncul di sidebar

### Setup Environment
1. Klik **Environments** > **Create Environment**
2. Nama: `KP BBPMP Local`
3. Variables:
   ```
   base_url: http://localhost:5000/api
   token: (akan auto-terisi setelah login)
   ```

### Test Flow
1. **Auth** > **Login**
   - Token otomatis tersimpan di collection variable
2. **Events** > **Create Event**
   - Test create kegiatan baru
3. **Events** > **Generate Form Link**
   - Dapatkan link untuk user
4. **Attendance** > **Submit Attendance**
   - Test submit absensi (public)
5. **Certificates** > **Generate Event Certificates**
   - Generate semua sertifikat
6. **Certificates** > **Send Event Certificates**
   - Kirim via email

## 3. Testing dengan Thunder Client (VS Code)

### Install Extension
1. Buka VS Code
2. Extensions > Search "Thunder Client"
3. Install

### Import Collection
1. Klik Thunder Client icon di sidebar
2. Collections > Import > File
3. Pilih `KP-BBPMP-API.postman_collection.json`

### Test Requests
Sama seperti Postman, jalankan requests sesuai urutan.

## 4. Testing dengan JavaScript

### Install Node.js HTTP Client
```bash
npm install -g httpie
```

### Test Requests
```bash
# Health check
http GET localhost:5000/api/health

# Login
http POST localhost:5000/api/auth/login \
  username=admin password=admin123

# Get events (with token)
http GET localhost:5000/api/events \
  Authorization:"Bearer YOUR_TOKEN"
```

## 5. Automated Testing

### Setup Jest
```bash
npm install --save-dev jest supertest
```

### Create Test File
`tests/auth.test.js`:
```javascript
import request from 'supertest';
import app from '../server.js';

describe('Auth Endpoints', () => {
  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      });
    
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('token');
  });

  test('POST /api/auth/login - wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrongpassword'
      });
    
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
```

Run tests:
```bash
npm test
```

## Test Scenarios

### Scenario 1: Complete Event Flow

1. **Admin Login**
   ```
   POST /api/auth/login
   ✓ Dapat token
   ```

2. **Create Event**
   ```
   POST /api/events
   ✓ Event created dengan ID
   ```

3. **Generate Link**
   ```
   POST /api/events/{id}/generate-link
   ✓ Dapat link form
   ```

4. **User Submit Attendance** (3x dengan email berbeda)
   ```
   POST /api/attendance/submit/{event_id}
   ✓ 3 peserta terdaftar
   ```

5. **View Attendances**
   ```
   GET /api/attendance/event/{event_id}
   ✓ Muncul 3 peserta
   ```

6. **Generate Certificates**
   ```
   POST /api/certificates/generate-event/{event_id}
   ✓ 3 PDF generated
   ```

7. **Send Certificates**
   ```
   POST /api/certificates/send-event/{event_id}
   ✓ 3 email terkirim
   ```

### Scenario 2: Validation Tests

1. **Duplicate Email**
   ```
   POST /api/attendance/submit/{event_id}
   dengan email yang sama 2x
   ✗ Error: "Already submitted attendance"
   ```

2. **Email Mismatch**
   ```
   email: "test@mail.com"
   email_konfirmasi: "different@mail.com"
   ✗ Error: "Email do not match"
   ```

3. **Missing Required Fields**
   ```
   Submit tanpa nama_lengkap
   ✗ Error: "All required fields must be filled"
   ```

4. **Expired Deadline**
   ```
   Submit setelah batas_waktu_absensi
   ✗ Error: "Attendance deadline has passed"
   ```

### Scenario 3: Security Tests

1. **Access Protected Route Without Token**
   ```
   GET /api/events
   tanpa Authorization header
   ✗ 401 Unauthorized
   ```

2. **Invalid Token**
   ```
   GET /api/events
   dengan token yang salah
   ✗ 403 Forbidden
   ```

3. **SQL Injection Attempt**
   ```
   POST /api/auth/login
   username: "admin' OR '1'='1"
   ✗ Login failed (prepared statements mencegah)
   ```

## Load Testing

### Using Artillery

Install:
```bash
npm install -g artillery
```

Create `load-test.yml`:
```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - post:
        url: '/api/auth/login'
        json:
          username: 'admin'
          password: 'admin123'
```

Run:
```bash
artillery run load-test.yml
```

## Expected Results

### Success Responses
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Debugging

### Enable Debug Logs
```bash
# Development
DEBUG=* npm run dev

# Production
NODE_ENV=development npm start
```

### Check Database
```sql
-- Check events
SELECT * FROM events ORDER BY id DESC LIMIT 10;

-- Check attendances
SELECT * FROM attendances ORDER BY created_at DESC LIMIT 10;

-- Check certificate status
SELECT 
  e.nama_kegiatan,
  COUNT(*) as total,
  SUM(CASE WHEN a.status = 'sertifikat_terkirim' THEN 1 ELSE 0 END) as sent
FROM attendances a
JOIN events e ON a.event_id = e.id
GROUP BY e.id;
```

## Common Issues & Solutions

### Issue: Token expired
**Solution:** Login ulang untuk mendapat token baru

### Issue: File upload gagal
**Solution:** Cek folder permissions dan MAX_FILE_SIZE

### Issue: Email tidak terkirim
**Solution:** Cek SMTP credentials dan test koneksi

### Issue: Database connection timeout
**Solution:** Increase connectionLimit di database config

## Performance Benchmarks

Target performance:
- Login: < 200ms
- Create Event: < 300ms
- Submit Attendance: < 500ms
- Generate Certificate: < 2s per certificate
- Send Email: < 3s per email

Monitor dengan:
```bash
pm2 monit
```

---

Happy Testing! 🧪
