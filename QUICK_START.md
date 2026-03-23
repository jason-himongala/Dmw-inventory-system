# 🚀 PEOS System - Quick Start Guide

Complete setup from zero to running both frontend and backend.

---

## 📦 Prerequisites

- **Node.js 14+** (includes npm)
- **Python 3.x** (for Excel parsing)

[Download Node.js](https://nodejs.org/) | [Download Python](https://www.python.org/)

---

## ⚡ 5-Minute Setup

### Step 1: Backend Setup

```bash
cd backend
npm install
npm run dev
```

Wait for:

```
✓ PEOS Backend Server running on http://localhost:3001
✓ Database: SQLite (peos.db)
```

### Step 2: Frontend Setup (New Terminal)

```bash
npm run dev
```

Your app is now running on `http://localhost:5000` (or shows the actual URL)

### Step 3: Test It

1. Open browser → `http://localhost:5000`
2. Go to **Activity** page → Add a new activity
3. Go to **Participants** page → Select the activity you just created
4. Fill in some attendance data → Click **✓ Submit**
5. Check **🖨 Print** or **⬇ Download PDF**

✅ **Done!** Your system is running with persistent database storage!

---

## 🗂️ Project Structure

```
dmw/
├── backend/                    ← Backend API Server
│   ├── server.js              ← Main Express app
│   ├── database.js            ← SQLite setup
│   ├── package.json           ← Backend dependencies
│   ├── peos.db                ← Database (auto-created)
│   └── README.md              ← Backend docs
│
├── public/                     ← Frontend Files
│   ├── index.html
│   ├── dashboard.html         ← Main dashboard
│   ├── css/
│   │   └── app.css
│   └── js/
│       └── api-client.js      ← API communication
│
├── resources/                  ← Data Files
│   ├── json/                  ← Processed data
│   └── exel/                  ← Source Excel
│
├── scripts/
│   └── simplify_peos.py       ← Excel to JSON
│
├── package.json               ← Frontend dependencies
├── BACKEND_SETUP.md          ← Detailed backend guide
└── QUICK_START.md            ← This file
```

---

## 📊 How It Works

### Data Flow

```
1. Adding Activity in UI
   ↓
   → Sent to Backend API
   ↓
   → Saved in SQLite Database
   ↓
   → Retrieved when you select activity in Participants
   ↓
   → Fill attendance & submit
   ↓
   → Permanently stored in database

2. Print/Download
   ↓
   → Backend provides data
   ↓
   → Frontend formats as PDF/HTML
   ↓
   → Browser downloads/prints
```

---

## 🎯 Key Features

✅ **Persistent Storage** - Data saved in SQLite database (not just browser memory)  
✅ **Multi-Activity** - Handle multiple activities/events  
✅ **Attendance Tracking** - Full attendance sheets per activity  
✅ **Print/Export** - Download attendance as PDF or HTML  
✅ **Search & Filter** - Find participants quickly  
✅ **Dashboard** - View statistics and charts

---

## 🔧 Common Commands

| Task           | Command                                  |
| -------------- | ---------------------------------------- |
| Start backend  | `cd backend && npm run dev`              |
| Start frontend | `npm run dev`                            |
| Build CSS      | `npm run build`                          |
| Stop server    | `Ctrl + C`                               |
| View database  | Backend stores data in `backend/peos.db` |
| Clear data     | Delete `backend/peos.db`, restart server |

---

## 🐛 Troubleshooting

### Backend won't start on port 3001

```bash
# Find what's using port 3001
netstat -ano | findstr :3001

# Kill the process (Windows)
taskkill /PID <PID> /F

# Or use a different port
PORT=3002 npm run dev
```

### "Cannot find module 'express'"

```bash
cd backend
npm install
```

### Frontend can't reach backend

- Make sure backend is running on `http://localhost:3001`
- Check browser console (F12) for CORS errors
- Both must be running simultaneously

### Data not saving

- Check backend terminal for errors
- Verify `backend/peos.db` file exists
- Check browser console for API errors

---

## 📈 Production Deployment

When ready to deploy:

1. **Backend**: Deploy Node.js server
   - Services: Heroku, Railway, Render, DigitalOcean
   - Update `API_URL` in `api-client.js`

2. **Frontend**: Deploy static files
   - Services: Netlify, Vercel, GitHub Pages
   - Or serve from same Node.js server

3. **Database**: Use persistent storage
   - SQLite (current) - copy `peos.db` in backups
   - Upgrade to PostgreSQL/MySQL for production

---

## 📞 Need Help?

See detailed documentation:

- Backend API: `backend/README.md`
- Setup Details: `BACKEND_SETUP.md`
- Frontend: `public/dashboard.html`

---

## ✅ Checklist

- [ ] Node.js installed
- [ ] Backend dependencies installed
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5000
- [ ] Can add activities
- [ ] Can access attendance form
- [ ] Can submit and print attendance
- [ ] Data persists after refresh

**All checked? 🎉 You're ready to use the PEOS system!**
