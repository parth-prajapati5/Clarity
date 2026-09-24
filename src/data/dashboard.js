/**
 * dashboard.js
 * Top-level dashboard configuration: greeting, date, system status.
 * Replace with Tauri IPC / system calls when ready.
 */

export const dashboardConfig = {
  greeting: "Good morning, Alex. You're on track today.",
  dateLabel: 'Tuesday, Oct 24',
  focusWindowAlert: 'Optimal focus window starts in 15m',
  systemHealth: 'System Health: Optimal',
  lastSync: 'Last Sync: 2 minutes ago',
  appVersion: 'v2.4.0-pro',
}

/**
 * Sidebar navigation items.
 * active: marks the currently selected route.
 */
export const navItems = [
  { id: 'dashboard',    label: 'Dashboard',   icon: 'dashboard',          active: true,  filled: true  },
  { id: 'analytics',    label: 'Analytics',   icon: 'analytics',          active: false, filled: false },
  { id: 'applications', label: 'Applications',icon: 'grid_view',          active: false, filled: false },
  { id: 'focus',        label: 'Focus',       icon: 'center_focus_strong',active: false, filled: false },
  { id: 'goals',        label: 'Goals',       icon: 'flag',               active: false, filled: false },
  { id: 'reports',      label: 'Reports',     icon: 'description',        active: false, filled: false },
  { id: 'ai-coach',     label: 'AI Coach',    icon: 'psychology',         active: false, filled: false },
]

export const restrictionNavItems = [
  { id: 'app-blocking', label: 'App Blocking', icon: 'block', active: false, filled: false },
  { id: 'website-blocking', label: 'Website Blocking', icon: 'language', active: false, filled: false },
]

export const bottomNavItems = [
  { id: 'profile', label: 'Profile', icon: 'account_circle', active: false, filled: false },
  { id: 'settings', label: 'Settings', icon: 'settings', active: false, filled: false },
]

/**
 * AI Insight card content.
 */
export const aiInsight = {
  message:
    "You're most focused before noon. Consider scheduling your deep work block for",
  highlightedTime: '9 AM tomorrow',
  hintSuffix: '.',
}
