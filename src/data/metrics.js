/**
 * metrics.js
 * Core dashboard metric cards data.
 * Replace values here when wiring to Tauri IPC / SQLite.
 */

export const heroMetric = {
  label: 'Current Screen Time',
  value: '2h 45m',
  dailyGoal: '4h',
  dailyGoalMinutes: 240,
  currentMinutes: 165,
  remainingLabel: 'Remaining: 1h 15m',
  percentageUsed: 68,
}

export const secondaryMetrics = [
  {
    id: 'focus-time',
    label: 'Focus Time',
    value: '1h 12m',
    delta: '+12% vs yesterday',
    deltaPositive: true,
    icon: 'timer',
    iconColor: 'text-primary',
    iconBg: 'bg-primary-container/10',
  },
  {
    id: 'productivity-score',
    label: 'Productivity Score',
    value: '82',
    delta: 'Tier: High',
    deltaPositive: true,
    icon: 'auto_graph',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary-container/10',
  },
  {
    id: 'daily-streak',
    label: 'Daily Streak',
    value: '12 days',
    delta: null,
    deltaPositive: null,
    icon: 'local_fire_department',
    iconColor: 'text-secondary',
    iconBg: 'bg-secondary-container/10',
    showStreakDots: true,
  },
  {
    id: 'goal-progress',
    label: 'Goal Progress',
    value: '65%',
    delta: '3/5 Complete',
    deltaPositive: null,
    icon: 'checklist',
    iconColor: 'text-on-surface',
    iconBg: 'bg-outline-variant/20',
  },
]
