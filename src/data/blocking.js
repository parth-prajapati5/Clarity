/**
 * blocking.js — mock data for the Blocking module.
 * Neutral language. No productivity judgements.
 */

// ── Summary cards ──────────────────────────────────────────
export const blockingSummaryCards = [
  { id: 'blocked-apps',  label: 'Blocked Apps',      value: '12', sub: '3 active now',        icon: 'block',        iconBg: 'bg-error-container/15',   iconClass: 'text-error'     },
  { id: 'blocked-sites', label: 'Blocked Websites',  value: '8',  sub: '2 active now',        icon: 'language',     iconBg: 'bg-secondary-container/10',iconClass: 'text-secondary' },
  { id: 'active-limits', label: 'Active Limits',     value: '5',  sub: '2 apps, 3 websites',  icon: 'schedule',     iconBg: 'bg-tertiary-container/10', iconClass: 'text-tertiary'  },
  { id: 'scheduled',     label: 'Scheduled Blocks',  value: '3',  sub: '2 active today',      icon: 'calendar_today',iconBg:'bg-primary-container/10',  iconClass: 'text-primary'   },
]

// ── Status badge config ────────────────────────────────────
export const STATUS_STYLES = {
  Blocked:   { bg: 'bg-error-container/20',          text: 'text-error',     label: 'Blocked'   },
  Scheduled: { bg: 'bg-tertiary-container/20',       text: 'text-tertiary',  label: 'Scheduled' },
  Limit:     { bg: 'bg-secondary-container/15',      text: 'text-secondary', label: 'Limit'     },
  Allowed:   { bg: 'bg-surface-variant',             text: 'text-outline',   label: 'Allowed'   },
}

// ── Blockable applications ─────────────────────────────────
export const blockingApps = [
  { id: 'youtube',  name: 'YouTube',           category: 'Entertainment',  iconBg: '#FF0000', iconSymbol: 'smart_display',  status: 'Blocked',   limitSchedule: 'Always',           toggleOn: true  },
  { id: 'instagram',name: 'Instagram',         category: 'Social Media',   iconBg: '#C13584', iconSymbol: 'photo_camera',   status: 'Blocked',   limitSchedule: '8:00 PM – 10:00 PM\nWeekdays', toggleOn: true  },
  { id: 'discord',  name: 'Discord',           category: 'Communication',  iconBg: '#5865F2', iconSymbol: 'headset_mic',    status: 'Scheduled', limitSchedule: '9:00 PM – 7:00 AM\nDaily',     toggleOn: true  },
  { id: 'netflix',  name: 'Netflix',           category: 'Entertainment',  iconBg: '#E50914', iconSymbol: 'movie',           status: 'Limit',     limitSchedule: '1h 30m / day\nDaily',          toggleOn: true  },
  { id: 'spotify',  name: 'Spotify',           category: 'Music',          iconBg: '#1DB954', iconSymbol: 'music_note',     status: 'Limit',     limitSchedule: '2h / day\nDaily',              toggleOn: true  },
  { id: 'chrome',   name: 'Chrome',            category: 'Browser',        iconBg: '#4285F4', iconSymbol: 'language',       status: 'Allowed',   limitSchedule: 'No limit',         toggleOn: false },
  { id: 'vscode',   name: 'Visual Studio Code',category: 'Development',    iconBg: '#007ACC', iconSymbol: 'terminal',       status: 'Allowed',   limitSchedule: 'No limit',         toggleOn: false },
]

// ── Blockable websites ─────────────────────────────────────
export const blockingWebsites = [
  { id: 'twitter',  name: 'x.com',         category: 'Social',         iconBg: '#000000', iconSymbol: 'alternate_email', status: 'Blocked',   limitSchedule: 'Always',                       toggleOn: true  },
  { id: 'facebook', name: 'facebook.com',  category: 'Social',         iconBg: '#1877F2', iconSymbol: 'people',          status: 'Scheduled', limitSchedule: '9:00 PM – 7:00 AM\nDaily',     toggleOn: true  },
  { id: 'tiktok',   name: 'tiktok.com',    category: 'Entertainment',  iconBg: '#010101', iconSymbol: 'video_library',   status: 'Blocked',   limitSchedule: 'Always',                       toggleOn: true  },
  { id: 'reddit',   name: 'reddit.com',    category: 'Social',         iconBg: '#FF4500', iconSymbol: 'forum',           status: 'Limit',     limitSchedule: '1h / day\nDaily',              toggleOn: true  },
  { id: 'twitch',   name: 'twitch.tv',     category: 'Entertainment',  iconBg: '#9146FF', iconSymbol: 'live_tv',         status: 'Allowed',   limitSchedule: 'No limit',                     toggleOn: false },
]

// ── Active blocking rules (right panel) ───────────────────
export const activeRules = [
  { id: 'r1', name: 'YouTube',      sub: 'Blocked',     schedule: 'Always',                        iconBg: '#FF0000', iconSymbol: 'smart_display',  statusKey: 'Blocked'   },
  { id: 'r2', name: 'Instagram',    sub: 'Blocked',     schedule: '8:00 PM – 10:00 PM\nWeekdays',  iconBg: '#C13584', iconSymbol: 'photo_camera',   statusKey: 'Blocked'   },
  { id: 'r3', name: 'Discord',      sub: 'Scheduled',   schedule: '9:00 PM – 7:00 AM\nDaily',      iconBg: '#5865F2', iconSymbol: 'headset_mic',    statusKey: 'Scheduled' },
  { id: 'r4', name: 'Spotify',      sub: 'Daily Limit', schedule: '2h / day\nDaily',               iconBg: '#1DB954', iconSymbol: 'music_note',     statusKey: 'Limit'     },
  { id: 'r5', name: 'reddit.com',   sub: 'Blocked',     schedule: 'Always',                        iconBg: '#FF4500', iconSymbol: 'forum',           statusKey: 'Blocked'   },
]
