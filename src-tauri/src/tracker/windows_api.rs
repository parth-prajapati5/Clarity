// tracker/windows_api.rs
// Windows-specific calls: get the foreground window's process name and friendly name.
// All unsafe Windows API calls are isolated in this file.

#[cfg(target_os = "windows")]
pub mod platform {
    use std::ffi::OsString;
    use std::os::windows::ffi::OsStringExt;
    use windows_sys::Win32::{
        Foundation::{CloseHandle, HANDLE, INVALID_HANDLE_VALUE, MAX_PATH},
        System::Threading::{
            OpenProcess, QueryFullProcessImageNameW,
            PROCESS_NAME_WIN32, PROCESS_QUERY_LIMITED_INFORMATION,
        },
        UI::WindowsAndMessaging::{
            GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId,
        },
    };

    /// Information about the currently active foreground window.
    #[derive(Debug, Clone)]
    pub struct ForegroundInfo {
        /// Friendly window title
        pub window_title: String,
        /// Process executable name (e.g. "Code.exe")
        pub executable:   String,
        /// Full path to the executable
        pub full_path:    String,
        /// Numeric PID
        pub pid:          u32,
    }

    /// Get the current foreground window's process info.
    /// Returns `None` if no foreground window exists or on any API error.
    pub fn get_foreground_app() -> Option<ForegroundInfo> {
        unsafe {
            let hwnd = GetForegroundWindow();
            if hwnd.is_null() {
                return None;
            }

            // Window title
            let mut title_buf = [0u16; 512];
            let title_len =
                GetWindowTextW(hwnd, title_buf.as_mut_ptr(), title_buf.len() as i32);
            let window_title = if title_len > 0 {
                OsString::from_wide(&title_buf[..title_len as usize])
                    .to_string_lossy()
                    .into_owned()
            } else {
                String::new()
            };

            // PID
            let mut pid: u32 = 0;
            GetWindowThreadProcessId(hwnd, &mut pid);
            if pid == 0 {
                return None;
            }

            // Open process handle
            let handle: HANDLE = OpenProcess(
                PROCESS_QUERY_LIMITED_INFORMATION,
                0,
                pid,
            );
            if handle == INVALID_HANDLE_VALUE || handle.is_null() {
                return None;
            }

            // Full path
            let mut path_buf = [0u16; MAX_PATH as usize];
            let mut path_len = MAX_PATH;
            let ok = QueryFullProcessImageNameW(
                handle,
                PROCESS_NAME_WIN32,
                path_buf.as_mut_ptr(),
                &mut path_len,
            );
            CloseHandle(handle);

            if ok == 0 || path_len == 0 {
                return None;
            }

            let full_path = OsString::from_wide(&path_buf[..path_len as usize])
                .to_string_lossy()
                .into_owned();

            // Executable name = last component
            let executable = std::path::Path::new(&full_path)
                .file_name()
                .map(|f| f.to_string_lossy().into_owned())
                .unwrap_or_else(|| full_path.clone());

            Some(ForegroundInfo {
                window_title,
                executable,
                full_path,
                pid,
            })
        }
    }

    /// Enumerate all visible running processes and return (pid, lowercase_exe_name) pairs.
    /// Uses CreateToolhelp32Snapshot — lightweight, no elevated privileges needed to enumerate.
    pub fn enumerate_processes() -> Vec<(u32, String)> {
        use windows_sys::Win32::System::Diagnostics::ToolHelp::{
            CreateToolhelp32Snapshot, Process32FirstW, Process32NextW,
            PROCESSENTRY32W, TH32CS_SNAPPROCESS,
        };
        use windows_sys::Win32::Foundation::INVALID_HANDLE_VALUE;

        let mut result = Vec::new();
        unsafe {
            let snapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
            if snapshot == INVALID_HANDLE_VALUE || snapshot.is_null() {
                return result;
            }

            let mut entry: PROCESSENTRY32W = std::mem::zeroed();
            entry.dwSize = std::mem::size_of::<PROCESSENTRY32W>() as u32;

            if Process32FirstW(snapshot, &mut entry) != 0 {
                loop {
                    // szExeFile is a null-terminated wide-char array
                    let len = entry.szExeFile.iter().position(|&c| c == 0).unwrap_or(entry.szExeFile.len());
                    let name = OsString::from_wide(&entry.szExeFile[..len])
                        .to_string_lossy()
                        .to_lowercase();
                    result.push((entry.th32ProcessID, name));

                    if Process32NextW(snapshot, &mut entry) == 0 {
                        break;
                    }
                }
            }
            CloseHandle(snapshot);
        }
        result
    }

