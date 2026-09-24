import { formatDuration } from '../services/usageApi'

/**
 * applications.js
 * All mock data for the Applications module.
 * Neutral — no productivity/distraction classifications.
 * Replace with Tauri IPC / SQLite queries when backend is ready.
 */

// ─────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────
export const appSummaryCards = [
  {
    id: 'total-usage',
    label: 'Total Usage',
    value: '46h 32m',
    sub: 'This Week',
    icon: 'schedule',
    iconColor: '#6366F1',
    iconBg: 'rgba(99,102,241,0.15)',
  },
  {
    id: 'total-apps',
    label: 'Total Applications',
    value: '112',
    sub: 'Installed',
    icon: 'grid_view',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14,165,233,0.15)',
  },
  {
    id: 'active-today',
    label: 'Active Today',
    value: '28',
    sub: 'Used',
    icon: 'today',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139,92,246,0.15)',
  },
  {
    id: 'avg-daily',
    label: 'Avg. Daily Usage',
    value: '6h 38m',
    sub: 'This Week',
    icon: 'trending_up',
    iconColor: '#0EA5E9',
    iconBg: 'rgba(14,165,233,0.15)',
  },
]

// ─────────────────────────────────────────────────────────────
// APP LIST
// ─────────────────────────────────────────────────────────────
export const applicationList = [
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    publisher: 'Microsoft Corporation',
    category: 'Development',
    iconBg: '#007ACC',
    iconLetter: 'VS',
    iconSymbol: 'terminal',
    weekMinutes: 1125,   // 18h 45m
    todayMinutes: 252,   // 4h 12m
    sessions: 65,
    lastUsed: '10 min ago',
    lastUsedTs: Date.now() - 10 * 60 * 1000,
    percent: 40,
    weeklyBars: [
      { day: 'Mon', hours: 3.5 },
      { day: 'Tue', hours: 5.5 },
      { day: 'Wed', hours: 3.8 },
      { day: 'Thu', hours: 5.5 },
      { day: 'Fri', hours: 3.5 },
      { day: 'Sat', hours: 2.4 },
      { day: 'Sun', hours: 4.5 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 28 },
      { day: 'Wk 2', hours: 32 },
      { day: 'Wk 3', hours: 26 },
      { day: 'Wk 4', hours: 18.75 },
    ],
    timeline: [
      { id: 't1', time: '09:02 AM', type: 'start',  label: 'Application Started',  detail: 'Visual Studio Code',   duration: null },
      { id: 't2', time: '12:15 PM', type: 'end',    label: 'Application Closed',   detail: null,                   duration: '3h 13m' },
      { id: 't3', time: '01:45 PM', type: 'start',  label: 'Application Started',  detail: 'Visual Studio Code',   duration: null },
      { id: 't4', time: '05:10 PM', type: 'end',    label: 'Application Closed',   detail: null,                   duration: '3h 25m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Microsoft VS Code',
  },
  {
    id: 'chrome',
    name: 'Google Chrome',
    publisher: 'Google LLC',
    category: 'Browser',
    iconBg: '#4285F4',
    iconLetter: 'GC',
    iconSymbol: 'language',
    weekMinutes: 572,
    todayMinutes: 98,
    sessions: 42,
    lastUsed: '5 min ago',
    lastUsedTs: Date.now() - 5 * 60 * 1000,
    percent: 20,
    weeklyBars: [
      { day: 'Mon', hours: 1.2 },
      { day: 'Tue', hours: 2.1 },
      { day: 'Wed', hours: 1.8 },
      { day: 'Thu', hours: 2.5 },
      { day: 'Fri', hours: 1.9 },
      { day: 'Sat', hours: 0.8 },
      { day: 'Sun', hours: 1.2 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 11.5 },
      { day: 'Wk 2', hours: 14 },
      { day: 'Wk 3', hours: 10 },
      { day: 'Wk 4', hours: 9.5 },
    ],
    timeline: [
      { id: 't1', time: '08:30 AM', type: 'start', label: 'Application Started', detail: 'Google Chrome', duration: null },
      { id: 't2', time: '09:00 AM', type: 'end',   label: 'Application Closed',  detail: null,            duration: '30m' },
      { id: 't3', time: '11:00 AM', type: 'start', label: 'Application Started', detail: 'Google Chrome', duration: null },
      { id: 't4', time: '12:00 PM', type: 'end',   label: 'Application Closed',  detail: null,            duration: '1h 0m' },
    ],
    location: 'C:\\Program Files\\Google\\Chrome\\Application',
  },
  {
    id: 'spotify',
    name: 'Spotify',
    publisher: 'Spotify AB',
    category: 'Music',
    iconBg: '#1DB954',
    iconLetter: 'SP',
    iconSymbol: 'music_note',
    weekMinutes: 261,
    todayMinutes: 45,
    sessions: 18,
    lastUsed: '2h ago',
    lastUsedTs: Date.now() - 120 * 60 * 1000,
    percent: 9,
    weeklyBars: [
      { day: 'Mon', hours: 0.5 },
      { day: 'Tue', hours: 0.9 },
      { day: 'Wed', hours: 0.7 },
      { day: 'Thu', hours: 1.1 },
      { day: 'Fri', hours: 0.8 },
      { day: 'Sat', hours: 0.45 },
      { day: 'Sun', hours: 0.3 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 5.2 },
      { day: 'Wk 2', hours: 6.8 },
      { day: 'Wk 3', hours: 4.3 },
      { day: 'Wk 4', hours: 4.35 },
    ],
    timeline: [
      { id: 't1', time: '09:00 AM', type: 'start', label: 'Application Started', detail: 'Spotify', duration: null },
      { id: 't2', time: '12:15 PM', type: 'end',   label: 'Application Closed',  detail: null,      duration: '3h 15m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Roaming\\Spotify',
  },
  {
    id: 'discord',
    name: 'Discord',
    publisher: 'Discord Inc.',
    category: 'Communication',
    iconBg: '#5865F2',
    iconLetter: 'DC',
    iconSymbol: 'headset_mic',
    weekMinutes: 198,
    todayMinutes: 32,
    sessions: 22,
    lastUsed: '1h ago',
    lastUsedTs: Date.now() - 60 * 60 * 1000,
    percent: 7,
    weeklyBars: [
      { day: 'Mon', hours: 0.3 },
      { day: 'Tue', hours: 0.8 },
      { day: 'Wed', hours: 0.5 },
      { day: 'Thu', hours: 0.9 },
      { day: 'Fri', hours: 0.6 },
      { day: 'Sat', hours: 0.3 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 4.1 },
      { day: 'Wk 2', hours: 5.5 },
      { day: 'Wk 3', hours: 3.8 },
      { day: 'Wk 4', hours: 3.3 },
    ],
    timeline: [
      { id: 't1', time: '06:00 PM', type: 'start', label: 'Application Started', detail: 'Discord', duration: null },
      { id: 't2', time: '06:32 PM', type: 'end',   label: 'Application Closed',  detail: null,      duration: '32m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Local\\Discord',
  },
  {
    id: 'figma',
    name: 'Figma',
    publisher: 'Figma Inc.',
    category: 'Design',
    iconBg: '#F24E1E',
    iconLetter: 'FG',
    iconSymbol: 'design_services',
    weekMinutes: 165,
    todayMinutes: 28,
    sessions: 14,
    lastUsed: '3h ago',
    lastUsedTs: Date.now() - 180 * 60 * 1000,
    percent: 6,
    weeklyBars: [
      { day: 'Mon', hours: 0.4 },
      { day: 'Tue', hours: 0.7 },
      { day: 'Wed', hours: 0.3 },
      { day: 'Thu', hours: 0.8 },
      { day: 'Fri', hours: 0.5 },
      { day: 'Sat', hours: 0.05 },
      { day: 'Sun', hours: 0 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 3.5 },
      { day: 'Wk 2', hours: 4.2 },
      { day: 'Wk 3', hours: 3.0 },
      { day: 'Wk 4', hours: 2.75 },
    ],
    timeline: [
      { id: 't1', time: '02:00 PM', type: 'start', label: 'Application Started', detail: 'Figma', duration: null },
      { id: 't2', time: '02:28 PM', type: 'end',   label: 'Application Closed',  detail: null,    duration: '28m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Local\\Figma',
  },
  {
    id: 'notion',
    name: 'Notion',
    publisher: 'Notion Labs Inc.',
    category: 'Productivity',
    iconBg: '#000000',
    iconLetter: 'N',
    iconSymbol: 'sticky_note_2',
    weekMinutes: 132,
    todayMinutes: 18,
    sessions: 11,
    lastUsed: '4h ago',
    lastUsedTs: Date.now() - 240 * 60 * 1000,
    percent: 5,
    weeklyBars: [
      { day: 'Mon', hours: 0.2 },
      { day: 'Tue', hours: 0.5 },
      { day: 'Wed', hours: 0.4 },
      { day: 'Thu', hours: 0.6 },
      { day: 'Fri', hours: 0.3 },
      { day: 'Sat', hours: 0.1 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 2.8 },
      { day: 'Wk 2', hours: 3.2 },
      { day: 'Wk 3', hours: 2.5 },
      { day: 'Wk 4', hours: 2.2 },
    ],
    timeline: [
      { id: 't1', time: '10:00 AM', type: 'start', label: 'Application Started', detail: 'Notion', duration: null },
      { id: 't2', time: '10:18 AM', type: 'end',   label: 'Application Closed',  detail: null,     duration: '18m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Local\\Programs\\Notion',
  },
  {
    id: 'telegram',
    name: 'Telegram Desktop',
    publisher: 'Telegram FZ-LLC',
    category: 'Communication',
    iconBg: '#2AABEE',
    iconLetter: 'TG',
    iconSymbol: 'send',
    weekMinutes: 99,
    todayMinutes: 14,
    sessions: 9,
    lastUsed: '5h ago',
    lastUsedTs: Date.now() - 300 * 60 * 1000,
    percent: 4,
    weeklyBars: [
      { day: 'Mon', hours: 0.2 },
      { day: 'Tue', hours: 0.3 },
      { day: 'Wed', hours: 0.2 },
      { day: 'Thu', hours: 0.4 },
      { day: 'Fri', hours: 0.3 },
      { day: 'Sat', hours: 0.15 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 2.0 },
      { day: 'Wk 2', hours: 2.5 },
      { day: 'Wk 3', hours: 1.8 },
      { day: 'Wk 4', hours: 1.65 },
    ],
    timeline: [
      { id: 't1', time: '11:30 AM', type: 'start', label: 'Application Started', detail: 'Telegram Desktop', duration: null },
      { id: 't2', time: '11:44 AM', type: 'end',   label: 'Application Closed',  detail: null,               duration: '14m' },
    ],
    location: 'C:\\Users\\Alex\\AppData\\Roaming\\Telegram Desktop',
  },
  {
    id: 'word',
    name: 'Microsoft Word',
    publisher: 'Microsoft Corporation',
    category: 'Office',
    iconBg: '#2B579A',
    iconLetter: 'W',
    iconSymbol: 'description',
    weekMinutes: 80,
    todayMinutes: 12,
    sessions: 7,
    lastUsed: 'Yesterday',
    lastUsedTs: Date.now() - 18 * 60 * 60 * 1000,
    percent: 3,
    weeklyBars: [
      { day: 'Mon', hours: 0.15 },
      { day: 'Tue', hours: 0.4 },
      { day: 'Wed', hours: 0.2 },
      { day: 'Thu', hours: 0.35 },
      { day: 'Fri', hours: 0.2 },
      { day: 'Sat', hours: 0 },
      { day: 'Sun', hours: 0 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 1.6 },
      { day: 'Wk 2', hours: 2.0 },
      { day: 'Wk 3', hours: 1.4 },
      { day: 'Wk 4', hours: 1.33 },
    ],
    timeline: [
      { id: 't1', time: '03:00 PM', type: 'start', label: 'Application Started', detail: 'Microsoft Word', duration: null },
      { id: 't2', time: '03:12 PM', type: 'end',   label: 'Application Closed',  detail: null,             duration: '12m' },
    ],
    location: 'C:\\Program Files\\Microsoft Office\\root\\Office16',
  },
]

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
export const fmtMinutes = (totalMins) => {
  return formatDuration(totalMins * 60)
}

// Sort helpers
export const sortByUsage  = (apps) => [...apps].sort((a, b) => b.weekMinutes - a.weekMinutes)
export const sortByRecent = (apps) => [...apps].sort((a, b) => b.lastUsedTs - a.lastUsedTs)
export const sortByName   = (apps) => [...apps].sort((a, b) => a.name.localeCompare(b.name))
