// main.rs — Tauri entry point (thin shell, real logic is in lib.rs)
// Prevents a console window appearing on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    clarity_desktop_lib::run();
}
