// commands/blocking.rs — Tauri IPC commands for app blocking (premium).
//
// DEV BYPASS — TEMPORARY DEVELOPMENT FLAG
// ──────────────────────────────────────────────────────────────
// Set DEV_PREMIUM_BYPASS = true to treat every user as PRO during
// development/testing.  The production premium architecture is preserved.
//
// TO DISABLE: change the constant below to `false` and recompile.
// DO NOT ship to production with this set to true.
// ──────────────────────────────────────────────────────────────
const DEV_PREMIUM_BYPASS: bool = true; // ← DEVELOPMENT ONLY — set false before release

// ── Protected system processes that must never be blocked ───────────────────
// This list is checked server-side before any block rule is persisted.
const PROTECTED_EXECUTABLES: &[&str] = &[
    "system", "idle", "registry",
    "smss.exe", "csrss.exe", "wininit.exe", "winlogon.exe",
    "services.exe", "lsass.exe", "svchost.exe",
    "explorer.exe",   // Windows shell — blocking this breaks the desktop
    "clarity-desktop.exe", // The app itself
    "taskmgr.exe",    // Task manager — never block it
    "dwm.exe",        // Desktop Window Manager
    "fontdrvhost.exe",
];

use tauri::State;
use crate::AppState;
use crate::models::BlockedApp;
use crate::tracker::platform as windows_api;

// ── Helpers ──────────────────────────────────────────────────

fn check_pro(state: &State<'_, AppState>) -> Result<(), String> {
    if DEV_PREMIUM_BYPASS {
        log::debug!("[blocking] DEV_PREMIUM_BYPASS active — skipping pro check");
        return Ok(());
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if db.is_pro_user() { Ok(()) } else { Err("not_pro".into()) }
}

fn is_protected(exe: &str) -> bool {
    let lower = exe.to_lowercase();
    PROTECTED_EXECUTABLES.iter().any(|p| lower == *p)
}

fn normalize_exe(input: &str) -> Option<String> {
    let s = input.trim().to_lowercase();
    if s.is_empty() { return None; }
    // Must look like an exe — at minimum has a dot and no path separators
    if s.contains('\\') || s.contains('/') {
        // Accept only the filename component
        let name = std::path::Path::new(&s)
            .file_name()
            .map(|f| f.to_string_lossy().into_owned())
            .unwrap_or(s.clone());
        return normalize_exe(&name);
    }
    if is_protected(&s) { return None; }
    Some(s)
}

fn extract_exe_from_lnk_bytes(bytes: &[u8]) -> Option<String> {
    let mut best_exe: Option<String> = None;

    // 1. Scan for ASCII strings ending with .exe
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i].is_ascii_graphic() || bytes[i] == b' ' {
            let start = i;
            while i < bytes.len() && (bytes[i].is_ascii_graphic() || bytes[i] == b' ') {
                i += 1;
            }
            let slice = &bytes[start..i];
            if slice.len() >= 5 {
                if let Ok(s) = std::str::from_utf8(slice) {
                    let s_lower = s.to_lowercase();
                    if s_lower.ends_with(".exe") {
                        let filename = std::path::Path::new(s)
                            .file_name()
                            .map(|f| f.to_string_lossy().into_owned())
                            .unwrap_or_else(|| s.to_string())
                            .to_lowercase();
                        if !is_ignored_exe(&filename) {
                            best_exe = Some(filename);
                        }
                    }
                }
            }
        } else {
            i += 1;
        }
    }

    // 2. Scan for UTF-16LE strings ending with .exe
    let mut u16_buf: Vec<u16> = Vec::new();
    let mut j = 0;
    while j + 1 < bytes.len() {
        let code = u16::from_le_bytes([bytes[j], bytes[j + 1]]);
        if (code >= 0x20 && code <= 0x7E) || code == 0x09 {
            u16_buf.push(code);
        } else {
            if u16_buf.len() >= 5 {
                if let Ok(s) = String::from_utf16(&u16_buf) {
                    let s_lower = s.to_lowercase();
                    if s_lower.ends_with(".exe") {
                        let filename = std::path::Path::new(&s)
                            .file_name()
                            .map(|f| f.to_string_lossy().into_owned())
                            .unwrap_or_else(|| s)
                            .to_lowercase();
                        if !is_ignored_exe(&filename) {
                            best_exe = Some(filename);
                        }
                    }
                }
            }
            u16_buf.clear();
        }
        j += 2;
    }

    best_exe
}

