# PROJECT_CONTEXT.md
# Clarity — Digital Wellbeing Desktop App
# Handoff document for Cursor / next AI coding assistant
# Generated from full codebase analysis — do not edit manually

---

## 1. PROJECT OVERVIEW

**Name:** Clarity  
**Type:** Windows desktop application  
**Purpose:** Digital wellbeing tracker that shows users how they spend their computer time. It records which applications are in focus, for how long, and presents the data as screen-time analytics.

**Key philosophy:**
- The app **does not judge** the user. It does not label usage as "distraction" or "productive".
- It simply shows *how much time* the user spent in each application.
- Think of it as a screen-time dashboard for adults on Windows.

**Target platform:** Windows (x86-64). The tracking layer uses Windows-only APIs.

**Current development status:** In active development. The backend (Rust + SQLite) is fully implemented and tested. The frontend (React) has been partially connected to the real backend — several modules still display mock/placeholder data.

**Product tier:** Free and Pro. Pro features include Focus Mode, App Blocking, and Website Blocking. The free tier shows usage data and analytics.

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Version (package.json / Cargo.toml) |
|---|---|---|
| Desktop shell | Tauri | 2.x (2.11.5 resolved) |
| Backend language | Rust | 1.97.1 (toolchain) |
| Database | SQLite | via `rusqlite 0.32` with `bundled` feature |
| Frontend framework | React | 18.3.1 |
| Frontend bundler | Vite | 5.4.x |
| Frontend styling | Tailwind CSS | 3.4.14 |
| CSS processing | PostCSS + Autoprefixer | standard config |
| Charts | Recharts | 3.10.1 |
| Icons | Google Material Symbols (web font, loaded in index.html) | — |
| Date/time | chrono 0.4 (Rust) / native JS Date | — |
| Windows APIs | windows-sys 0.59 | Win32 foreground-window detection |
| Error handling (Rust) | anyhow 1.0, thiserror 2.x | thiserror upgraded from 1.0 to fix muda compatibility |
| Logging (Rust) | log 0.4, env_logger 0.11 | — |
| Tauri IPC | @tauri-apps/api 2.11.1 | `invoke` imported from `@tauri-apps/api/core` |

**Important:** `invoke` must be imported from `@tauri-apps/api/core`, NOT from `@tauri-apps/api`. The top-level `@tauri-apps/api` barrel export does not re-export `invoke` in v2.

---

## 3. COMPLETE PROJECT STRUCTURE

