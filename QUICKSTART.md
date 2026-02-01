# 🚀 Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd /home/user/Tracely

# Frontend
cd frontend && npm install && cd ..

# Backend
cd backend && npm install && cd ..

# Done! ✅
```

### Step 2: Configure Backend (1 min)

```bash
cd backend
cp .env.example .env

# Edit .env:
# MONGODB_URI=mongodb://localhost:27017/privacy-lens
# PORT=3000
# JWT_SECRET=hackathon-demo-key
```

**Or use MongoDB Atlas** (free tier):
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Copy connection string to `.env`

### Step 3: Start Services (2 mins)

**Terminal 1: Backend**
```bash
cd /home/user/Tracely/backend
npm run dev
# Output: 🔐 Tracely Backend running on http://localhost:3000
```

**Terminal 2: Frontend**
```bash
cd /home/user/Tracely/frontend
npm run dev
# Output: VITE v5.0.0  ready in 500 ms
# ➜  Local:   http://localhost:5173/
```

### Step 4: Load Extension (1 min)

**Chrome/Chromium Setup:**

1. Open Chrome/Chromium browser
2. Navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in top right corner)
4. Click **Load unpacked** button
5. Browse to and select: `/home/user/Tracely/extension`
6. Extension appears with Tracely icon in toolbar ✅

**Verify Extension Works:**

1. Click the Tracely extension icon
2. You should see:
   - Current domain name
   - Privacy score (0-100)
   - Number of trackers detected
   - "View Dashboard" button
3. Visit any website (e.g., news site, social media)
4. Extension automatically detects and logs trackers

**Troubleshooting Extension:**

- **Icon not showing?** - Pin it: Click puzzle icon → Find Tracely → Click pin
- **Not detecting trackers?** - Check Service Worker console: `chrome://extensions/` → Tracely card → "Service Worker" link → Console
- **Popup blank?** - Right-click extension icon → "Inspect popup" to see errors
- **Permission errors?** - Reload extension after code changes

### Step 5: Test It! (Open Chrome and test the full workflow)

1. Click Tracely icon
2. See privacy score for current site
3. Click "View Dashboard"
4. Explore dashboard at `http://localhost:5173`
5. **Navigate to Analytics** to see tracker distribution charts
6. **Toggle between "My Data" and "Global Stats"** on Dashboard
7. Click any site to view **Full Research Report**

**Test the Complete Flow:**

1. **Extension Detection**: Visit a popular website (e.g., CNN, YouTube)
2. **Real-time Logging**: Open extension popup - see tracker count increase
3. **Dashboard View**: Go to `http://localhost:5173` - see site appear
4. **Analytics**: Click "Analytics" in nav - view tracker distribution
5. **Research Report**: Click any site → "View Research Report" - see evidence timeline

---

## What You Now Have

✅ **Chrome Extension** - Real-time tracker detection with automatic logging  
✅ **Backend API** - MongoDB data persistence with hybrid user/global data  
✅ **React Dashboard** - Beautiful visualization with search, filter, and sort  
✅ **Analytics Page** - Tracker distribution charts and insights  
✅ **Research Reports** - Full evidence timelines with methodology disclosure  
✅ **Hybrid Data Mode** - Toggle between personal data and global statistics  

---

## Useful Commands

```bash
# Start everything (from root)
cd backend && npm run dev &      # Background
cd frontend && npm run dev       # Foreground

# Build frontend for production
cd frontend && npm run build

# Check backend health
curl http://localhost:3000/api/health

# View mock data
curl http://localhost:3000/api/sites

# MongoDB connection test
mongosh "mongodb://localhost:27017/privacy-lens"
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Extension not loading | Check `/extension/manifest.json` syntax, reload extension |
| Extension not detecting | Check Service Worker console for errors |
| Backend won't connect | Verify MongoDB is running: `mongosh` |
| Port already in use | Kill: `lsof -i :3000` then `kill -9 <PID>` |
| CORS errors | Check `CORS_ORIGIN` in backend `.env` |
| Frontend not loading | Clear cache: `rm -rf frontend/.vite` |
| Module not found | Run `npm install` in the folder |
| No data in dashboard | Ensure extension is active and backend running |
| Charts not rendering | Refresh page, check browser console for errors |

---

## File Structure

```
Tracely/
├── frontend/          # React Dashboard (port 5173)
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   └── utils/        # Helper functions
│   └── index.html
│
├── backend/           # Express API (port 3000)
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── models/       # MongoDB schemas
│   │   ├── utils/        # Helpers
│   │   └── middleware/   # Auth, CORS, etc.
│   └── server.js         # Entry point
│
├── extension/         # Chrome Extension
│   ├── manifest.json  # V3 config
│   ├── src/
│   │   ├── popup/     # Extension popup UI
│   │   ├── content/   # Page content script
│   │   └── background/# Service worker
│   └── README.md
│
└── docs/
    ├── DEMO.md        # Demo script
    ├── ARCHITECTURE.md # Technical deep-dive
    └── PITCH.md       # Presentation notes
```


Ready? → `cd /home/user/Tracely && npm run dev` 🚀
