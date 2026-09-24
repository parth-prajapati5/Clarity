/**
 * useAnalyticsData.js
 * Re-exports the real hooks from useUsageData for backward compatibility.
 * Analytics data is now driven by useAnalyticsSelection.js.
 */
export { useWeeklyUsage, useUsageForDate } from './useUsageData'
