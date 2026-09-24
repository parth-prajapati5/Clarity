// lib.rs — application root, wires all modules together.

mod commands;
mod database;
pub mod icons;
mod models;
mod tracker;
mod utils;

use std::sync::{Arc, Mutex};
use tauri::{
    Manager,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    WindowEvent,
};

use database::Database;
use icons::IconService;
use tracker::AppTracker;

/// Shared application state injected into all Tauri commands.
pub struct AppState {
    pub db:      Arc<Mutex<Database>>,
    pub tracker: Arc<Mutex<AppTracker>>,
    pub icons:   Arc<IconService>,
}

/// Called from main.rs — builds and runs the Tauri application.
pub fn run() {
    env_logger::Builder::from_env(
        env_logger::Env::default().default_filter_or("info"),
    )
    .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // ── 1. Resolve data directory ─────────────────
            let data_dir = app
                .path()
                .app_data_dir()
                .expect("could not resolve app data dir");
            std::fs::create_dir_all(&data_dir)
                .expect("could not create app data dir");

            // ── 2. Open / migrate database ────────────────
            let db_path = data_dir.join("clarity.db");
            log::info!("Database path: {:?}", db_path);

            let db = Database::open(&db_path)
                .expect("failed to open database");
            db.run_migrations()
                .expect("failed to run database migrations");

            let db_arc = Arc::new(Mutex::new(db));

            // ── 3. Create icon service ───────────────────
            let icons = Arc::new(IconService::new(data_dir.join("icons")));

            // ── 4. Create tracker ─────────────────────────
            let tracker = AppTracker::new(Arc::clone(&db_arc));
            let tracker_arc = Arc::new(Mutex::new(tracker));

            // ── 5. Register state ─────────────────────────
            app.manage(AppState {
                db:      Arc::clone(&db_arc),
                tracker: Arc::clone(&tracker_arc),
                icons:   Arc::clone(&icons),
            });

            // ── 6. Start background tracking thread ───────
            {
                let tracker_bg = Arc::clone(&tracker_arc);
                std::thread::spawn(move || {
                    log::info!("Tracking thread started");
                    loop {
                        {
                            let mut t = tracker_bg.lock().unwrap();
                            if let Err(e) = t.tick() {
                                log::warn!("Tracker tick error: {}", e);
                            }
                        }
                        std::thread::sleep(std::time::Duration::from_secs(1));
                    }
                });
            }

            log::info!("Clarity backend started");

            // ── 7. Tray icon — powers "minimize to tray" ────────
            let show_item = MenuItem::with_id(app, "show", "Show Clarity", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            let mut tray = TrayIconBuilder::with_id("main-tray");
            if let Some(icon) = app.default_window_icon().cloned() {
                tray = tray.icon(icon);
            }
            let _tray = tray
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.unminimize();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => app.exit(0),
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // "Minimize to tray" — hide the window instead of quitting.
                let minimize_to_tray = {
                    let db_arc = window
                        .app_handle()
                        .try_state::<AppState>()
                        .map(|s| s.db.clone());
                    match db_arc {
                        Some(arc) => arc
                            .lock()
                            .ok()
                            .and_then(|db| db.get_setting("general.minimize_to_tray"))
                            .map(|v| v == "true")
                            .unwrap_or(true),
                        None => true,
                    }
                };

                if minimize_to_tray {
                    api.prevent_close();
                    let _ = window.hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // ── Usage tracking ────────────────────────────
            commands::usage::get_today_usage,
            commands::usage::get_application_usage,
            commands::usage::get_usage_for_date,
            commands::usage::get_weekly_usage,
            commands::usage::get_daily_usage,
            commands::usage::get_hourly_usage,
            commands::usage::get_application_sessions,
            commands::usage::get_current_app,
            commands::usage::get_summary_stats,
            commands::usage::get_today_website_usage,
            commands::usage::get_weekly_website_usage,
            commands::usage::get_website_summary_stats,
            commands::usage::get_website_sessions,
            commands::usage::debug_website_tracking,
            // ── App icons ─────────────────────────────────
            commands::usage::get_app_icon,
            commands::usage::get_app_icons,
            // ── App blocking ──────────────────────────────
            commands::blocking::get_tracked_applications,
            commands::blocking::get_blocked_apps,
            commands::blocking::add_blocked_app,
            commands::blocking::remove_blocked_app,
            commands::blocking::set_app_block_enabled,
            // ── Premium state ─────────────────────────────
            commands::blocking::is_pro_user,
            commands::blocking::dev_set_pro,
            // ── Focus Mode ────────────────────────────────
            commands::focus::get_active_focus_session,
            commands::focus::get_focus_history,
            commands::focus::start_focus_session,
            commands::focus::pause_focus_session,
            commands::focus::resume_focus_session,
            commands::focus::end_focus_session,
            commands::focus::update_focus_elapsed,
            // ── Settings ──────────────────────────────────
            commands::settings::get_settings,
            commands::settings::save_setting,
            commands::settings::get_app_version,
            commands::settings::export_usage_data,
            commands::settings::delete_all_data,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
