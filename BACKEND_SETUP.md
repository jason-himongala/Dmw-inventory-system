# Backend Database Setup Guide

This guide walks you through setting up the production-ready backend for the PEOS Monitoring System.

## 🎯 Architecture

```
┌─────────────────┐
│   Frontend UI   │
│   (Dashboard)   │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────────┐
│  Express.js API     │
│  (/api/*)           │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│  SQLite Database    │
│  (peos.db)          │
└─────────────────────┘
```

---

## 📋 What's Included

### Backend (`/backend`)

- **server.js** - Express API server
- **database.js** - SQLite database initialization
- **package.json** - Node dependencies

### Frontend Updates

- **api-client.js** - API helper functions
- **dashboard.html** - Updated to use backend API

### Database

- **peos.db** - Auto-created SQLite file (3 tables)

---

## 🚀 Setup Instructions

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This installs:

- `express` - Web framework
- `sqlite3` - Database
- `cors` - Cross-origin requests
- `uuid` - ID generation
- `dotenv` - Environment variables
- `nodemon` - Auto-reload during development

### Step 2: Start the Backend Server

**Development (with auto-reload):**

```bash
npm run dev
```

**Production:**

```bash
npm start
```

Expected output:

```
✓ PEOS Backend Server running on http://localhost:3001
✓ Database: SQLite (peos.db)
✓ Endpoints ready:
  GET  /api/activities         - Get all activities
  POST /api/activities         - Create activity
  GET  /api/attendance/:id     - Get attendance records
  POST /api/attendance/batch   - Save batch attendance
  GET  /api/health             - Health check
```

### Step 3: Update Frontend to Use Backend

The frontend now has two modes:

1. **Backend mode** (if backend is running) → Uses API calls
2. **Fallback mode** (if backend is down) → Uses localStorage

The `api-client.js` automatically detects which mode to use.

### Step 4: Run Both Services

**Terminal 1: Start Tailwind & Frontend**

```bash
npm run dev
```

**Terminal 2: Start Backend**

```bash
cd backend
npm run dev
```

Now you have:

- Frontend: `http://localhost:5000` (or your dev server)
- Backend API: `http://localhost:3001`
- Database: `backend/peos.db` (SQLite)

---

## 📊 Database Schema

### `activities` table

```sql
id              TEXT PRIMARY KEY
name            TEXT NOT NULL
venue           TEXT NOT NULL
date            TEXT NOT NULL
source          TEXT DEFAULT 'saved'
created_by      TEXT
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### `attendance` table

```sql
id              TEXT PRIMARY KEY
activity_id     TEXT FOREIGN KEY
row_number      INTEGER NOT NULL
name            TEXT
sex             TEXT
office          TEXT
position        TEXT
contact         TEXT
signature       TEXT
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

### `users` table (future authentication)

```sql
id              TEXT PRIMARY KEY
username        TEXT UNIQUE NOT NULL
password        TEXT NOT NULL
role            TEXT DEFAULT 'user'
created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
```

---

## 🔌 API Examples

### Create an Activity

```javascript
const activity = await createActivity("Job Fair", "DMW Office", "2026-03-18");
```

### Get All Activities

```javascript
const activities = await getActivities();
```

### Save Attendance Sheet

```javascript
const records = [
  {
    row_number: 1,
    name: "Juan Dela Cruz",
    sex: "M",
    office: "DMW",
    position: "Officer",
    contact: "09123456789",
    signature: "",
  },
  // ... more rows
];

await batchSaveAttendance(activityId, records);
```

---

## 🔒 Security Considerations

Current implementation (to add later):

- [ ] User authentication (JWT tokens)
- [ ] Role-based access control
- [ ] Input validation & sanitization
- [ ] Rate limiting
- [ ] HTTPS in production
- [ ] Password hashing
- [ ] Audit logs

### For Production:

1. **Add authentication:**

   ```bash
   npm install jsonwebtoken bcrypt
   ```

2. **Use environment variables:**

   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your settings
   ```

3. **Deploy with:**
   - Docker container
   - Node.js hosting (Heroku, Railway, Render)
   - PM2 for process management

---

## 🚨 Troubleshooting

### Backend won't start

```bash
# Check if port 3001 is already in use
netstat -ano | findstr :3001

# Kill process if needed (Windows)
taskkill /PID <PID> /F
```

### Database not creating

- Check write permissions in `/backend` folder
- Delete corrupted `peos.db` and restart

### CORS errors

- Make sure both frontend and backend are running
- Backend is on `http://localhost:3001`
- Frontend can reach it from `http://localhost:5000` or similar

### API calls failing

- Check backend console for errors
- Verify database tables exist
- Use `/api/health` endpoint to test connectivity

---

## 📈 Next Steps

1. ✅ Backend API running
2. ✅ Database persistent storage
3. ⬜ Frontend integrated with API
4. ⬜ User authentication added
5. ⬜ Deployed to production

---

For detailed API documentation, see `backend/README.md`