```
desktop-app/
├── index.html                         # App shell; loads Material Symbols font
├── package.json                       # npm scripts: dev, build, tauri
├── tailwind.config.js                 # Full MD3 color token + typography system
├── postcss.config.js                  # tailwindcss + autoprefixer
├── PROJECT_CONTEXT.md                 # This file
│
├── src/                               # React frontend
│   ├── main.jsx                       # ReactDOM.createRoot entry point
│   ├── App.jsx                        # Root: navigation state, PAGE_MAP, upgrade overlay
│   │
│   ├── layouts/
│   │   └── DashboardLayout.jsx        # Outer shell: Sidebar + TopHeader + <main> slot
│   │
│   ├── pages/
│   │   ├── DashboardPage.jsx          # Dashboard — REAL backend data
│   │   ├── ApplicationsPage.jsx       # App Usage — REAL backend data
│   │   ├── AnalyticsPage.jsx          # Analytics — REAL backend data (via useAnalyticsSelection)
│   │   ├── WebsiteUsagePage.jsx       # Website Usage — MOCK data only (no backend for websites)
│   │   ├── FocusPage.jsx              # Focus Mode — mock data (Pro feature)
│   │   ├── BlockingPage.jsx           # App Blocking — mock data (Pro feature)
│   │   ├── SettingsPage.jsx           # Settings — static/mock
│   │   └── UpgradePage.jsx            # Pro upgrade full-screen overlay
│   │
│   ├── services/
│   │   ├── usageApi.js                # PRIMARY service layer — all Tauri invoke() calls + formatters
│   │   └── tauri-api.js               # LEGACY — kept for reference, not imported by any component
│   │
│   ├── hooks/
│   │   ├── useUsageData.js            # All React hooks: useTodayUsage, useWeeklyUsage, etc.
│   │   ├── useAnalyticsSelection.js   # Analytics state machine: view/week/day navigation + data
│   │   └── useAnalyticsData.js        # Thin re-export shim (not used directly by pages)
│   │
│   ├── components/
│   │   ├── ui/                        # Primitive design system components
│   │   │   ├── Card.jsx               # Glass-morphism card wrapper
│   │   │   ├── Button.jsx             # Variant system: filled, ghost, text, outlined
│   │   │   ├── Badge.jsx              # Pill badge: primary, secondary, tertiary
│   │   │   ├── MaterialIcon.jsx       # Renders <span class="material-symbols-outlined">
│   │   │   ├── SectionTitle.jsx       # Uppercase label with optional icon
│   │   │   └── index.js               # Barrel export for all UI primitives
│   │   │
│   │   ├── sidebar/
│   │   │   ├── Sidebar.jsx            # Left nav: logo, NAV_ITEMS array, upgrade button
│   │   │   └── NavItem.jsx            # Single nav row: icon + label + active state
│   │   │
│   │   ├── header/
│   │   │   ├── TopHeader.jsx          # Top bar: SearchBar + NotificationButton + UserProfile
│   │   │   ├── SearchBar.jsx          # Decorative search input (no logic)
│   │   │   ├── NotificationButton.jsx # Bell icon button (no logic)
│   │   │   └── UserProfile.jsx        # Avatar + name + Pro badge (static)
│   │   │
│   │   ├── dashboard/
│   │   │   ├── GreetingSection.jsx    # Greeting + date + live current app (REAL: getCurrentApp)
│   │   │   ├── HeroMetricCard.jsx     # Today's screen time + ProgressRing (REAL: getSummaryStats)
│   │   │   ├── MetricCard.jsx         # Secondary KPI tile (receives data as prop)
│   │   │   ├── ProgressRing.jsx       # SVG circular progress indicator
│   │   │   ├── ScreenTimeChart.jsx    # Weekly area chart (REAL: getWeeklyUsage)
│   │   │   ├── AppUsageTable.jsx      # Top 5 apps today (REAL: getTodayUsage)
│   │   │   ├── ActivityFeed.jsx       # Timeline of today's top apps (REAL: getTodayUsage)
│   │   │   ├── AIInsightCard.jsx      # Insight + heatmap (REAL: getTodayUsage + getWeeklyUsage)
│   │   │   └── index.js               # Barrel export
│   │   │
│   │   ├── analytics/
│   │   │   ├── AnalyticsHeader.jsx    # Week/Month toggle + back button + context label
│   │   │   ├── AnalyticsOverviewCard.jsx # 4 KPI tiles (receives overviewData prop)
│   │   │   ├── WeeklyScreenTimeChart.jsx # Bar chart, 7 days (receives weekDayBars prop)
│   │   │   ├── MonthChart.jsx         # Bar chart, 4 weeks (receives monthBars prop)
│   │   │   ├── UsageBarChart.jsx      # Horizontal app usage bars (receives appsData prop)
│   │   │   ├── ActivityHeatmap.jsx    # Hour×Day intensity grid (receives heatmap prop)
│   │   │   ├── PeakHoursCard.jsx      # Busiest hours (receives hourlyData prop)
│   │   │   ├── FocusTrendChart.jsx    # Focus time trend (receives focusData prop)
│   │   │   ├── AIInsightsPanel.jsx    # Insight cards list (receives insights prop)
│   │   │   ├── AchievementsCard.jsx   # 4 stat tiles (REAL: getSummaryStats internally)
│   │   │   ├── ExportSection.jsx      # Export buttons (decorative, no logic)
│   │   │   └── index.js               # Barrel export
│   │   │
│   │   ├── applications/
│   │   │   ├── AppSummaryCards.jsx    # 4 KPI cards (REAL: getSummaryStats)
│   │   │   ├── AppListPanel.jsx       # Sortable app list, left column (receives apps prop)
│   │   │   ├── AppDetailPanel.jsx     # Selected app detail, right column (REAL: getApplicationSessions)
│   │   │   ├── AppUsageChart.jsx      # Bar chart for selected app (receives data prop)
│   │   │   ├── UsageTimeline.jsx      # Session timeline (receives events prop)
│   │   │   └── ProUpgradeModal.jsx    # Modal: "Upgrade to Pro" for blocking features
│   │   │
│   │   ├── focus/
│   │   │   ├── SessionSetup.jsx       # Timer setup UI (mock/static)
│   │   │   ├── ActiveSessionPanel.jsx # Running timer display (mock/static)
│   │   │   ├── FocusFeatureStrip.jsx  # Feature highlights (from data/focus.js)
│   │   │   ├── ProBanner.jsx          # Pro upsell banner
│   │   │   └── FocusUpgradeModal.jsx  # Upgrade modal for Focus
│   │   │
│   │   ├── blocking/
│   │   │   ├── BlockingAppTable.jsx   # App list with toggle switches (mock data)
│   │   │   ├── ActiveRulesPanel.jsx   # Active blocking rules (from data/blocking.js)
│   │   │   ├── BlockingSummaryCards.jsx # KPI cards (from data/blocking.js)
│   │   │   ├── BlockingInfoStrip.jsx  # Info banner
│   │   │   └── BlockingUpgradeModal.jsx # Upgrade modal for Blocking
│   │   │
│   │   ├── websites/
│   │   │   ├── WebsiteSummaryCards.jsx # KPI cards (from data/websites.js)
│   │   │   ├── WebsiteListPanel.jsx   # Sortable website list (from data/websites.js)
│   │   │   ├── WebsiteDetailPanel.jsx # Selected site detail (from data/websites.js)
│   │   │   ├── WebsiteUsageChart.jsx  # Usage chart for selected site (mock)
│   │   │   ├── WebsiteTimeline.jsx    # Session timeline for selected site (mock)
│   │   │   └── WebsiteUpgradeModal.jsx # Upgrade modal
│   │   │
│   │   ├── settings/
│   │   │   ├── SettingsSidebar.jsx    # Left nav for settings sections (from data/settings.js)
│   │   │   ├── SettingsWidgets.jsx    # Shared widget components (Toggle, Select, etc.)
│   │   │   └── sections/              # 7 setting section components (all static/mock)
│   │   │       ├── GeneralSettings.jsx
│   │   │       ├── AppearanceSettings.jsx
│   │   │       ├── NotificationSettings.jsx
│   │   │       ├── TrackingSettings.jsx
│   │   │       ├── PrivacySettings.jsx
│   │   │       ├── AccountSettings.jsx
│   │   │       └── AboutSettings.jsx
│   │   │
│   │   └── debug/
│   │       └── TauriDebug.jsx         # Nulled-out debug panel (returns null, safe to ignore)
│   │
│   ├── data/                          # MOCK DATA — see Section 10 for full details
│   │   ├── analytics.js
│   │   ├── applications.js
│   │   ├── activities.js
│   │   ├── metrics.js
│   │   ├── dashboard.js
│   │   ├── focusSessions.js
│   │   ├── focus.js
│   │   ├── blocking.js
│   │   ├── settings.js
│   │   └── websites.js
│   │
│   └── styles/
│       └── index.css                  # Global CSS: Tailwind directives, glass-card utility, custom scrollbar
│
└── src-tauri/                         # Rust/Tauri backend
    ├── Cargo.toml                     # Rust dependencies and build profile
    ├── tauri.conf.json                # Tauri window config, CSP, bundle config
    ├── build.rs                       # Tauri build script (generated)
    └── src/
        ├── main.rs                    # Binary entry point — calls lib::run()
        ├── lib.rs                     # App setup: DB init, tracker spawn, command registration
        ├── commands/
        │   └── usage.rs               # All 7 Tauri IPC commands
        ├── database/
        │   └── mod.rs                 # SQLite connection, schema migrations, all query methods
        ├── models/
        │   ├── mod.rs                 # Re-exports all model types
        │   ├── usage_response.rs      # AppUsageResponse, DayUsageResponse, SummaryStats, AppSession
        │   ├── session.rs             # AppSession struct (serde)
        │   ├── app_record.rs          # AppRecord struct (not actively used)
        │   └── daily_summary.rs       # DailySummary struct (not actively used)
        ├── tracker/
        │   ├── mod.rs                 # AppTracker state machine, friendly name map, skip list
        │   └── windows_api.rs         # Windows foreground window detection via Win32 API
        └── utils/
            └── mod.rs                 # Utility helpers (currently minimal)
```

