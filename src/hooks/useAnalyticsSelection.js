/**
 * useAnalyticsSelection.js
 * Single source of truth for Analytics navigation state.
 * All data comes from the real Tauri/SQLite backend.
 *
 * Real-time data sources:
 *   getDailyUsage(28)   → calendar-aligned per-day totals (Week/Month bars)
 *   getHourlyUsage(28)  → per-hour totals (Peak Hours card + Activity Heatmap)
 *   getFocusHistory     → real focus session minutes (Focus Time chart)
 *   getUsageForDate     → per-app breakdown for the selected day / apps panel
 *
 * State machine — API is unchanged so AnalyticsPage.jsx needs no changes:
 *   view, selectedWeekIdx, selectedDayIdx,
 *   selectView, selectDay, selectWeek, goBack,
 *   contextLabel, showBackBtn,
 *   overviewData, monthBars, weekDayBars,
 *   appsData, focusData, hourlyData, insightsData, heatmap
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import {
  getDailyUsage,
  getHourlyUsage,
  getUsageForDate,
  getFocusHistory,
  getActiveFocusSession,
  fmtSeconds,
} from '../services/usageApi'

// ─── constants ──────────────────────────────────────────────

export const FILTER_TABS  = ['Week', 'Month']
export const DEFAULT_FILTER = 'Week'

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// 16 hourly slots shown in both the heatmap and the Peak Hours chart (6 AM – 9 PM)
const HOUR_SLOTS = Array.from({ length: 16 }, (_, i) => i + 6)

// Decorative daily focus goal used by the Focus Trend chart reference line.
const DAILY_FOCUS_GOAL_HOURS = 2

// Poll interval — keeps the charts live while the app is open.
const POLL_MS = 30_000

// Colour palette for app bars — deterministic from app name
const APP_COLORS = ['#c0c1ff','#89ceff','#ffb783','#c7c4d7','#908fa0','#a8e6cf','#ffd3a5']
function appColor(name = '', idx = 0) {
  return APP_COLORS[idx % APP_COLORS.length]
}

// ─── helper: build last N calendar weeks ────────────────────

/**
 * Returns an array of N objects, index 0 = current week (Mon–Sun).
 * Each has { startDate, label, shortLabel, dates: Date[7] }
 */
function buildCalendarWeeks(n = 4) {
  const weeks = []
  const now   = new Date()

  const dow = (now.getDay() + 6) % 7   // 0=Mon, 6=Sun
  const mon = new Date(now)
  mon.setHours(0, 0, 0, 0)
  mon.setDate(mon.getDate() - dow)

  for (let w = 0; w < n; w++) {
    const weekStart = new Date(mon)
    weekStart.setDate(mon.getDate() - w * 7)

    const dates = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(weekStart)
      day.setDate(weekStart.getDate() + d)
      return day
    })

    const fmt = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    weeks.push({
      startDate:  weekStart,
      label:      `${fmt(dates[0])} – ${fmt(dates[6])} ${dates[0].getFullYear()}`,
      shortLabel: `Wk ${w + 1}`,
      dates,
    })
  }
  return weeks
}