    /// Terminate ALL running instances of `executable_name` without showing any UI dialog.
    /// Returns the number of processes killed.
    pub fn kill_processes_only(executable_name: &str) -> u32 {
        use windows_sys::Win32::System::Threading::{
            OpenProcess, TerminateProcess, PROCESS_TERMINATE,
        };

        let target = std::path::Path::new(executable_name)
            .file_name()
            .map(|f| f.to_string_lossy().into_owned())
            .unwrap_or_else(|| executable_name.to_string())
            .to_lowercase();

        let mut killed = 0u32;
        for (pid, exe) in enumerate_processes() {
            if pid <= 4 || exe != target { continue; }
            unsafe {
                let handle = OpenProcess(PROCESS_TERMINATE, 0, pid);
                if !handle.is_null() && handle != INVALID_HANDLE_VALUE {
                    let ok = TerminateProcess(handle, 1);
                    CloseHandle(handle);
                    if ok != 0 {
                        killed += 1;
                        log::info!("[blocker] Terminated pid={} exe={}", pid, exe);
                    }
                }
            }
        }
        killed
    }

    /// Show the Win32 blocking dialog.
    pub fn show_blocked_notification(display_name: &str, is_focus_block: bool) {
        use windows_sys::Win32::UI::WindowsAndMessaging::{
            MessageBoxW, MB_OK, MB_ICONWARNING, MB_SYSTEMMODAL, MB_SETFOREGROUND,
        };

        let (title_str, message_str) = if is_focus_block {
            (
                "Clarity — Focus Session Active".to_string(),
                format!(
                    "{} is blocked during your Focus session.\n\nStay focused! You can end the session from the Focus Mode page when you're done.",
                    display_name
                ),
            )
        } else {
            (
                "Clarity — App Blocked".to_string(),
                format!(
                    "{} is blocked by Clarity.\n\nTo unblock it, open Clarity and remove the block rule from App Blocking.",
                    display_name
                ),
            )
        };

        let title_wide:   Vec<u16> = title_str.encode_utf16().chain(std::iter::once(0)).collect();
        let message_wide: Vec<u16> = message_str.encode_utf16().chain(std::iter::once(0)).collect();

        unsafe {
            MessageBoxW(
                std::ptr::null_mut(),
                message_wide.as_ptr(),
                title_wide.as_ptr(),
                MB_OK | MB_ICONWARNING | MB_SYSTEMMODAL | MB_SETFOREGROUND,
            );
        }
    }

    /// Kill ALL running instances of `executable_name`, then show ONE notification.
    /// Returns how many processes were killed.
    #[allow(dead_code)]
    pub fn kill_processes_by_name(executable_name: &str) -> u32 {
        kill_processes_by_name_with_display(executable_name, executable_name, false)
    }

    /// Same as above but uses a friendly display name in the notification.
    /// `is_focus_block` controls whether the message says "Focus session" or "App Blocking".
    pub fn kill_processes_by_name_with_display(executable_name: &str, display_name: &str, is_focus_block: bool) -> u32 {
        let killed = kill_processes_only(executable_name);
        if killed > 0 {
            show_blocked_notification(display_name, is_focus_block);
        }
        killed
    }

    /// Check whether any process matching `executable_name` is currently running.
    #[allow(dead_code)]
    pub fn is_process_running(executable_name: &str) -> bool {
        let target = executable_name.to_lowercase();
        enumerate_processes().iter().any(|(pid, exe)| *pid > 4 && exe == &target)
    }