fn is_ignored_exe(exe: &str) -> bool {
    let lower = exe.to_lowercase();
    lower.contains("uninstall")
        || lower.contains("installer")
        || lower.contains("setup")
        || lower.contains("update")
        || lower.contains("helper")
        || lower.contains("crashpad")
        || lower.contains("appcertui")
        || lower.contains("appverif")
        || lower.contains("mdsched")
        || lower.contains("dfrgui")
        || lower == "1.exe"
        || lower == "provider.exe"
        || lower == "wizlink.exe"
        || lower == "cleanmgr.exe"
        || lower == "perfmon.exe"
        || lower == "control.exe"
        || lower == "cmd.exe"
        || lower == "powershell.exe"
        || lower == "powershell_ise.exe"
        || lower == "regedit.exe"
        || lower == "msconfig.exe"
        || lower == "explorer.exe"
        || is_protected(&lower)
}

fn is_ignored_name(name: &str) -> bool {
    let lower = name.to_lowercase();
    lower.contains("uninstall")
        || lower.contains("un-install")
        || lower.contains("install additional")
        || lower.contains("manual")
        || lower.contains("guide")
        || lower.contains("documentation")
        || lower.contains("readme")
}

fn walk_dir_for_lnks(dir: &std::path::Path, results: &mut std::collections::HashMap<String, String>, depth: usize) {
    if depth > 4 { return; }
    let entries = match std::fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            walk_dir_for_lnks(&path, results, depth + 1);
        } else if let Some(ext) = path.extension() {
            if ext.eq_ignore_ascii_case("lnk") {
                if let Some(stem) = path.file_stem() {
                    let name = stem.to_string_lossy().to_string();
                    if is_ignored_name(&name) { continue; }

                    if let Ok(bytes) = std::fs::read(&path) {
                        if let Some(exe) = extract_exe_from_lnk_bytes(&bytes) {
                            if !results.contains_key(&exe) {
                                results.insert(exe, name);
                            }
                        }
                    }
                }
            }
        }
    }
}

// ── Commands ─────────────────────────────────────────────────

/// List all downloaded and installed applications detected on this machine.
/// Used to populate the "Add application" picker in the UI and Focus session block-list.
#[tauri::command]
pub async fn get_tracked_applications(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let mut map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    // 1. Existing tracked applications from the database
    if let Ok(db) = state.db.lock() {
        if let Ok(apps) = db.get_tracked_applications() {
            for (name, exe) in apps {
                let exe_lower = exe.trim().to_lowercase();
                if !exe_lower.is_empty() && !is_protected(&exe_lower) {
                    map.insert(exe_lower, name);
                }
            }
        }
    }

    // 2. Scan installed/downloaded application shortcuts from Start Menu & user AppData
    let mut search_dirs = Vec::new();
    if let Ok(p) = std::env::var("ProgramData") {
        search_dirs.push(std::path::PathBuf::from(p).join(r"Microsoft\Windows\Start Menu\Programs"));
    }
    if let Ok(a) = std::env::var("APPDATA") {
        search_dirs.push(std::path::PathBuf::from(a).join(r"Microsoft\Windows\Start Menu\Programs"));
    }
    if let Ok(l) = std::env::var("LOCALAPPDATA") {
        search_dirs.push(std::path::PathBuf::from(l).join("Programs"));
    }

    for dir in search_dirs {
        if dir.exists() {
            walk_dir_for_lnks(&dir, &mut map, 0);
        }
    }

    // 3. Scan currently running processes
    for (_pid, exe) in crate::tracker::platform::enumerate_processes() {
        let exe_lower = exe.trim().to_lowercase();
        if !exe_lower.is_empty() && !is_ignored_exe(&exe_lower) && !map.contains_key(&exe_lower) {
            let name = crate::tracker::friendly_name(&exe_lower);
            map.insert(exe_lower, name);
        }
    }

    // 4. Convert to sorted vector (alphabetical by display name)
    let mut list: Vec<(String, String)> = map.into_iter().collect();
    list.sort_by(|a, b| a.1.to_lowercase().cmp(&b.1.to_lowercase()));

    Ok(list
        .into_iter()
        .map(|(exe, name)| {
            let icon = state.icons.get_icon(&exe);
            serde_json::json!({
                "name": name,
                "executableName": exe,
                "icon": icon
            })
        })
        .collect())
}

