/**
 * settings.js — all mock data and initial state for the Settings module.
 * No hardcoded colours — only design tokens referenced in components.
 */

export const SETTINGS_SECTIONS = [
  { id: 'general',       label: 'General',          icon: 'settings'            },
  { id: 'appearance',    label: 'Appearance',        icon: 'palette'             },
  { id: 'notifications', label: 'Notifications',     icon: 'notifications'       },
  { id: 'privacy',       label: 'Privacy & Data',    icon: 'shield'              },
  { id: 'tracking',      label: 'Tracking',          icon: 'monitoring'          },
  { id: 'account',       label: 'Account',           icon: 'account_circle'      },
  { id: 'about',         label: 'About',             icon: 'info'                },
]

// ── General ────────────────────────────────────────────────
export const generalSettings = {
  launchOnStartup:   true,
  minimizeToTray:    true,
  showInTaskbar:     true,
  dailyGoalMinutes:  240,    // 4h
  weekStartDay:      'Monday',
  language:          'English',
  weekStartOptions:  ['Monday', 'Sunday', 'Saturday'],
  languageOptions:   ['English', 'German', 'French', 'Spanish', 'Japanese'],
}

// ── Appearance ─────────────────────────────────────────────
export const appearanceSettings = {
  theme:        'Dark',
  accentColor:  'Indigo',
  fontSize:     'Medium',
  compactMode:  false,
  themeOptions:       ['Dark', 'Light', 'System'],
  accentOptions:      ['Indigo', 'Violet', 'Cyan', 'Emerald', 'Rose'],
  fontSizeOptions:    ['Small', 'Medium', 'Large'],
}

// ── Notifications ──────────────────────────────────────────
export const notificationSettings = {
  dailySummary:         true,
  goalAlerts:           true,
  focusReminders:       true,
  weeklyReport:         true,
  dailySummaryTime:     '09:00 PM',
  focusReminderInterval: '30 min',
  intervalOptions:      ['15 min', '30 min', '45 min', '1 hr'],
}

// ── Privacy & Data ─────────────────────────────────────────
export const privacySettings = {
  dataCollection:       true,
  crashReports:         false,
  analyticsSharing:     false,
  localStorageOnly:     true,
  dataRetentionDays:    90,
  retentionOptions:     [30, 60, 90, 180, 365],
}

// ── Tracking ───────────────────────────────────────────────
export const trackingSettings = {
  trackIdleTime:        true,
  idleThresholdMinutes: 5,
  trackIncognito:       false,
  pauseOnScreensaver:   true,
  captureScreenshots:   false,
  idleOptions:          [2, 5, 10, 15, 30],
}

// ── Account ────────────────────────────────────────────────
export const accountData = {
  name:      'Alex Johnson',
  email:     'alex@example.com',
  plan:      'Free',
  joinDate:  'August 2025',
  avatarIcon:'account_circle',
}

// ── About ──────────────────────────────────────────────────
export const aboutData = {
  version:    '2.4.0',
  build:      '20250806',
  platform:   'Windows 11',
  license:    'Personal Use',
  website:    'clarity.app',
  changelog:  'https://clarity.app/changelog',
  support:    'https://clarity.app/support',
}
