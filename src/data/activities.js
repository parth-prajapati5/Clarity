/**
 * activities.js
 * Recent activity feed / timeline entries.
 * Replace with Tauri IPC call to the Rust event log when ready.
 */

export const recentActivities = [
  {
    id: 'act-1',
    time: '10:15 AM',
    title: 'Deep Work Session Ended',
    description: "Completed 1h 12m of focus on 'UI Architecture'.",
    dotColor: 'bg-primary',
  },
  {
    id: 'act-2',
    time: '09:00 AM',
    title: 'Deep Work Session Started',
    description: 'Active notification blocking enabled.',
    dotColor: 'bg-secondary',
  },
  {
    id: 'act-3',
    time: '08:42 AM',
    title: 'Website Blocked',
    description: "Prevented access to 'twitter.com' during focus hour.",
    dotColor: 'bg-tertiary',
  },
  {
    id: 'act-4',
    time: '08:00 AM',
    title: 'Daily Goal Set',
    description: '4 hours limit active for today.',
    dotColor: 'bg-outline-variant',
  },
]
