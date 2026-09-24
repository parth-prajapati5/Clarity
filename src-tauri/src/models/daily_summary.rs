// models/daily_summary.rs — aggregated totals for a calendar date.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailySummary {
    pub date:            String,   // "YYYY-MM-DD"
    pub total_seconds:   i64,
    pub active_apps:     i64,
    pub session_count:   i64,
}
