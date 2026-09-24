// tracker/mod.rs
// Application usage tracker — state machine that runs in a background thread.
//
// State machine:
//   Idle  ──► Active(app_A, session_id, started_at)
//   Active ──► Active(app_B …)   when foreground changes
//   Active ──► Idle               when no foreground window
//
// Tick is called every 2 s from lib.rs.

mod windows_api;
pub(crate) use windows_api::platform;

use std::sync::{Arc, Mutex};
use std::collections::HashSet;
use anyhow::Result;
use chrono::Utc;
use crate::database::Database;
use windows_api::platform::get_foreground_app;

// ── App name clean-up helpers ────────────────────────────────────────────────

/// Map raw executable name → user-friendly display name.
pub(crate) fn friendly_name(exe: &str) -> String {
    let lower = exe.to_lowercase();
    match lower.as_str() {
        "code.exe"           => "Visual Studio Code".into(),
        "chrome.exe"         => "Google Chrome".into(),
        "firefox.exe"        => "Mozilla Firefox".into(),
        "msedge.exe"         => "Microsoft Edge".into(),
        "explorer.exe"       => "Windows Explorer".into(),
        "notepad.exe"        => "Notepad".into(),
        "notepad++.exe"      => "Notepad++".into(),
        "spotify.exe"        => "Spotify".into(),
        "discord.exe"        => "Discord".into(),
        "slack.exe"          => "Slack".into(),
        "teams.exe"          => "Microsoft Teams".into(),
        "winword.exe"        => "Microsoft Word".into(),
        "excel.exe"          => "Microsoft Excel".into(),
        "powerpnt.exe"       => "Microsoft PowerPoint".into(),
        "outlook.exe"        => "Microsoft Outlook".into(),
        "devenv.exe"         => "Visual Studio".into(),
        "rider64.exe"        => "JetBrains Rider".into(),
        "idea64.exe"         => "IntelliJ IDEA".into(),
        "clion64.exe"        => "CLion".into(),
        "pycharm64.exe"      => "PyCharm".into(),
        "webstorm64.exe"     => "WebStorm".into(),
        "figma.exe"          => "Figma".into(),
        "zoom.exe"           => "Zoom".into(),
        "vlc.exe"            => "VLC Media Player".into(),
        "telegram.exe"       => "Telegram".into(),
        "obsidian.exe"       => "Obsidian".into(),
        "notion.exe"         => "Notion".into(),
        "postman.exe"        => "Postman".into(),
        "dbeaver.exe"        => "DBeaver".into(),
        "windowsterminal.exe"=> "Windows Terminal".into(),
        "powershell.exe"     => "PowerShell".into(),
        "cmd.exe"            => "Command Prompt".into(),
        "wt.exe"             => "Windows Terminal".into(),
        _ => {
            let stem2 = std::path::Path::new(exe)
                .file_stem()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_else(|| exe.to_string());
            let mut chars = stem2.chars();
            match chars.next() {
                None    => String::new(),
                Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
            }
        }
    }
}

// ── Skip list — system processes we don't want to track ──────────────────────
//
// clarity-desktop.exe is intentionally included here: the app itself should
// not count toward the user's screen-time total.

fn should_skip(exe: &str) -> bool {
    let lower = exe.to_lowercase();
    // Clarity itself — never count Clarity app in user's screen time
    if lower.starts_with("clarity") || lower.contains("clarity") {
        return true;
    }
    matches!(lower.as_str(),
        // Windows shell & input infrastructure
        "textinputhost.exe"            |
        "searchui.exe"                 |
        "searchapp.exe"                |
        "shellexperiencehost.exe"      |
        "startmenuexperiencehost.exe"  |
        "lockapp.exe"                  |
        "logonui.exe"                  |
        "dwm.exe"                      |
        "systemsettings.exe"           |
        "applicationframehost.exe"
    )
}

