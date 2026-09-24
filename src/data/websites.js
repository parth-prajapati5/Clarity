import { formatDuration } from '../services/usageApi'

/**
 * websites.js
 * All mock data for the Website Usage module.
 * Neutral — no judgement classifications.
 * Same shape as applications.js so all components are interchangeable.
 */

// ─────────────────────────────────────────────────────────────
// SUMMARY CARDS
// ─────────────────────────────────────────────────────────────
export const websiteSummaryCards = [
  {
    id: 'total-usage',
    label: 'Total Browse Time',
    value: '22h 14m',
    sub: 'This Week',
    icon: 'schedule',
  },
  {
    id: 'total-sites',
    label: 'Total Websites',
    value: '84',
    sub: 'Visited',
    icon: 'language',
  },
  {
    id: 'active-today',
    label: 'Active Today',
    value: '16',
    sub: 'Visited',
    icon: 'today',
  },
  {
    id: 'avg-daily',
    label: 'Avg. Daily Browsing',
    value: '3h 10m',
    sub: 'This Week',
    icon: 'trending_up',
  },
]

// ─────────────────────────────────────────────────────────────
// WEBSITE LIST
// weekMinutes  — used for bar width + sorting (mirrors app.weekMinutes)
// percent      — share of total browse time
// iconBg       — brand colour for the favicon circle
// iconSymbol   — material icon used as favicon fallback
// publisher    → url  (displayed under the site name)
// sessions     → pageViews
// timeline     → visit events (type: 'open' | 'close')
// location     → url  (used in the "Visit Site" action)
// ─────────────────────────────────────────────────────────────
export const websiteList = [
  {
    id: 'github',
    name: 'GitHub',
    url: 'github.com',
    category: 'Development',
    iconBg: '#24292e',
    iconSymbol: 'code',
    weekMinutes: 548,
    todayMinutes: 92,
    pageViews: 312,
    lastVisited: '8 min ago',
    lastUsedTs: Date.now() - 8 * 60 * 1000,
    percent: 38,
    weeklyBars: [
      { day: 'Mon', hours: 1.2 },
      { day: 'Tue', hours: 2.0 },
      { day: 'Wed', hours: 1.5 },
      { day: 'Thu', hours: 2.2 },
      { day: 'Fri', hours: 1.5 },
      { day: 'Sat', hours: 0.5 },
      { day: 'Sun', hours: 0.2 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 9.1 },
      { day: 'Wk 2', hours: 11.0 },
      { day: 'Wk 3', hours: 8.5 },
      { day: 'Wk 4', hours: 9.13 },
    ],
    timeline: [
      { id: 't1', time: '09:10 AM', type: 'start', label: 'Site Opened',  detail: 'github.com',  duration: null },
      { id: 't2', time: '11:05 AM', type: 'end',   label: 'Site Closed',  detail: null,          duration: '1h 55m' },
      { id: 't3', time: '01:20 PM', type: 'start', label: 'Site Opened',  detail: 'github.com',  duration: null },
      { id: 't4', time: '02:52 PM', type: 'end',   label: 'Site Closed',  detail: null,          duration: '1h 32m' },
    ],
    location: 'https://github.com',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'youtube.com',
    category: 'Video',
    iconBg: '#FF0000',
    iconSymbol: 'smart_display',
    weekMinutes: 318,
    todayMinutes: 55,
    pageViews: 128,
    lastVisited: '30 min ago',
    lastUsedTs: Date.now() - 30 * 60 * 1000,
    percent: 22,
    weeklyBars: [
      { day: 'Mon', hours: 0.6 },
      { day: 'Tue', hours: 1.0 },
      { day: 'Wed', hours: 0.8 },
      { day: 'Thu', hours: 1.2 },
      { day: 'Fri', hours: 0.9 },
      { day: 'Sat', hours: 0.5 },
      { day: 'Sun', hours: 0.3 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 5.3 },
      { day: 'Wk 2', hours: 6.5 },
      { day: 'Wk 3', hours: 4.8 },
      { day: 'Wk 4', hours: 5.3 },
    ],
    timeline: [
      { id: 't1', time: '12:00 PM', type: 'start', label: 'Site Opened', detail: 'youtube.com', duration: null },
      { id: 't2', time: '12:55 PM', type: 'end',   label: 'Site Closed', detail: null,          duration: '55m' },
    ],
    location: 'https://youtube.com',
  },
  {
    id: 'stackoverflow',
    name: 'Stack Overflow',
    url: 'stackoverflow.com',
    category: 'Development',
    iconBg: '#F48024',
    iconSymbol: 'help',
    weekMinutes: 201,
    todayMinutes: 38,
    pageViews: 224,
    lastVisited: '1h ago',
    lastUsedTs: Date.now() - 60 * 60 * 1000,
    percent: 14,
    weeklyBars: [
      { day: 'Mon', hours: 0.5 },
      { day: 'Tue', hours: 0.8 },
      { day: 'Wed', hours: 0.6 },
      { day: 'Thu', hours: 0.7 },
      { day: 'Fri', hours: 0.5 },
      { day: 'Sat', hours: 0.1 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 3.3 },
      { day: 'Wk 2', hours: 4.1 },
      { day: 'Wk 3', hours: 3.2 },
      { day: 'Wk 4', hours: 3.35 },
    ],
    timeline: [
      { id: 't1', time: '10:00 AM', type: 'start', label: 'Site Opened', detail: 'stackoverflow.com', duration: null },
      { id: 't2', time: '10:38 AM', type: 'end',   label: 'Site Closed', detail: null,               duration: '38m' },
    ],
    location: 'https://stackoverflow.com',
  },
  {
    id: 'figma-web',
    name: 'Figma',
    url: 'figma.com',
    category: 'Design',
    iconBg: '#F24E1E',
    iconSymbol: 'design_services',
    weekMinutes: 144,
    todayMinutes: 22,
    pageViews: 67,
    lastVisited: '2h ago',
    lastUsedTs: Date.now() - 120 * 60 * 1000,
    percent: 10,
    weeklyBars: [
      { day: 'Mon', hours: 0.3 },
      { day: 'Tue', hours: 0.5 },
      { day: 'Wed', hours: 0.3 },
      { day: 'Thu', hours: 0.6 },
      { day: 'Fri', hours: 0.4 },
      { day: 'Sat', hours: 0.2 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 2.4 },
      { day: 'Wk 2', hours: 3.0 },
      { day: 'Wk 3', hours: 2.2 },
      { day: 'Wk 4', hours: 2.4 },
    ],
    timeline: [
      { id: 't1', time: '02:15 PM', type: 'start', label: 'Site Opened', detail: 'figma.com', duration: null },
      { id: 't2', time: '02:37 PM', type: 'end',   label: 'Site Closed', detail: null,        duration: '22m' },
    ],
    location: 'https://figma.com',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    url: 'reddit.com',
    category: 'Social',
    iconBg: '#FF4500',
    iconSymbol: 'forum',
    weekMinutes: 115,
    todayMinutes: 18,
    pageViews: 89,
    lastVisited: '3h ago',
    lastUsedTs: Date.now() - 180 * 60 * 1000,
    percent: 8,
    weeklyBars: [
      { day: 'Mon', hours: 0.2 },
      { day: 'Tue', hours: 0.4 },
      { day: 'Wed', hours: 0.3 },
      { day: 'Thu', hours: 0.4 },
      { day: 'Fri', hours: 0.3 },
      { day: 'Sat', hours: 0.15 },
      { day: 'Sun', hours: 0.1 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 1.9 },
      { day: 'Wk 2', hours: 2.4 },
      { day: 'Wk 3', hours: 1.8 },
      { day: 'Wk 4', hours: 1.92 },
    ],
    timeline: [
      { id: 't1', time: '03:30 PM', type: 'start', label: 'Site Opened', detail: 'reddit.com', duration: null },
      { id: 't2', time: '03:48 PM', type: 'end',   label: 'Site Closed', detail: null,         duration: '18m' },
    ],
    location: 'https://reddit.com',
  },
  {
    id: 'notion-web',
    name: 'Notion',
    url: 'notion.so',
    category: 'Productivity',
    iconBg: '#000000',
    iconSymbol: 'sticky_note_2',
    weekMinutes: 72,
    todayMinutes: 12,
    pageViews: 45,
    lastVisited: '4h ago',
    lastUsedTs: Date.now() - 240 * 60 * 1000,
    percent: 5,
    weeklyBars: [
      { day: 'Mon', hours: 0.15 },
      { day: 'Tue', hours: 0.3 },
      { day: 'Wed', hours: 0.2 },
      { day: 'Thu', hours: 0.3 },
      { day: 'Fri', hours: 0.2 },
      { day: 'Sat', hours: 0.05 },
      { day: 'Sun', hours: 0.0 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 1.2 },
      { day: 'Wk 2', hours: 1.5 },
      { day: 'Wk 3', hours: 1.1 },
      { day: 'Wk 4', hours: 1.2 },
    ],
    timeline: [
      { id: 't1', time: '09:45 AM', type: 'start', label: 'Site Opened', detail: 'notion.so', duration: null },
      { id: 't2', time: '09:57 AM', type: 'end',   label: 'Site Closed', detail: null,        duration: '12m' },
    ],
    location: 'https://notion.so',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    url: 'x.com',
    category: 'Social',
    iconBg: '#000000',
    iconSymbol: 'alternate_email',
    weekMinutes: 58,
    todayMinutes: 8,
    pageViews: 72,
    lastVisited: '5h ago',
    lastUsedTs: Date.now() - 300 * 60 * 1000,
    percent: 4,
    weeklyBars: [
      { day: 'Mon', hours: 0.1 },
      { day: 'Tue', hours: 0.2 },
      { day: 'Wed', hours: 0.15 },
      { day: 'Thu', hours: 0.2 },
      { day: 'Fri', hours: 0.15 },
      { day: 'Sat', hours: 0.1 },
      { day: 'Sun', hours: 0.07 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 0.97 },
      { day: 'Wk 2', hours: 1.2 },
      { day: 'Wk 3', hours: 0.9 },
      { day: 'Wk 4', hours: 0.97 },
    ],
    timeline: [
      { id: 't1', time: '11:15 AM', type: 'start', label: 'Site Opened', detail: 'x.com', duration: null },
      { id: 't2', time: '11:23 AM', type: 'end',   label: 'Site Closed', detail: null,    duration: '8m' },
    ],
    location: 'https://x.com',
  },
  {
    id: 'docs-google',
    name: 'Google Docs',
    url: 'docs.google.com',
    category: 'Productivity',
    iconBg: '#4285F4',
    iconSymbol: 'description',
    weekMinutes: 43,
    todayMinutes: 7,
    pageViews: 28,
    lastVisited: 'Yesterday',
    lastUsedTs: Date.now() - 18 * 60 * 60 * 1000,
    percent: 3,
    weeklyBars: [
      { day: 'Mon', hours: 0.1 },
      { day: 'Tue', hours: 0.2 },
      { day: 'Wed', hours: 0.1 },
      { day: 'Thu', hours: 0.2 },
      { day: 'Fri', hours: 0.1 },
      { day: 'Sat', hours: 0 },
      { day: 'Sun', hours: 0 },
    ],
    monthlyBars: [
      { day: 'Wk 1', hours: 0.72 },
      { day: 'Wk 2', hours: 0.9 },
      { day: 'Wk 3', hours: 0.65 },
      { day: 'Wk 4', hours: 0.72 },
    ],
    timeline: [
      { id: 't1', time: '04:00 PM', type: 'start', label: 'Site Opened', detail: 'docs.google.com', duration: null },
      { id: 't2', time: '04:07 PM', type: 'end',   label: 'Site Closed', detail: null,              duration: '7m' },
    ],
    location: 'https://docs.google.com',
  },
]

// ─────────────────────────────────────────────────────────────
// HELPERS  (same signatures as applications.js)
// ─────────────────────────────────────────────────────────────
export const fmtMinutes = (totalMins) => {
  return formatDuration(totalMins * 60)
}

export const sortByUsage  = (sites) => [...sites].sort((a, b) => b.weekMinutes - a.weekMinutes)
export const sortByRecent = (sites) => [...sites].sort((a, b) => b.lastUsedTs - a.lastUsedTs)
export const sortByName   = (sites) => [...sites].sort((a, b) => a.name.localeCompare(b.name))

// Max weekMinutes in the list — used for bar widths (same as 1125 in apps)
export const MAX_WEEK_MINUTES = 548
