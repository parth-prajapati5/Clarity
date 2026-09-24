// commands/settings.rs — Tauri IPC commands for the Settings module.
//
// All user preferences are stored in the app_settings key-value table.
// Keys are simple strings like "general.launch_on_startup".
// Values are always strings (booleans → "true"/"false", numbers → their string form).
//
// Launch-on-startup is implemented via the Windows Registry
// HKCU\Software\Microsoft\Windows\CurrentVersion\Run
// so it works without needing tauri-plugin-autostart.

use tauri::State;
use crate::AppState;
use std::collections::HashMap;

// ─────────────────────────────────────────────────────────────────────────────
// get_settings
// Returns all app_settings rows as a plain JSON object { key: value }.
// Called once when the Settings page loads.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_settings(
    state: State<'_, AppState>,
) -> Result<HashMap<String, String>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut map: HashMap<String, String> = db
        .get_all_settings()
        .map_err(|e| e.to_string())?
        .into_iter()
        .collect();

    // Reflect the true Windows startup state so the UI always shows what the
    // OS will actually do on login, not just the last value we persisted.
    match get_launch_on_startup() {
        Some(enabled) => {
            map.insert("general.launch_on_startup".to_string(), enabled.to_string());
        }
        None => {
            // Registry query failed (non-Windows or API error) — keep the
            // persisted preference, defaulting to enabled like the UI default.
            map.entry("general.launch_on_startup".to_string())
                .or_insert_with(|| "true".to_string());
        }
    }

    Ok(map)
}

// ─────────────────────────────────────────────────────────────────────────────
// save_setting
// Persist a single key-value pair.  Called each time the user toggles
// a setting — no "save" button needed, changes are immediate.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn save_setting(
    key:   String,
    value: String,
    state: State<'_, AppState>,
) -> Result<(), String> {
    // Launch-on-startup is applied to the Windows Registry first, and an
    // OS-level failure is surfaced to the UI (which reverts the toggle)
    // instead of being swallowed.
    if key == "general.launch_on_startup" {
        let enable = value == "true";
        set_launch_on_startup(enable).map_err(|e| e.to_string())?;
    }

    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.set_setting(&key, &value).map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// get_app_version
// Returns the version string from Cargo.toml / tauri.conf.json.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn get_app_version(
    app: tauri::AppHandle,
) -> Result<String, String> {
    Ok(app.package_info().version.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// export_usage_data
// Returns a CSV string of all application_sessions joined with applications.
// The frontend receives this and triggers a file download.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn export_usage_data(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.export_usage_as_csv().map_err(|e| e.to_string())
}

// ─────────────────────────────────────────────────────────────────────────────
// delete_all_data
// Permanently deletes all usage sessions from SQLite.
// Settings, blocked-app rules, and focus sessions are preserved.
// ─────────────────────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn delete_all_data(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    db.delete_all_usage_data().map_err(|e| e.to_string())?;
    log::info!("[settings] All usage data deleted by user request");
    Ok(())
}

