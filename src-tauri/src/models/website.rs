// models/website.rs — JSON-serializable website response types for IPC commands.

use serde::{Deserialize, Serialize};

/// Per-website usage totals for a given period.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteUsageResponse {
    pub domain:           String,
    pub duration_seconds: i64,
    pub session_count:    i64,
    pub last_used:        Option<String>,
}

/// One browsing session on a single website.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteSession {
    pub id:               i64,
    pub website_id:       i64,
    pub domain:           String,
    pub started_at:       String,
    pub ended_at:         Option<String>,
    pub duration_seconds: i64,
}

/// Summary stats for websites.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebsiteSummaryStats {
    pub today_seconds:     i64,
    pub week_seconds:      i64,
    pub active_today:      i64,
    pub avg_daily_seconds: i64,
    pub total_websites:    i64,
}

/// An application the user has chosen to block.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BlockedApp {
    pub id:              i64,
    pub executable_name: String,
    pub display_name:    String,
    pub enabled:         bool,
    pub created_at:      String,
    pub updated_at:      String,
}

/// A focus session record.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FocusSession {
    pub id:              i64,
    pub name:            String,
    pub goal:            String,
    pub total_seconds:   i64,
    pub elapsed_seconds: i64,
    pub status:          String, // "active" | "paused" | "completed" | "abandoned"
    pub blocked_apps:    String, // JSON array of executable names
    pub started_at:      String,
    pub ended_at:        Option<String>,
    pub created_at:      String,
}
