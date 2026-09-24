/**
 * focus.js
 * All mock data for the Focus Mode module.
 * Neutral — no judgement. Pro-gated actions are clearly marked.
 */

// ─────────────────────────────────────────────────────────────
// SESSION DURATION PRESETS
// ─────────────────────────────────────────────────────────────
export const DURATION_PRESETS = [
  { id: 'p25',  label: '25 min',  minutes: 25  },
  { id: 'p50',  label: '50 min',  minutes: 50  },
  { id: 'p60',  label: '1 hr',    minutes: 60  },
  { id: 'p90',  label: '1.5 hr',  minutes: 90  },
  { id: 'p120', label: '2 hr',    minutes: 120 },
]

export const DEFAULT_HOURS   = 1
export const DEFAULT_MINUTES = 0

// ─────────────────────────────────────────────────────────────
// BLOCKABLE APPS
// ─────────────────────────────────────────────────────────────
export const blockableApps = [
  { id: 'youtube',   name: 'YouTube',   category: 'Entertainment',  iconBg: '#FF0000', iconSymbol: 'smart_display',  checked: true  },
  { id: 'instagram', name: 'Instagram', category: 'Social Media',   iconBg: '#C13584', iconSymbol: 'photo_camera',   checked: true  },
  { id: 'discord',   name: 'Discord',   category: 'Communication',  iconBg: '#5865F2', iconSymbol: 'headset_mic',    checked: false },
  { id: 'netflix',   name: 'Netflix',   category: 'Entertainment',  iconBg: '#E50914', iconSymbol: 'movie',           checked: true  },
  { id: 'reddit',    name: 'Reddit',    category: 'Social Media',   iconBg: '#FF4500', iconSymbol: 'forum',           checked: false },
]

// ─────────────────────────────────────────────────────────────
// BLOCKABLE WEBSITES
// ─────────────────────────────────────────────────────────────
export const blockableWebsites = [
  { id: 'twitter',  name: 'x.com',          category: 'Social',         iconBg: '#000000', iconSymbol: 'alternate_email', checked: true  },
  { id: 'facebook', name: 'facebook.com',   category: 'Social',         iconBg: '#1877F2', iconSymbol: 'people',          checked: false },
  { id: 'tiktok',   name: 'tiktok.com',     category: 'Entertainment',  iconBg: '#010101', iconSymbol: 'video_library',   checked: true  },
  { id: 'twitch',   name: 'twitch.tv',      category: 'Entertainment',  iconBg: '#9146FF', iconSymbol: 'live_tv',         checked: false },
  { id: 'news',     name: 'news.ycombinator.com', category: 'News',     iconBg: '#FF6600', iconSymbol: 'newspaper',       checked: false },
]

// ─────────────────────────────────────────────────────────────
// ACTIVE SESSION MOCK (simulates an in-progress session)
// ─────────────────────────────────────────────────────────────
export const mockActiveSession = {
  name:          'Deep Work Session',
  totalSeconds:  60 * 60,        // 1 hour
  elapsedSeconds: 60 * 60 - (45 * 60 + 30), // 45:30 remaining
  startedAt:     '09:15 AM',
  endTime:       '10:15 AM',
  blockedItems: [
    { id: 'yt',   iconBg: '#FF0000', iconSymbol: 'smart_display' },
    { id: 'rd',   iconBg: '#FF4500', iconSymbol: 'forum'          },
    { id: 'ig',   iconBg: '#C13584', iconSymbol: 'photo_camera'  },
  ],
  extraCount: 7,
}

// ─────────────────────────────────────────────────────────────
// SESSION HISTORY
// ─────────────────────────────────────────────────────────────
export const sessionHistory = [
  { id: 'h1', name: 'Deep Work Session',  timeRange: 'Today, 9:15 AM – 10:15 AM',     duration: '1h 00m', completed: true  },
  { id: 'h2', name: 'Study Session',      timeRange: 'Today, 7:30 AM – 8:15 AM',      duration: '45m',    completed: true  },
  { id: 'h3', name: 'Coding Session',     timeRange: 'Yesterday, 6:00 PM – 8:00 PM',  duration: '2h 00m', completed: true  },
  { id: 'h4', name: 'Design Work',        timeRange: 'Yesterday, 2:00 PM – 3:00 PM',  duration: '1h 00m', completed: false },
  { id: 'h5', name: 'Reading Session',    timeRange: 'May 12, 10:00 AM – 11:00 AM',   duration: '1h 00m', completed: true  },
]

// ─────────────────────────────────────────────────────────────
// FEATURE HIGHLIGHTS (bottom strip)
// ─────────────────────────────────────────────────────────────
export const focusFeatures = [
  { id: 'f1', icon: 'block',        title: 'Block distractions',  sub: 'Apps & websites'   },
  { id: 'f2', icon: 'bar_chart',    title: 'Track progress',      sub: 'Session analytics' },
  { id: 'f3', icon: 'calendar_today', title: 'Build habits',      sub: 'Long-term focus'   },
]