// ─────────────────────────────────────────────────────────────────────────────
// Windows Registry — launch on startup
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(target_os = "windows")]
fn set_launch_on_startup(enable: bool) -> anyhow::Result<()> {
    use windows_sys::Win32::System::Registry::{
        RegOpenKeyExW, RegSetValueExW, RegDeleteValueW, RegCloseKey,
        HKEY_CURRENT_USER, KEY_SET_VALUE, REG_SZ,
    };
    use windows_sys::Win32::Foundation::ERROR_SUCCESS;
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let subkey_wide: Vec<u16> = OsStr::new(
        r"Software\Microsoft\Windows\CurrentVersion\Run"
    ).encode_wide().chain(std::iter::once(0)).collect();

    let value_name_wide: Vec<u16> = OsStr::new("Clarity")
        .encode_wide().chain(std::iter::once(0)).collect();

    unsafe {
        let mut hkey: windows_sys::Win32::System::Registry::HKEY = std::ptr::null_mut();
        let rc = RegOpenKeyExW(
            HKEY_CURRENT_USER,
            subkey_wide.as_ptr(),
            0,
            KEY_SET_VALUE,
            &mut hkey,
        );
        if rc != ERROR_SUCCESS {
            anyhow::bail!("RegOpenKeyExW failed: {}", rc);
        }

        let result = if enable {
            // Get the path to the current executable
            let exe_path = std::env::current_exe()
                .map(|p| p.to_string_lossy().into_owned())
                .unwrap_or_default();
            let exe_wide: Vec<u16> = OsStr::new(&exe_path)
                .encode_wide().chain(std::iter::once(0)).collect();
            let data = exe_wide.as_slice();
            RegSetValueExW(
                hkey,
                value_name_wide.as_ptr(),
                0,
                REG_SZ,
                data.as_ptr() as *const u8,
                (data.len() * 2) as u32,
            )
        } else {
            RegDeleteValueW(hkey, value_name_wide.as_ptr())
        };

        RegCloseKey(hkey);

        if result != ERROR_SUCCESS && result != 2 {
            // Error code 2 = value not found on delete — acceptable
            anyhow::bail!("Registry write failed: {}", result);
        }
    }

    log::info!("[settings] Launch on startup: {}", enable);
    Ok(())
}

#[cfg(not(target_os = "windows"))]
fn set_launch_on_startup(_enable: bool) -> anyhow::Result<()> {
    Ok(()) // No-op on non-Windows
}

/// Read whether the "Clarity" value exists under HKCU Run.
/// Returns Some(true/false) for a definitive answer, None when the registry
/// couldn't be queried (in which case the persisted preference is used).
#[cfg(target_os = "windows")]
fn get_launch_on_startup() -> Option<bool> {
    use windows_sys::Win32::System::Registry::{
        RegOpenKeyExW, RegQueryValueExW, RegCloseKey,
        HKEY_CURRENT_USER, KEY_QUERY_VALUE, REG_SZ,
    };
    use windows_sys::Win32::Foundation::{ERROR_SUCCESS, ERROR_FILE_NOT_FOUND};
    use std::ffi::OsStr;
    use std::os::windows::ffi::OsStrExt;

    let subkey_wide: Vec<u16> = OsStr::new(
        r"Software\Microsoft\Windows\CurrentVersion\Run"
    ).encode_wide().chain(std::iter::once(0)).collect();
    let value_name_wide: Vec<u16> = OsStr::new("Clarity")
        .encode_wide().chain(std::iter::once(0)).collect();

    unsafe {
        let mut hkey = std::ptr::null_mut();
        let rc = RegOpenKeyExW(
            HKEY_CURRENT_USER,
            subkey_wide.as_ptr(),
            0,
            KEY_QUERY_VALUE,
            &mut hkey,
        );
        if rc != ERROR_SUCCESS {
            return None;
        }

        let mut value_type: u32 = 0;
        let mut data_len: u32 = 0;
        let rc = RegQueryValueExW(
            hkey,
            value_name_wide.as_ptr(),
            std::ptr::null_mut(),
            &mut value_type,
            std::ptr::null_mut(),
            &mut data_len,
        );
        RegCloseKey(hkey);

        match rc {
            ERROR_SUCCESS if value_type == REG_SZ => Some(true),
            x if x == ERROR_FILE_NOT_FOUND => Some(false),
            _ => None,
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_launch_on_startup() -> Option<bool> {
    None // Unknown on non-Windows — fall back to the persisted value.
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests — verify the Windows startup registry round-trip in both directions.
// The test restores the prior registry state afterwards.
// ─────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn launch_on_startup_registry_roundtrip() {
        let before = get_launch_on_startup();

        set_launch_on_startup(true).expect("enable should succeed");
        assert_eq!(get_launch_on_startup(), Some(true));

        set_launch_on_startup(false).expect("disable should succeed");
        assert_eq!(get_launch_on_startup(), Some(false));

        if before == Some(true) {
            set_launch_on_startup(true).expect("restore prior state");
        }
        assert_eq!(get_launch_on_startup(), before);
    }
}
