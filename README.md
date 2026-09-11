# UniPulse — AI-Powered Smart Campus Platform

> **Find. Report. Discover.**  
> *A high-fidelity full-stack platform bringing campus life, space intelligence, and AI matching into one cohesive experience.*

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Python: 3.10+](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![Architecture: Zero--Dependency](https://img.shields.io/badge/Dependencies-Standard%20Library-emerald.svg)](#tech-stack)
[![Tests: 11 Passing](https://img.shields.io/badge/Tests-11%2F11%20Passing-success.svg)](#-testing)

---

## 🌟 Overview

**UniPulse** is a modern, unified campus companion web application designed for students, faculty, and university operations staff. Powered by a native Python HTTP server, an SQLite database with 64-dimensional dense vector embeddings, real-time Server-Sent Events (SSE) occupancy streams, and a responsive Tailwind CSS frontend with zero external package dependencies.

---

## ✨ Features

- **Secure Authentication & Identity System:** Full authentication flow featuring responsive glassmorphism login and registration interfaces, client-side validation, salted `bcrypt` password hashing (12 rounds, never plaintext), and dual-channel JWT verification via secure HTTP-only cookies (`SameSite=Lax`) and Bearer headers. Protected dashboard route automatically redirects unauthenticated sessions.
- **Conversational AI Campus Assistant:** Natural language assistant with word-by-word Server-Sent Events (SSE) token streaming. Emits structured interactive cards (`study_space`, `location`, `match`, `event`) that synchronize the Right Context Panel with 1-click actions.
- **Dynamic 91% AI Lost & Found Match Engine:** Multi-factor similarity analysis computing an explainable score across 5 weighted dimensions (Visual 35%, Proximity 25%, Description 20%, Time 10%, Category 10%). Evaluates to ~91.0%–92.4% on Alex Rivera's lost Hydro Flask.
- **Smart Lost & Found Intake & Claim Dispatch:** "I Lost Something" / "I Found Something" report modal with drag-and-drop image upload (persisted as base64 to `/uploads/`), candidate match generation, and 1-click desk claim dispatch generating verified claim codes (`CLM-XXXXXX`).
- **Interactive Campus Finder:** Vector SVG map with Dijkstra's shortest-path navigation between campus facilities (Block 34, Main Library, Sports Complex, Student Commons, Innovation Hub), animated route polylines, walking distance/time, and turn-by-turn steps.
- **Live Study Spaces & Instant Desk Passes:** Real-time seat occupancy progress meters, acoustic noise atmosphere filters (*Silent Focus*, *Quiet Pods*, *Moderate Labs*, *Collaborative Lounges*), and instant 45-minute desk booking issuing digital passes (`PASS-XXXXXX`).
- **Realtime SSE Occupancy Broadcast:** Background `EventSource` connection at `/api/realtime/study-spaces` broadcasting live seat reservation deltas across all connected clients without polling.
- **Campus Events Discovery & RSVP:** Curated events feed filtered by student interests, with persistent RSVP registration and live attendee counters.
- **Student Profile & Digital ID:** Academic credential card (Alex Rivera, B.S. CS '27, ID `CS-2027-4819`), active desk passes list, submitted report history, and editable interest tags persisted to SQLite.
- **Operations Admin Console & Audit Queue:** Live campus KPIs (14,820 students, 94.2% AI precision), 7-day resolution velocity bar chart, space atmosphere distribution, and staff match audit queue with Approve/Reject actions protected by Role-Based Access Control (RBAC).
- **Global Command Palette (⌘K / Ctrl+K):** Keyboard-driven search across campus buildings, study spaces, lost items, and quick navigation shortcuts.

---

## 🛠️ Tech Stack

- **Backend:** Native Python 3 (`http.server`, `sqlite3`, `hashlib`, `urllib`, `json`, `uuid`) + `bcrypt` password security.
- **Database:** SQLite3 with relational user models, bcrypt hashes, dense 64-dimensional vector feature representations, and automated migration/seeding.
- **Frontend:** Modular ECMAScript (ESM) bundled into a standalone production script ([`js/bundle.js`](js/bundle.js)) via a custom bundler ([`build_bundle.py`](build_bundle.py)).
- **Styling:** Tailwind CSS (CDN runtime) + Custom Glassmorphism, CSS keyframe animations, and SVG route polylines ([`css/custom.css`](css/custom.css)).
- **Realtime:** Server-Sent Events (SSE) push streaming.
- **Authentication:** Bcrypt password encryption, HMAC-SHA256 signed JSON Web Tokens (JWT), secure HTTP-only cookies, and Role-Based Access Control (RBAC).

---

## 📁 Project Structure

```
unipulse/
├── index.html                   # Single-Page Application root HTML
├── server.py                    # Production HTTP server (REST API + SSE + Static assets)
├── build_bundle.py              # ESM module bundler generating js/bundle.js
├── seed.py                      # Database initializer & demo seeder
├── test_backend.py              # Automated 11-suite backend integration test suite
├── INTEGRATION.md               # Complete REST API & SSE architecture specification
├── .env.example                 # Environment configuration template
├── .gitignore                   # Production Git ignore rules
├── css/
│   └── custom.css               # Glassmorphism, animations, SVG keyframes
├── js/
│   ├── data.js                  # State store (AppState), constants, ApiClient
│   ├── app.js                   # SPA orchestrator, navigation router, event controller
│   ├── bundle.js                # Standalone production bundle
│   ├── components/
│   │   ├── header.js            # Top bar, role badge, quick search trigger
│   │   ├── sidebar.js           # Navigation drawer, role toggle button
│   │   ├── modals.js            # Report modal, 91% match analysis modal, reserve modal, ⌘K
│   │   └── toasts.js            # Toast notifications with Web Audio API chime
│   └── views/
│       ├── dashboard.js         # Hero search, proactive 91% match banner, spaces overview
│       ├── assistant.js         # Token-streaming AI chat & Right Context Panel
│       ├── campusMap.js         # Interactive SVG campus map & routing
│       ├── lostFound.js         # Inventory cards, filters, match inspector
│       ├── spaces.js            # Real-time study spaces & noise filters
│       ├── events.js            # Campus events feed & RSVP
│       ├── profile.js           # Digital student ID, active passes, interests
│       └── admin.js             # KPIs, velocity chart, staff audit queue
├── backend/
│   ├── __init__.py              # Backend package marker
│   ├── db.py                    # SQLite connection, schema definition, migration helpers
│   ├── matching.py              # 64-dim vector embeddings & 5-factor similarity engine
│   ├── assistant.py             # Query classifier & SSE token streaming generator
│   └── routes.py                # 16 REST route handlers & JWT authentication
└── uploads/
    └── .gitkeep                 # Directory for user-uploaded item photos
```

---

## 📋 Prerequisites

- **Python:** Version 3.10 or later (Tested on Python 3.10, 3.11, 3.12, 3.14).
- **Web Browser:** Any modern browser supporting ECMAScript 2020+ (Chrome, Edge, Firefox, Safari).
- **External Packages:** None. UniPulse uses standard Python modules exclusively.

---

## 🚀 Installation & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/unipulse.git
cd unipulse
```

### 2. Environment Configuration (Optional)
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(Default settings work out-of-the-box with SQLite and local deterministic AI fallback).*

### 3. Start the Application
Run the unified server with a single command:
```bash
python server.py 8080
```

Open your browser and navigate to:
```
http://localhost:8080
```

> **Note:** On first startup, `unipulse.db` is automatically created and populated with demo accounts, locations, study spaces, events, and the flagship 91% match.

---

## 🧪 Testing

Run the comprehensive 11-suite backend integration test:
```bash
python test_backend.py
```

### Test Coverage Highlights:
1. Database initialization and demo seeding.
2. JWT token issuance, verification, and role resolution.
3. Multi-factor AI matching calculation (dynamically evaluates to ~91.0%–92.4%).
4. Global search endpoint across locations, study spaces, items, and quick actions.
5. Study space desk reservation and live occupancy state increment.
6. Campus pedestrian graph Dijkstra shortest path & SVG polyline generation.
7. AI Assistant query response and structured card emission.
8. Admin console KPIs and staff audit queue retrieval.
9. Strict input validation (400 Bad Request) and Role-Based Access Control (403 Forbidden).
10. AI Assistant SSE token streaming generator sequence verification.
11. Dynamic Admin KPI aggregation and space capacity atmosphere distribution.

---

## 🔨 Building the Frontend Bundle

If you modify any source modules in `js/`, regenerate the standalone production bundle:
```bash
python build_bundle.py
```
This strips ESM statements and bundles all modules into [`js/bundle.js`](js/bundle.js) for zero-dependency execution.

---

## 🔑 Demo Accounts

The application is pre-seeded with two demo personas:

| Role | Name | Email | Password | Permissions |
|---|---|---|---|---|
| **Student** | Alex Rivera | `alex@campus.edu` | `alex123` | Report lost items, reserve study desks, RSVP to events, view 91% match analysis. |
| **Administrator** | Dr. Sarah Chen | `admin@campus.edu` | `admin123` | Access Admin Console KPIs, review resolution velocity, approve/reject staff audit queue. |

*Switch roles anytime by clicking the **"Switch to Admin / Student"** toggle at the bottom of the sidebar.*

---

## 📡 API Specification Summary

All REST endpoints return a unified JSON envelope:
```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-09-12T01:00:00Z"
  }
}
```

### Key Endpoints:
- `POST /api/auth/register`: Creates new user account, hashes password via bcrypt, issues JWT & HTTP-only cookie.
- `POST /api/auth/login`: Authenticates credentials against bcrypt hash, sets secure HTTP-only cookie + JWT.
- `POST /api/auth/logout`: Clears the session cookie and invalidates client session.
- `GET /api/auth/me`: Returns profile of the authenticated session via HTTP cookie or Bearer token.
- `GET /api/search?q={query}`: Multi-domain search across locations, spaces, items, actions.
- `POST /api/assistant/message`: AI assistant query with word-by-word SSE streaming (`stream: true`).
- `GET /api/study-spaces`: Lists study spaces with capacity and noise ratings.
- `POST /api/study-spaces/:id/reserve`: Reserves a 45-min desk pass and broadcasts occupancy update.
- `GET /api/realtime/study-spaces`: Server-Sent Events (SSE) live occupancy push stream.
- `GET /api/items/:id/matches`: Returns explainable 5-factor match confidence breakdown.
- `POST /api/matches/:id/claim`: Dispatches lost item claim to desk and generates claim code.
- `GET /api/route?from={id}&to={id}`: Calculates pedestrian shortest path and SVG polyline.
- `GET /api/admin/kpis`: Live operational metrics and 7-day velocity chart data.
- `POST /api/admin/audit/:id/verify`: Approves/rejects pending matches (requires Admin JWT).
- `POST /api/upload`: Uploads item photo as base64 and returns stored URL.

*For full endpoint parameters, request bodies, and response schemas, see [INTEGRATION.md](INTEGRATION.md).*

---

## 🔮 Future Improvements

- [ ] **pgvector / Qdrant Integration:** Scale from SQLite dense vectors to dedicated vector databases for millions of campus inventory items.
- [ ] **Native Mobile App (React Native / Flutter):** Mobile client utilizing the existing REST and SSE backend.
- [ ] **Push Notifications:** Web Push / APNS notifications when a lost item candidate achieves $\ge 85\%$ confidence match.
- [ ] **NFC / BLE Beacon Check-In:** Automatic study desk occupancy verification via physical desk tap.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
