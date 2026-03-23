# PEOS Backend API

Production-ready Node.js + Express + MySQL backend for the PEOS Monitoring System.

## 🚀 Quick Start

### Prerequisites

- **XAMPP** installed and running (MySQL service enabled)
- **Node.js** 14+ installed

### 1. Start XAMPP

Open XAMPP Control Panel and start the MySQL service.

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Configure Database (Optional)

Edit `backend/.env` if your MySQL settings differ:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=peos_db
PORT=3001
```

### 4. Start the Server

**Development (with hot reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

The server will run on `http://localhost:3001`

## 📊 Database

- **Type**: MySQL (XAMPP)
- **Host**: localhost (127.0.0.1)
- **User**: root (default, no password)
- **Database**: peos_db (auto-created on first run)
- **Auto-creates tables** on first run

### Tables

- **users** - User accounts (for authentication)
- **activities** - PEOS activities/events
- **attendance** - Participant attendance records with foreign keys

## 🔌 API Endpoints

## 🔌 API Endpoints

### Activities

| Method | Endpoint              | Description           |
| ------ | --------------------- | --------------------- |
| GET    | `/api/activities`     | Get all activities    |
| GET    | `/api/activities/:id` | Get specific activity |
| POST   | `/api/activities`     | Create new activity   |
| PUT    | `/api/activities/:id` | Update activity       |
| DELETE | `/api/activities/:id` | Delete activity       |

**POST Body Example:**

```json
{
  "name": "Job Fair",
  "venue": "DMW",
  "date": "2026-03-18",
  "created_by": "user123"
}
```

### Attendance

| Method | Endpoint                             | Description            |
| ------ | ------------------------------------ | ---------------------- |
| GET    | `/api/attendance/:activity_id`       | Get attendance records |
| POST   | `/api/attendance`                    | Create single record   |
| POST   | `/api/attendance/batch/:activity_id` | Save entire sheet      |
| PUT    | `/api/attendance/:id`                | Update record          |

**POST Batch Body Example:**

```json
[
  {
    "row_number": 1,
    "name": "Juan Dela Cruz",
    "sex": "M",
    "office": "DMW",
    "position": "Officer",
    "contact": "09123456789",
    "signature": ""
  }
]
```

## 🔄 Frontend Integration

Update your frontend to use the API instead of localStorage. Replace localStorage calls with HTTP requests to these endpoints.

## 📝 Notes

- Database file (`peos.db`) is auto-created
- Add more endpoints as needed
- Use transactions for batch operations in production
- Consider adding authentication middleware
