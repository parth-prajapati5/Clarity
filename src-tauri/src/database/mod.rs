// database/mod.rs â€” SQLite connection wrapper, migrations, and queries.
//
// DATE HANDLING STRATEGY
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// All timestamps are stored in UTC ISO-8601 ("YYYY-MM-DDTHH:MM:SSZ").
// All queries that filter by "today" or "a specific date" accept a
// YYYY-MM-DD string from the caller.  Commands that need "today" receive
// the local date from the frontend so the user always sees their own
// calendar day â€” not a UTC day that may differ by 1 at midnight.
//
// ACTIVE-SESSION INCLUSION
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// The currently-running session has duration_seconds = 0 in the DB
// (it is updated only when the session ends).  To avoid under-reporting,
// the tracker passes its live elapsed time into the query layer via the
// `active_elapsed` parameter.  Queries add that elapsed time to the
// matching application's total before returning, and also include it in
// the summary total.  This means the dashboard shows real-time totals
// that grow every few seconds without any double-counting.

use std::path::Path;
use anyhow::{Context, Result};
use rusqlite::{Connection, params};
use crate::models::{
    AppUsageResponse, DayUsageResponse, SummaryStats, AppSession,
    WebsiteUsageResponse, WebsiteSession, WebsiteSummaryStats, HourUsage,
};

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Connection wrapper
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

pub struct Database {
    conn: Connection,
}

impl Database {
    /// Open (or create) the SQLite database at `path`.
    pub fn open(path: &Path) -> Result<Self> {
        let conn = Connection::open(path)
            .with_context(|| format!("opening database at {:?}", path))?;

        // WAL gives better concurrent read performance; foreign keys for integrity
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
            .context("setting PRAGMA options")?;

        Ok(Database { conn })
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Migrations
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn run_migrations(&self) -> Result<()> {
        self.conn.execute_batch(SCHEMA_V1)
            .context("running schema migration v1")?;
        log::info!("Database migrations complete");
        Ok(())
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Application registry
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Return existing app_id, or insert and return new id.
    pub fn upsert_application(&self, name: &str, executable: &str) -> Result<i64> {
        let existing: Result<i64, _> = self.conn.query_row(
            "SELECT id FROM applications WHERE executable_name = ?1",
            params![executable],
            |row| row.get(0),
        );

        if let Ok(id) = existing {
            return Ok(id);
        }

        self.conn.execute(
            "INSERT INTO applications (name, executable_name) VALUES (?1, ?2)",
            params![name, executable],
        ).context("inserting application")?;

        Ok(self.conn.last_insert_rowid())
    }

    /// Return existing website_id, or insert and return new id.
    pub fn upsert_website(&self, domain: &str) -> Result<i64> {
        let existing: Result<i64, _> = self.conn.query_row(
            "SELECT id FROM websites WHERE domain = ?1",
            params![domain],
            |row| row.get(0),
        );

        if let Ok(id) = existing {
            return Ok(id);
        }

        self.conn.execute(
            "INSERT INTO websites (domain) VALUES (?1)",
            params![domain],
        ).context("inserting website")?;

        Ok(self.conn.last_insert_rowid())
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Session lifecycle
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Open a new session record (duration stays 0 until session ends).
    pub fn start_session(&self, application_id: i64, started_at: &str) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO application_sessions
               (application_id, started_at, ended_at, duration_seconds)
             VALUES (?1, ?2, NULL, 0)",
            params![application_id, started_at],
        ).context("inserting session")?;
        Ok(self.conn.last_insert_rowid())
    }

    /// Close an open session: write end time and computed duration.
    pub fn end_session(&self, session_id: i64, ended_at: &str, duration_seconds: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE application_sessions
             SET ended_at = ?1, duration_seconds = ?2
             WHERE id = ?3",
            params![ended_at, duration_seconds, session_id],
        ).context("closing session")?;
        Ok(())
    }

    /// Delete a session row â€” used to remove sub-1s placeholder rows.
    pub fn delete_session(&self, session_id: i64) -> Result<()> {
        self.conn.execute(
            "DELETE FROM application_sessions WHERE id = ?1",
            params![session_id],
        ).context("deleting session")?;
        Ok(())
    }

