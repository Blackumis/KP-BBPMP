# KP-BBPMP - Sistem Manajemen Kehadiran & Sertifikat

Aplikasi manajemen kehadiran dan sertifikat untuk **BBPMP Provinsi Jawa Tengah**.

Project ini menggunakan:

- **React + Vite** untuk Frontend
- **Express.js + MySQL** untuk Backend

Frontend dan Backend **dipisahkan secara jelas** dalam folder masing-masing.

---

## 📁 Project Structure

KP-BBPMP/
├── frontend/ # Frontend (React + Vite)
│ ├── src/
│ ├── index.html
│ ├── vite.config.js
│ └── README.md # Frontend documentation
├── backend/ # Backend (Express + MySQL)
│ ├── controllers/
│ ├── routes/
│ ├── middleware/
│ ├── database/
│ ├── server.js
│ └── README.md # Backend documentation (optional)
├── DOCUMENTATION.md
└── README.md # This file

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MySQL 8.0+
- npm atau yarn

---

### 1️⃣ Install Dependencies

# Frontend

cd frontend
npm install

# Backend

cd ../backend
npm install

---

### 2️⃣ Setup Environment

#### Frontend (frontend/.env)

VITE_API_URL=http://localhost:5000/api

#### Backend (backend/.env)

PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=kp_bbpmp_db
JWT_SECRET=your-secret-key

---

### 3️⃣ Run Database Migration

cd backend
npm run migrate

---

### 4️⃣ Start Development Servers

# Terminal 1 - Backend

cd backend
npm run dev

# Terminal 2 - Frontend (Vite default port)

cd frontend
npm run dev

---

### 5️⃣ Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api

---

# KP-BBPMP Frontend

Frontend aplikasi **KP-BBPMP Sistem Manajemen Kehadiran & Sertifikat**  
Dibangun menggunakan **React 18 + Vite + Tailwind CSS**.

---

## 🚀 Development

### Start Frontend Server

npm run dev

Aplikasi berjalan di:
http://localhost:5173

---

## 📁 Frontend Structure

frontend/
├── src/
│ ├── components/
│ │ ├── AdminPanel.jsx # Create & Edit Event
│ │ ├── AttendanceForm.jsx # Public attendance form
│ │ ├── AttendanceList.jsx # Participant list
│ │ ├── DaftarKegiatan.jsx # Admin dashboard
│ │ ├── Header.jsx
│ │ ├── Footer.jsx
│ │ └── Login.jsx
│ ├── services/
│ │ └── api.js # API service layer
│ ├── routes/ # React Router config
│ ├── layouts/ # Shared layouts
│ ├── pages/ # Page-level components
│ ├── styles/ # Global styles
│ ├── App.jsx
│ └── main.jsx
├── index.html
├── vite.config.js
└── .env

---

## 🔗 API Connection

VITE_API_URL=http://localhost:5000/api

Semua request API **HARUS melalui service layer**
(src/services/api.js).

---

## 🧠 Frontend Rules

- Gunakan layout & component reusable
- Jangan fetch API langsung di page
- Pisahkan Create dan Edit logic
- Tidak hardcode URL backend
- Gunakan React Router

---

## 🛠️ Tech Stack

- React 18
- Vite
- Tailwind CSS
- Axios
- React Router v6

---

## 📄 License

MIT License  
BBPMP Provinsi Jawa Tengah © 2026
