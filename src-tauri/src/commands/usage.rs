// commands/usage.rs — Tauri IPC commands exposed to the React frontend.
//
// All "today" queries accept a local_date parameter (YYYY-MM-DD) supplied
// by the frontend so that the user's local calendar day is always used —
// not a UTC day that may differ by ±1 at midnight.
//
// All commands that need live (in-progress) session data call
// tracker.active_session_elapsed() and pass the result into the database
// layer so the currently-running session is included in totals without
// waiting for a session close.

use tauri::State;
use chrono::Timelike;
use crate::AppState;
use crate::models::{
    AppUsageResponse, DayUsageResponse, SummaryStats, AppSession,
    WebsiteUsageResponse, WebsiteSession, WebsiteSummaryStats, HourUsage,
};

// ─────────────────────────────────────────────────────────────────────────────
// get_today_usage
// Returns per-app totals for the user's local today, including live elapsed
// time for the currently-running session.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_today_usage(
    local_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<AppUsageResponse>, String> {
    validate_date(&local_date)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    };
    let mut results = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.get_today_usage(&local_date, active).map_err(|e| e.to_string())?
    };
    for r in &mut results {
        r.icon = state.icons.get_icon(&r.executable_name);
    }
    Ok(results)
}

// ─────────────────────────────────────────────────────────────────────────────
// get_application_usage
// Alias for get_today_usage used by the Applications page.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_application_usage(
    local_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<AppUsageResponse>, String> {
    get_today_usage(local_date, state).await
}

// ─────────────────────────────────────────────────────────────────────────────
// get_usage_for_date
// Per-app totals for any given YYYY-MM-DD date string (past or today).
// For today, the active session is included.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_usage_for_date(
    date: String,
    local_today: String,
    state: State<'_, AppState>,
) -> Result<Vec<AppUsageResponse>, String> {
    validate_date(&date)?;
    validate_date(&local_today)?;

    // Only inject live session if the requested date is today
    let active = if date == local_today {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    } else {
        None
    };

    let mut results = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        if active.is_some() {
            db.get_today_usage(&date, active).map_err(|e| e.to_string())?
        } else {
            db.get_usage_for_date(&date).map_err(|e| e.to_string())?
        }
    };
    for r in &mut results {
        r.icon = state.icons.get_icon(&r.executable_name);
    }
    Ok(results)
}

// ─────────────────────────────────────────────────────────────────────────────
// App Icon Commands
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_app_icon(
    executable_or_path: String,
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    Ok(state.icons.get_icon(&executable_or_path))
}

#[tauri::command]
pub async fn get_app_icons(
    executables: Vec<String>,
    state: State<'_, AppState>,
) -> Result<std::collections::HashMap<String, String>, String> {
    Ok(state.icons.get_icons(&executables))
}

// ─────────────────────────────────────────────────────────────────────────────
// get_weekly_usage
// Day-by-day totals for the 7 days ending on local_today.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_weekly_usage(
    local_today: String,
    state: State<'_, AppState>,
) -> Result<Vec<DayUsageResponse>, String> {
    validate_date(&local_today)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_weekly_usage(&local_today, active).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_daily_usage
// Per-day totals (screen time, apps, sessions) over the last N local calendar
// days ending on local_today. Used by the Analytics page for calendar-aligned
// Week / Month bars (handles the rolling-window -> calendar-week mismatch).
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_daily_usage(
    local_today: String,
    days: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<DayUsageResponse>, String> {
    validate_date(&local_today)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_daily_usage(&local_today, days.unwrap_or(28), active)
        .map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_hourly_usage
// Per-hour totals per day over the last N local calendar days. Powers the
// Activity Heatmap and the Hourly Activity (Peak Hours) chart with real data.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_hourly_usage(
    local_today: String,
    days: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<HourUsage>, String> {
    validate_date(&local_today)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    };
    // Only attribute live elapsed time if the requested window covers today
    let now_local_date = chrono::Local::now().format("%Y-%m-%d").to_string();
    let active_hour = if now_local_date == local_today {
        chrono::Local::now().hour() as i64
    } else {
        -1
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_hourly_usage(&local_today, days.unwrap_or(28), active, active_hour)
        .map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_application_sessions
// Recent sessions for a specific executable.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_application_sessions(
    executable: String,
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<AppSession>, String> {
    let lim = limit.unwrap_or(50).min(500).max(1);
    let db  = state.db.lock().map_err(|e| e.to_string())?;
    db.get_application_sessions(&executable.to_lowercase(), lim)
        .map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_current_app
// Name of the currently active foreground application.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_current_app(
    state: State<'_, AppState>,
) -> Result<Option<String>, String> {
    let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
    Ok(tracker.current_app())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_summary_stats
// Dashboard KPIs: today total, week total, distinct apps today, 7-day avg.
// Includes live elapsed time for the currently-running session.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_summary_stats(
    local_date: String,
    state: State<'_, AppState>,
) -> Result<SummaryStats, String> {
    validate_date(&local_date)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_summary_stats(&local_date, active).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// Website tracking commands
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_today_website_usage(
    local_date: String,
    state: State<'_, AppState>,
) -> Result<Vec<WebsiteUsageResponse>, String> {
    validate_date(&local_date)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_website_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_today_website_usage(&local_date, active).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_weekly_website_usage(
    local_today: String,
    state: State<'_, AppState>,
) -> Result<Vec<DayUsageResponse>, String> {
    validate_date(&local_today)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_website_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_weekly_website_usage(&local_today, active).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_website_summary_stats(
    local_date: String,
    state: State<'_, AppState>,
) -> Result<WebsiteSummaryStats, String> {
    validate_date(&local_date)?;
    let active = {
        let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.active_website_session_elapsed()
    };
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_website_summary_stats(&local_date, active).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn get_website_sessions(
    domain: String,
    limit: Option<i64>,
    state: State<'_, AppState>,
) -> Result<Vec<WebsiteSession>, String> {
    let lim = limit.unwrap_or(50).min(500).max(1);
    let db  = state.db.lock().map_err(|e| e.to_string())?;
    db.get_website_sessions(&domain, lim).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

fn validate_date(date: &str) -> Result<(), String> {
    if date.len() != 10 || !date.chars().all(|c| c.is_ascii_digit() || c == '-') {
        return Err(format!("Invalid date '{}'. Expected YYYY-MM-DD", date));
    }
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug / Diagnostic
// ─────────────────────────────────────────────────────────────────────────────

/// Diagnostic: test URL extraction from the current foreground browser.
/// Call from the browser console: `await window.__TAURI__.core.invoke("debug_website_tracking")`
#[tauri::command]
pub async fn debug_website_tracking(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let tracker = state.tracker.lock().map_err(|e| e.to_string())?;
    let current = tracker.current_app().unwrap_or_else(|| "(none)".into());
    let ws_elapsed = tracker.active_website_session_elapsed();

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let websites = db.get_today_website_usage(&today, ws_elapsed)
        .map_err(|e| e.to_string())?;

    let mut report = format!("=== Website Tracking Debug ===\n");
    report += &format!("Current app: {}\n", current);
    report += &format!("Active website session: {:?}\n", ws_elapsed);
    report += &format!("Today's websites ({}):\n", today);
    for w in &websites {
        report += &format!("  {} — {}s ({} sessions, last: {:?})\n",
            w.domain, w.duration_seconds, w.session_count, w.last_used);
    }
    if websites.is_empty() {
        report += "  (none recorded yet)\n";
    }

    Ok(report)
}
