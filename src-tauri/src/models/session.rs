// models/session.rs — one foreground usage session for a single application.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSession {
    pub id:               i64,
    pub application_id:   i64,
    pub app_name:         String,
    pub executable_name:  String,
    pub started_at:       String,  // ISO-8601 UTC
    pub ended_at:         Option<String>,
    pub duration_seconds: i64,
}
