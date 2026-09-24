// models/app_record.rs — an installed / seen application.

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppRecord {
    pub id:              i64,
    pub name:            String,
    pub executable_name: String,
    pub created_at:      String,
}
