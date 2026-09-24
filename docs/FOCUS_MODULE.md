# Focus Module — Complete Technical Documentation

## Overview
The Focus Module is a premium feature in Clarity that lets users start timed focus sessions where selected applications are temporarily blocked. When the session ends, those blocks are automatically removed.

---

## Architecture Flow

```
User clicks "Start Focus"
        ↓
FocusPage.jsx  (React UI)
        ↓
useFocusSession.js  (React Hook)
        ↓
usageApi.js  (IPC Service Layer)
        ↓
invoke('start_focus_session')  (Tauri IPC)
        ↓
commands/focus.rs  (Rust Command Handler)
        ↓
database/mod.rs  (SQLite Queries)
        ↓
focus_sessions table  (SQLite)
        +
blocked_applications table  (SQLite)
        ↓
tracker/mod.rs  (Background Thread — every 2s)
        ↓
windows_api.rs  (Win32 Process Kill + MessageBox)
```

---

## File-by-File Breakdown

### 1. `FocusPage.jsx`
* **Type:** React page component  
* **Role:** Top-level UI orchestrator  
* **Path:** `src/pages/FocusPage.jsx`

#### Responsibilities:
- Owns all setup-form state: `hours`, `minutes`, `sessionName`, `goal`, `activeTab`, `checkedExes`.
- Reads real tracked applications from backend via `useTrackedApplications()` and displays them in the block-list picker.
- Calls `useFocusSession` hook for all session operations.
- Builds `sessionProp` and `historyProp` objects from real backend data and passes them down to `ActiveSessionPanel`.
- Contains `handleStartSession`, `handlePause`, `handleEnd` — these are the UI event handlers.
- Auto-end logic lives in a `useEffect` with an `autoEndCalledRef` guard — when `remaining === 0`, it calls `focus.end(true)` exactly once.

#### Boundaries (Does NOT contain):
- Timer logic (handled in the hook).
- Backend calls (delegated to the hook / service layer).
- Process killing (handled in Rust).

---

### 2. `SessionSetup.jsx`
* **Type:** React presentational component  
* **Role:** Left column — configure a new session  
* **Path:** `src/components/focus/SessionSetup.jsx`

#### Responsibilities:
- Renders the duration picker (hour/minute spinners + preset buttons from `focus.js`).
- Renders the block-list (Applications tab) showing real apps from the backend with checkboxes.
- Renders Session Name and Goal text inputs.
- Renders the "Start Focus Session" button.
- Receives all state and handlers as props from `FocusPage` — it owns no state itself.
- Accepts `hasActiveSession` prop to disable the Start button when a session is already running.
- Accepts `startError` prop to show backend error messages below the button.

---

### 3. `ActiveSessionPanel.jsx`
* **Type:** React presentational component  
* **Role:** Right column — shows the live running session  
* **Path:** `src/components/focus/ActiveSessionPanel.jsx`

#### Responsibilities:
- Renders the SVG countdown ring (`CountdownRing`) using `remaining` and `totalSeconds` props.
- Shows session name, start time, end time, and blocked item avatars.
- Renders Pause/Resume and End Session buttons.
- Shows session history list below.
- When no session is active, shows an empty state card and history only.
- Pause button dynamically toggles between "Pause Session" and "Resume Session" based on `session.isPaused`.
- Receives `remaining` and `elapsed` directly from the hook — no local timer.

---

### 4. `useFocusSession.js`
* **Type:** React custom hook  
* **Role:** Central state machine for Focus Mode  
* **Path:** `src/hooks/useFocusSession.js`

#### Core Methods:

| Function | Purpose |
|---|---|
| `loadSession()` | On mount: calls `getActiveFocusSession()` + `getFocusHistory()` in parallel; if session is active, calculates true elapsed using `max(db_elapsed, wall_clock)` to handle app restarts. |
| `startTick(fromElapsed)` | Starts a 1-second `setInterval` that increments elapsed; starts a 5-second heartbeat that writes elapsed to DB via `update_focus_elapsed`. |
| `stopTick()` | Clears both intervals. |
| `start(name, goal, totalSeconds, exes)` | Calls `startFocusSession`, sets session state, starts tick from 0. |
| `pause()` | Reads current `elapsedRef`, calls `pauseFocusSession`, stops tick. |
| `resume()` | Calls `resumeFocusSession`, restarts tick from current elapsed. |
| `end(completed)` | Reads `elapsedRef`, calls `endFocusSession`, clears session state, refreshes history. |