/// Parse and normalize domain name from URL, stripping www. and local/internal addresses.
fn extract_domain(url: &str) -> Option<String> {
    let mut s = url.trim();
    if s.is_empty() {
        return None;
    }

    // Skip browser-internal and local file schemes
    if s.starts_with("chrome://")
        || s.starts_with("edge://")
        || s.starts_with("about:")
        || s.starts_with("file://")
        || s.starts_with("data:")
        || s.starts_with("blob:")
    {
        return None;
    }

    // Strip scheme
    if let Some(pos) = s.find("://") {
        s = &s[pos + 3..];
    }

    // Find end of host (stop at first /, ?, #, or port colon)
    let end = s.find(|c: char| c == '/' || c == '?' || c == '#' || c == ':')
               .unwrap_or(s.len());

    let mut domain = s[..end].to_lowercase();

    // Strip leading www.
    if domain.starts_with("www.") {
        domain = domain[4..].to_string();
    }

    // Reject localhost and loopback
    if domain == "localhost" || domain == "127.0.0.1" || domain == "::1" {
        return None;
    }

    // Reject Windows drive letters like "d:", "c:", etc.
    // A valid domain must contain a dot and no backslashes or percent-only hosts.
    if domain.is_empty()
        || (domain.len() == 2 && domain.ends_with(':'))   // e.g. "d:"
        || domain.contains('\\')
        || !domain.contains('.')                           // bare word / drive letter
        || domain.contains(' ')                            // search text leaked through
    {
        return None;
    }

    // Reject raw IPv4 addresses (only digits and dots) — not useful for domain tracking
    if domain.chars().all(|c| c.is_ascii_digit() || c == '.') {
        return None;
    }

    Some(domain)
}

// ── Session state ─────────────────────────────────────────────────────────────

#[derive(Debug)]
struct ActiveSession {
    session_id:     i64,
    application_id: i64,
    executable:     String,
    started_at:     chrono::DateTime<Utc>,
}

#[derive(Debug)]
struct ActiveWebsiteSession {
    session_id: i64,
    website_id: i64,
    domain:     String,
    started_at: chrono::DateTime<Utc>,
}

// ── Tracker ───────────────────────────────────────────────────────────────────

pub struct AppTracker {
    db:                     Arc<Mutex<Database>>,
    active_session:         Option<ActiveSession>,
    active_website_session: Option<ActiveWebsiteSession>,
    last_exe:               Option<String>,
    last_domain:            Option<String>,
    /// (exe_lowercase, display_name, is_focus_block) for enabled blocked apps.
    blocked_exe_cache:      Vec<(String, String, bool)>,
    block_cache_tick:       u32,
    /// Executables currently showing a "blocked" notification dialog.
    /// Prevents spawning multiple dialogs for the same app across ticks.
    notifying:              Arc<Mutex<HashSet<String>>>,
}

/// How many ticks between refreshes of the blocked-app cache (~20 seconds).
const BLOCK_CACHE_INTERVAL_TICKS: u32 = 10;

impl AppTracker {
    pub fn new(db: Arc<Mutex<Database>>) -> Self {
        AppTracker {
            db,
            active_session:         None,
            active_website_session: None,
            last_exe:               None,
            last_domain:            None,
            blocked_exe_cache:      Vec::new(),
            block_cache_tick:       0,
            notifying:              Arc::new(Mutex::new(HashSet::new())),
        }
    }

    /// Force-refresh the in-memory blocked-app cache from the database.
    /// Called by the blocking commands when a rule is added/removed/toggled.
    pub fn refresh_block_cache(&mut self) {
        let db = self.db.lock().unwrap();
        self.blocked_exe_cache = db.get_enabled_blocked_executables();
        self.block_cache_tick = 0;
        log::debug!("[blocker] Cache refreshed: {} entries", self.blocked_exe_cache.len());
    }

    /// Whether usage tracking is enabled (Privacy → data collection).
    /// Defaults to true when the setting is absent.
    fn tracking_enabled(&self) -> bool {
        let db = self.db.lock().unwrap();
        match db.get_setting("privacy.data_collection") {
            Some(v) => v == "true" || v == "1",
            None    => true,
        }
    }