const toYMD = (d) => {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** Local "YYYY-MM-DD" key from a UTC ISO timestamp. */
const localDateKey = (isoUtc) => toYMD(new Date(isoUtc))

const hourLabel = (h) => {
  const period = h >= 12 ? 'PM' : 'AM'
  const hh = ((h + 11) % 12) + 1
  return `${hh} ${period}`
}

// ─── transform helpers ───────────────────────────────────────

function appsDataFromUsage(usageArr) {
  if (!usageArr || usageArr.length === 0) return []
  const totalMin = usageArr.reduce((s, a) => s + Math.round(a.durationSeconds / 60), 0)
  return usageArr.map((a, i) => ({
    app:          a.application,
    minutes:      Math.round(a.durationSeconds / 60),
    prevMinutes:  0,
    percent:      totalMin > 0 ? Math.round((a.durationSeconds / (totalMin * 60)) * 100) : 0,
    icon:         'apps',
    iconBg:       '#34343d',
    color:        appColor(a.application, i),
  }))
}

/** Aggregate per-hour seconds for a set of date keys → PeakHours data shape. */
function peakHoursFromKeys(keys, hourMap) {
  const secs = HOUR_SLOTS.map(h => {
    let sec = 0
    for (const k of keys) sec += hourMap[k]?.[h] ?? 0
    return { hour: h, seconds: sec }
  })
  const maxSec = Math.max(...secs.map(s => s.seconds), 1)
  return secs.map(s => ({
    hour:    hourLabel(s.hour),
    score:   Math.round((s.seconds / maxSec) * 100),
    minutes: Math.round(s.seconds / 60),
  }))
}

/** Build 7-day heatmap rows (Mon–Sun) normalized 0–4 from real hourly data. */
function heatmapFromDays(days, weekDates, hourMap) {
  const maxSec = weekDates.reduce((m, d) => {
    const key = toYMD(d)
    for (const h of HOUR_SLOTS) m = Math.max(m, hourMap[key]?.[h] ?? 0)
    return m
  }, 0)

  return days.map((day, i) => ({
    day,
    hours: HOUR_SLOTS.map(h => {
      const sec = hourMap[toYMD(weekDates[i])]?.[h] ?? 0
      const intensity = maxSec > 0 ? Math.min(Math.floor((sec / maxSec) * 4), 4) : 0
      return { hour: String(h), intensity }
    }),
  }))
}

// ─── main hook ───────────────────────────────────────────────

const CALENDAR_WEEKS = buildCalendarWeeks(4)
const WEEKDAY_LONG = d => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

const useAnalyticsSelection = () => {
  const [view,            setView]            = useState(DEFAULT_FILTER)
  const [selectedWeekIdx, setSelectedWeekIdx] = useState(0)           // 0 = current week
  const [selectedDayIdx,  setSelectedDayIdx]  = useState(null)

  const [dailyRows,   setDailyRows]   = useState([])     // DayUsageResponse[] last 28 days
  const [hourlyRows,  setHourlyRows]  = useState([])     // HourUsage[] last 28 days
  const [dayUsage,    setDayUsage]    = useState([])     // AppUsageResponse[] for selected day
  const [weekAppsMap, setWeekAppsMap] = useState({})     // weekIdx → AppUsageResponse[]
  const [focusByDay,  setFocusByDay]  = useState({})     // "YYYY-MM-DD" → seconds
  const [loading,     setLoading]     = useState(true)

  const pollRef = useRef(() => {})
  pollRef.current = async () => {
    try { setDailyRows(await getDailyUsage(28)) } catch { /* keep last */ }
    try { setHourlyRows(await getHourlyUsage(28)) } catch { /* keep last */ }
    try {
      const [history, active] = await Promise.all([getFocusHistory(100), getActiveFocusSession()])
      const map = {}
      for (const s of history || []) {
        const key = localDateKey(s.startedAt)
        map[key] = (map[key] ?? 0) + (s.elapsedSeconds || 0)
      }
      if (active?.startedAt) {
        const key = localDateKey(active.startedAt)
        map[key] = (map[key] ?? 0) + (active.elapsedSeconds || 0)
      }
      setFocusByDay(map)
    } catch { /* keep last */ }
    setLoading(false)
  }

  // Fetch daily totals, hourly totals and focus history on mount, then poll.
  useEffect(() => {
    let cancelled = false
    const run = () => { if (!cancelled) pollRef.current() }
    run()
    const id = setInterval(run, POLL_MS)
    return () => { cancelled = true; clearInterval(id) }
  }, [])

  // Fetch per-day app usage for the selected day (day drill / day detail)
  useEffect(() => {
    if (selectedDayIdx === null) { setDayUsage([]); return }
    const week = CALENDAR_WEEKS[selectedWeekIdx ?? 0]
    const date = toYMD(week.dates[selectedDayIdx])
    getUsageForDate(date).then(setDayUsage).catch(() => setDayUsage([]))
  }, [selectedWeekIdx, selectedDayIdx])

  // Fetch per-day app usage for each day in the selected week (apps panel)
  useEffect(() => {
    const weekIdx = selectedWeekIdx ?? 0
    const week    = CALENDAR_WEEKS[weekIdx]
    Promise.all(week.dates.map(d => getUsageForDate(toYMD(d))))
      .then(results => {
        setWeekAppsMap(prev => ({ ...prev, [weekIdx]: results.flat() }))
      })
      .catch(() => {})
  }, [selectedWeekIdx])

  // ── navigation ──────────────────────────────────────────────

  const selectView = useCallback((v) => {
    setView(v)
    setSelectedDayIdx(null)
    setSelectedWeekIdx(v === 'Week' ? 0 : null)
  }, [])

  const selectDay  = useCallback((i) => setSelectedDayIdx(p => p === i ? null : i), [])
  const selectWeek = useCallback((i) => { setSelectedWeekIdx(i); setSelectedDayIdx(null) }, [])
  const goBack     = useCallback(() => {
    if (selectedDayIdx !== null) { setSelectedDayIdx(null); return }
    if (view === 'Month' && selectedWeekIdx !== null) setSelectedWeekIdx(null)
  }, [view, selectedWeekIdx, selectedDayIdx])

  // ── derived ─────────────────────────────────────────────────

  const derived = useMemo(() => {
    const weekIdx  = selectedWeekIdx ?? 0
    const week     = CALENDAR_WEEKS[weekIdx]
    const weekApps = weekAppsMap[weekIdx] ?? []

    // Index rows for O(1) lookup
    const dayMap = {}
    for (const r of dailyRows) dayMap[r.date] = r
    const hourMap = {}
    for (const h of hourlyRows) {
      hourMap[h.date] = hourMap[h.date] ?? {}
      hourMap[h.date][h.hour] = (hourMap[h.date][h.hour] ?? 0) + h.totalSeconds
    }

    const dayTotalSec   = (i) => dayMap[toYMD(week.dates[i])]?.totalSeconds ?? 0
    const dayFocusSec   = (i) => focusByDay[toYMD(week.dates[i])] ?? 0
    const weekTotalSec  = week.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0)
    const weekSessions  = week.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.sessionCount ?? 0), 0)
    const weekFocusSec  = week.dates.reduce((s, d) => s + (focusByDay[toYMD(d)] ?? 0), 0)
    const weekHours     = weekTotalSec / 3600
    const weekFocusHours = weekFocusSec / 3600

    // Calendar-aligned Mon–Sun bars (fixes the rolling 7-day offset bug)
    const weekDayBars = DAY_LABELS.map((day, i) => ({
      day,
      hours:      parseFloat((dayTotalSec(i) / 3600).toFixed(2)),
      focusHours: parseFloat((dayFocusSec(i) / 3600).toFixed(2)),
      dayIdx:     i,
    }))

    // ── Month top-level ──────────────────────────────────────
    if (view === 'Month' && selectedWeekIdx === null) {
      const monthBars = CALENDAR_WEEKS.map((w, wi) => {
        const totalSec = w.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0)
        const focusSec = w.dates.reduce((s, d) => s + (focusByDay[toYMD(d)] ?? 0), 0)
        return {
          label:      w.shortLabel,
          fullLabel:  w.label,
          hours:      parseFloat((totalSec / 3600).toFixed(1)),
          focusHours: parseFloat((focusSec / 3600).toFixed(1)),
          weekIdx:    wi,
        }
      })

      const monthTotalSec = CALENDAR_WEEKS.reduce((s, w) =>
        s + w.dates.reduce((x, d) => x + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0), 0)
      const monthSessions = CALENDAR_WEEKS.reduce((s, w) =>
        s + w.dates.reduce((x, d) => x + (dayMap[toYMD(d)]?.sessionCount ?? 0), 0), 0)
      const monthFocusSec = CALENDAR_WEEKS.reduce((s, w) =>
        s + w.dates.reduce((x, d) => x + (focusByDay[toYMD(d)] ?? 0), 0), 0)
      const monthly = CALENDAR_WEEKS.map(w =>
        w.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0))

      const allKeys = CALENDAR_WEEKS.flatMap(w => w.dates.map(toYMD))

      return {
        contextLabel: 'Last 4 Weeks',
        showBackBtn:  false,
        overviewData: [
          { id:'screen-time', label:'Total Screen Time', value:fmtSeconds(monthTotalSec), icon:'schedule',            iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:monthly },
          { id:'focus-time',  label:'Focus Time',        value:fmtSeconds(monthFocusSec), icon:'center_focus_strong', iconBg:'bg-secondary-container/10', iconColor:'text-secondary', sparklineColor:'#89ceff', sparkline:CALENDAR_WEEKS.map(w => w.dates.reduce((s, d) => s + (focusByDay[toYMD(d)] ?? 0), 0)) },
          { id:'sessions',    label:'Active Sessions',   value:String(monthSessions),     icon:'grid_view',           iconBg:'bg-tertiary-container/10',  iconColor:'text-tertiary',  sparklineColor:'#ffb783', sparkline:CALENDAR_WEEKS.map(w => w.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.sessionCount ?? 0), 0)) },
          { id:'avg',         label:'Weekly Average',    value:fmtSeconds(monthTotalSec / 4), icon:'bar_chart',       iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:monthly },
        ],
        monthBars,
        weekDayBars,
        selectedDayIdx: null,
        appsData:      appsDataFromUsage(weekAppsMap[0] ?? []),
        focusData:     CALENDAR_WEEKS.map((w, i) => ({
          day:        w.shortLabel,
          focusHours: parseFloat((w.dates.reduce((s, d) => s + (focusByDay[toYMD(d)] ?? 0), 0) / 3600).toFixed(2)),
          goal:       DAILY_FOCUS_GOAL_HOURS * 7,
        })),
        hourlyData:    peakHoursFromKeys(allKeys, hourMap),
        insightsData:  insightsForWeek(CALENDAR_WEEKS[0].dates, dayMap, weekAppsMap[0] ?? [], hourMap, fmtSeconds(monthTotalSec), 'month'),
        heatmap:       heatmapFromDays(DAY_LABELS, CALENDAR_WEEKS[0].dates, hourMap),
      }
    }

    // ── Week view or month-drill, no day selected ────────────
    if (selectedDayIdx === null) {
      return {
        contextLabel:  `${week.label}  ·  Click a day to view details`,
        showBackBtn:   view === 'Month' && selectedWeekIdx !== null,
        overviewData: [
          { id:'screen-time', label: view === 'Month' ? 'Week Screen Time' : 'Total Screen Time',
            value:fmtSeconds(weekTotalSec), icon:'schedule', iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:week.dates.map(d => dayMap[toYMD(d)]?.totalSeconds ?? 0) },
          { id:'focus-time',  label:'Focus Time', value:fmtSeconds(weekFocusSec),
            icon:'center_focus_strong', iconBg:'bg-secondary-container/10', iconColor:'text-secondary', sparklineColor:'#89ceff', sparkline:week.dates.map(d => focusByDay[toYMD(d)] ?? 0) },
          { id:'sessions',    label:'Active Sessions', value:String(weekSessions),
            icon:'grid_view', iconBg:'bg-tertiary-container/10',  iconColor:'text-tertiary',  sparklineColor:'#ffb783', sparkline:week.dates.map(d => dayMap[toYMD(d)]?.sessionCount ?? 0) },
          { id:'daily-avg',   label:'Daily Average', value:fmtSeconds(week.dates.length ? weekTotalSec / week.dates.length : 0),
            icon:'bar_chart', iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:week.dates.map(d => dayMap[toYMD(d)]?.totalSeconds ?? 0) },
        ],
        monthBars:     view === 'Month'
          ? CALENDAR_WEEKS.map((w, wi) => {
              const totalSec = w.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0)
              return { label: w.shortLabel, fullLabel: w.label, hours: parseFloat((totalSec / 3600).toFixed(1)), focusHours: 0, weekIdx: wi }
            })
          : null,
        weekDayBars,
        selectedDayIdx: null,
        appsData:      appsDataFromUsage(weekApps),
        focusData:     DAY_LABELS.map((day, i) => ({ day, focusHours: parseFloat((dayFocusSec(i) / 3600).toFixed(2)), goal: DAILY_FOCUS_GOAL_HOURS })),
        hourlyData:    peakHoursFromKeys(week.dates.map(toYMD), hourMap),
        insightsData:  insightsForWeek(week.dates, dayMap, weekApps, hourMap, fmtSeconds(weekTotalSec), 'week'),
        heatmap:       heatmapFromDays(DAY_LABELS, week.dates, hourMap),
      }
    }

    // ── Day selected ─────────────────────────────────────────
    const dayDate   = week.dates[selectedDayIdx]
    const dayKey    = toYMD(dayDate)
    const dayLabel  = WEEKDAY_LONG(dayDate)
    const dayRow    = dayMap[dayKey]
    const dayFocus  = focusByDay[dayKey] ?? 0
    const totalSec  = dayUsage.reduce((s, a) => s + a.durationSeconds, 0)
    const sessions  = dayUsage.reduce((s, a) => s + a.sessionCount, 0)

    return {
      contextLabel:  dayLabel,
      showBackBtn:   true,
      overviewData: [
        { id:'screen-time', label:'Screen Time', value:fmtSeconds(dayRow?.totalSeconds ?? totalSec), icon:'schedule',            iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:[totalSec] },
        { id:'focus-time',  label:'Focus Time',  value:fmtSeconds(dayFocus),                        icon:'center_focus_strong', iconBg:'bg-secondary-container/10', iconColor:'text-secondary', sparklineColor:'#89ceff', sparkline:[dayFocus] },
        { id:'sessions',    label:'Active Sessions', value:String(dayRow?.sessionCount ?? sessions), icon:'grid_view',          iconBg:'bg-tertiary-container/10',  iconColor:'text-tertiary',  sparklineColor:'#ffb783', sparkline:[sessions] },
        { id:'peak',        label:'Active Apps', value:String(dayUsage.length),                     icon:'apps',                iconBg:'bg-primary-container/10',   iconColor:'text-primary',   sparklineColor:'#c0c1ff', sparkline:[dayUsage.length] },
      ],
      monthBars:     view === 'Month'
        ? CALENDAR_WEEKS.map((w, wi) => {
            const secs = w.dates.reduce((s, d) => s + (dayMap[toYMD(d)]?.totalSeconds ?? 0), 0)
            return { label: w.shortLabel, fullLabel: w.label, hours: parseFloat((secs / 3600).toFixed(1)), focusHours: 0, weekIdx: wi }
          })
        : null,
      weekDayBars,
      selectedDayIdx,
      appsData:      appsDataFromUsage(dayUsage),
      focusData:     [{ day: DAY_LABELS[selectedDayIdx], focusHours: parseFloat((dayFocus / 3600).toFixed(2)), goal: DAILY_FOCUS_GOAL_HOURS }],
      hourlyData:    peakHoursFromKeys([dayKey], hourMap),
      insightsData:  insightsForDay(dayKey, dayLabel, dayUsage, dayFocus),
      heatmap:       heatmapFromDays(DAY_LABELS, week.dates, hourMap),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedWeekIdx, selectedDayIdx, dailyRows, hourlyRows, dayUsage, weekAppsMap, focusByDay])

  return {
    view,
    selectedWeekIdx,
    selectedDayIdx,
    selectView,
    selectDay,
    selectWeek,
    goBack,
    loading,
    ...derived,
  }
}