#### Critical Implementation Detail — Stale Closure Fix:
Uses `elapsedRef` (a `useRef`) that stays current inside interval callbacks. Without this, the heartbeat would always write `elapsed = 0` because elapsed state is captured by value at interval creation time.

#### Hook Return Value:
```javascript
{
  session,
  elapsed,
  remaining,
  history,
  loading,
  error,
  isActive,
  isPaused,
  hasSession,
  start,
  pause,
  resume,
  end,
  reload
}
```

---

### 5. `usageApi.js`
* **Type:** JavaScript service layer  
* **Role:** All Tauri IPC calls in one place  
* **Path:** `src/services/usageApi.js`

#### Focus-related Functions:

| Function | Tauri Command | Purpose |
|---|---|---|
| `getActiveFocusSession()` | `get_active_focus_session` | Load current active/paused session |
| `getFocusHistory(limit)` | `get_focus_history` | Load past sessions |
| `startFocusSession(name, goal, secs, exes)` | `start_focus_session` | Create session + activate blocks |
| `pauseFocusSession(id, elapsed)` | `pause_focus_session` | Pause and save elapsed |
| `resumeFocusSession(id)` | `resume_focus_session` | Resume |
| `endFocusSession(id, elapsed, completed)` | `end_focus_session` | End and remove blocks |
| `updateFocusElapsed(id, elapsed)` | `update_focus_elapsed` | Heartbeat persist |

---

### 6. `commands/focus.rs`
* **Type:** Rust Tauri command handlers  
* **Role:** Bridge between frontend IPC and database + blocking engine  
* **Path:** `src-tauri/src/commands/focus.rs`

#### Commands:
- **`start_focus_session`**:
  - Validates `total_seconds > 0`.
  - Abandons any stale active session (safety cleanup).
  - Inserts new row into `focus_sessions` with `status = 'active'`.
  - For each exe in `blocked_app_exes`: inserts into `blocked_applications` with `display_name = "[FOCUS] discord.exe"` (only if not already permanently blocked).
  - Immediately kills any already-running instances via `kill_processes_by_name_with_display(exe, name, true)`.
  - Calls `tracker.refresh_block_cache()` so the background thread starts enforcing the new blocks within 2 seconds.
  - Returns the saved `FocusSession` row.

- **`end_focus_session`**:
  - Reads `blocked_apps` JSON from the active session row before ending it (critical — after ending, the row moves to history).
  - Updates `focus_sessions` with `status`, `elapsed_seconds`, `ended_at`.
  - Calls `remove_focus_blocks()` helper which removes only rows whose `display_name` starts with `"[FOCUS] "` — permanent App Blocking rules are never touched.
  - Calls `tracker.refresh_block_cache()` so blocking stops within 2 seconds.

- **`pause_focus_session` / `resume_focus_session`**:
  - Simple DB status updates. Pausing saves elapsed time so it survives app restarts.

- **`update_focus_elapsed`**:
  - Heartbeat — updates `elapsed_seconds` in the DB row. Called every 5 seconds from the React hook.

- **`remove_focus_blocks()` helper (private)**:
  - Parses stored JSON array of exe names, checks each one's `display_name` in `blocked_applications`, and only deletes rows where the display name starts with the `"[FOCUS] "` prefix. This guarantees clean separation between permanent and temporary blocks.

---

### 7. `database/mod.rs`
* **Type:** Rust SQLite query layer  
* **Role:** All database operations  
* **Path:** `src-tauri/src/database/mod.rs`

#### Focus-related Methods:

| Method | SQL Operation |
|---|---|
| `start_focus_session(name, goal, total_sec, apps_json, started_at)` | `INSERT INTO focus_sessions` |
| `update_focus_elapsed(id, elapsed)` | `UPDATE focus_sessions SET elapsed_seconds` |
| `pause_focus_session(id, elapsed)` | `UPDATE focus_sessions SET status='paused', elapsed_seconds` |
| `resume_focus_session(id)` | `UPDATE focus_sessions SET status='active'` |
| `end_focus_session(id, elapsed, status, ended_at)` | `UPDATE focus_sessions SET status, elapsed_seconds, ended_at` |
| `get_active_focus_session()` | `SELECT … WHERE status IN ('active', 'paused') LIMIT 1` |
| `get_focus_session_history(limit)` | `SELECT … WHERE status IN ('completed', 'abandoned')` |
| `get_enabled_blocked_executables()` | Returns `Vec<(exe, display_name, is_focus_block)>` — strips `[FOCUS]` prefix, derives clean name, flags focus vs permanent |

---

### 8. `tracker/mod.rs`
* **Type:** Rust background thread  
* **Role:** Continuously enforces blocking every 2 seconds  
* **Path:** `src-tauri/src/tracker/mod.rs`

#### Focus-relevant Behavior:
- Maintains `blocked_exe_cache: Vec<(String, String, bool)>` — `(exe, clean_name, is_focus_block)`.
- Cache refreshes from DB every 10 ticks (~20 seconds) automatically, or immediately when `refresh_block_cache()` is called by a command.
- Each tick: iterates the cache, calls `is_process_running(exe)`, and if found spawns a thread to kill + notify.
- Uses `notifying: Arc<Mutex<HashSet<String>>>` to ensure only one popup per exe at a time.
- Runs independently of the React UI — Focus blocking continues even when the Focus page is closed or the user navigates elsewhere.

---

### 9. `windows_api.rs`
* **Type:** Rust Windows API isolation  
* **Role:** All unsafe Win32 API calls  
* **Path:** `src-tauri/src/windows_api.rs`

#### Focus-relevant Function:
- **`kill_processes_by_name_with_display(exe, display_name, is_focus_block)`**:
  - Enumerates all processes via `CreateToolhelp32Snapshot`.
  - Kills ALL matching PIDs via `TerminateProcess` (handles multi-process apps like Discord or Chrome).
  - Shows ONE `MessageBoxW` dialog with context-tailored messaging:
    - **Focus block (`is_focus_block = true`):**
      - Title: `"Clarity — Focus Session Active"`
      - Message: `"<AppName> is blocked during your Focus session. Stay focused!..."`
    - **Permanent app block (`is_focus_block = false`):**
      - Title: `"Clarity — App Blocked"`
      - Message: `"<AppName> is blocked by Clarity. To unblock it..."`

---

### 10. `focus.js`
* **Type:** JavaScript constants file  
* **Role:** Static UI constants only  
* **Path:** `src/data/focus.js`

#### Contents:
- `DURATION_PRESETS`: Preset duration buttons (25m, 50m, 1h, 1.5h, 2h).
- `DEFAULT_HOURS = 1`, `DEFAULT_MINUTES = 0`.
- `focusFeatures`: 3 feature highlight cards in the bottom strip.
- Does **NOT** contain mock session data anymore — mock active session and session history have been removed in favor of live backend data.

---

## Database Schema

### `focus_sessions` Table
```sql
CREATE TABLE IF NOT EXISTS focus_sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    goal            TEXT,
    total_seconds   INTEGER NOT NULL,
    elapsed_seconds INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL CHECK(status IN ('active', 'paused', 'completed', 'abandoned')),
    blocked_apps    TEXT NOT NULL DEFAULT '[]',  -- JSON array of exe strings
    started_at      TEXT NOT NULL,               -- UTC ISO-8601
    ended_at        TEXT                         -- UTC ISO-8601 or NULL
);
```

### `blocked_applications` Table (Shared with App Blocking)
Focus sessions insert temporary rows with `display_name = "[FOCUS] <exe>"`. Permanent App Blocking rows have user-assigned display names (e.g. `display_name = "Discord"`).

```
Permanent block row:   executable_name="discord.exe"   display_name="Discord"
Focus temp block row:  executable_name="discord.exe"   display_name="[FOCUS] discord.exe"
```

#### Isolation Behavior:
When Focus ends:
1. Only rows with `display_name LIKE '[FOCUS] %'` are deleted.
2. Permanent block rows remain completely intact.
3. If Discord was permanently blocked prior to the session, it remains blocked after the focus session ends.