    /// Retrieve the URL from the active browser tab using Windows UI Automation.    ///
    /// This works by:
    /// 1. Getting the foreground window handle (Chrome/Edge)
    /// 2. Creating a UIA element from that handle
    /// 3. Searching for the Edit control inside the ToolBar (the Omnibox / address bar)
    ///    This strictly ignores all web page input fields and search forms.
    /// 4. Reading its Value / LegacyIAccessible property (the current URL)
    ///
    /// Supports Chrome and Edge (Chromium-based — they share the same UIA tree).
    pub fn get_active_browser_url() -> Option<String> {
        use uiautomation::UIAutomation;
        use uiautomation::types::{TreeScope, UIProperty};
        use uiautomation::controls::ControlType;

        // 1. Create UIA instance
        let automation = match UIAutomation::new() {
            Ok(a) => a,
            Err(e) => {
                log::trace!("UIA init failed: {}", e);
                return None;
            }
        };

        // 2. Get the foreground window as a UIA element
        let hwnd = unsafe { GetForegroundWindow() };
        if hwnd.is_null() {
            return None;
        }

        let root = match automation.element_from_handle(uiautomation::types::Handle::from(hwnd as isize)) {
            Ok(el) => el,
            Err(e) => {
                log::trace!("UIA element_from_handle failed: {}", e);
                return None;
            }
        };

        let edit_condition = match automation.create_property_condition(
            UIProperty::ControlType,
            uiautomation::variants::Variant::from(ControlType::Edit as i32),
            None,
        ) {
            Ok(c) => c,
            Err(_) => return None,
        };

        // 3. Primary Strategy: Search inside ToolBar controls
        // In Chrome and Edge, the browser chrome navigation bar is a ToolBar.
        // Web pages and their inputs are in Document controls, NEVER in ToolBar!
        let toolbar_condition = match automation.create_property_condition(
            UIProperty::ControlType,
            uiautomation::variants::Variant::from(ControlType::ToolBar as i32),
            None,
        ) {
            Ok(c) => c,
            Err(_) => return None,
        };

        if let Ok(toolbars) = root.find_all(TreeScope::Descendants, &toolbar_condition) {
            for toolbar in toolbars {
                if let Ok(edits) = toolbar.find_all(TreeScope::Descendants, &edit_condition) {
                    for edit in edits {
                        if let Some(url) = extract_url_from_edit_element(&edit) {
                            log::debug!("UIA extracted address bar URL from ToolBar: {}", url);
                            return Some(url);
                        }
                    }
                }
            }
        }

        // 4. Secondary Strategy (Fallback): Search for specific Omnibox Edit control by exact Name / ClassName / AutomationId
        if let Ok(all_edits) = root.find_all(TreeScope::Descendants, &edit_condition) {
            for edit in all_edits {
                let name = edit.get_name().unwrap_or_default().to_lowercase();
                let class_name = edit.get_classname().unwrap_or_default();
                let auto_id = edit.get_automation_id().unwrap_or_default();

                let is_omnibox = class_name.contains("OmniboxViewViews")
                    || auto_id == "view_1020"
                    || name.contains("address and search bar")
                    || name.contains("search or enter web address")
                    || name.contains("address")
                    || name.contains("adresse")
                    || name.contains("dirección")
                    || name.contains("barre d'adresse");

                if is_omnibox {
                    if let Some(url) = extract_url_from_edit_element(&edit) {
                        log::debug!("UIA extracted address bar URL from named Omnibox: {}", url);
                        return Some(url);
                    }
                }
            }
        }

        log::trace!("UIA: no address bar found in foreground window");
        None
    }

    fn extract_url_from_edit_element(element: &uiautomation::core::UIElement) -> Option<String> {
        use uiautomation::types::UIProperty;

        // Try ValuePattern first
        let mut raw_val = if let Ok(val) = element.get_property_value(UIProperty::ValueValue) {
            val.get_string().unwrap_or_default()
        } else {
            String::new()
        };

        // If empty, try LegacyIAccessibleValue
        if raw_val.trim().is_empty() {
            if let Ok(val) = element.get_property_value(UIProperty::LegacyIAccessibleValue) {
                raw_val = val.get_string().unwrap_or_default();
            }
        }

        let trimmed = raw_val.trim();
        if trimmed.is_empty() {
            return None;
        }

        // Prepend https:// if it's just a domain for consistent parsing
        let normalized = if trimmed.contains("://") {
            trimmed.to_string()
        } else {
            format!("https://{}", trimmed)
        };

        Some(normalized)
    }
}

// ── Non-Windows stub (compile on all platforms so CI doesn't break) ─────────

#[cfg(not(target_os = "windows"))]
pub mod platform {
    #[derive(Debug, Clone)]
    pub struct ForegroundInfo {
        pub window_title: String,
        pub executable:   String,
        pub full_path:    String,
        pub pid:          u32,
    }

    pub fn get_foreground_app() -> Option<ForegroundInfo> { None }
    pub fn get_active_browser_url() -> Option<String> { None }
    pub fn enumerate_processes() -> Vec<(u32, String)> { vec![] }
    pub fn kill_processes_by_name(_exe: &str) -> u32 { 0 }
    pub fn is_process_running(_exe: &str) -> bool { false }
}
