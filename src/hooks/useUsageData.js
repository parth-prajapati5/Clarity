/**
 * useUsageData.js
 * React hooks that call usageApi.js and expose loading/error state.
 * All field names match the camelCase the Rust backend actually sends.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getTodayUsage,
  getApplicationUsage,
  getWeeklyUsage,
  getSummaryStats,
  getCurrentApp,
  getUsageForDate,
  getApplicationSessions,
  getTodayWebsiteUsage,
  getWeeklyWebsiteUsage,
  getWebsiteSummaryStats,
  getWebsiteSessions,
  isProUser,
  getTrackedApplications,
  getBlockedApps,
} from '../services/usageApi'

// ─── generic fetcher ────────────────────────────────────────

function useFetch(fetcher, defaultValue, intervalMs = 0, deps = []) {
  const [data,    setData]    = useState(defaultValue)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetcher()
      setData(result)
      setError(null)
    } catch (e) {
      setError(e?.message ?? String(e))
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    if (intervalMs > 0) {
      const id = setInterval(run, intervalMs)
      return () => clearInterval(id)
    }
  }, [run, intervalMs])

  return { data, loading, error, refresh: run }
}

// ─── App usage hooks ─────────────────────────────────────────

/** Today's per-app totals – refreshes every 30 s */
export function useTodayUsage() {
  return useFetch(getTodayUsage, [], 30_000)
}

/** Same data, alias used by Applications page */
export function useApplicationUsage() {
  return useFetch(getApplicationUsage, [], 30_000)
}

/** Last 7 days, one row per day – refreshes every 60 s */
export function useWeeklyUsage() {
  return useFetch(getWeeklyUsage, [], 60_000)
}

/** Dashboard KPIs – refreshes every 30 s */
export function useSummaryStats() {
  return useFetch(getSummaryStats, null, 30_000)
}

/** Currently active foreground app – refreshes every 5 s */
export function useCurrentApp() {
  const { data: app, loading } = useFetch(getCurrentApp, null, 5_000)
  return { app, loading }
}

/** Per-app usage for an arbitrary local date (YYYY-MM-DD) */
export function useUsageForDate(date) {
  return useFetch(() => getUsageForDate(date), [], 0, [date])
}

/** Session list for a specific executable */
export function useAppSessions(executableName, limit = 50) {
  return useFetch(
    () => getApplicationSessions(executableName, limit),
    [],
    0,
    [executableName, limit],
  )
}

// ─── Website usage hooks ─────────────────────────────────────

/** Today's website totals – refreshes every 30 s */
export function useWebsiteUsage() {
  return useFetch(getTodayWebsiteUsage, [], 30_000)
}

/** Weekly website usage – refreshes every 60 s */
export function useWebsiteWeeklyUsage() {
  return useFetch(getWeeklyWebsiteUsage, [], 60_000)
}

/** Website summary stats – refreshes every 30 s */
export function useWebsiteSummaryStats() {
  return useFetch(getWebsiteSummaryStats, null, 30_000)
}

/** Sessions for a specific website domain */
export function useWebsiteSessions(domain, limit = 50) {
  return useFetch(
    () => getWebsiteSessions(domain, limit),
    [],
    0,
    [domain, limit],
  )
}

// ─── Blocking hooks ──────────────────────────────────────────

/** All blocked-app rules. Call refresh() after mutations. */
export function useBlockedApps() {
  return useFetch(getBlockedApps, [], 0)
}

/** All applications Clarity has ever tracked on this machine. */
export function useTrackedApplications() {
  return useFetch(getTrackedApplications, [], 0)
}

/** Whether the current user has Pro – checked once on mount. */
export function useIsProUser() {
  const { data, loading } = useFetch(isProUser, false, 0)
  return { isPro: data ?? false, loading }
}