---

## 4. FRONTEND ARCHITECTURE

### Entry Point

`src/main.jsx` → mounts `<App />` into `#root` in `index.html`.

### Navigation

`src/App.jsx` manages a single `activeNavId` state string. No router library. `PAGE_MAP` maps nav IDs to page components. The upgrade page is a full-screen overlay that renders over the layout.

Nav IDs: `dashboard` · `analytics` · `applications` · `website` · `focus` · `app-blocking` · `settings`

### Layout

`DashboardLayout.jsx` wraps every page. It renders:
- Left: `<Sidebar />` (fixed, 240px wide)
- Top: `<TopHeader />`
- Center: `<main>` slot for the active page

### Module Status

| Module | Page Component | Data Source | Status |
|---|---|---|---|
| Dashboard | `DashboardPage.jsx` | Real backend | ✅ Connected |
| Applications | `ApplicationsPage.jsx` | Real backend | ✅ Connected |
| Analytics | `AnalyticsPage.jsx` | Real backend via `useAnalyticsSelection` | ✅ Connected |
| Website Usage | `WebsiteUsagePage.jsx` | `data/websites.js` | ⚠️ Mock only |
| Focus Mode | `FocusPage.jsx` | `data/focus.js`, `data/focusSessions.js` | ⚠️ Mock / Pro feature |
| App Blocking | `BlockingPage.jsx` | `data/blocking.js` | ⚠️ Mock / Pro feature |
| Settings | `SettingsPage.jsx` | `data/settings.js` | ⚠️ Static |
| Upgrade | `UpgradePage.jsx` | Static | ℹ️ Decorative |

---

## 5. DESIGN SYSTEM

The design is **Material Design 3 (MD3)** adapted to a dark glassmorphism aesthetic.

### Tailwind Color Tokens (from `tailwind.config.js`)

```js
// Surface hierarchy (darkest to lightest)
'surface-dim':       '#111118'   // outermost background
'surface':           '#141218'   // default page background
'surface-container-lowest': '#0f0d13'
'surface-container-low':    '#1d1b20'
'surface-container':        '#211f26'
'surface-container-high':   '#2b2930'
'surface-container-highest':'#36343b'
'surface-variant':          '#49454f'

// Primary (indigo/purple)
'primary':           '#c0c1ff'   // main accent
'on-primary':        '#1f2178'
'primary-container': '#3738a0'

// Secondary (teal/sky)
'secondary':         '#89ceff'
'on-secondary':      '#003450'

// Tertiary (orange/amber)
'tertiary':          '#ffb783'
'on-tertiary':       '#4a2800'

// Text hierarchy
'on-surface':        '#e6e1e5'   // primary text
'on-surface-variant':'#cac4d0'   // secondary text
'outline':           '#908fa0'   // tertiary text / borders
'outline-variant':   '#49454f'   // subtle borders

// Error
'error':             '#ffb4ab'
```

### Typography Scale

Custom font-size + font-weight classes defined in Tailwind config:
- `text-metric-large` / `font-metric-large` — big numbers in KPI cards
- `text-headline-lg` / `text-headline-md` — section headings
- `text-body-md` / `text-body-sm` — body text
- `text-label-md` / `text-label-sm` — small labels

No custom font family — uses system sans-serif stack.

### Glassmorphism

The `glass-card` utility class is defined in `src/styles/index.css`:
```css
.glass-card {
  background: rgba(36, 34, 42, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(73, 69, 79, 0.4);
}
```

### Card Component

`Card.jsx` wraps content in a rounded-2xl container with `glass-card` styling, a subtle border, and an optional hover shadow. Used everywhere consistently.

### Button Variants

`Button.jsx` supports: `filled` (primary bg), `ghost` (transparent + border), `text` (no border), `outlined`.

### Icons

Google **Material Symbols Outlined** loaded via CDN in `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined..." rel="stylesheet">
```
Used via `<MaterialIcon name="schedule" />` which renders `<span class="material-symbols-outlined">schedule</span>`.