    /// Open a new website session record (duration stays 0 until session ends).
    pub fn start_website_session(&self, website_id: i64, started_at: &str) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO website_sessions
               (website_id, started_at, ended_at, duration_seconds)
             VALUES (?1, ?2, NULL, 0)",
            params![website_id, started_at],
        ).context("inserting website session")?;
        Ok(self.conn.last_insert_rowid())
    }

    /// End a website session, updating the ended_at timestamp and duration.
    pub fn end_website_session(&self, session_id: i64, ended_at: &str, duration_seconds: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE website_sessions
              SET ended_at = ?1, duration_seconds = ?2
              WHERE id = ?3",
            params![ended_at, duration_seconds, session_id],
        ).context("closing website session")?;
        Ok(())
    }

    /// Delete a website session row â€” used to remove sub-1s placeholder rows.
    pub fn delete_website_session(&self, session_id: i64) -> Result<()> {
        self.conn.execute(
            "DELETE FROM website_sessions WHERE id = ?1",
            params![session_id],
        ).context("deleting website session")?;
        Ok(())
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Query: today's per-app usage totals
    //
    // Parameters
    //   today          â€” local YYYY-MM-DD for "today"
    //   active_elapsed â€” Option<(application_id, elapsed_seconds)>
    //                    for the currently-running session that has not
    //                    yet been written to the DB.  Added to the
    //                    matching app's total so the dashboard reflects
    //                    live usage without waiting for a session close.
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_today_usage(
        &self,
        today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<Vec<AppUsageResponse>> {
        // Fetch all COMPLETED sessions for today (duration_seconds > 0) using local date
        let mut stmt = self.conn.prepare(
            "SELECT
                a.id,
                a.name,
                a.executable_name,
                COALESCE(SUM(s.duration_seconds), 0) AS total_sec,
                COUNT(s.id)                          AS sessions,
                MAX(s.started_at)                    AS last_used
             FROM applications a
             JOIN application_sessions s ON s.application_id = a.id
             WHERE DATE(s.started_at, 'localtime') = ?1
               AND s.duration_seconds > 0
             GROUP BY a.id
             ORDER BY total_sec DESC",
        )?;

        let mut rows: Vec<(i64, AppUsageResponse)> = stmt
            .query_map(params![today], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    AppUsageResponse {
                        application:      row.get(1)?,
                        executable_name:  row.get(2)?,
                        duration_seconds: row.get(3)?,
                        session_count:    row.get(4)?,
                        last_used:        row.get(5)?,
                        icon:             None,
                    },
                ))
            })?
            .collect::<Result<Vec<_>, _>>()
            .context("querying today's usage")?;

        // Add live elapsed time for the currently-running session
        if let Some((active_app_id, elapsed)) = active_elapsed {
            if elapsed > 0 {
                if let Some(entry) = rows.iter_mut().find(|(id, _)| *id == active_app_id) {
                    entry.1.duration_seconds += elapsed;
                } else {
                    // App not yet in today's results (first session of the day)
                    // Look up its name so we can include it
                    let app_info: Result<(String, String), _> = self.conn.query_row(
                        "SELECT name, executable_name FROM applications WHERE id = ?1",
                        params![active_app_id],
                        |row| Ok((row.get(0)?, row.get(1)?)),
                    );
                    if let Ok((name, exe)) = app_info {
                        rows.push((
                            active_app_id,
                            AppUsageResponse {
                                application:      name,
                                executable_name:  exe,
                                duration_seconds: elapsed,
                                session_count:    1,
                                last_used:        None,
                                icon:             None,
                            },
                        ));
                    }
                }
            }
        }

        // Re-sort after live injection and strip the app_id
        rows.sort_by(|a, b| b.1.duration_seconds.cmp(&a.1.duration_seconds));
        Ok(rows.into_iter().map(|(_, r)| r).collect())
    }

    /// Return website usage totals for the specified local date.
    pub fn get_today_website_usage(
        &self,
        today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<Vec<WebsiteUsageResponse>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                w.id,
                w.domain,
                COALESCE(SUM(s.duration_seconds), 0) AS total_sec,
                COUNT(s.id)                          AS sessions,
                MAX(s.started_at)                    AS last_used
             FROM websites w
             JOIN website_sessions s ON s.website_id = w.id
             WHERE DATE(s.started_at, 'localtime') = ?1
               AND s.duration_seconds > 0
             GROUP BY w.id
             ORDER BY total_sec DESC",
        )?;

        let mut rows: Vec<(i64, WebsiteUsageResponse)> = stmt
            .query_map(params![today], |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    WebsiteUsageResponse {
                        domain:           row.get(1)?,
                        duration_seconds: row.get(2)?,
                        session_count:    row.get(3)?,
                        last_used:        row.get(4)?,
                    },
                ))
            })?
            .collect::<Result<Vec<_>, _>>()
            .context("querying today's website usage")?;

        // Add live elapsed time for active session
        if let Some((active_site_id, elapsed)) = active_elapsed {
            if elapsed > 0 {
                if let Some(entry) = rows.iter_mut().find(|(id, _)| *id == active_site_id) {
                    entry.1.duration_seconds += elapsed;
                } else {
                    let domain: Result<String, _> = self.conn.query_row(
                        "SELECT domain FROM websites WHERE id = ?1",
                        params![active_site_id],
                        |row| row.get(0),
                    );
                    if let Ok(dom) = domain {
                        rows.push((
                            active_site_id,
                            WebsiteUsageResponse {
                                domain:           dom,
                                duration_seconds: elapsed,
                                session_count:    1,
                                last_used:        None,
                            },
                        ));
                    }
                }
            }
        }

        rows.sort_by(|a, b| b.1.duration_seconds.cmp(&a.1.duration_seconds));
        Ok(rows.into_iter().map(|(_, r)| r).collect())
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Query: usage for a specific local date (no active session)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_usage_for_date(&self, date: &str) -> Result<Vec<AppUsageResponse>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                a.name,
                a.executable_name,
                COALESCE(SUM(s.duration_seconds), 0) AS total_sec,
                COUNT(s.id),
                MAX(s.started_at)
             FROM applications a
             JOIN application_sessions s ON s.application_id = a.id
             WHERE DATE(s.started_at, 'localtime') = ?1
               AND s.duration_seconds > 0
             GROUP BY a.id
             ORDER BY total_sec DESC",
        )?;

        let rows = stmt.query_map(params![date], |row| {
            Ok(AppUsageResponse {
                application:      row.get(0)?,
                executable_name:  row.get(1)?,
                duration_seconds: row.get(2)?,
                session_count:    row.get(3)?,
                last_used:        row.get(4)?,
                icon:             None,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>()
            .context("querying usage for date")
     }

     pub fn get_website_usage_for_date(&self, date: &str) -> Result<Vec<WebsiteUsageResponse>> {
         let mut stmt = self.conn.prepare(
             "SELECT
                 w.domain,
                 COALESCE(SUM(s.duration_seconds), 0) AS total_sec,
                 COUNT(s.id),
                 MAX(s.started_at)
              FROM websites w
              JOIN website_sessions s ON s.website_id = w.id
              WHERE DATE(s.started_at, 'localtime') = ?1
                AND s.duration_seconds > 0
              GROUP BY w.id
              ORDER BY total_sec DESC",
         )?;

         let rows = stmt.query_map(params![date], |row| {
             Ok(WebsiteUsageResponse {
                 domain:           row.get(0)?,
                 duration_seconds: row.get(1)?,
                 session_count:    row.get(2)?,
                 last_used:        row.get(3)?,
             })
         })?;

         rows.collect::<Result<Vec<_>, _>>()
             .context("querying website usage for date")
     }

     // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     // Query: weekly usage (last 7 local days, one row per day)
    //
    // Uses a 7-day window ending at local today (passed in).
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_weekly_usage(
        &self,
        local_today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<Vec<DayUsageResponse>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                DATE(s.started_at, 'localtime') AS day,
                COALESCE(SUM(s.duration_seconds), 0),
                COUNT(DISTINCT s.application_id),
                COUNT(s.id)
             FROM application_sessions s
             WHERE DATE(s.started_at, 'localtime') >= DATE(?1, '-6 days')
               AND DATE(s.started_at, 'localtime') <= ?1
               AND s.duration_seconds > 0
             GROUP BY day
             ORDER BY day ASC",
        )?;

        let mut rows: Vec<DayUsageResponse> = stmt.query_map(params![local_today], |row| {
            Ok(DayUsageResponse {
                date:          row.get(0)?,
                total_seconds: row.get(1)?,
                active_apps:   row.get(2)?,
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .context("querying weekly usage")?;

        // Add live elapsed time to today's entry if present
        if let Some((_, elapsed)) = active_elapsed {
            if elapsed > 0 {
                if let Some(today_entry) = rows.iter_mut().find(|r| r.date == local_today) {
                    today_entry.total_seconds += elapsed;
                } else {
                    rows.push(DayUsageResponse {
                        date:          local_today.to_string(),
                        total_seconds: elapsed,
                        active_apps:   1,
                        session_count: 1,
                    });
                }
            }
        }

        Ok(rows)
    }

    /// Return weekly website usage (last 7 local days, one row per day)
    pub fn get_weekly_website_usage(
        &self,
        local_today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<Vec<DayUsageResponse>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                DATE(s.started_at, 'localtime') AS day,
                COALESCE(SUM(s.duration_seconds), 0),
                COUNT(DISTINCT s.website_id),
                COUNT(s.id)
             FROM website_sessions s
             WHERE DATE(s.started_at, 'localtime') >= DATE(?1, '-6 days')
               AND DATE(s.started_at, 'localtime') <= ?1
               AND s.duration_seconds > 0
             GROUP BY day
             ORDER BY day ASC",
        )?;

        let mut rows: Vec<DayUsageResponse> = stmt.query_map(params![local_today], |row| {
            Ok(DayUsageResponse {
                date:          row.get(0)?,
                total_seconds: row.get(1)?,
                active_apps:   row.get(2)?, // mapped to active websites count
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .context("querying weekly website usage")?;

        if let Some((_, elapsed)) = active_elapsed {
            if elapsed > 0 {
                if let Some(today_entry) = rows.iter_mut().find(|r| r.date == local_today) {
                    today_entry.total_seconds += elapsed;
                } else {
                    rows.push(DayUsageResponse {
                        date:          local_today.to_string(),
                        total_seconds: elapsed,
                        active_apps:   1,
                        session_count: 1,
                    });
                }
            }
        }

        Ok(rows)
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // ─────────────────────────────────────────────────────────────────────────────
    // Query: daily usage for the last N local days (calendar-aligned window)
    // ─────────────────────────────────────────────────────────────────────────────

    pub fn get_daily_usage(
        &self,
        local_today: &str,
        days: i64,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<Vec<DayUsageResponse>> {
        let days = days.clamp(1, 90);
        let mut stmt = self.conn.prepare(
            "SELECT
                DATE(s.started_at, 'localtime') AS day,
                COALESCE(SUM(s.duration_seconds), 0),
                COUNT(DISTINCT s.application_id),
                COUNT(s.id)
             FROM application_sessions s
             WHERE DATE(s.started_at, 'localtime') >= DATE(?1, '-' || ?2 || ' days')
               AND DATE(s.started_at, 'localtime') <= ?1
               AND s.duration_seconds > 0
             GROUP BY day
             ORDER BY day ASC",
        )?;

        let mut rows: Vec<DayUsageResponse> = stmt.query_map(params![local_today, days], |row| {
            Ok(DayUsageResponse {
                date:          row.get(0)?,
                total_seconds: row.get(1)?,
                active_apps:   row.get(2)?,
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .context("querying daily usage")?;

        // Add live elapsed time to today's entry if present
        if let Some((_, elapsed)) = active_elapsed {
            if elapsed > 0 {
                if let Some(today_entry) = rows.iter_mut().find(|r| r.date == local_today) {
                    today_entry.total_seconds += elapsed;
                } else {
                    rows.push(DayUsageResponse {
                        date:          local_today.to_string(),
                        total_seconds: elapsed,
                        active_apps:   1,
                        session_count: 1,
                    });
                }
            }
        }

        Ok(rows)
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Query: per-hour totals per day over the last N local days
    // Powers the Activity Heatmap and Hourly Activity (Peak Hours) charts.
    // ─────────────────────────────────────────────────────────────────────────────

    pub fn get_hourly_usage(
        &self,
        local_today: &str,
        days: i64,
        active_elapsed: Option<(i64, i64)>,
        active_hour: i64,
    ) -> Result<Vec<HourUsage>> {
        let days = days.clamp(1, 90);
        let mut stmt = self.conn.prepare(
            "SELECT
                DATE(s.started_at, 'localtime') AS day,
                CAST(STRFTIME('%H', s.started_at, 'localtime') AS INTEGER) AS hour,
                COALESCE(SUM(s.duration_seconds), 0)
             FROM application_sessions s
             WHERE DATE(s.started_at, 'localtime') >= DATE(?1, '-' || ?2 || ' days')
               AND DATE(s.started_at, 'localtime') <= ?1
               AND s.duration_seconds > 0
             GROUP BY day, hour
             ORDER BY day ASC, hour ASC",
        )?;

        let mut rows: Vec<HourUsage> = stmt.query_map(params![local_today, days], |row| {
            Ok(HourUsage {
                date:          row.get(0)?,
                hour:          row.get(1)?,
                total_seconds: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()
        .context("querying hourly usage")?;

        // Attribute the currently-running session to today's current local hour
        if let Some((_, elapsed)) = active_elapsed {
            if elapsed > 0 && active_hour >= 0 {
                if let Some(entry) = rows.iter_mut().find(|r| r.date == local_today && r.hour == active_hour) {
                    entry.total_seconds += elapsed;
                } else {
                    rows.push(HourUsage {
                        date:          local_today.to_string(),
                        hour:          active_hour,
                        total_seconds: elapsed,
                    });
                }
            }
        }

        rows.sort_by_key(|r| (r.date.clone(), r.hour));
        Ok(rows)
    }

    // Query: sessions for a specific application
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_application_sessions(&self, executable: &str, limit: i64) -> Result<Vec<AppSession>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                s.id, s.application_id, a.name, a.executable_name,
                s.started_at, s.ended_at, s.duration_seconds
             FROM application_sessions s
             JOIN applications a ON a.id = s.application_id
             WHERE a.executable_name = ?1
               AND s.duration_seconds > 0
             ORDER BY s.started_at DESC
             LIMIT ?2",
        )?;

        let rows = stmt.query_map(params![executable, limit], |row| {
            Ok(AppSession {
                id:               row.get(0)?,
                application_id:   row.get(1)?,
                app_name:         row.get(2)?,
                executable_name:  row.get(3)?,
                started_at:       row.get(4)?,
                ended_at:         row.get(5)?,
                duration_seconds: row.get(6)?,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>()
            .context("querying application sessions")
    }

    /// Return sessions for a specific website domain.
    pub fn get_website_sessions(&self, domain: &str, limit: i64) -> Result<Vec<WebsiteSession>> {
        let mut stmt = self.conn.prepare(
            "SELECT
                s.id, s.website_id, w.domain,
                s.started_at, s.ended_at, s.duration_seconds
             FROM website_sessions s
             JOIN websites w ON w.id = s.website_id
             WHERE w.domain = ?1
               AND s.duration_seconds > 0
             ORDER BY s.started_at DESC
             LIMIT ?2",
        )?;

        let rows = stmt.query_map(params![domain, limit], |row| {
            Ok(WebsiteSession {
                id:               row.get(0)?,
                website_id:       row.get(1)?,
                domain:           row.get(2)?,
                started_at:       row.get(3)?,
                ended_at:         row.get(4)?,
                duration_seconds: row.get(5)?,
            })
        })?;

        rows.collect::<Result<Vec<_>, _>>()
            .context("querying website sessions")
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Query: summary stats for the dashboard KPIs
    //
    // Parameters
    //   today          â€” local YYYY-MM-DD
    //   active_elapsed â€” live time for currently-running session
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    pub fn get_summary_stats(
        &self,
        today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<SummaryStats> {
        // Today total â€” completed sessions only
        let today_completed: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0)
             FROM application_sessions
             WHERE DATE(started_at, 'localtime') = ?1
               AND duration_seconds > 0",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);

        // Add live elapsed for active session
        let active_secs = active_elapsed.map(|(_, s)| s).unwrap_or(0);
        let today_seconds = today_completed + active_secs;

        // Week total â€” completed sessions over the 7-day window
        let week_completed: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0)
             FROM application_sessions
             WHERE DATE(started_at, 'localtime') >= DATE(?1, '-6 days')
               AND DATE(started_at, 'localtime') <= ?1
               AND duration_seconds > 0",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);
        let week_seconds = week_completed + active_secs;

        // Distinct apps used today (completed sessions + active if present)
        let active_app_id = active_elapsed.map(|(id, _)| id);
        let completed_today_apps: i64 = self.conn.query_row(
            "SELECT COUNT(DISTINCT application_id)
             FROM application_sessions
             WHERE DATE(started_at, 'localtime') = ?1
               AND duration_seconds > 0",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);

        // Check if active app is already counted in today's completed sessions
        let active_already_counted = if let Some(app_id) = active_app_id {
            let count: i64 = self.conn.query_row(
                "SELECT COUNT(*) FROM application_sessions
                 WHERE application_id = ?1
                   AND DATE(started_at, 'localtime') = ?2
                   AND duration_seconds > 0",
                params![app_id, today],
                |row| row.get(0),
            ).unwrap_or(0);
            count > 0
        } else {
            true
        };

        let active_today = if active_app_id.is_some() && !active_already_counted {
            completed_today_apps + 1
        } else {
            completed_today_apps
        };

        // 7-day average (week total divided by 7)
        let avg_daily_seconds = week_seconds / 7;

        Ok(SummaryStats {
            today_seconds,
            week_seconds,
            active_today,
            avg_daily_seconds,
        })
    }

    /// Return summary stats for websites.
    pub fn get_website_summary_stats(
        &self,
        today: &str,
        active_elapsed: Option<(i64, i64)>,
    ) -> Result<WebsiteSummaryStats> {
        // Today's total website usage
        let mut today_seconds: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0)
             FROM website_sessions
             WHERE DATE(started_at, 'localtime') = ?1",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);

        // Weekly total website usage (last 7 local days)
        let mut week_seconds: i64 = self.conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0)
             FROM website_sessions
             WHERE DATE(started_at, 'localtime') >= DATE(?1, '-6 days')
               AND DATE(started_at, 'localtime') <= ?1",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);

        // Today's active distinct websites count (completed)
        let completed_today_sites: i64 = self.conn.query_row(
            "SELECT COUNT(DISTINCT website_id)
             FROM website_sessions
             WHERE DATE(started_at, 'localtime') = ?1
               AND duration_seconds > 0",
            params![today],
            |row| row.get(0),
        ).unwrap_or(0);

        // Total websites ever tracked
        let total_websites: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM websites",
            [],
            |row| row.get(0),
        ).unwrap_or(0);

        let active_site_id = active_elapsed.map(|(id, _)| id);
        let active_elapsed_sec = active_elapsed.map(|(_, elapsed)| elapsed).unwrap_or(0);

        if active_elapsed_sec > 0 {
            today_seconds += active_elapsed_sec;
            week_seconds += active_elapsed_sec;
        }

        let active_already_counted = if let Some(site_id) = active_site_id {
            let count: i64 = self.conn.query_row(
                "SELECT COUNT(*) FROM website_sessions
                 WHERE website_id = ?1
                   AND DATE(started_at, 'localtime') = ?2
                   AND duration_seconds > 0",
                params![site_id, today],
                |row| row.get(0),
            ).unwrap_or(0);
            count > 0
        } else {
            true
        };

        let active_today = if active_site_id.is_some() && !active_already_counted {
            completed_today_sites + 1
        } else {
            completed_today_sites
        };

        let avg_daily_seconds = week_seconds / 7;

        Ok(WebsiteSummaryStats {
            today_seconds,
            week_seconds,
            active_today,
            avg_daily_seconds,
            total_websites,
        })
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Blocked-app CRUD
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Add an application to the block list.
    pub fn add_blocked_app(&self, executable_name: &str, display_name: &str) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO blocked_applications (executable_name, display_name, enabled)
             VALUES (?1, ?2, 1)",
            params![executable_name, display_name],
        ).context("inserting blocked application")?;
        Ok(self.conn.last_insert_rowid())
    }

    /// Permanently remove a blocked-app rule.
    pub fn remove_blocked_app(&self, executable_name: &str) -> Result<()> {
        self.conn.execute(
            "DELETE FROM blocked_applications WHERE executable_name = ?1",
            params![executable_name],
        ).context("removing blocked application")?;
        Ok(())
    }

    /// Enable or disable a blocked-app rule.
    pub fn set_blocked_app_enabled(&self, executable_name: &str, enabled: bool) -> Result<()> {
        self.conn.execute(
            "UPDATE blocked_applications
             SET enabled = ?1,
                 updated_at = STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')
             WHERE executable_name = ?2",
            params![enabled as i32, executable_name],
        ).context("toggling blocked application")?;
        Ok(())
    }

    /// Return all blocked-app rows ordered by creation time.
    pub fn get_blocked_apps(&self) -> Result<Vec<crate::models::BlockedApp>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, executable_name, display_name, enabled, created_at, updated_at
             FROM blocked_applications
             ORDER BY created_at ASC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(crate::models::BlockedApp {
                id:              row.get(0)?,
                executable_name: row.get(1)?,
                display_name:    row.get(2)?,
                enabled:         row.get::<_, i32>(3)? != 0,
                created_at:      row.get(4)?,
                updated_at:      row.get(5)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>()
            .context("querying blocked applications")
    }

    /// Return (exe_lowercase, friendly_display_name, is_focus_block) for every enabled blocked app.
    /// The [FOCUS] prefix is stripped from display_name before returning so
    /// notification messages always show clean app names.
    /// Used by the tracker for efficient in-memory caching.
    pub fn get_enabled_blocked_executables(&self) -> Vec<(String, String, bool)> {
        let mut out = Vec::new();
        let mut seen_exes = std::collections::HashSet::new();

        // 1. If a focus session is active, its blocked apps are enforced with focus dialogs.
        if let Ok(Some(session)) = self.get_active_focus_session() {
            if session.status == "active" {
                if let Ok(focus_exes) = serde_json::from_str::<Vec<String>>(&session.blocked_apps) {
                    for exe_raw in focus_exes {
                        let exe = exe_raw.trim().to_lowercase();
                        if exe.is_empty() { continue; }
                        let display = {
                            let stem = std::path::Path::new(&exe)
                                .file_stem()
                                .map(|s| s.to_string_lossy().into_owned())
                                .unwrap_or_else(|| exe.clone());
                            let mut chars = stem.chars();
                            match chars.next() {
                                None    => stem,
                                Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
                            }
                        };
                        seen_exes.insert(exe.clone());
                        out.push((exe, display, true));
                    }
                }
            }
        }

        // 2. Query permanent enabled rules from blocked_applications
        if let Ok(mut stmt) = self.conn.prepare(
            "SELECT executable_name, display_name FROM blocked_applications WHERE enabled = 1",
        ) {
            if let Ok(rows) = stmt.query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            }) {
                for r in rows.flatten() {
                    let exe = r.0.trim().to_lowercase();
                    if exe.is_empty() || seen_exes.contains(&exe) {
                        continue;
                    }

                    let raw_display = r.1;
                    let is_focus = raw_display.starts_with("[FOCUS] ");
                    let display = if is_focus {
                        let stem = std::path::Path::new(&exe)
                            .file_stem()
                            .map(|s| s.to_string_lossy().into_owned())
                            .unwrap_or_else(|| exe.clone());
                        let mut chars = stem.chars();
                        match chars.next() {
                            None    => stem,
                            Some(c) => c.to_uppercase().collect::<String>() + chars.as_str(),
                        }
                    } else {
                        raw_display
                    };

                    seen_exes.insert(exe.clone());
                    out.push((exe, display, is_focus));
                }
            }
        }

        out
    }

    /// Return all known applications from the tracking table.
    pub fn get_tracked_applications(&self) -> Result<Vec<(String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT name, executable_name FROM applications ORDER BY name ASC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        rows.collect::<Result<Vec<_>, _>>()
            .context("querying tracked applications")
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Focus session CRUD
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Start a new focus session. Returns the new session id.
    pub fn start_focus_session(
        &self,
        name: &str,
        goal: &str,
        total_seconds: i64,
        blocked_apps_json: &str,
        started_at: &str,
    ) -> Result<i64> {
        self.conn.execute(
            "INSERT INTO focus_sessions
               (name, goal, total_seconds, elapsed_seconds, status, blocked_apps, started_at)
             VALUES (?1, ?2, ?3, 0, 'active', ?4, ?5)",
            params![name, goal, total_seconds, blocked_apps_json, started_at],
        ).context("inserting focus session")?;
        Ok(self.conn.last_insert_rowid())
    }

    /// Update elapsed time (called on pause / periodic heartbeat).
    pub fn update_focus_elapsed(&self, id: i64, elapsed_seconds: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE focus_sessions SET elapsed_seconds = ?1 WHERE id = ?2",
            params![elapsed_seconds, id],
        ).context("updating focus elapsed")?;
        Ok(())
    }

    /// Set status to 'paused'.
    pub fn pause_focus_session(&self, id: i64, elapsed_seconds: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE focus_sessions SET status = 'paused', elapsed_seconds = ?1 WHERE id = ?2",
            params![elapsed_seconds, id],
        ).context("pausing focus session")?;
        Ok(())
    }

    /// Set status back to 'active' after a pause.
    pub fn resume_focus_session(&self, id: i64) -> Result<()> {
        self.conn.execute(
            "UPDATE focus_sessions SET status = 'active' WHERE id = ?1",
            params![id],
        ).context("resuming focus session")?;
        Ok(())
    }

    /// End a session: set status, final elapsed, ended_at.
    pub fn end_focus_session(
        &self,
        id: i64,
        elapsed_seconds: i64,
        status: &str,  // "completed" or "abandoned"
        ended_at: &str,
    ) -> Result<()> {
        self.conn.execute(
            "UPDATE focus_sessions
             SET status = ?1, elapsed_seconds = ?2, ended_at = ?3
             WHERE id = ?4",
            params![status, elapsed_seconds, ended_at, id],
        ).context("ending focus session")?;
        Ok(())
    }

    /// Return the single active or paused session, if any.
    pub fn get_active_focus_session(&self) -> Result<Option<crate::models::FocusSession>> {
        let result = self.conn.query_row(
            "SELECT id, name, goal, total_seconds, elapsed_seconds, status,
                    blocked_apps, started_at, ended_at, created_at
             FROM focus_sessions
             WHERE status IN ('active', 'paused')
             ORDER BY started_at DESC LIMIT 1",
            [],
            |row| Ok(crate::models::FocusSession {
                id:               row.get(0)?,
                name:             row.get(1)?,
                goal:             row.get(2)?,
                total_seconds:    row.get(3)?,
                elapsed_seconds:  row.get(4)?,
                status:           row.get(5)?,
                blocked_apps:     row.get(6)?,
                started_at:       row.get(7)?,
                ended_at:         row.get(8)?,
                created_at:       row.get(9)?,
            }),
        );
        match result {
            Ok(s)                               => Ok(Some(s)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e)                              => Err(e.into()),
        }
    }

    /// Return the last N completed/abandoned sessions for history display.
    pub fn get_focus_session_history(&self, limit: i64) -> Result<Vec<crate::models::FocusSession>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, name, goal, total_seconds, elapsed_seconds, status,
                    blocked_apps, started_at, ended_at, created_at
             FROM focus_sessions
             WHERE status IN ('completed', 'abandoned')
             ORDER BY started_at DESC LIMIT ?1",
        )?;
        let rows = stmt.query_map(params![limit], |row| {
            Ok(crate::models::FocusSession {
                id:               row.get(0)?,
                name:             row.get(1)?,
                goal:             row.get(2)?,
                total_seconds:    row.get(3)?,
                elapsed_seconds:  row.get(4)?,
                status:           row.get(5)?,
                blocked_apps:     row.get(6)?,
                started_at:       row.get(7)?,
                ended_at:         row.get(8)?,
                created_at:       row.get(9)?,
            })
        })?;
        rows.collect::<Result<Vec<_>, _>>().context("querying focus session history")
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Settings key-value store
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Read a single setting value by key. Returns None if key not found.
    pub fn get_setting(&self, key: &str) -> Option<String> {
        self.conn.query_row(
            "SELECT value FROM app_settings WHERE key = ?1",
            rusqlite::params![key],
            |row| row.get::<_, String>(0),
        ).ok()
    }

    /// Write a single setting value (insert or replace).
    pub fn set_setting(&self, key: &str, value: &str) -> Result<()> {
        self.conn.execute(
            "INSERT INTO app_settings (key, value)
             VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value = ?2,
             updated_at = STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')",
            rusqlite::params![key, value],
        ).context("setting key-value")?;
        Ok(())
    }

    /// Read all settings as a Vec of (key, value) pairs.
    pub fn get_all_settings(&self) -> Result<Vec<(String, String)>> {
        let mut stmt = self.conn.prepare(
            "SELECT key, value FROM app_settings ORDER BY key ASC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })?;
        rows.collect::<Result<Vec<_>, _>>().context("reading all settings")
    }

    /// Delete all tracked sessions and website sessions (used by Privacy â†’ Delete All Data).
    /// Does NOT delete settings, blocked apps, or focus sessions.
    pub fn delete_all_usage_data(&self) -> Result<()> {
        self.conn.execute_batch(
            "DELETE FROM application_sessions;
             DELETE FROM website_sessions;
             DELETE FROM applications;
             DELETE FROM websites;"
        ).context("deleting all usage data")?;
        Ok(())
    }

    /// Export all application_sessions as a CSV string.
    pub fn export_usage_as_csv(&self) -> Result<String> {
        let mut stmt = self.conn.prepare(
            "SELECT a.name, a.executable_name,
                    s.started_at, s.ended_at, s.duration_seconds
             FROM application_sessions s
             JOIN applications a ON a.id = s.application_id
             WHERE s.duration_seconds > 0
             ORDER BY s.started_at DESC",
        )?;

        let mut csv = String::from("Application,Executable,Started At,Ended At,Duration (seconds)\n");
        let rows = stmt.query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, i64>(4)?,
            ))
        })?;

        for row in rows.flatten() {
            csv.push_str(&format!(
                "{},{},{},{},{}\n",
                row.0,
                row.1,
                row.2,
                row.3.unwrap_or_default(),
                row.4,
            ));
        }
        Ok(csv)
    }

    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Pro user flag (simple local flag, no payment integration)
    // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    /// Returns true if the user has activated Pro.
    pub fn is_pro_user(&self) -> bool {
        self.conn.query_row(
            "SELECT value FROM app_settings WHERE key = 'is_pro'",
            [],
            |row| row.get::<_, String>(0),
        ).map(|v| v == "1").unwrap_or(false)
    }

    /// Persist the pro flag.
    pub fn set_pro_user(&self, is_pro: bool) -> Result<()> {
        let val = if is_pro { "1" } else { "0" };
        self.conn.execute(
            "INSERT INTO app_settings (key, value)
             VALUES ('is_pro', ?1)
             ON CONFLICT(key) DO UPDATE SET value = ?1,
             updated_at = STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')",
            params![val],
        ).context("setting pro flag")?;
        Ok(())
    }
}

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Schema
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SCHEMA_V1: &str = "
-- Applications registry: one row per unique executable
CREATE TABLE IF NOT EXISTS applications (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    NOT NULL,
    executable_name TEXT    NOT NULL UNIQUE,
    created_at      TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- One row per foreground session
CREATE TABLE IF NOT EXISTS application_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id   INTEGER NOT NULL REFERENCES applications(id),
    started_at       TEXT    NOT NULL,
    ended_at         TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0
);

-- Indexes for fast date-range and per-app queries
CREATE INDEX IF NOT EXISTS idx_sessions_app       ON application_sessions(application_id);
CREATE INDEX IF NOT EXISTS idx_sessions_started   ON application_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_app_exe            ON applications(executable_name);

-- Websites registry: one row per unique domain (usage tracking)
CREATE TABLE IF NOT EXISTS websites (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    domain          TEXT    NOT NULL UNIQUE,
    created_at      TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at      TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- One row per website browsing session
CREATE TABLE IF NOT EXISTS website_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    website_id       INTEGER NOT NULL REFERENCES websites(id),
    started_at       TEXT    NOT NULL,
    ended_at         TEXT,
    duration_seconds INTEGER NOT NULL DEFAULT 0
);

-- Indexes for fast website queries
CREATE INDEX IF NOT EXISTS idx_website_sessions_site    ON website_sessions(website_id);
CREATE INDEX IF NOT EXISTS idx_website_sessions_started ON website_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_websites_domain          ON websites(domain);

-- â”€â”€ App settings (key-value store) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS app_settings (
    key        TEXT NOT NULL PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- â”€â”€ App Blocking (v3 migration â€” safe to run on existing databases) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
-- One row per application the user has chosen to block.
-- enabled = 1  means any process matching executable_name is terminated on detection.
-- enabled = 0  means rule is saved but the process is not terminated.
CREATE TABLE IF NOT EXISTS blocked_applications (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    executable_name  TEXT    NOT NULL UNIQUE,
    display_name     TEXT    NOT NULL,
    enabled          INTEGER NOT NULL DEFAULT 1,
    created_at       TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at       TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_blocked_apps_exe ON blocked_applications(executable_name);

-- Focus sessions: one row per user-started focus session
CREATE TABLE IF NOT EXISTS focus_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    name             TEXT    NOT NULL DEFAULT '',
    goal             TEXT    NOT NULL DEFAULT '',
    total_seconds    INTEGER NOT NULL,          -- planned duration
    elapsed_seconds  INTEGER NOT NULL DEFAULT 0, -- time actually spent
    status           TEXT    NOT NULL DEFAULT 'active', -- active | paused | completed | abandoned
    blocked_apps     TEXT    NOT NULL DEFAULT '', -- JSON array of executable names
    started_at       TEXT    NOT NULL,
    ended_at         TEXT,
    created_at       TEXT    NOT NULL DEFAULT (STRFTIME('%Y-%m-%dT%H:%M:%SZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_started ON focus_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_status  ON focus_sessions(status);
";