// ─── insight builders (real data → readable observations) ────

function insightsForWeek(weekDates, dayMap, weekApps, hourMap, totalLabel, scope) {
  const insights = []
  const keys = weekDates.map(toYMD)

  let maxDaySec = 0, maxDayIdx = 0
  dayMap && keys.forEach((k, i) => {
    const sec = dayMap[k]?.totalSeconds ?? 0
    if (sec > maxDaySec) { maxDaySec = sec; maxDayIdx = i }
  })
  if (maxDaySec > 0) {
    insights.push({
      id:        'busiest-day',
      icon:      'calendar_month',
      title:     'Most Active Day',
      body:      `Your busiest day this ${scope} was ${DAY_LABELS[maxDayIdx]} with ${fmtSeconds(maxDaySec)} of screen time.`,
      highlight: DAY_LABELS[maxDayIdx],
    })
  } else {
    insights.push({
      id:        'no-data',
      icon:      'info',
      title:     'Getting Started',
      body:      'No screen time recorded yet this week. Open a few apps and check back — your insights will appear here.',
      highlight: 'No data yet',
    })
  }

  // Peak hour of activity across the period
  let maxHourSec = 0, maxHour = -1
  for (const h of HOUR_SLOTS) {
    let sec = 0
    for (const k of keys) sec += hourMap[k]?.[h] ?? 0
    if (sec > maxHourSec) { maxHourSec = sec; maxHour = h }
  }
  if (maxHour >= 0 && maxHourSec > 0) {
    insights.push({
      id:        'peak-hour',
      icon:      'schedule',
      title:     'Peak Activity Hour',
      body:      `You racked up the most screen time around ${hourLabel(maxHour)} — ${fmtSeconds(maxHourSec)} across the period.`,
      highlight: hourLabel(maxHour),
    })
  }

  // Most used app in the period
  const topApp = weekApps?.length ? weekApps[0] : null
  if (topApp) {
    insights.push({
      id:        'top-app',
      icon:      'apps',
      title:     'Most Used App',
      body:      `${topApp.application} took the most time this ${scope} at ${fmtSeconds(topApp.durationSeconds)}.`,
      highlight: topApp.application,
    })
  }

  if (insights.length < 2) {
    insights.push({
      id:        'screen-time',
      icon:      'schedule',
      title:     'Screen Time',
      body:      `You recorded ${totalLabel} of screen time across the last ${scope === 'month' ? '4 weeks' : '7 days'}.`,
      highlight: totalLabel,
    })
  }

  return insights
}