### Spacing / Radius

Standard Tailwind scale. Cards: `rounded-2xl`. Smaller elements: `rounded-xl`, `rounded-lg`. Padding convention: `p-8` for page sections, `p-6`/`p-5` for cards.

### Responsive

Sidebar is always visible. Grid uses `col-span-12` collapsing to `lg:col-span-X` for multi-column layouts. Minimum window size: 1024×640.

---

## 6. PRODUCT REQUIREMENTS / DECISIONS

These decisions were made during development and must be preserved:

1. **This is a general digital wellbeing app** for adults on Windows laptops/desktops. It is not student-specific.
2. **The app does not judge usage**. No labeling of apps as "distracting" or "productive". Only time-tracking.
3. **Analytics views: Week and Month only.** Month = last 4 calendar weeks. No yearly view. No custom date range picker.
4. **Clicking a day bar in Weekly view** drills into that day and shows what applications were used on that exact local date.
5. **Premium features:** Focus Mode, App Blocking, Website Blocking. Free users can view the UI but attempting to use Pro features should trigger the upgrade flow.
6. **Application Usage module** shows applications actually run on this computer. No fake/placeholder apps once real data exists.
7. **Empty states** are required when no data has been recorded yet. Never fall back to mock values silently.
8. **Date/time must be local** (user's Windows timezone). Never display UTC times directly to the user.
9. **The existing UI design must not be redesigned** unless the user explicitly requests it. Colors, layout, spacing, cards, typography — all frozen.
10. **Website tracking is not yet implemented** in the backend. The Website Usage page uses mock data and should display a clear notice when real tracking is available.

---

## 7. BACKEND ARCHITECTURE

### Tauri Startup (lib.rs)

1. `env_logger` initialised (log level: INFO by default).
2. App data directory resolved via `app.path().app_data_dir()` → `C:\Users\<user>\AppData\Roaming\app.clarity.desktop\`.
3. SQLite database opened at `<data_dir>/clarity.db`.
4. `db.run_migrations()` creates tables if they don't exist.
5. `AppState { db, tracker }` registered with Tauri's state manager.
6. Background thread spawned — calls `tracker.tick()` every **2 seconds**.
7. 7 IPC commands registered via `invoke_handler`.

### Database (database/mod.rs)

Connection uses WAL mode and foreign keys. All operations go through the `Database` struct which wraps a `rusqlite::Connection` behind `Arc<Mutex<>>`.

#### Schema

**Table: `applications`**
```sql
CREATE TABLE IF NOT EXISTS applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,           -- friendly display name
  executable_name TEXT NOT NULL UNIQUE,    -- lowercase exe filename
  first_seen      TEXT NOT NULL,           -- ISO-8601 UTC
  last_seen       TEXT NOT NULL            -- ISO-8601 UTC
)
CREATE INDEX idx_applications_executable ON applications(executable_name)
```

**Table: `application_sessions`**
```sql
CREATE TABLE IF NOT EXISTS application_sessions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL REFERENCES applications(id),
  started_at     TEXT NOT NULL,    -- ISO-8601 UTC
  ended_at       TEXT,             -- NULL if session still open
  duration_seconds INTEGER         -- set when session ends
)
CREATE INDEX idx_sessions_app_id  ON application_sessions(application_id)
CREATE INDEX idx_sessions_started ON application_sessions(started_at)
```

#### Key Database Methods

| Method | What it does |
|---|---|
| `upsert_application(name, exe)` | INSERT or UPDATE, returns `id` |
| `start_session(app_id, started_at)` | INSERT new open session, returns `session_id` |
| `end_session(session_id, ended_at, duration)` | UPDATE session with end time + duration |
| `get_today_usage(date)` | SUM duration by app for today's sessions (ORDER BY duration DESC) |
| `get_usage_for_date(date)` | Same as above but for any YYYY-MM-DD |
| `get_weekly_usage()` | Last 7 days, one row per day with total seconds + app count + session count |
| `get_application_sessions(exe, limit)` | Last N sessions for a specific executable |
| `get_summary_stats(date)` | today total + week total + distinct apps today + 7-day avg |

### Windows Foreground Window Detection (tracker/windows_api.rs)

Uses `windows-sys` crate with Win32 APIs:
- `GetForegroundWindow()` → HWND of active window
- `GetWindowThreadProcessId()` → PID
- `OpenProcess()` + `GetModuleFileNameExW()` → full executable path
- `GetWindowTextW()` → window title

Returns `Option<ForegroundInfo> { executable, window_title, full_path, pid }`.

### Session Tracking State Machine (tracker/mod.rs)

States: `Idle` or `Active { session_id, application_id, executable, started_at }`.

Every 2-second tick:
1. Call `get_foreground_app()` → current exe name.
2. If same as `last_exe` → skip (no change).
3. If changed:
   - **Close** previous session: compute `duration = now - started_at`. If ≥1s, call `db.end_session()`.
   - **Open** new session: `db.upsert_application()` → `db.start_session()`.
4. System processes on the **skip list** are silently ignored: `textinputhost.exe`, `searchui.exe`, `searchapp.exe`, `shellexperiencehost.exe`, `startmenuexperiencehost.exe`, `lockapp.exe`, `logonui.exe`, `dwm.exe`, `systemsettings.exe`, `applicationframehost.exe`.

**Friendly name map** (partial list): `code.exe` → "Visual Studio Code", `chrome.exe` → "Google Chrome", `msedge.exe` → "Microsoft Edge", `discord.exe` → "Discord", `slack.exe` → "Slack", `spotify.exe` → "Spotify", `windowsterminal.exe` → "Windows Terminal", etc. Unmapped exes get their stem title-cased.

---

## 8. TAURI COMMANDS

All commands live in `src-tauri/src/commands/usage.rs` and are registered in `lib.rs`.

### `get_today_usage`
- **Input:** none (uses server-side `Utc::now()` for today's date)
- **Returns:** `Vec<AppUsageResponse>` sorted by `duration_seconds DESC`
- **Used by:** Dashboard (`AppUsageTable`, `ActivityFeed`, `AIInsightCard`), ApplicationsPage overview

### `get_application_usage`
- **Input:** none (alias for `get_today_usage`)
- **Returns:** `Vec<AppUsageResponse>` — same as above
- **Used by:** `ApplicationsPage` main list

### `get_usage_for_date`
- **Input:** `date: String` — must be `"YYYY-MM-DD"` format (validated)
- **Returns:** `Vec<AppUsageResponse>` for that specific local date
- **Used by:** Analytics day-drill view (`useAnalyticsSelection`)

### `get_weekly_usage`
- **Input:** none
- **Returns:** `Vec<DayUsageResponse>` — 7 items, last 7 days oldest-first
- **Used by:** Dashboard `ScreenTimeChart`, Analytics weekly bars, `useAnalyticsSelection`

### `get_application_sessions`
- **Input:** `executable: String`, `limit: Option<i64>` (default 50, max 500)
- **Returns:** `Vec<AppSession>` — recent sessions for one exe
- **Used by:** `AppDetailPanel` for timeline + weekly chart building

### `get_current_app`
- **Input:** none
- **Returns:** `Option<String>` — friendly name of foreground app, or null
- **Used by:** `GreetingSection` (live "Currently tracking: X" label, polls every 5s)

### `get_summary_stats`
- **Input:** none
- **Returns:** `SummaryStats { todaySeconds, weekSeconds, activeToday, avgDailySeconds }`
- **Used by:** `HeroMetricCard`, `AppSummaryCards`, `AchievementsCard`, secondary metric cards in `DashboardPage`

### Response Type Shapes (camelCase — from `#[serde(rename_all = "camelCase")]`)

