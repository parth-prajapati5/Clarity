// models/usage_response.rs — JSON-serializable response types for IPC commands.

use serde::{Deserialize, Serialize};

/// Per-application usage totals for a given period.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppUsageResponse {
    pub application:      String,
    pub executable_name:  String,
    pub duration_seconds: i64,
    pub session_count:    i64,
    pub last_used:        Option<String>,
    pub icon:             Option<String>,
}

/// Screen-time total for a single calendar day.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DayUsageResponse {
    pub date:             String,  // "YYYY-MM-DD"
    pub total_seconds:    i64,
    pub active_apps:      i64,
    pub session_count:    i64,
}

/// High-level summary stats shown on the dashboard.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SummaryStats {
    pub today_seconds:      i64,
    pub week_seconds:       i64,
    pub active_today:       i64,   // distinct apps used today
    pub avg_daily_seconds:  i64,   // 7-day rolling average
}

/// Per-hour screen-time total for a single local calendar day.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HourUsage {
    pub date:          String,  // "YYYY-MM-DD"
    pub hour:          i64,     // 0-23 in local time
    pub total_seconds: i64,
}
