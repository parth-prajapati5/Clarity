/**
 * usageApi.js
 * Central service layer — all Tauri IPC calls live here.
 *
 * IMPORTANT — all "today" commands now receive the user's local date
 * (YYYY-MM-DD) so the backend always queries the correct calendar day,
 * regardless of the user's UTC offset.
 *
 * Backend response field names (camelCase via #[serde(rename_all = "camelCase")]):
 *   AppUsageResponse  → { application, executableName, durationSeconds, sessionCount, lastUsed }
 *   DayUsageResponse  → { date, totalSeconds, activeApps, sessionCount }
 *   SummaryStats      → { todaySeconds, weekSeconds, activeToday, avgDailySeconds }
 *   AppSession        → { id, applicationId, appName, executableName, startedAt, endedAt, durationSeconds }
 */

import { invoke } from '@tauri-apps/api/core'

// ─── date helper ────────────────────────────────────────────

/** Returns today's date as "YYYY-MM-DD" in the user's LOCAL timezone. */
export function localToday() {
  const d  = new Date()
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// ─── raw Tauri calls ────────────────────────────────────────

/**
 * Today's per-app totals, sorted by duration descending.
 * Includes live elapsed time for the currently-running session.
 * @returns {Promise<AppUsageResponse[]>}
 */
export const getTodayUsage = () =>
  invoke('get_today_usage', { localDate: localToday() })

/**
 * Same as getTodayUsage — alias used by the Applications page.
 * @returns {Promise<AppUsageResponse[]>}
 */
export const getApplicationUsage = () =>
  invoke('get_application_usage', { localDate: localToday() })

/**
 * Per-app totals for any local YYYY-MM-DD date.
 * For today, the active session is automatically included.
 * @param {string} date  YYYY-MM-DD local date
 * @returns {Promise<AppUsageResponse[]>}
 */
export const getUsageForDate = (date) =>
  invoke('get_usage_for_date', { date, localToday: localToday() })

/**
 * Last 7 days, one row per day, oldest first.
 * @returns {Promise<DayUsageResponse[]>}
 */
export const getWeeklyUsage = () =>
  invoke('get_weekly_usage', { localToday: localToday() })

/**
 * Per-day totals over the last N local calendar days (default 28).
 * Calendar-aligned — used by the Analytics Week/Month charts.
 * @param {number} [days=28]
 * @returns {Promise<DayUsageResponse[]>}
 */
export const getDailyUsage = (days = 28) =>
  invoke('get_daily_usage', { localToday: localToday(), days })

/**
 * Per-hour totals per day over the last N local calendar days (default 28).
 * Powers the Activity Heatmap and Hourly Activity (Peak Hours) charts.
 * @param {number} [days=28]
 * @returns {Promise<Array<{ date: string, hour: number, totalSeconds: number }>>}
 */
export const getHourlyUsage = (days = 28) =>
  invoke('get_hourly_usage', { localToday: localToday(), days })

/**
 * Get native icon data URL for an executable or path.
 * @param {string} executableOrPath
 * @returns {Promise<string | null>}
 */
export const getAppIcon = (executableOrPath) =>
  invoke('get_app_icon', { executableOrPath })

/**
 * Batch retrieve icons for a list of executables.
 * @param {string[]} executables
 * @returns {Promise<Record<string, string>>}
 */
export const getAppIcons = (executables) =>
  invoke('get_app_icons', { executables })

/**
 * Recent sessions for a specific executable.
 * @param {string} executable  e.g. "code.exe"
 * @param {number} [limit=50]
 * @returns {Promise<AppSession[]>}
 */
export const getApplicationSessions = (executable, limit = 50) =>
  invoke('get_application_sessions', { executable, limit })

/**
 * Friendly name of the currently active foreground app, or null.
 * @returns {Promise<string|null>}
 */
export const getCurrentApp = () => invoke('get_current_app')

/**
 * Dashboard KPIs: todaySeconds, weekSeconds, activeToday, avgDailySeconds.
 * Includes live elapsed time for the currently-running session.
 * @returns {Promise<SummaryStats>}
 */
export const getSummaryStats = () =>
  invoke('get_summary_stats', { localDate: localToday() })

/**
 * Today's website totals, sorted by duration descending.
 * Includes live elapsed time for the currently-running website session.
 * @returns {Promise<WebsiteUsageResponse[]>}
 */
export const getTodayWebsiteUsage = () =>
  invoke('get_today_website_usage', { localDate: localToday() })

/**
 * Weekly website usage (last 7 local days).
 * @returns {Promise<DayUsageResponse[]>}
 */
export const getWeeklyWebsiteUsage = () =>
  invoke('get_weekly_website_usage', { localToday: localToday() })

/**
 * Website summary stats.
 * @returns {Promise<WebsiteSummaryStats>}
 */
export const getWebsiteSummaryStats = () =>
  invoke('get_website_summary_stats', { localDate: localToday() })

/**
 * Recent sessions for a specific website domain.
 * @param {string} domain
 * @param {number} [limit=50]
 * @returns {Promise<WebsiteSession[]>}
 */
export const getWebsiteSessions = (domain, limit = 50) =>
  invoke('get_website_sessions', { domain, limit })

// ─── formatting helpers ─────────────────────────────────────

/**
 * Convert seconds into human-readable duration format (hours and minutes).
 * Rounding to nearest minute. Seconds are ignored.
 * - 0 minutes: "0m"
 * - Less than 1 hour: "Xm" (e.g., 5m, 12m)
 * - 1 hour or more: "Xh" or "Xh YYm" (e.g., 1h, 1h 20m, 12h 05m)
 */
export function formatDuration(sec) {
  const roundedMins = Math.round((Number(sec) || 0) / 60)
  if (roundedMins <= 0) return '0m'
  const h = Math.floor(roundedMins / 60)
  const m = roundedMins % 60
  if (h > 0 && m > 0) {
    return `${h}h ${String(m).padStart(2, '0')}m`
  }
  if (h > 0) return `${h}h`
  return `${m}m`
}

export function fmtSeconds(sec) {
  return formatDuration(sec)
}

/** Convert seconds to decimal hours string e.g. "3.25" */
export function secToHours(sec) {
  const s = Number(sec) || 0
  return (s / 3600).toFixed(2)
}

/** Format ISO-8601 UTC timestamp → local "HH:MM AM/PM" */
export function fmtTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/** Format ISO-8601 UTC timestamp → local "Mon, Jan 1" */
export function fmtDate(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleDateString([], {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

/** "Xm ago" / "Xh ago" / formatted date from ISO timestamp */
export function fmtLastUsed(isoString) {
  if (!isoString) return '—'
  const ms  = Date.now() - new Date(isoString).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1)  return 'Just now'
  if (min < 60) return `${min}m ago`
  const h = Math.floor(min / 60)
  if (h < 24)  return `${h}h ago`
  return fmtDate(isoString)
}

/** Deterministic hex color from an app name string (for icon backgrounds). */
export function appColor(name = '') {
  const PALETTE = [
    '#6750A4', '#7D5260', '#006A6A', '#1B5E82',
    '#4A5568', '#2D5016', '#7B3F00', '#1A237E',
  ]
  const idx = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % PALETTE.length
  return PALETTE[idx]
}

/** Returns true if the current user has Pro. */
export const isProUser = () =>
  invoke('is_pro_user')

/**
 * DEV-ONLY: grant / revoke pro for testing.
 * @param {boolean} value
 */
export const devSetPro = (value) =>
  invoke('dev_set_pro', { value })

// ─── App Blocking API ───────────────────────────────────────

/**
 * All applications Clarity has detected on this machine.
 * Used to populate the "Add application" picker.
 * @returns {Promise<Array<{name: string, executableName: string}>>}
 */
export const getTrackedApplications = () =>
  invoke('get_tracked_applications')

/**
 * All blocked-app rules (enabled or disabled).
 * @returns {Promise<BlockedApp[]>} { id, executableName, displayName, enabled, createdAt, updatedAt }
 */
export const getBlockedApps = () =>
  invoke('get_blocked_apps')

/**
 * Add an application to the block list (PRO only).
 * Immediately terminates any running instance.
 * @param {string} executableName  e.g. "discord.exe"
 * @param {string} displayName     e.g. "Discord"
 * @returns {Promise<BlockedApp>}
 */
export const addBlockedApp = (executableName, displayName) =>
  invoke('add_blocked_app', { executableName, displayName })

/**
 * Permanently remove a blocked-app rule (PRO only).
 * @param {string} executableName
 */
export const removeBlockedApp = (executableName) =>
  invoke('remove_blocked_app', { executableName })

/**
 * Enable or disable a blocking rule without deleting it (PRO only).
 * @param {string}  executableName
 * @param {boolean} enabled
 */
export const setAppBlockEnabled = (executableName, enabled) =>
  invoke('set_app_block_enabled', { executableName, enabled })

// ─── Focus Mode API ─────────────────────────────────────────

/** Get the currently active or paused focus session, or null. */
export const getActiveFocusSession = () =>
  invoke('get_active_focus_session')

/** Get completed/abandoned session history. */
export const getFocusHistory = (limit = 20) =>
  invoke('get_focus_history', { limit })

/**
 * Start a new focus session.
 * @param {string}   name
 * @param {string}   goal
 * @param {number}   totalSeconds
 * @param {string[]} blockedAppExes  — lowercase exe names e.g. ["discord.exe"]
 * @returns {Promise<FocusSession>}
 */
export const startFocusSession = (name, goal, totalSeconds, blockedAppExes) =>
  invoke('start_focus_session', { name, goal, totalSeconds, blockedAppExes })

/** Pause the running session, persisting elapsed time. */
export const pauseFocusSession = (sessionId, elapsedSeconds) =>
  invoke('pause_focus_session', { sessionId, elapsedSeconds })

/** Resume a paused session. */
export const resumeFocusSession = (sessionId) =>
  invoke('resume_focus_session', { sessionId })

/**
 * End the session.
 * @param {boolean} completed  true = user finished; false = abandoned early
 */
export const endFocusSession = (sessionId, elapsedSeconds, completed) =>
  invoke('end_focus_session', { sessionId, elapsedSeconds, completed })

/** Heartbeat — persist elapsed seconds every ~5s. */
export const updateFocusElapsed = (sessionId, elapsedSeconds) =>
  invoke('update_focus_elapsed', { sessionId, elapsedSeconds })

// ─── Settings API ───────────────────────────────────────────

/**
 * Get all persisted settings as a key-value map.
 * @returns {Promise<Record<string, string>>}
 */
export const getSettings = () =>
  invoke('get_settings')

/**
 * Save a single setting key-value pair.
 * @param {string} key
 * @param {string} value
 * @returns {Promise<void>}
 */
export const saveSetting = (key, value) =>
  invoke('save_setting', { key, value: String(value) })

/**
 * Get application version string from Tauri backend.
 * @returns {Promise<string>}
 */
export const getAppVersion = () =>
  invoke('get_app_version')

/**
 * Export all usage sessions as a CSV string.
 * @returns {Promise<string>}
 */
export const exportUsageData = () =>
  invoke('export_usage_data')

/**
 * Permanently delete all recorded usage data.
 * @returns {Promise<void>}
 */
export const deleteAllData = () =>
  invoke('delete_all_data')