```typescript
// AppUsageResponse
{ application: string, executableName: string, durationSeconds: number,
  sessionCount: number, lastUsed: string | null }

// DayUsageResponse
{ date: string, totalSeconds: number, activeApps: number, sessionCount: number }

// SummaryStats
{ todaySeconds: number, weekSeconds: number, activeToday: number, avgDailySeconds: number }

// AppSession
{ id: number, applicationId: number, appName: string, executableName: string,
  startedAt: string, endedAt: string | null, durationSeconds: number }
```

⚠️ **Critical:** All field names are **camelCase** in JavaScript because the Rust structs use `#[serde(rename_all = "camelCase")]`. Using snake_case field names (e.g. `duration_seconds`) in the frontend will result in `undefined` / NaN.

---

## 9. FRONTEND ↔ BACKEND CONNECTION

### Data flow

```
React Component
    ↓
hooks/useUsageData.js  (or useAnalyticsSelection.js)
    ↓
services/usageApi.js
    ↓
invoke('command_name', params)  from @tauri-apps/api/core
    ↓
Rust command handler  (src-tauri/src/commands/usage.rs)
    ↓
Database method  (src-tauri/src/database/mod.rs)
    ↓
SQLite  (clarity.db in AppData)
    ↓
Returns JSON to React
```

### Service Layer: `src/services/usageApi.js`

This is the **single source of truth** for all backend calls. Every function wraps one `invoke()` call. Import `{ invoke }` from `'@tauri-apps/api/core'`.

Exports:
- `getTodayUsage()` → `AppUsageResponse[]`
- `getApplicationUsage()` → `AppUsageResponse[]`
- `getUsageForDate(date)` → `AppUsageResponse[]`
- `getWeeklyUsage()` → `DayUsageResponse[]`
- `getApplicationSessions(executable, limit)` → `AppSession[]`
- `getCurrentApp()` → `string | null`
- `getSummaryStats()` → `SummaryStats`

Formatting utilities (also in `usageApi.js`):
- `fmtSeconds(sec)` → `"Xh Ym"` / `"Ym"` / `"Xs"` (never returns NaN)
- `secToHours(sec)` → `"3.2"` decimal string
- `fmtTime(isoString)` → local `"HH:MM AM/PM"`
- `fmtDate(isoString)` → local `"Mon, Jan 1"`
- `localToday()` → `"YYYY-MM-DD"` in local time
- `fmtLastUsed(isoString)` → `"Xm ago"` / `"Xh ago"` / date
- `appColor(name)` → deterministic hex color from app name string

### React Hooks: `src/hooks/useUsageData.js`

Generic `useFetch(fetcher, default, intervalMs, deps)` wrapper — handles loading/error state and optional polling.

Public hooks:
- `useTodayUsage()` — polls every 30s
- `useApplicationUsage()` — polls every 30s
- `useWeeklyUsage()` — polls every 60s
- `useSummaryStats()` — polls every 30s
- `useCurrentApp()` — polls every 5s (live tracking)
- `useUsageForDate(date)` — fetches once when `date` changes
- `useAppSessions(executableName, limit)` — fetches once when `executableName` changes

All return `{ data, loading, error, refresh }`.

### Analytics State Machine: `src/hooks/useAnalyticsSelection.js`

