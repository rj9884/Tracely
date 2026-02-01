# Tracely

**Most tools protect users. Ours creates evidence.**

Tracely is an extension-based browser platform for investigating third-party tracking across websites. Designed for regulators, researchers, journalists, and compliance teams—it transforms raw tracker detections into traceable, reproducible evidence.

## What It Does

### For Privacy Professionals
- **See what's tracking you** - Real-time detection of third-party trackers, pixels, and analytics
- **Understand the ecosystem** - Cross-site tracking relationships and data flows
- **Export evidence** - Structured data exports (JSON, CSV) for audits and investigations
- **Reproduce findings** - Freeze snapshots and compare changes over time

### For Compliance & Audits
- **Full Research Reports** - Methodology disclosure, evidence timelines, confidence scoring
- **Audit-ready exports** - Download structured evidence for regulatory submissions
- **Reproducible analysis** - Every finding is timestamped and replayable
- **Neutral language** - Focus on what's observed, not assumptions

## Key Features

### 🔍 Dashboard
- Site privacy risk scores (0-100)
- Quick overview of tracker ecosystem
- Risk trends over time
- Multi-site comparison
- **User Authentication** - Login to save personal tracking data or view global aggregated insights
- **Hybrid Data Mode** - Authenticated users see personal data; non-authenticated users see global stats
- Search, filter, and sort capabilities

### 📊 Analytics Page
- **Top Trackers** - Visual list with horizontal progress bars showing relative sighting frequency
- **Tracker Distribution Chart** - Bar chart visualization of top 10 trackers with accented gradient design
- **Key Insights** - Curated analysis of tracker growth, analytics dominance, cross-site tracking, and high-risk activity
- **Statistics Cards** - Unique trackers count, total sightings, and high-risk tracker count

### 📊 Site Analysis
- Privacy risk breakdown
- Tracker list with categories
- Historical trend visualization
- Compliance recommendations

### 📋 Full Research Reports
- **Evidence Timeline** - All observed trackers with timestamps
- **Reproducibility Controls** - Rerun analysis, freeze snapshots, compare results
- **Methodology Disclosure** - What data we collect, what we exclude, limitations
- **Raw Data Access** - Export JSON, CSV, or structured audit reports
- **Confidence Scoring** - Track sighting counts (high ≥50, medium ≥10, low <10)
- **Persistence Metrics** - Days active, first seen, last seen

### 🌐 Browser Extension
- Passive observation of HTTP/HTTPS requests
- Automatic tracker categorization
- Real-time event logging
- Privacy-first (no content capture, no identifiers)
- Seamless data sync to dashboard
- Auto-syncs authentication tokens for personalized tracking
Authentication & Data Management

Tracely supports **user authentication** to provide personalized tracking data while maintaining global insights for non-authenticated users.

### Authentication Features
- **JWT-based authentication** - Secure token-based login/registration
- **Extension sync** - Tokens automatically sync between web app and browser extension
- **Personal data isolation** - Each user's tracking data is stored separately with their userId
- **Global aggregation** - Non-authenticated users see cumulative data from all users

### How It Works
- **Logged In**: See only your personal tracking data and observations
- **Logged Out**: See aggregated global statistics from all users combined
- **Extension Integration**: Login once in the web app, and the extension automatically uses your credentials

### API Behavior
- Personal data (requires authentication):
  - `GET /sites` - Your tracked sites only
  - `GET /site/:domain/details` - Your data for a specific domain
  - `GET /site/:domain/evidence` - Your evidence timeline
  - `POST /events` - Creates events linked to your userId
- Global data (no authentication required):
  - `GET /sites/global/stats` - Aggregated data from all users
  
### Data Privacy
- Each user's tracking data is isolated by userId in the database
- Global statistics are truly anonymous aggregates
- No user identities or browsing histories are exposed in global view
- Extension token storage uses secure chrome.storage.local API