function insightsForDay(dayKey, dayLabel, dayUsage, dayFocus) {
  const insights = []
  const totalSec = dayUsage.reduce((s, a) => s + a.durationSeconds, 0)
  const topApp   = dayUsage[0]

  if (totalSec > 0) {
    insights.push({
      id:        'd-total',
      icon:      'schedule',
      title:     'Screen Time',
      body:      `You recorded ${fmtSeconds(totalSec)} of screen time on ${dayLabel}.`,
      highlight: fmtSeconds(totalSec),
    })
    insights.push({
      id:        'd-top-app',
      icon:      'apps',
      title:     'Most Used App',
      body:      `${topApp.application} accounted for the most time — ${fmtSeconds(topApp.durationSeconds)}.`,
      highlight: topApp.application,
    })
  } else {
    insights.push({
      id:        'd-empty',
      icon:      'info',
      title:     'No Activity',
      body:      `No usage was recorded on ${dayLabel}.`,
      highlight: 'No data yet',
    })
  }

  if (dayFocus > 0) {
    insights.push({
      id:        'd-focus',
      icon:      'center_focus_strong',
      title:     'Focus Time',
      body:      `You spent ${fmtSeconds(dayFocus)} in focus sessions on ${dayLabel}.`,
      highlight: fmtSeconds(dayFocus),
    })
  }

  return insights
}

export default useAnalyticsSelection