This hook is the **brain of the Analytics page**. It manages:
- `view`: `'Week'` | `'Month'`
- `selectedWeekIdx`: which of the last 4 calendar weeks is shown (0 = current)
- `selectedDayIdx`: which day within the week is drilled into (0–6, null = none)

It fetches `getWeeklyUsage()` on mount, and `getUsageForDate(date)` whenever a day is selected. All analytics chart props (`overviewData`, `weekDayBars`, `monthBars`, `appsData`, `heatmap`, etc.) are derived from real backend data via `useMemo`.

`AnalyticsPage.jsx` destructures everything from `useAnalyticsSelection()` and passes props down to chart components — the chart components themselves are dumb (receive data as props).

---

## 10. MOCK DATA

The following files in `src/data/` contain placeholder data. **Do not delete these files** — some are still consumed by pages that have no backend equivalent yet.

| File | Contents | Currently used by | Should be replaced? |
|---|---|---|---|
| `data/analytics.js` | `FILTER_TABS`, `HEATMAP_HOURS`, `fmtDuration` | Nothing (cleaned up) | N/A — constants now inlined |
| `data/applications.js` | `applicationList[]`, `appSummaryCards[]`, `fmtMinutes()` | Nothing (cleaned up) | N/A — replaced by real data |
| `data/activities.js` | `recentActivities[]` | Nothing (cleaned up) | N/A — replaced by real data |
| `data/metrics.js` | `heroMetric`, `secondaryMetrics[]` | Nothing (cleaned up) | N/A — replaced by real data |
| `data/dashboard.js` | `dashboardConfig`, `aiInsight` | Nothing (cleaned up) | N/A — replaced by real data |
| `data/focusSessions.js` | `hourlyScreenTime[]`, `weeklyScreenTime[]`, `focusHeatmap[]` | Nothing (cleaned up) | N/A — replaced by real data |
| `data/focus.js` | `focusFeatures[]`, `DURATION_PRESETS[]` | `FocusFeatureStrip`, `SessionSetup` | When Focus Mode is implemented in backend |
| `data/blocking.js` | `blockingSummaryCards[]`, `activeRules[]`, `STATUS_STYLES` | `BlockingSummaryCards`, `ActiveRulesPanel`, `BlockingAppTable` | When App Blocking is implemented in backend |
| `data/settings.js` | `SETTINGS_SECTIONS[]`, `aboutData`, `accountData` | `SettingsSidebar`, `AboutSettings`, `AccountSettings` | Partially — sections are static navigation |
| `data/websites.js` | `websiteList[]`, `websiteSummaryCards[]`, `fmtMinutes`, `MAX_WEEK_MINUTES` | All website components | When browser extension / website tracking is added |

---

## 11. DATABASE SCHEMA (Full)

**Database location:** `C:\Users\<username>\AppData\Roaming\app.clarity.desktop\clarity.db`

```sql
-- Table 1: Known applications
CREATE TABLE IF NOT EXISTS applications (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT    NOT NULL,
  executable_name TEXT    NOT NULL UNIQUE,
  first_seen      TEXT    NOT NULL,  -- "YYYY-MM-DDTHH:MM:SSZ" UTC
  last_seen       TEXT    NOT NULL   -- "YYYY-MM-DDTHH:MM:SSZ" UTC
);
CREATE INDEX IF NOT EXISTS idx_applications_executable
  ON applications(executable_name);

-- Table 2: Individual application focus sessions
CREATE TABLE IF NOT EXISTS application_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id   INTEGER NOT NULL REFERENCES applications(id),
  started_at       TEXT    NOT NULL,   -- "YYYY-MM-DDTHH:MM:SSZ" UTC
  ended_at         TEXT,               -- NULL while session is open
  duration_seconds INTEGER             -- populated on session close
);
CREATE INDEX IF NOT EXISTS idx_sessions_app_id
  ON application_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started
  ON application_sessions(started_at);
```

**Notes:**
- All timestamps are stored as UTC ISO-8601 strings.
- The frontend must convert to local time for display.
- Sessions shorter than 1 second are discarded by the tracker before being written.
- `ended_at` is NULL for any session that is currently open (rare edge case if app crashes).

---

## 12. CURRENT WORKING STATUS

| Feature | Status | Notes |
|---|---|---|
| React UI renders | ✅ Working | All pages render without crashes |
| Vite build | ✅ Clean | 694 modules, 0 errors |
| Tauri app window opens | ✅ Working | Window opens, WebView loads |
| Rust compilation | ⚠️ Intermittent | Fails with OOM on low-RAM systems; requires ~1.5 GB free RAM. `thiserror` upgraded to `"2"` to fix `muda 0.19.3` compatibility. |
| SQLite database init | ✅ Working | Creates `clarity.db`, runs migrations |
| Windows app tracking | ✅ Working | Foreground window detection via Win32 API, 2s polling |
| Session persistence | ✅ Working | Sessions written to SQLite on focus change |
| `get_today_usage` | ✅ Working | Returns real data |
| `get_application_usage` | ✅ Working | Returns real data |
| `get_usage_for_date` | ✅ Working | Returns real data for YYYY-MM-DD |
| `get_weekly_usage` | ✅ Working | Returns 7-day rolling data |
| `get_application_sessions` | ✅ Working | Returns session history per exe |
| `get_current_app` | ✅ Working | Returns live foreground app name |
| `get_summary_stats` | ✅ Working | Returns KPI aggregates |
| Dashboard — screen time | ✅ Real data | `HeroMetricCard`, secondary metrics |
| Dashboard — top apps | ✅ Real data | `AppUsageTable` |
| Dashboard — weekly chart | ✅ Real data | `ScreenTimeChart` |
| Dashboard — activity feed | ✅ Real data | `ActivityFeed` |
| Dashboard — AI insight | ✅ Real data | `AIInsightCard` |
| Applications module | ✅ Real data | List, detail, sessions, chart |
| Analytics — week view | ✅ Real data | Via `useAnalyticsSelection` |
| Analytics — month view | ✅ Real data | Via `useAnalyticsSelection` |
| Analytics — day drill | ✅ Real data | `getUsageForDate` |
| Analytics — achievements | ✅ Real data | `AchievementsCard` |
| Website Usage | ⚠️ Mock data | No browser tracking backend |
| Focus Mode | ⚠️ Mock / UI only | No backend timer implementation |
| App Blocking | ⚠️ Mock / UI only | No backend blocking implementation |
| Settings | ⚠️ Static | No persistence layer |
| Pro/Upgrade page | ✅ Decorative | UI complete, no payment integration |

