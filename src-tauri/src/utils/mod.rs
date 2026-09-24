// utils/mod.rs — shared utility functions.

/// Format a duration in seconds to a human-readable string like "2h 15m" or "45m".
/// Useful for log messages and debug output in Rust code.
#[allow(dead_code)]
pub fn format_duration(seconds: i64) -> String {
    let h = seconds / 3600;
    let m = (seconds % 3600) / 60;
    let s = seconds % 60;
    if h > 0 {
        if m > 0 {
            format!("{}h {}m", h, m)
        } else {
            format!("{}h", h)
        }
    } else if m > 0 {
        format!("{}m {}s", m, s)
    } else {
        format!("{}s", s)
    }
}
