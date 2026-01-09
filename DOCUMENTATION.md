# KP-BBPMP Application Documentation

## System Architecture

This is a full-stack web application for managing attendance and certificate generation at BBPMP Provinsi Jawa Tengah.

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + Vite | SPA user interface |
| Styling | Tailwind CSS | Responsive design |
| Backend | Express.js | REST API server |
| Database | MySQL | Data persistence |
| Auth | JWT | Stateless authentication |

---

## Application Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            USER JOURNEY                                   │
└──────────────────────────────────────────────────────────────────────────┘

  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │   ADMIN     │      │   EVENT     │      │ PARTICIPANT │
  │   LOGIN     │ ───► │  CREATION   │ ───► │  ATTENDANCE │
  └─────────────┘      └─────────────┘      └─────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
  │  Dashboard  │      │   Draft     │      │   Submit    │
  │  View All   │      │   Status    │      │   Form      │
  │   Events    │      │             │      │             │
  └─────────────┘      └─────────────┘      └─────────────┘
         │                    │                    │
         │                    ▼                    ▼
         │            ┌─────────────┐      ┌─────────────┐
         │            │  Activate   │      │ Certificate │
         └──────────► │   Event     │      │  Generated  │
                      │             │      │             │
                      └─────────────┘      └─────────────┘
```

---

## Frontend Architecture

### Component Hierarchy

```
App.jsx
├── Header.jsx          # Navigation bar with user info & logout
├── Login.jsx           # Authentication form
├── DaftarKegiatan.jsx  # Event dashboard/list
├── AdminPanel.jsx      # Create new event form
├── AttendanceForm.jsx  # Public attendance submission form
├── AttendanceList.jsx  # View event attendances (admin)
└── Footer.jsx          # Page footer
```

### State Management

The application uses React's useState and useEffect for state management:

```javascript
// App.jsx - Main State
const [view, setView] = useState('dashboard');     // Current view
const [kegiatanList, setKegiatanList] = useState([]); // Events list
const [activeKegiatan, setActiveKegiatan] = useState(null); // Selected event
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [user, setUser] = useState(null);            // Logged in user
```

### API Service Layer

All API calls are centralized in `src/services/api.js`:

```javascript
// Authentication
authAPI.login(username, password)
authAPI.logout()
authAPI.getProfile()
authAPI.isAuthenticated()

// Events
eventsAPI.getAll(params)
eventsAPI.getById(id)
eventsAPI.create(eventData)
eventsAPI.update(id, eventData)
eventsAPI.delete(id)
eventsAPI.generateLink(id)

// Attendance
attendanceAPI.getEventForm(eventId)
attendanceAPI.submit(eventId, data)
attendanceAPI.getByEvent(eventId, params)
attendanceAPI.delete(id)

// Reference Data
referenceAPI.getKabupatenKota()
```

---

## Backend API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/login` | ❌ | Admin login |
| POST | `/register` | ✅ Admin | Register new admin |
| GET | `/profile` | ✅ | Get current user profile |
| PUT | `/change-password` | ✅ | Change password |

### Event Routes (`/api/events`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✅ Admin | List all events |
| GET | `/:id` | ✅ Admin | Get event details |
| POST | `/` | ✅ Admin | Create new event |
| PUT | `/:id` | ✅ Admin | Update event |
| DELETE | `/:id` | ✅ Admin | Delete event |
| POST | `/:id/generate-link` | ✅ Admin | Activate event |

### Attendance Routes (`/api/attendance`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/form/:id` | ❌ | Get public form |
| POST | `/submit/:event_id` | ❌ | Submit attendance |
| GET | `/event/:event_id` | ✅ Admin | List attendances |
| GET | `/:id` | ✅ Admin | Get attendance detail |
| DELETE | `/:id` | ✅ Admin | Delete attendance |

### Reference Routes (`/api/reference`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/kabupaten-kota` | ❌ | Get regions list |

---

## Database Schema

### Events Table
```sql
CREATE TABLE events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama_kegiatan VARCHAR(255) NOT NULL,
  nomor_surat VARCHAR(100) UNIQUE NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_selesai DATE NOT NULL,
  jam_mulai TIME NOT NULL,
  jam_selesai TIME NOT NULL,
  batas_waktu_absensi DATETIME NOT NULL,
  template_sertifikat VARCHAR(255) NULL,
  form_config JSON NULL,           -- Dynamic form field configuration
  status ENUM('draft', 'active', 'closed') DEFAULT 'draft',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Attendances Table
```sql
CREATE TABLE attendances (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  nama_lengkap VARCHAR(255) NOT NULL,
  unit_kerja VARCHAR(255) NOT NULL,
  nip VARCHAR(50) NULL,
  provinsi ENUM('Jawa Tengah', 'Luar Jawa Tengah') NOT NULL,
  kabupaten_kota VARCHAR(100) NOT NULL,
  tanggal_lahir DATE NULL,
  nomor_hp VARCHAR(20) NOT NULL,
  pangkat_golongan VARCHAR(100) NULL,
  jabatan VARCHAR(255) NULL,
  email VARCHAR(255) NOT NULL,
  signature_url VARCHAR(500) NOT NULL,
  urutan_absensi INT NOT NULL,      -- Auto-generated sequence
  nomor_sertifikat VARCHAR(100) NULL, -- Format: urutan/nomor_surat
  status ENUM('menunggu_sertifikat', 'sertifikat_terkirim') DEFAULT 'menunggu_sertifikat'
);
```

### Form Config JSON Structure
```json
{
  "requireName": true,
  "requireEmail": true,
  "requirePhone": true,
  "requireUnit": true,
  "requireNIP": false,
  "requireRank": false,
  "requirePosition": false,
  "requireDob": true,
  "requireCity": true,
  "requireProvince": true,
  "requireSignature": true,
  "requirePernyataan": true,
  "eventPassword": ""
}
```

---

## Event Lifecycle

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  DRAFT   │ ──► │  ACTIVE  │ ──► │  CLOSED  │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │                │                │
   Cannot         Accepts        No longer
   accept       attendance      accepting
  attendance                   attendance
```

1. **Draft**: Event created but not yet published
2. **Active**: Event is live, participants can submit attendance
3. **Closed**: Event ended, no more submissions accepted

---

## Security Features

1. **JWT Authentication**: Stateless token-based auth with configurable expiry
2. **Password Hashing**: bcrypt with salt rounds
3. **Rate Limiting**: 100 requests per 15 minutes per IP
4. **CORS Protection**: Configured allowed origins
5. **Helmet.js**: Security headers
6. **Event Password**: Optional password protection for attendance forms

---

## Running the Application

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

### Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run migrate     # Run database migrations
npm run create-admin  # Create admin account
npm run dev         # Start development server
```

### Frontend Setup
```bash
cp .env.example .env
npm install
npm run dev
```

### Production Build
```bash
# Frontend
npm run build

# Backend
npm start
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (.env)
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=kp_bbpmp_db
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```