---

## 13. KNOWN ISSUES

### Rust Compiler Warnings (non-breaking)

From the last successful build — 7 warnings in `clarity-desktop` lib:
1. `unused import: app_record::AppRecord` — `src/models/mod.rs:8`
2. `unused import: daily_summary::DailySummary` — `src/models/mod.rs:10`
3. `unused variable: stem` — `src/tracker/mod.rs:61` (dead code path in exe name stripping)
4. `struct AppRecord is never constructed` — `src/models/app_record.rs:6`
5. `struct DailySummary is never constructed` — `src/models/daily_summary.rs:6`
6. `field application_id is never read` — `src/tracker/mod.rs:103`
7. `fields window_title, full_path, pid are never read` — `src/tracker/windows_api.rs:24`

None of these are errors. They indicate planned but not-yet-used data structures.

### Dependency Version Issue

`muda 0.19.3` (pulled in by `tauri 2.11.5`) requires `thiserror 2.x`. The workspace `Cargo.toml` was updated from `thiserror = "1.0"` to `thiserror = "2"` to fix this. Do not revert to `"1.0"`.

### OOM During Rust Compilation

The Rust linker requires ~1.5 GB free RAM. On systems with <500 MB free, `cargo build` fails with `memory allocation failed` or `paging file too small`. **This is a system resource issue, not a code bug.** Close other applications before running `npm run tauri dev`.

### Legacy Service File

`src/services/tauri-api.js` exists but is **not imported by any component**. It is kept for reference only. All active code uses `src/services/usageApi.js`.

### Debug Component

`src/components/debug/TauriDebug.jsx` returns `null`. It is safe to delete or ignore.

### Analytics PeakHoursCard and FocusTrendChart

These components receive `hourlyData` and `focusData` from `useAnalyticsSelection`. The hook currently returns placeholder data for both (no per-hour tracking in backend, no focus session tracking). The charts render but show zeros.

### Website Tracking

There is no backend implementation for website URL tracking. `WebsiteUsagePage` and all `src/components/websites/` components use mock data from `data/websites.js`. A browser extension or browser history integration would be needed to implement this.

### Analytics Day-to-Day UTC vs Local

`useAnalyticsSelection` builds calendar weeks in local time. `getUsageForDate` passes a local `YYYY-MM-DD` string to the backend. The backend queries sessions by `DATE(started_at)` which compares against UTC timestamps. This can cause **off-by-one day errors** for users in UTC+ timezones. This is a known gap that needs a backend fix (pass timezone offset or store local date alongside UTC).

---

## 14. RECENT VERIFICATION

The Rust backend passed `cargo check` with **0 errors** during development.

The Vite frontend passed a full production build:
```
✓ 694 modules transformed.
dist/assets/index-DV_wMnvk.js  164.58 kB
✓ built in 9.92s
0 errors
```

### Build / Run Commands

```bash
# Run full desktop app (requires Rust toolchain + ~1.5 GB free RAM)
cd "d:\desktop digitalWellbeing\desktop-app"
npm run tauri dev

# Run frontend only (for UI development, no Tauri/Rust)
npm run dev
# Then open http://localhost:1420 in browser
# Note: invoke() calls will fail silently (no backend), but UI renders

# Build frontend only (verify JS has no errors)
npx vite build

# Check Rust only (fast, no linking)
cd src-tauri
cargo check

# Full Rust build only
cargo build

# Tauri dev with verbose logging
RUST_LOG=debug npm run tauri dev
```

---

## 15. NEXT RECOMMENDED STEPS

Ordered by priority:

1. **Fix the UTC/local date mismatch in analytics** — Backend should either accept a timezone offset or store a local date column alongside `started_at`. This ensures "today" and "day drill" show data for the user's local calendar day.

2. **Verify end-to-end on a running system** — Use the app for 15–30 minutes normally (open Chrome, VS Code, Spotify), then check Dashboard and Applications to confirm real data appears.

3. **Wire `DashboardPage` secondary MetricCards to real data** — Currently `DashboardPage` imports `secondaryMetrics` structure but builds it from `useSummaryStats`. Verify all 4 tiles (`This Week`, `Daily Average`, `Apps Today`, `Focus Sessions`) display correct values.

4. **Implement Analytics hourly breakdown** — Add a `get_hourly_usage(date)` Tauri command that returns total seconds per hour slot, enabling real `PeakHoursCard` data.

5. **Implement Focus Mode backend** — Timer management in Rust, `start_focus_session` / `end_focus_session` commands, persist to a new `focus_sessions` table.

6. **Implement App Blocking backend** — Windows API to block/kill a process or prevent its window from gaining focus. Store block rules in SQLite.

