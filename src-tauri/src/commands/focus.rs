// commands/focus.rs — Tauri IPC commands for Focus Mode.

use tauri::State;
use chrono::Utc;
use crate::AppState;
use crate::models::FocusSession;

const DEV_PREMIUM_BYPASS: bool = true; // ← DEVELOPMENT ONLY

// Marker on display_name so we only remove OUR temporary rules, never permanent ones.
const FOCUS_BLOCK_PREFIX: &str = "[FOCUS] ";

fn check_pro(state: &State<'_, AppState>) -> Result<(), String> {
    if DEV_PREMIUM_BYPASS { return Ok(()); }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if db.is_pro_user() { Ok(()) } else { Err("not_pro".into()) }
}

fn now_str() -> String {
    Utc::now().format("%Y-%m-%dT%H:%M:%SZ").to_string()
}

// ─────────────────────────────────────────────────────────────────────────────
// get_active_focus_session
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn get_active_focus_session(
    state: State<'_, AppState>,
) -> Result<Option<FocusSession>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_active_focus_session().map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_focus_history
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn get_focus_history(
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<FocusSession>, String> {
    let lim = limit.unwrap_or(20).min(100).max(1);
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_focus_session_history(lim).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// start_focus_session
// Creates session, temporarily blocks selected apps, kills running instances.
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn start_focus_session(
    name: String,
    goal: String,
    total_seconds: i64,
    blocked_app_exes: Vec<String>,
    state: State<'_, AppState>,
) -> Result<FocusSession, String> {
    check_pro(&state)?;

    if total_seconds <= 0 {
        return Err("Session duration must be greater than 0.".into());
    }

    let started_at = now_str();
    let blocked_apps_json = serde_json::to_string(&blocked_app_exes)
        .map_err(|e| e.to_string())?;

    // ── 1. Abandon any stale active session ──────────────────
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        if let Ok(Some(old)) = db.get_active_focus_session() {
            let _ = db.end_focus_session(old.id, old.elapsed_seconds, "abandoned", &started_at);
            remove_focus_blocks(&db, &old.blocked_apps);
        }
    }

    // ── 2. Persist new session ────────────────────────────────
    let _new_id = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.start_focus_session(&name, &goal, total_seconds, &blocked_apps_json, &started_at)
            .map_err(|e| e.to_string())?
    };

    // ── 3. Kill already-running instances of blocked apps (non-blocking) ────
    for exe in &blocked_app_exes {
        let killed = crate::tracker::platform::kill_processes_only(exe);
        if killed > 0 {
            log::info!("[focus] Terminated {} running instance(s) of {}", killed, exe);
        }
    }

    // ── 4. Refresh tracker's in-memory cache ─────────────────
    {
        let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.refresh_block_cache();
    }

    // ── 5. Return the saved session ───────────────────────────
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_active_focus_session()
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "Session was created but could not be retrieved.".into())
}

// ─────────────────────────────────────────────────────────────────────────────
// pause_focus_session
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn pause_focus_session(
    session_id: i64,
    elapsed_seconds: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    check_pro(&state)?;
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.pause_focus_session(session_id, elapsed_seconds)
            .map_err(|e| e.to_string())?;
    }
    {
        let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.refresh_block_cache();
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// resume_focus_session
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn resume_focus_session(
    session_id: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    check_pro(&state)?;
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.resume_focus_session(session_id)
            .map_err(|e| e.to_string())?;
    }
    {
        let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.refresh_block_cache();
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// end_focus_session
// Saves final state and removes ONLY the temporary focus blocks,
// leaving any permanent App Blocking rules intact.
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn end_focus_session(
    session_id: i64,
    elapsed_seconds: i64,
    completed: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    check_pro(&state)?;

    let status   = if completed { "completed" } else { "abandoned" };
    let ended_at = now_str();

    // ── 1. Read blocked_apps BEFORE ending (while row is still active) ──
    let blocked_apps_json = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_active_focus_session()
            .map_err(|e| e.to_string())?
            .filter(|s| s.id == session_id)
            .map(|s| s.blocked_apps)
            .unwrap_or_default()
    };

    // ── 2. Persist end state ──────────────────────────────────
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.end_focus_session(session_id, elapsed_seconds, status, &ended_at)
            .map_err(|e| e.to_string())?;
    }

    // ── 3. Remove only focus-session temporary blocks ─────────
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        remove_focus_blocks(&db, &blocked_apps_json);
    }

    // ── 4. Refresh tracker cache ──────────────────────────────
    {
        let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.refresh_block_cache();
    }

    log::info!("[focus] Session {} ended as {}", session_id, status);
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// update_focus_elapsed
// Heartbeat — persists elapsed time every ~5 s so crashes don't lose progress.
// ─────────────────────────────────────────────────────────────────────────────
#[tauri::command]
pub async fn update_focus_elapsed(
    session_id: i64,
    elapsed_seconds: i64,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.update_focus_elapsed(session_id, elapsed_seconds)
        .map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: remove ONLY focus-session temporary blocks.
// Accepts the blocked_apps JSON string directly so it can be called before
// or after the session row is moved to history.
// Permanent App Blocking rules are never touched.
// ─────────────────────────────────────────────────────────────────────────────
fn remove_focus_blocks(db: &crate::database::Database, blocked_apps_json: &str) {
    let exes: Vec<String> = serde_json::from_str(blocked_apps_json).unwrap_or_default();

    for exe in &exes {
        // Only remove if the display_name has our focus prefix (= temporary rule).
        // If the user also has it as a permanent block, the permanent row has a
        // different display_name so it will NOT be removed.
        let is_focus_temp = db.get_blocked_apps()
            .map(|list| {
                let focus_display = format!("{}{}", FOCUS_BLOCK_PREFIX, exe);
                list.iter().any(|a| &a.executable_name == exe && a.display_name == focus_display)
            })
            .unwrap_or(false);

        if is_focus_temp {
            let _ = db.remove_blocked_app(exe);
            log::info!("[focus] Removed temp block for {}", exe);
        }
    }
}
