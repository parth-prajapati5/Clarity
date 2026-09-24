/**
 * focusSessions.js
 * Historical focus session data used by the AI Insight heatmap
 * and the screen time trend chart.
 * Replace with Tauri IPC / SQLite queries when ready.
 */

/**
 * Heatmap blocks — each entry represents a time-of-day bucket.
 * opacity: Tailwind opacity suffix for `bg-primary/{opacity}`.
 */
export const focusHeatmap = [
  { id: 'h-1', hour: '06:00', opacityClass: 'bg-primary/10' },
  { id: 'h-2', hour: '07:00', opacityClass: 'bg-primary/20' },
  { id: 'h-3', hour: '08:00', opacityClass: 'bg-primary/60' },
  { id: 'h-4', hour: '09:00', opacityClass: 'bg-primary' },
  { id: 'h-5', hour: '10:00', opacityClass: 'bg-primary' },
  { id: 'h-6', hour: '11:00', opacityClass: 'bg-primary/70' },
  { id: 'h-7', hour: '12:00', opacityClass: 'bg-primary/40' },
  { id: 'h-8', hour: '13:00', opacityClass: 'bg-primary/10' },
  { id: 'h-9', hour: '14:00', opacityClass: 'bg-primary/5' },
  { id: 'h-10', hour: '15:00', opacityClass: 'bg-primary/10' },
]

/**
 * Hourly screen time data for the line chart.
 * minutes: total screen-time minutes recorded in that hour.
 */
export const hourlyScreenTime = [
  { time: '06:00', minutes: 5 },
  { time: '07:00', minutes: 12 },
  { time: '08:00', minutes: 35 },
  { time: '09:00', minutes: 72 },
  { time: '10:00', minutes: 68 },
  { time: '11:00', minutes: 55 },
  { time: '12:00', minutes: 40 },
  { time: '13:00', minutes: 25 },
  { time: '14:00', minutes: 48 },
  { time: '15:00', minutes: 60 },
  { time: '16:00', minutes: 52 },
  { time: '17:00', minutes: 30 },
  { time: '18:00', minutes: 18 },
  { time: '19:00', minutes: 10 },
  { time: '20:00', minutes: 8 },
  { time: '21:00', minutes: 5 },
]

/**
 * Weekly screen time data (Mon–Sun averages in minutes).
 */
export const weeklyScreenTime = [
  { day: 'Mon', minutes: 185 },
  { day: 'Tue', minutes: 210 },
  { day: 'Wed', minutes: 165 },
  { day: 'Thu', minutes: 240 },
  { day: 'Fri', minutes: 195 },
  { day: 'Sat', minutes: 280 },
  { day: 'Sun', minutes: 150 },
]