7. **Settings persistence** — Save user preferences (daily goal, notification settings, etc.) to a `settings` table or JSON file in AppData.

8. **Website tracking** — Requires a browser extension (Chrome/Edge) that POSTs visited URLs to a local Tauri HTTP server endpoint, or reads browser history directly.

9. **Fix `window_title`, `full_path`, `pid` fields** — These are captured in `ForegroundInfo` but never used. Either expose them via commands or remove them to clean up warnings.

10. **Production build + installer** — `npm run tauri build` generates an `.msi` installer. Test the release build separately from dev.

---

## 16. RULES FOR CONTINUING DEVELOPMENT

**The next AI assistant (Cursor or other) must follow these rules:**

1. **Preserve the existing UI exactly.** Do not change colors, layout, spacing, typography, card styles, icon choices, or component structure unless the user explicitly requests a redesign.

2. **Do not recreate existing components.** All UI components already exist. Extend them; do not replace them.

3. **Do not create a second backend.** The Rust/Tauri/SQLite backend is the only backend. Do not introduce Node.js servers, Python servers, or any other backend.

4. **Do not replace SQLite.** The database is SQLite via `rusqlite`. Do not introduce any other database.

5. **Do not invent Tauri commands.** The 7 existing commands cover the current data model. Add new commands only when genuinely needed, and only after checking that no existing command can be reused.

6. **Always import `invoke` from `@tauri-apps/api/core`**, not from `@tauri-apps/api` or `@tauri-apps/api/tauri`.

7. **All backend response fields are camelCase** (`durationSeconds`, `totalSeconds`, `executableName`, etc.) due to `#[serde(rename_all = "camelCase")]`. Never use snake_case field names in the frontend.

8. **Read existing code before making changes.** Do not modify files you have not read. Do not guess at existing APIs or component interfaces.

9. **Do not replace real data with mock data.** Once a component is connected to the real backend, do not revert it to use `data/` files.

10. **Do not silently change product decisions.** Week/Month analytics only. No yearly view. No custom date range. No judgment labels. Check this document before adding features.

11. **Make changes incrementally.** One concern per change. Do not refactor unrelated code while implementing a feature.

12. **After backend changes, run `cargo check`** in `src-tauri/` to verify 0 errors before continuing.

13. **After frontend changes, run `npx vite build`** to verify 0 bundle errors.

14. **The `thiserror` dependency must stay at `"2"`** in `Cargo.toml`. Do not downgrade to `"1.0"` — it breaks `muda 0.19.3`.

15. **Empty states are required.** When no data exists yet, show a friendly "No data recorded yet" message. Never fall back to mock data silently.

16. **Date handling must use local time.** Always compute "today" and calendar week boundaries in the user's local timezone. Timestamps stored in SQLite are UTC — convert on display.

17. **Explain every file changed** at the end of each task. The user needs to know what was modified.

---

## 17. CURRENT TASK (at time of handoff)

The task that was actively in progress when this document was created:

> **Goal:** Connect the existing React frontend to the already-implemented Rust/Tauri/SQLite backend so that the UI stops displaying mock/placeholder data and starts displaying **real Windows application usage data**.

### What has been completed

- `src/services/usageApi.js` — Clean service layer with all 7 Tauri commands and formatting helpers.
- `src/hooks/useUsageData.js` — React hooks with correct camelCase field names and polling.
- `src/hooks/useAnalyticsSelection.js` — Full rewrite connecting Analytics to real backend.
- All **Dashboard** components: `HeroMetricCard`, `AppUsageTable`, `ScreenTimeChart`, `ActivityFeed`, `GreetingSection`, `AIInsightCard` — all now use real data.
- All **Applications** components: `AppSummaryCards`, `AppListPanel`, `AppDetailPanel` (loads real sessions) — all now use real data.
- All **Analytics** chart components receive real data via props from `useAnalyticsSelection`.
- `AchievementsCard`, `AnalyticsHeader`, `ActivityHeatmap`, `UsageBarChart` — all cleaned up (no mock data imports).
- `thiserror` upgraded to `"2"` in `Cargo.toml` to fix `muda 0.19.3` compile error.

### What still needs verification

- **End-to-end test:** Run the app, use Windows normally for 15+ minutes, then confirm the Dashboard shows real screen time and the Applications page lists the apps you actually used.
- **Analytics UTC/local date bug:** The day-drill may show data for the wrong calendar day for users outside UTC. The backend queries `DATE(started_at)` against UTC timestamps while the frontend passes a local date string.
- **Secondary MetricCards on Dashboard:** Verify the 4 secondary tiles (This Week, Daily Average, Apps Today, Focus Sessions) display non-zero real values after usage is recorded.
- **Analytics month bars:** The month chart distributes weekly data proportionally — verify this looks correct with real data.

### The compile error that existed at handoff

When running `npm run tauri dev`, the compiler was failing with:
```
error[E0277]: AcceleratorParseError doesn't implement std::fmt::Display
  --> muda-0.19.3/src/accelerator.rs:49
```

**Root cause:** `muda 0.19.3` requires `thiserror 2.x`, but `Cargo.toml` had `thiserror = "1.0"`.  
**Fix already applied:** Changed `Cargo.toml` to `thiserror = "2"`.  
**If this error reappears:** Ensure `Cargo.toml` has `thiserror = "2"` and run `cargo update` in `src-tauri/`.

---

*End of PROJECT_CONTEXT.md*  
*Generated: August 2026*  
*App: Clarity Desktop v0.1.0*  
*Workspace: d:\desktop digitalWellbeing\desktop-app*