/// List all blocked-app rules (enabled or not).
#[tauri::command]
pub async fn get_blocked_apps(
    state: State<'_, AppState>,
) -> Result<Vec<BlockedApp>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.get_blocked_apps().map_err(|e| e.to_string())
}

/// Add an application to the block list and immediately terminate it if running.
#[tauri::command]
pub async fn add_blocked_app(
    executable_name: String,
    display_name: String,
    state: State<'_, AppState>,
) -> Result<BlockedApp, String> {
    check_pro(&state)?;

    let exe = normalize_exe(&executable_name)
        .ok_or_else(|| format!("\"{}\" is a protected or invalid executable.", executable_name))?;

    log::info!("[blocking] add request: \"{}\" → normalized \"{}\"", executable_name, exe);

    // Check duplicate
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let existing = db.get_blocked_apps().map_err(|e| e.to_string())?;
        if existing.iter().any(|a| a.executable_name == exe) {
            return Err(format!("\"{}\" is already in the blocked list.", exe));
        }
    }

    // Persist to database
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        db.add_blocked_app(&exe, &display_name).map_err(|e| e.to_string())?;
    }

    // Immediately terminate if running
    let killed = windows_api::kill_processes_by_name_with_display(&exe, &display_name, false);
    if killed > 0 {
        log::info!("[blocking] Immediately terminated {} instance(s) of {}", killed, exe);
    }

    // Refresh the in-memory cache in the tracker
    {
        let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
        tracker.refresh_block_cache();
    }

    // Return the new row
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let list = db.get_blocked_apps().map_err(|e| e.to_string())?;
    list.into_iter()
        .find(|a| a.executable_name == exe)
        .ok_or_else(|| "DB insert succeeded but row not found".into())
}

/// Permanently remove a blocked-app rule.
#[tauri::command]
pub async fn remove_blocked_app(
    executable_name: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    check_pro(&state)?;

    let exe = executable_name.trim().to_lowercase();
    log::info!("[blocking] remove request for {}", exe);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.remove_blocked_app(&exe).map_err(|e| e.to_string())?;
    drop(db);

    // Refresh tracker cache so blocking stops immediately
    let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
    tracker.refresh_block_cache();

    log::info!("[blocking] {} removed from block list", exe);
    Ok(())
}

/// Enable or disable a blocked-app rule without deleting it.
#[tauri::command]
pub async fn set_app_block_enabled(
    executable_name: String,
    enabled: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    check_pro(&state)?;

    let exe = executable_name.trim().to_lowercase();
    log::info!("[blocking] set {} enabled={}", exe, enabled);

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_blocked_app_enabled(&exe, enabled).map_err(|e| e.to_string())?;
    drop(db);

    // If enabling, immediately kill any running instance
    if enabled {
        // Look up display name for the notification
        let display = {
            let db = state.db.lock().map_err(|e| e.to_string())?;
            db.get_blocked_apps()
                .map(|list| list.into_iter().find(|a| a.executable_name == exe).map(|a| a.display_name))
                .unwrap_or(None)
                .unwrap_or_else(|| exe.clone())
        };
        let killed = windows_api::kill_processes_by_name_with_display(&exe, &display, false);
        if killed > 0 {
            log::info!("[blocking] Immediately terminated {} instance(s) of {} on enable", killed, exe);
        }
    }

    // Refresh tracker cache
    let mut tracker = state.tracker.lock().map_err(|e| e.to_string())?;
    tracker.refresh_block_cache();

    Ok(())
}

// ── Premium helpers ──────────────────────────────────────────

#[tauri::command]
pub async fn is_pro_user(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    if DEV_PREMIUM_BYPASS {
        return Ok(true);
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(db.is_pro_user())
}

#[tauri::command]
pub async fn dev_set_pro(
    value: bool,
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_pro_user(value).map_err(|e| e.to_string())
}
