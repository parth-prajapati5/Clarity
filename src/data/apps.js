/**
 * apps.js
 * Top used applications data.
 * Replace with Tauri IPC call to the Rust tracking engine when ready.
 */

export const topApps = [
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication & Work',
    initial: 'S',
    bgColor: '#4A154B',
    usageLabel: '45m',
    usageMinutes: 45,
    usagePercent: 75,
    barColor: 'bg-secondary-container',
    isFocused: false,
  },
  {
    id: 'vscode',
    name: 'VS Code',
    category: 'Development • Focused',
    initial: 'V',
    bgColor: '#007ACC',
    usageLabel: '1h 12m',
    usageMinutes: 72,
    usagePercent: 95,
    barColor: 'bg-primary',
    isFocused: true,
  },
  {
    id: 'chrome',
    name: 'Chrome',
    category: 'Browsing',
    initial: 'C',
    bgColor: '#4285F4',
    usageLabel: '32m',
    usageMinutes: 32,
    usagePercent: 40,
    barColor: 'bg-tertiary-container',
    isFocused: false,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    category: 'Audio & Focus Music',
    initial: 'S',
    bgColor: '#1DB954',
    usageLabel: '16m',
    usageMinutes: 16,
    usagePercent: 25,
    barColor: 'bg-secondary-fixed-dim',
    isFocused: false,
  },
]
