// models/mod.rs — public data structures shared across the backend.

pub mod app_record;
pub mod session;
pub mod daily_summary;
pub mod usage_response;
pub mod website;

#[allow(unused_imports)]
pub use app_record::AppRecord;
pub use session::AppSession;
#[allow(unused_imports)]
pub use daily_summary::DailySummary;
pub use usage_response::{AppUsageResponse, DayUsageResponse, SummaryStats, HourUsage};
pub use website::{WebsiteUsageResponse, WebsiteSession, WebsiteSummaryStats, BlockedApp, FocusSession};
