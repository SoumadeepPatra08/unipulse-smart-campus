# UniPulse Full-Stack Integration Map

This document details how each frontend user interface module connects to its corresponding backend REST endpoints, data models, and real-time streams.

---

## 1. Feature to Endpoint Mapping

| Frontend Feature | UI Trigger / Component | Backend Endpoint | Method | Response Shape / Effect |
|---|---|---|---|---|
| **User Authentication & Role Switch** | Sidebar switch button & initial boot | `/api/auth/login`<br>`/api/auth/me` | `POST`<br>`GET` | Issues signed JWT token (`Authorization: Bearer <token>`); toggles between Student (`alex@campus.edu`) and Admin (`admin@campus.edu`). |
| **Hero Search & Suggestions** | Dashboard input & suggestion chips | `/api/search?q={query}` | `GET` | Returns ranked objects: `locations`, `study_spaces`, `lost_items`, and `actions`. |
| **Command Palette (⌘K / Ctrl+K)** | Keyboard shortcut `Cmd+K` or Header search trigger | `/api/search?q={query}` | `GET` | Fuzzy-filtered quick actions, buildings, and study spaces with instant keyboard execution. |
| **AI Campus Assistant (Streaming)** | Chat input & suggested prompt pills | `/api/assistant/message` | `POST` | Streams response word-by-word via SSE chunks (`stream: true`), concludes with structured cards (`study_space`, `location`, `match`, `event`). |
| **Right Context Panel Sync** | Automatic sync driven by Assistant stream or card selection | `/api/assistant/message`<br>`/api/study-spaces` | `POST`<br>`GET` | Populates active context card in right sidebar with 1-click booking / navigation. |
| **Smart Lost & Found Intake** | "I Lost Something" / "I Found Something" Modal | `/api/items`<br>`/api/upload` | `POST` | Stores photo (`/api/upload`), computes 64-dim normalized vector embedding, searches opposite candidates, triggers candidate match if similarity $\ge 70\%$. |
| **91% AI Match Side-by-Side Analysis** | Dashboard Hero Banner & Item Card "Inspect Match" | `/api/items/:id/matches`<br>`/api/matches/:id` | `GET` | Returns dynamically computed multi-factor score (**~91.0%**), factor weights, and side-by-side comparison of lost vs found items. |
| **Desk Claim Dispatch** | "Dispatch Claim to Desk" Modal Button | `/api/matches/:id/claim` | `POST` | Transitions match status to `claimed`, generates verification claim code (`CLM-XXXXXX`), and writes an entry to `audit_log`. |
| **Interactive Campus Finder** | Building pins & Route dropdowns | `/api/locations`<br>`/api/route?from=&to=` | `GET` | Computes shortest path over campus graph; returns animated SVG polyline (`M x,y L x,y...`), distance in meters, and walking minutes. |
| **Live Study Spaces** | Real-time seat meters & noise filters | `/api/study-spaces` | `GET` | Returns capacity, current occupancy, noise ratings (`Silent Focus`, `Quiet`, `Moderate`, `Collaborative`), and open desk numbers. |
| **Live Desk Reservation** | "Reserve Desk" button | `/api/study-spaces/:id/reserve` | `POST` | Issues digital pass (`PASS-XXXXXX`), increments occupied count, and broadcasts update to all connected clients. |
| **Realtime SSE Channel** | Background EventSource connection | `/api/realtime/study-spaces` | `GET (SSE)` | Pushes `event: occupancy` updates when any client reserves a seat, animating progress meters live without polling. |
| **Campus Events Discovery & RSVP** | Event cards & "RSVP" button | `/api/events`<br>`/api/events/:id/rsvp` | `GET`<br>`POST` | Displays events curated for Computer Science profile; toggles RSVP persistence and attendee count. |
| **Student Profile & Interests** | Dynamic tag management | `/api/profile`<br>`/api/profile/interests` | `GET`<br>`PUT` | Loads credentials, student ID card, active desk passes, and persists customized interest tags. |
| **Admin Console & KPIs** | Operations statistics & charts | `/api/admin/kpis`<br>`/api/admin/audit-queue` | `GET` | Live metrics (14,820 students, 94.2% AI precision), weekly resolution velocity bar chart, and pending match queue. |
| **Staff Match Verification** | "Approve" / "Reject" buttons in Audit Table | `/api/admin/audit/:id/verify` | `POST` | Marks match as `verified` or `rejected`, writes administrative action to `audit_log` with RBAC enforcement. |

---

## 2. API Response Specification

All standard JSON REST endpoints return a unified envelope structure:

```json
{
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-09-12T00:45:00Z"
  }
}
```

In case of validation errors or unauthorized requests:

```json
{
  "data": null,
  "error": {
    "message": "Forbidden: Administrator access required.",
    "code": 403
  },
  "meta": {}
}
```

---

## 3. Streaming Assistant Protocol (SSE)

When querying `/api/assistant/message` with `{ "message": "...", "stream": true }`:
- **Token chunks:**
  ```
  data: {"type": "token", "token": "The "}
  data: {"type": "token", "token": "Main "}
  data: {"type": "token", "token": "Library "}
  ```
- **Final payload chunk:**
  ```
  data: {"type": "complete", "content": "Full reconstructed response text", "cards": [...]}
  ```

---

## 4. Dynamic 91% Match Formula

The flagship **91% match** between Alex's Lost Navy Blue Hydro Flask and the item found at the Main Library desk is calculated dynamically using:

$$\text{Overall Score} = 0.35 \times \text{Visual} + 0.25 \times \text{Location} + 0.20 \times \text{Description} + 0.10 \times \text{Time} + 0.10 \times \text{Category}$$

- **Visual Similarity (35% weight)**: Computed via cosine similarity between dense 64-dimensional feature embeddings.
- **Location Proximity (25% weight)**: Geographic distance between reported campus nodes (`lib` Level 2 vs `lib` Ground Desk).
- **Description Match (20% weight)**: Jaccard keyword overlap on brand, model, volume, and material attributes.
- **Time Window (10% weight)**: Time delta interval (< 3 hours).
- **Category Match (10% weight)**: Exact match on `Bottles & Containers`.

---

## 5. Realtime Architecture (SSE)

```
[Browser Client 1]  --- POST /api/study-spaces/:id/reserve ---> [UniPulse Server]
                                                                        |
                                                           Updates SQLite Database
                                                                        |
                                                           Broadcasts to SSE Queue
                                                                        |
[Browser Client 1]  <=== event: occupancy (Live meter update) =========+
[Browser Client 2]  <=== event: occupancy (Live meter update) =========+
```

Clients subscribe to `/api/realtime/study-spaces` using `EventSource`. Any desk reservation broadcast immediately shifts the progress bars and percentages across all connected browser tabs with zero polling.

---

## 6. Execution & Bundling

- **Run Server:** `python server.py 8080`
- **Rebuild ESM Bundle:** `python build_bundle.py`
- **Run Backend Tests:** `python test_backend.py`