### Implementation
- JWT tokens stored in localStorage (web) and chrome.storage.local (extension)
- Authorization header automatically included in all authenticated requests
- Middleware validates tokens and sets req.userId for data filtering
- Database models include optional userId field (null for legacy/global data)
- Researcher dashboards with exportable global reports

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for detailed setup instructions.

### 60-Second Setup

```bash
# Backend (Node.js + MongoDB)
cd backend
npm install
npm run dev

# Frontend (React + Vite)
cd ../frontend
npm install
npm run dev

# Extension (load in Chrome)
# Navigate to chrome://extensions/ → "Load unpacked" → select extension/
```

Then visit `http://localhost:5173`

## Architecture

```
frontend/          React + Vite UI
├── pages/         Dashboard, Site Detail, Analytics, Researcher Mode
├── components/    Reusable UI components (Layout, AuthModal, Charts, TrackerList, etc.)
├── contexts/      AuthContext for authentication state management
├── hooks/         Custom data-fetching hooks (useApi, useSites, useTrackers)
└── utils/         API client

backend/           Express.js API + MongoDB
├── routes/        API endpoints (sites, trackers, events, analytics, auth)
├── models/        Mongoose schemas (Site, Tracker, Event, User)
├── middleware/    Auth middleware (JWT validation)
└── utils/         Helpers, database utilities

extension/         Chrome extension
├── background/    Service worker (message passing, token management)
├── content/       Content script (XHR/Fetch interception, token sync)
├── popup/         UI for extension popup
└── utils/         Auth utilities, shared utilities
```

## Core Workflows

### For Auditors
1. Add site to dashboard (or use extension to auto-detect)
2. Run extension on target site
3. Navigate to **Full Research Report**
4. Review evidence timeline and confidence scores
5. Download audit report for submission

### For Researchers
1. Visit site with extension active
2. Collect observations over time
3. Review data in **Analytics** page to understand tracker distribution
4. Freeze snapshot as baseline
5. Rerun analysis to detect changes
6. Compare snapshots to identify new trackers

### For Compliance Teams
1. Toggle to **Global Stats** to see aggregated tracker trends
2. Export evidence (JSON/CSV)
3. Share with stakeholders
4. Maintain audit trail (all reports timestamped)
5. Review methodology documentation

## Data Privacy

✅ **What we collect:**
- Third-party domain names
- Request timestamps
- HTTP headers (User-Agent, Referer, etc.)
- Request paths

❌ **What we explicitly exclude:**
- Page content or HTML
- Form data or credentials
- User identities or personal data
- First-party site data (beyond domain name)

All data stays in your browser extension and local database. No cloud sync.

## Technical Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v7, Recharts (data visualization), Lucide React (icons)
- **Backend**: Node.js, Express.js, Mongoose, JWT authentication, bcrypt
- **Database**: MongoDB (with userId-based data isolation and global aggregation)
- **Extension**: Chrome/Chromium (Manifest v3) with token sync via postMessage
- **Auth**: JWT tokens with automatic extension synchronization

## Project Status

This is a **complete, functional MVP** ready for production use:
- ✅ Real tracker detection with categorization
- ✅ User authentication with JWT tokens
- ✅ Personal data isolation per user
- ✅ Global aggregated statistics for non-authenticated users
- ✅ Extension token synchronization
- ✅ Evidence-based reporting with full methodology
- ✅ Reproducible analysis with snapshots
- ✅ Audit-ready exports (JSON, CSV)
- ✅ Full methodology disclosure
- ✅ Interactive data visualizations
- ✅ Professional UI with accented design with authentication guide

- **[QUICKSTART.md](QUICKSTART.md)** - Setup and first steps
- **[docs/DEMO.md](docs/DEMO.md)** - Interactive demo walkthrough
- **[docs/PITCH.md](docs/PITCH.md)** - Product positioning and talking points

## License

ISC

---