    /// Called every 2 s from the background thread.
    pub fn tick(&mut self) -> Result<()> {
        // ─────────────────────────────────────────────────
        // 0. App Blocking — enumerate processes and kill any that are blocked.
        //    We do this BEFORE the tracking logic so that blocked apps are never
        //    recorded as usage.
        // ─────────────────────────────────────────────────
        self.block_cache_tick += 1;
        if self.block_cache_tick >= BLOCK_CACHE_INTERVAL_TICKS || self.blocked_exe_cache.is_empty() {
            let db = self.db.lock().unwrap();
            self.blocked_exe_cache = db.get_enabled_blocked_executables();
            self.block_cache_tick = 0;
        }

        if !self.blocked_exe_cache.is_empty() {
            for (blocked_exe, display_name, is_focus_block) in &self.blocked_exe_cache.clone() {
                // 1. Unconditionally terminate any running instance of the blocked app
                let killed = platform::kill_processes_only(blocked_exe);
                if killed > 0 {
                    log::info!("[blocker] Terminated {} instance(s) of {}", killed, blocked_exe);

                    // 2. Show notification dialog only if one isn't already active for this exe
                    let mut notifying = self.notifying.lock().unwrap();
                    if !notifying.contains(blocked_exe) {
                        notifying.insert(blocked_exe.clone());

                        let exe_clone     = blocked_exe.clone();
                        let name_clone    = display_name.clone();
                        let focus_clone   = *is_focus_block;
                        let notifying_ref = Arc::clone(&self.notifying);

                        std::thread::spawn(move || {
                            platform::show_blocked_notification(&name_clone, focus_clone);
                            let mut notif = notifying_ref.lock().unwrap();
                            notif.remove(&exe_clone);
                        });
                    }
                }
            }
        }
        // ─────────────────────────────────────────────
        // 0.5. Data-collection gate (Privacy → data collection) — when
        //      disabled we close any open sessions and stop recording,
        //      but app blocking keeps working.
        // ─────────────────────────────────────────────
        if !self.tracking_enabled() {
            let now     = Utc::now();
            let now_str = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

            if let Some(session) = self.active_session.take() {
                let duration = (now - session.started_at).num_seconds().max(0);
                let db = self.db.lock().unwrap();
                if duration >= 1 {
                    db.end_session(session.session_id, &now_str, duration)?;
                    log::debug!("Closed app session (tracking disabled): {}", session.executable);
                } else {
                    db.delete_session(session.session_id)?;
                }
            }

            if let Some(session) = self.active_website_session.take() {
                let duration = (now - session.started_at).num_seconds().max(0);
                let db = self.db.lock().unwrap();
                if duration >= 1 {
                    db.end_website_session(session.session_id, &now_str, duration)?;
                    log::debug!("Closed website session (tracking disabled): {}", session.domain);
                } else {
                    db.delete_website_session(session.session_id)?;
                }
            }

            self.last_exe    = None;
            self.last_domain = None;
            return Ok(());
        }

        let foreground = get_foreground_app();

        let current_exe = foreground
            .as_ref()
            .map(|f| f.executable.to_lowercase());

        let now     = Utc::now();
        let now_str = now.format("%Y-%m-%dT%H:%M:%SZ").to_string();

        // ─────────────────────────────────────────────────────────────
        // 1. Application Tracking Lifecycle
        // ─────────────────────────────────────────────────────────────
        if current_exe == self.last_exe && self.active_session.is_some() {
            let session = self.active_session.as_ref().unwrap();
            let current_local_date = chrono::Local::now().format("%Y-%m-%d").to_string();
            let session_local_date = session.started_at.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();

            if current_local_date != session_local_date {
                // Day boundary crossed while inside the same app
                if let Some(old_session) = self.active_session.take() {
                    let duration = (now - old_session.started_at).num_seconds().max(0);
                    let db = self.db.lock().unwrap();
                    if duration >= 1 {
                        db.end_session(old_session.session_id, &now_str, duration)?;
                    } else {
                        db.delete_session(old_session.session_id)?;
                    }

                    // Start new session for the new day
                    let session_id = db.start_session(old_session.application_id, &now_str)?;
                    drop(db);

                    self.active_session = Some(ActiveSession {
                        session_id,
                        application_id: old_session.application_id,
                        executable: old_session.executable,
                        started_at: now,
                    });
                }
            }
        } else if current_exe != self.last_exe {
            // Close previous session
            if let Some(session) = self.active_session.take() {
                let duration = (now - session.started_at).num_seconds().max(0);
                let db = self.db.lock().unwrap();
                if duration >= 1 {
                    db.end_session(session.session_id, &now_str, duration)?;
                    log::debug!("Closed session: {} — {}s", session.executable, duration);
                } else {
                    db.delete_session(session.session_id)?;
                }
            }

            // Open new session
            self.last_exe = current_exe.clone();

            if let Some(ref info) = foreground {
                if !should_skip(&info.executable) {
                    let name = friendly_name(&info.executable);
                    let db   = self.db.lock().unwrap();

                    let app_id     = db.upsert_application(&name, &info.executable.to_lowercase())?;
                    let session_id = db.start_session(app_id, &now_str)?;

                    drop(db);

                    self.active_session = Some(ActiveSession {
                        session_id,
                        application_id: app_id,
                        executable:     info.executable.to_lowercase(),
                        started_at:     now,
                    });

                    log::debug!("Opened session: {} ({})", name, info.executable);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────
        // 2. Website Tracking Lifecycle
        // ─────────────────────────────────────────────────────────────
        let is_browser = current_exe.as_ref().map(|exe| {
            matches!(exe.as_str(), "chrome.exe" | "msedge.exe")
        }).unwrap_or(false);

        let mut current_domain = None;
        if is_browser {
            log::debug!("Browser detected: {}", current_exe.as_deref().unwrap_or("?"));
            match windows_api::platform::get_active_browser_url() {
                Some(url) => {
                    log::info!("UIA extracted URL: {}", url);
                    current_domain = extract_domain(&url);
                    log::info!("Normalized domain: {:?}", current_domain);
                }
                None => {
                    log::debug!("UIA: no URL extracted from browser window");
                }
            }
        }

        if current_domain == self.last_domain && self.active_website_session.is_some() {
            let session = self.active_website_session.as_ref().unwrap();
            let current_local_date = chrono::Local::now().format("%Y-%m-%d").to_string();
            let session_local_date = session.started_at.with_timezone(&chrono::Local).format("%Y-%m-%d").to_string();

            if current_local_date != session_local_date {
                // Day boundary crossed while inside the same website
                if let Some(old_session) = self.active_website_session.take() {
                    let duration = (now - old_session.started_at).num_seconds().max(0);
                    let db = self.db.lock().unwrap();
                    if duration >= 1 {
                        db.end_website_session(old_session.session_id, &now_str, duration)?;
                    } else {
                        db.delete_website_session(old_session.session_id)?;
                    }

                    // Start new session for the new day
                    let session_id = db.start_website_session(old_session.website_id, &now_str)?;
                    drop(db);

                    self.active_website_session = Some(ActiveWebsiteSession {
                        session_id,
                        website_id: old_session.website_id,
                        domain:     old_session.domain,
                        started_at: now,
                    });
                }
            }
        } else if current_domain != self.last_domain {
            // Close previous website session
            if let Some(session) = self.active_website_session.take() {
                let duration = (now - session.started_at).num_seconds().max(0);
                let db = self.db.lock().unwrap();
                if duration >= 1 {
                    db.end_website_session(session.session_id, &now_str, duration)?;
                    log::debug!("Closed website session: {} — {}s", session.domain, duration);
                } else {
                    db.delete_website_session(session.session_id)?;
                }
            }

            // Open new website session
            self.last_domain = current_domain.clone();

            if let Some(domain) = current_domain {
                let db = self.db.lock().unwrap();
                let website_id = db.upsert_website(&domain)?;
                let session_id = db.start_website_session(website_id, &now_str)?;
                drop(db);

                self.active_website_session = Some(ActiveWebsiteSession {
                    session_id,
                    website_id,
                    domain,
                    started_at: now,
                });

                log::debug!("Opened website session: {}", self.last_domain.as_deref().unwrap_or(""));
            }
        }

        Ok(())
    }

    /// Return the name of the currently active application, if any.
    pub fn current_app(&self) -> Option<String> {
        self.active_session.as_ref().map(|s| friendly_name(&s.executable))
    }

    /// Return elapsed seconds of the current open session (for live totals).
    pub fn active_session_elapsed(&self) -> Option<(i64, i64)> {
        self.active_session.as_ref().map(|s| {
            let elapsed = (Utc::now() - s.started_at).num_seconds().max(0);
            (s.application_id, elapsed)
        })
    }

    /// Return elapsed seconds of the current open website session (for live totals).
    pub fn active_website_session_elapsed(&self) -> Option<(i64, i64)> {
        self.active_website_session.as_ref().map(|s| {
            let elapsed = (Utc::now() - s.started_at).num_seconds().max(0);
            (s.website_id, elapsed)
        })
    }
}
