/**
 * analytics.js
 * Complete mock data store for the Analytics module.
 * Structure: per-day snapshots organised into weeks and months.
 * All language is neutral — no productivity/distraction judgements.
 * Replace exports with Tauri IPC calls when backend is ready.
 */

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const mins = (h, m = 0) => h * 60 + m

/** Format minutes → "Xh Ym" or "Ym" */
export const fmtDuration = (totalMins) => {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

// ─────────────────────────────────────────────────────────────
// APP REGISTRY  (icon + colour shared across all days)
// ─────────────────────────────────────────────────────────────
export const APP_META = {
  'VS Code':  { icon: 'terminal',      iconBg: '#0066FF', color: '#c0c1ff' },
  'Chrome':   { icon: 'language',      iconBg: '#4285F4', color: '#89ceff' },
  'YouTube':  { icon: 'smart_display', iconBg: '#FF0000', color: '#ffb783' },
  'Discord':  { icon: 'headset_mic',   iconBg: '#5865F2', color: '#c0c1ff' },
  'Spotify':  { icon: 'music_note',    iconBg: '#1DB954', color: '#89ceff' },
  'Slack':    { icon: 'forum',         iconBg: '#4A154B', color: '#ffb783' },
  'Notion':   { icon: 'sticky_note_2', iconBg: '#000000', color: '#c7c4d7' },
  'Other':    { icon: 'apps',          iconBg: '#34343d', color: '#908fa0' },
}

// ─────────────────────────────────────────────────────────────
// PER-DAY SNAPSHOT  (the atomic unit of all analytics data)
// Each day has: overview cards, app usage, hourly activity,
//               focus hours, peak hours data, AI insights.
// ─────────────────────────────────────────────────────────────

/**
 * createDay(date, screenMins, focusMins, apps, hourlyScores, insights)
 * apps: [{ app, minutes, prevMinutes }]
 */
const createDay = (dateLabel, screenMins, focusMins, apps, hourlyScores, insights) => {
  const totalAppMins = apps.reduce((s, a) => s + a.minutes, 0)
  const peakHour = hourlyScores.reduce((best, h) => h.score > best.score ? h : best, hourlyScores[0])

  return {
    dateLabel,                // e.g. "Thursday, 7 Aug 2025"
    overview: [
      {
        id: 'screen-time',
        label: 'Screen Time',
        value: fmtDuration(screenMins),
        rawMinutes: screenMins,
        icon: 'schedule',
        iconBg: 'bg-primary-container/10',
        iconColor: 'text-primary',
        sparklineColor: '#c0c1ff',
      },
      {
        id: 'focus-time',
        label: 'Focus Time',
        value: fmtDuration(focusMins),
        rawMinutes: focusMins,
        icon: 'center_focus_strong',
        iconBg: 'bg-secondary-container/10',
        iconColor: 'text-secondary',
        sparklineColor: '#89ceff',
      },
      {
        id: 'sessions',
        label: 'Active Sessions',
        value: String(Math.round(screenMins / 45)),
        rawMinutes: null,
        icon: 'grid_view',
        iconBg: 'bg-tertiary-container/10',
        iconColor: 'text-tertiary',
        sparklineColor: '#ffb783',
      },
      {
        id: 'peak',
        label: 'Peak Hour',
        value: peakHour?.hour ?? '—',
        rawMinutes: null,
        icon: 'av_timer',
        iconBg: 'bg-primary-container/10',
        iconColor: 'text-primary',
        sparklineColor: '#c0c1ff',
      },
    ],
    apps: apps.map((a) => ({
      ...a,
      percent: Math.round((a.minutes / totalAppMins) * 100),
      ...(APP_META[a.app] ?? APP_META['Other']),
    })).sort((a, b) => b.minutes - a.minutes),
    hourly: hourlyScores,   // [{ hour:'9 AM', score:0-100, minutes }]
    focusHours: focusMins / 60,
    insights,
  }
}

// ─────────────────────────────────────────────────────────────
// WEEK 1  (current week: Mon 4 Aug – Sun 10 Aug 2025)
// ─────────────────────────────────────────────────────────────
const W1_MON = createDay('Monday, 4 Aug 2025', mins(4,30), mins(2,10),
  [{ app:'VS Code', minutes:mins(2,0), prevMinutes:mins(1,45) },
   { app:'Chrome',  minutes:mins(1,0), prevMinutes:mins(1,10) },
   { app:'Slack',   minutes:mins(0,45),prevMinutes:mins(0,50) },
   { app:'Spotify', minutes:mins(0,30),prevMinutes:mins(0,25) },
   { app:'Other',   minutes:mins(0,15),prevMinutes:mins(0,20) }],
  [{ hour:'6 AM',score:10 },{ hour:'7 AM',score:20 },{ hour:'8 AM',score:45 },
   { hour:'9 AM',score:85 },{ hour:'10 AM',score:90 },{ hour:'11 AM',score:80 },
   { hour:'12 PM',score:55 },{ hour:'1 PM',score:40 },{ hour:'2 PM',score:65 },
   { hour:'3 PM',score:60 },{ hour:'4 PM',score:50 },{ hour:'5 PM',score:30 },
   { hour:'6 PM',score:15 },{ hour:'7 PM',score:10 },{ hour:'8 PM',score:20 },{ hour:'9 PM',score:10 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 4h 30m today. Your most active period was between 9 AM and 11 AM.', highlight:'4h 30m total' },
   { id:'i2', icon:'apps', title:'Most Used App',
     body:'VS Code accounted for 44% of your screen time today — 2h of active use.', highlight:'VS Code · 44%' }])

const W1_TUE = createDay('Tuesday, 5 Aug 2025', mins(6,15), mins(3,25),
  [{ app:'VS Code', minutes:mins(3,0), prevMinutes:mins(2,0) },
   { app:'Chrome',  minutes:mins(1,30),prevMinutes:mins(1,0) },
   { app:'YouTube', minutes:mins(0,45),prevMinutes:mins(1,0) },
   { app:'Slack',   minutes:mins(0,40),prevMinutes:mins(0,45) },
   { app:'Other',   minutes:mins(0,20),prevMinutes:mins(0,15) }],
  [{ hour:'6 AM',score:5  },{ hour:'7 AM',score:15 },{ hour:'8 AM',score:50 },
   { hour:'9 AM',score:95 },{ hour:'10 AM',score:98 },{ hour:'11 AM',score:88 },
   { hour:'12 PM',score:60 },{ hour:'1 PM',score:42 },{ hour:'2 PM',score:75 },
   { hour:'3 PM',score:80 },{ hour:'4 PM',score:68 },{ hour:'5 PM',score:35 },
   { hour:'6 PM',score:20 },{ hour:'7 PM',score:30 },{ hour:'8 PM',score:45 },{ hour:'9 PM',score:20 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 6h 15m today — your highest so far this week.', highlight:'6h 15m total' },
   { id:'i2', icon:'trending_up', title:'VS Code Usage Up',
     body:'VS Code usage increased by 50% compared to Monday — 3h today vs 2h on Monday.', highlight:'+50% vs Monday' }])

const W1_WED = createDay('Wednesday, 6 Aug 2025', mins(3,50), mins(2,45),
  [{ app:'VS Code', minutes:mins(2,10),prevMinutes:mins(3,0) },
   { app:'Notion',  minutes:mins(0,50),prevMinutes:mins(0,30) },
   { app:'Chrome',  minutes:mins(0,30),prevMinutes:mins(1,30) },
   { app:'Spotify', minutes:mins(0,15),prevMinutes:mins(0,20) },
   { app:'Other',   minutes:mins(0,5), prevMinutes:mins(0,10) }],
  [{ hour:'6 AM',score:0  },{ hour:'7 AM',score:5  },{ hour:'8 AM',score:35 },
   { hour:'9 AM',score:78 },{ hour:'10 AM',score:82 },{ hour:'11 AM',score:75 },
   { hour:'12 PM',score:50 },{ hour:'1 PM',score:30 },{ hour:'2 PM',score:58 },
   { hour:'3 PM',score:55 },{ hour:'4 PM',score:40 },{ hour:'5 PM',score:20 },
   { hour:'6 PM',score:10 },{ hour:'7 PM',score:5  },{ hour:'8 PM',score:10 },{ hour:'9 PM',score:5 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 3h 50m today — less than Tuesday.', highlight:'3h 50m total' },
   { id:'i2', icon:'sticky_note_2', title:'Notion Usage Up',
     body:'Notion usage increased to 50m today, up from 30m the previous day.', highlight:'Notion · +67%' }])

const W1_THU = createDay('Thursday, 7 Aug 2025', mins(7,10), mins(4,15),
  [{ app:'VS Code', minutes:mins(3,30),prevMinutes:mins(2,10) },
   { app:'Chrome',  minutes:mins(1,40),prevMinutes:mins(0,30) },
   { app:'Slack',   minutes:mins(1,0), prevMinutes:mins(0,40) },
   { app:'YouTube', minutes:mins(0,40),prevMinutes:mins(0,45) },
   { app:'Other',   minutes:mins(0,20),prevMinutes:mins(0,5)  }],
  [{ hour:'6 AM',score:0  },{ hour:'7 AM',score:25 },{ hour:'8 AM',score:55 },
   { hour:'9 AM',score:92 },{ hour:'10 AM',score:96 },{ hour:'11 AM',score:90 },
   { hour:'12 PM',score:62 },{ hour:'1 PM',score:48 },{ hour:'2 PM',score:78 },
   { hour:'3 PM',score:82 },{ hour:'4 PM',score:70 },{ hour:'5 PM',score:40 },
   { hour:'6 PM',score:22 },{ hour:'7 PM',score:15 },{ hour:'8 PM',score:28 },{ hour:'9 PM',score:12 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'Your screen time reached 7h 10m today — the highest day this week.', highlight:'7h 10m total' },
   { id:'i2', icon:'av_timer', title:'Peak Activity Window',
     body:'Your highest activity was recorded between 9 AM and 12 PM, with a peak score of 96 at 10 AM.', highlight:'9 AM – 12 PM peak' }])

const W1_FRI = createDay('Friday, 8 Aug 2025', mins(5,30), mins(3,0),
  [{ app:'VS Code', minutes:mins(2,20),prevMinutes:mins(3,30) },
   { app:'Chrome',  minutes:mins(1,20),prevMinutes:mins(1,40) },
   { app:'YouTube', minutes:mins(1,0), prevMinutes:mins(0,40) },
   { app:'Slack',   minutes:mins(0,35),prevMinutes:mins(1,0)  },
   { app:'Other',   minutes:mins(0,15),prevMinutes:mins(0,20) }],
  [{ hour:'6 AM',score:5  },{ hour:'7 AM',score:18 },{ hour:'8 AM',score:48 },
   { hour:'9 AM',score:88 },{ hour:'10 AM',score:85 },{ hour:'11 AM',score:78 },
   { hour:'12 PM',score:58 },{ hour:'1 PM',score:42 },{ hour:'2 PM',score:65 },
   { hour:'3 PM',score:60 },{ hour:'4 PM',score:52 },{ hour:'5 PM',score:38 },
   { hour:'6 PM',score:25 },{ hour:'7 PM',score:20 },{ hour:'8 PM',score:35 },{ hour:'9 PM',score:18 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 5h 30m today. Chrome usage was 1h 20m.', highlight:'5h 30m total' },
   { id:'i2', icon:'smart_display', title:'YouTube Usage',
     body:'YouTube usage increased to 1h today compared to 40m on Thursday.', highlight:'YouTube · 1h today' }])

const W1_SAT = createDay('Saturday, 9 Aug 2025', mins(8,0), mins(1,30),
  [{ app:'YouTube', minutes:mins(2,30),prevMinutes:mins(1,0) },
   { app:'Chrome',  minutes:mins(2,0), prevMinutes:mins(1,20) },
   { app:'Discord', minutes:mins(1,30),prevMinutes:mins(0,30) },
   { app:'Spotify', minutes:mins(1,0), prevMinutes:mins(0,45) },
   { app:'Other',   minutes:mins(1,0), prevMinutes:mins(0,45) }],
  [{ hour:'6 AM',score:0  },{ hour:'7 AM',score:0  },{ hour:'8 AM',score:10 },
   { hour:'9 AM',score:25 },{ hour:'10 AM',score:40 },{ hour:'11 AM',score:55 },
   { hour:'12 PM',score:70 },{ hour:'1 PM',score:75 },{ hour:'2 PM',score:80 },
   { hour:'3 PM',score:72 },{ hour:'4 PM',score:65 },{ hour:'5 PM',score:55 },
   { hour:'6 PM',score:48 },{ hour:'7 PM',score:42 },{ hour:'8 PM',score:60 },{ hour:'9 PM',score:38 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 8h 0m today. Your peak activity shifted to the afternoon on this day.', highlight:'8h 0m total' },
   { id:'i2', icon:'headset_mic', title:'Discord Usage',
     body:'Discord accounted for 1h 30m of use today — your highest Discord session this week.', highlight:'Discord · 1h 30m' }])

const W1_SUN = createDay('Sunday, 10 Aug 2025', mins(3,15), mins(1,10),
  [{ app:'YouTube', minutes:mins(1,10),prevMinutes:mins(2,30) },
   { app:'Chrome',  minutes:mins(0,55),prevMinutes:mins(2,0)  },
   { app:'Spotify', minutes:mins(0,45),prevMinutes:mins(1,0)  },
   { app:'Discord', minutes:mins(0,25),prevMinutes:mins(1,30) }],
  [{ hour:'6 AM',score:0  },{ hour:'7 AM',score:0  },{ hour:'8 AM',score:5  },
   { hour:'9 AM',score:15 },{ hour:'10 AM',score:30 },{ hour:'11 AM',score:42 },
   { hour:'12 PM',score:50 },{ hour:'1 PM',score:48 },{ hour:'2 PM',score:40 },
   { hour:'3 PM',score:35 },{ hour:'4 PM',score:28 },{ hour:'5 PM',score:20 },
   { hour:'6 PM',score:18 },{ hour:'7 PM',score:25 },{ hour:'8 PM',score:30 },{ hour:'9 PM',score:22 }],
  [{ id:'i1', icon:'schedule', title:'Screen Time',
     body:'You used your screen for 3h 15m today — your lowest day this week.', highlight:'3h 15m total' },
   { id:'i2', icon:'smart_display', title:'YouTube Usage',
     body:'YouTube usage dropped to 1h 10m today compared to 2h 30m on Saturday.', highlight:'YouTube · −53%' }])

// ─────────────────────────────────────────────────────────────
// WEEK 2  (Mon 28 Jul – Sun 3 Aug 2025)
// ─────────────────────────────────────────────────────────────
const makeSimpleDay = (label, screenMins, focusMins, appsArr, topHour) =>
  createDay(label, screenMins, focusMins, appsArr,
    [{ hour:'8 AM',score:30 },{ hour:'9 AM',score:70+(topHour==='9 AM'?20:0) },
     { hour:'10 AM',score:topHour==='10 AM'?95:75 },{ hour:'11 AM',score:65 },
     { hour:'12 PM',score:50 },{ hour:'1 PM',score:38 },{ hour:'2 PM',score:60 },
     { hour:'3 PM',score:55 },{ hour:'4 PM',score:45 },{ hour:'5 PM',score:28 },
     { hour:'6 PM',score:15 },{ hour:'7 PM',score:12 },{ hour:'8 PM',score:20 },{ hour:'9 PM',score:8 }],
    [{ id:'i1', icon:'schedule', title:'Screen Time',
       body:`You used your screen for ${fmtDuration(screenMins)} on this day.`, highlight:`${fmtDuration(screenMins)} total` },
     { id:'i2', icon:'av_timer', title:'Peak Activity',
       body:`Your highest activity was recorded around ${topHour}.`, highlight:`Peak at ${topHour}` }])

const W2_DAYS = [
  makeSimpleDay('Monday, 28 Jul 2025',    mins(5,0), mins(2,30), [{ app:'VS Code',minutes:mins(2,15),prevMinutes:mins(2,0)},{ app:'Chrome',minutes:mins(1,20),prevMinutes:mins(1,10)},{ app:'Slack',minutes:mins(1,0),prevMinutes:mins(0,55)},{ app:'Other',minutes:mins(0,25),prevMinutes:mins(0,20)}], '10 AM'),
  makeSimpleDay('Tuesday, 29 Jul 2025',   mins(5,45),mins(3,10), [{ app:'VS Code',minutes:mins(2,40),prevMinutes:mins(2,15)},{ app:'Chrome',minutes:mins(1,30),prevMinutes:mins(1,20)},{ app:'Discord',minutes:mins(0,55),prevMinutes:mins(0,40)},{ app:'Other',minutes:mins(0,40),prevMinutes:mins(0,30)}], '9 AM'),
  makeSimpleDay('Wednesday, 30 Jul 2025', mins(4,20),mins(2,50), [{ app:'VS Code',minutes:mins(1,55),prevMinutes:mins(2,40)},{ app:'Notion',minutes:mins(1,10),prevMinutes:mins(0,40)},{ app:'Chrome',minutes:mins(0,55),prevMinutes:mins(1,30)},{ app:'Other',minutes:mins(0,20),prevMinutes:mins(0,15)}], '10 AM'),
  makeSimpleDay('Thursday, 31 Jul 2025',  mins(6,50),mins(3,55), [{ app:'VS Code',minutes:mins(3,10),prevMinutes:mins(1,55)},{ app:'Chrome',minutes:mins(1,50),prevMinutes:mins(0,55)},{ app:'Slack',minutes:mins(1,0),prevMinutes:mins(0,45)},{ app:'Other',minutes:mins(0,50),prevMinutes:mins(0,20)}], '10 AM'),
  makeSimpleDay('Friday, 1 Aug 2025',     mins(5,10),mins(2,40), [{ app:'VS Code',minutes:mins(2,10),prevMinutes:mins(3,10)},{ app:'YouTube',minutes:mins(1,20),prevMinutes:mins(0,50)},{ app:'Chrome',minutes:mins(1,0),prevMinutes:mins(1,50)},{ app:'Other',minutes:mins(0,40),prevMinutes:mins(0,20)}], '9 AM'),
  makeSimpleDay('Saturday, 2 Aug 2025',   mins(7,30),mins(1,0),  [{ app:'YouTube',minutes:mins(2,20),prevMinutes:mins(1,0)},{ app:'Chrome',minutes:mins(1,50),prevMinutes:mins(1,0)},{ app:'Discord',minutes:mins(1,40),prevMinutes:mins(0,40)},{ app:'Spotify',minutes:mins(1,40),prevMinutes:mins(0,30)}], '2 PM'),
  makeSimpleDay('Sunday, 3 Aug 2025',     mins(3,0), mins(0,50), [{ app:'Chrome',minutes:mins(1,10),prevMinutes:mins(1,50)},{ app:'YouTube',minutes:mins(1,0),prevMinutes:mins(2,20)},{ app:'Spotify',minutes:mins(0,50),prevMinutes:mins(1,40)}], '12 PM'),
]

// ─────────────────────────────────────────────────────────────
// WEEK 3  (Mon 21 Jul – Sun 27 Jul 2025)
// ─────────────────────────────────────────────────────────────
const W3_DAYS = [
  makeSimpleDay('Monday, 21 Jul 2025',    mins(4,45),mins(2,0),  [{ app:'VS Code',minutes:mins(2,0),prevMinutes:mins(1,50)},{ app:'Chrome',minutes:mins(1,15),prevMinutes:mins(1,10)},{ app:'Slack',minutes:mins(1,0),prevMinutes:mins(0,50)},{ app:'Other',minutes:mins(0,30),prevMinutes:mins(0,20)}], '9 AM'),
  makeSimpleDay('Tuesday, 22 Jul 2025',   mins(5,30),mins(3,0),  [{ app:'VS Code',minutes:mins(2,30),prevMinutes:mins(2,0)},{ app:'Chrome',minutes:mins(1,20),prevMinutes:mins(1,15)},{ app:'Discord',minutes:mins(1,0),prevMinutes:mins(0,40)},{ app:'Other',minutes:mins(0,40),prevMinutes:mins(0,20)}], '10 AM'),
  makeSimpleDay('Wednesday, 23 Jul 2025', mins(4,0), mins(2,30), [{ app:'VS Code',minutes:mins(1,50),prevMinutes:mins(2,30)},{ app:'Notion',minutes:mins(1,0),prevMinutes:mins(0,50)},{ app:'Chrome',minutes:mins(0,50),prevMinutes:mins(1,20)},{ app:'Other',minutes:mins(0,20),prevMinutes:mins(0,10)}], '10 AM'),
  makeSimpleDay('Thursday, 24 Jul 2025',  mins(6,40),mins(3,45), [{ app:'VS Code',minutes:mins(3,0),prevMinutes:mins(1,50)},{ app:'Chrome',minutes:mins(1,50),prevMinutes:mins(0,50)},{ app:'Slack',minutes:mins(1,0),prevMinutes:mins(0,40)},{ app:'Other',minutes:mins(0,50),prevMinutes:mins(0,20)}], '10 AM'),
  makeSimpleDay('Friday, 25 Jul 2025',    mins(5,0), mins(2,30), [{ app:'VS Code',minutes:mins(2,0),prevMinutes:mins(3,0)},{ app:'YouTube',minutes:mins(1,20),prevMinutes:mins(0,50)},{ app:'Chrome',minutes:mins(1,0),prevMinutes:mins(1,50)},{ app:'Other',minutes:mins(0,40),prevMinutes:mins(0,15)}], '9 AM'),
  makeSimpleDay('Saturday, 26 Jul 2025',  mins(7,0), mins(1,0),  [{ app:'YouTube',minutes:mins(2,10),prevMinutes:mins(1,0)},{ app:'Chrome',minutes:mins(1,45),prevMinutes:mins(1,0)},{ app:'Discord',minutes:mins(1,35),prevMinutes:mins(0,50)},{ app:'Spotify',minutes:mins(1,30),prevMinutes:mins(0,30)}], '2 PM'),
  makeSimpleDay('Sunday, 27 Jul 2025',    mins(2,50),mins(0,45), [{ app:'Chrome',minutes:mins(1,10),prevMinutes:mins(1,45)},{ app:'YouTube',minutes:mins(0,55),prevMinutes:mins(2,10)},{ app:'Spotify',minutes:mins(0,45),prevMinutes:mins(1,30)}], '12 PM'),
]

// ─────────────────────────────────────────────────────────────
// WEEK 4  (Mon 14 Jul – Sun 20 Jul 2025)
// ─────────────────────────────────────────────────────────────
const W4_DAYS = [
  makeSimpleDay('Monday, 14 Jul 2025',    mins(4,15),mins(1,55), [{ app:'VS Code',minutes:mins(1,55),prevMinutes:mins(1,50)},{ app:'Chrome',minutes:mins(1,10),prevMinutes:mins(1,10)},{ app:'Slack',minutes:mins(0,55),prevMinutes:mins(0,50)},{ app:'Other',minutes:mins(0,15),prevMinutes:mins(0,20)}], '9 AM'),
  makeSimpleDay('Tuesday, 15 Jul 2025',   mins(5,15),mins(2,50), [{ app:'VS Code',minutes:mins(2,20),prevMinutes:mins(1,55)},{ app:'Chrome',minutes:mins(1,15),prevMinutes:mins(1,10)},{ app:'Discord',minutes:mins(0,55),prevMinutes:mins(0,40)},{ app:'Other',minutes:mins(0,45),prevMinutes:mins(0,20)}], '10 AM'),
  makeSimpleDay('Wednesday, 16 Jul 2025', mins(3,45),mins(2,20), [{ app:'VS Code',minutes:mins(1,40),prevMinutes:mins(2,20)},{ app:'Notion',minutes:mins(0,55),prevMinutes:mins(0,50)},{ app:'Chrome',minutes:mins(0,45),prevMinutes:mins(1,15)},{ app:'Other',minutes:mins(0,25),prevMinutes:mins(0,10)}], '10 AM'),
  makeSimpleDay('Thursday, 17 Jul 2025',  mins(6,20),mins(3,30), [{ app:'VS Code',minutes:mins(2,50),prevMinutes:mins(1,40)},{ app:'Chrome',minutes:mins(1,45),prevMinutes:mins(0,45)},{ app:'Slack',minutes:mins(0,55),prevMinutes:mins(0,40)},{ app:'Other',minutes:mins(0,50),prevMinutes:mins(0,25)}], '10 AM'),
  makeSimpleDay('Friday, 18 Jul 2025',    mins(4,50),mins(2,20), [{ app:'VS Code',minutes:mins(1,55),prevMinutes:mins(2,50)},{ app:'YouTube',minutes:mins(1,15),prevMinutes:mins(0,50)},{ app:'Chrome',minutes:mins(0,55),prevMinutes:mins(1,45)},{ app:'Other',minutes:mins(0,45),prevMinutes:mins(0,15)}], '9 AM'),
  makeSimpleDay('Saturday, 19 Jul 2025',  mins(6,40),mins(0,55), [{ app:'YouTube',minutes:mins(2,0),prevMinutes:mins(0,55)},{ app:'Chrome',minutes:mins(1,40),prevMinutes:mins(0,55)},{ app:'Discord',minutes:mins(1,30),prevMinutes:mins(0,50)},{ app:'Spotify',minutes:mins(1,30),prevMinutes:mins(0,30)}], '2 PM'),
  makeSimpleDay('Sunday, 20 Jul 2025',    mins(2,40),mins(0,40), [{ app:'Chrome',minutes:mins(1,5),prevMinutes:mins(1,40)},{ app:'YouTube',minutes:mins(0,50),prevMinutes:mins(2,0)},{ app:'Spotify',minutes:mins(0,45),prevMinutes:mins(1,30)}], '12 PM'),
]

// ─────────────────────────────────────────────────────────────
// WEEK SUMMARIES  (used by week/month bar charts)
// ─────────────────────────────────────────────────────────────
const weekSummary = (label, shortLabel, days) => ({
  label,
  shortLabel,
  days,
  totalScreenMins: days.reduce((s, d) => s + d.overview[0].rawMinutes, 0),
  totalFocusMins:  days.reduce((s, d) => s + d.overview[1].rawMinutes, 0),
  avgScreenMins:   Math.round(days.reduce((s, d) => s + d.overview[0].rawMinutes, 0) / days.length),
})

const WEEK_DAYS_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export const WEEKS = [
  weekSummary('Week 1 · 4–10 Aug',  'Wk 1', [W1_MON, W1_TUE, W1_WED, W1_THU, W1_FRI, W1_SAT, W1_SUN]),
  weekSummary('Week 2 · 28 Jul–3 Aug','Wk 2', W2_DAYS),
  weekSummary('Week 3 · 21–27 Jul', 'Wk 3', W3_DAYS),
  weekSummary('Week 4 · 14–20 Jul', 'Wk 4', W4_DAYS),
]

// Current week is index 0
export const CURRENT_WEEK_IDX = 0

// Day labels for chart X-axis
export const DAY_LABELS = WEEK_DAYS_LABELS

// ─────────────────────────────────────────────────────────────
// HEATMAP  (built from week-1 hourly data; can be swapped per selection)
// ─────────────────────────────────────────────────────────────
export const HEATMAP_HOURS = ['6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21']

export const buildHeatmapForWeek = (weekIdx) => {
  const week = WEEKS[weekIdx]
  return week.days.map((day, di) => ({
    day: WEEK_DAYS_LABELS[di],
    hours: HEATMAP_HOURS.map((h) => {
      const hourLabel = `${parseInt(h) < 12 ? parseInt(h)+' AM' : (parseInt(h)===12?'12 PM':(parseInt(h)-12)+' PM')}`
      const match = day.hourly.find(hh => hh.hour === hourLabel)
      const score = match?.score ?? 0
      const intensity = score === 0 ? 0 : score < 30 ? 1 : score < 55 ? 2 : score < 80 ? 3 : 4
      return { hour: h, intensity }
    }),
  }))
}

// ─────────────────────────────────────────────────────────────
// ACHIEVEMENTS  (static, not day-dependent)
// ─────────────────────────────────────────────────────────────
export const achievements = [
  {
    id: 'weekly-goal',
    icon: 'emoji_events',
    label: 'Weekly Focus Goal',
    value: '5 / 5 days',
    description: 'Met your daily focus target every day this week',
    color: 'text-tertiary',
    bg: 'bg-tertiary-container/10',
  },
  {
    id: 'longest-focus',
    icon: 'timer',
    label: 'Longest Focus Session',
    value: '2h 47m',
    description: 'Recorded on Thursday — your longest session this week',
    color: 'text-primary',
    bg: 'bg-primary-container/10',
  },
  {
    id: 'best-day',
    icon: 'star',
    label: 'Highest Usage Day',
    value: 'Thursday',
    description: '7h 10m of total screen time recorded',
    color: 'text-secondary',
    bg: 'bg-secondary-container/10',
  },
  {
    id: 'streak',
    icon: 'local_fire_department',
    label: 'Active Days Streak',
    value: '12 days',
    description: 'Consecutive days with recorded activity',
    color: 'text-tertiary',
    bg: 'bg-tertiary-container/10',
  },
]

// ─────────────────────────────────────────────────────────────
// FILTER TABS
// ─────────────────────────────────────────────────────────────
export const FILTER_TABS = ['Week', 'Month']
export const DEFAULT_FILTER = 'Week'
