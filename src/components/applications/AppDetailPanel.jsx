/**
 * AppDetailPanel.jsx
 * Right column — selected app detail view.
 * Loads real sessions from backend. Visual design unchanged.
 */

import { useState } from 'react'
import Card         from '../ui/Card'
import Button       from '../ui/Button'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon      from '../ui/AppIcon'
import AppUsageChart  from './AppUsageChart'
import UsageTimeline  from './UsageTimeline'
import { useAppSessions } from '../../hooks/useUsageData'
import { fmtSeconds, fmtTime } from '../../services/usageApi'

const METRIC_TOKENS = [
  { iconBg: 'bg-primary-container/10',   iconClass: 'text-primary'    },
  { iconBg: 'bg-secondary-container/10', iconClass: 'text-secondary'  },
  { iconBg: 'bg-tertiary-container/10',  iconClass: 'text-tertiary'   },
  { iconBg: 'bg-outline-variant/20',     iconClass: 'text-on-surface' },
]

const PRO_ACTIONS = [
  { id: 'block',    label: 'Block Application',  icon: 'block'               },
  { id: 'limit',    label: 'Daily Usage Limit',  icon: 'timer_off'           },
  { id: 'schedule', label: 'Schedule Blocking',  icon: 'event_busy'          },
  { id: 'focus',    label: 'Add to Focus Mode',  icon: 'center_focus_strong' },
]

const MetricTile = ({ item, tokens }) => (
  <Card className="p-4 flex flex-col gap-2" hoverable={false}>
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tokens.iconBg}`}>
      <MaterialIcon name={item.icon} size="text-base" className={tokens.iconClass} />
    </div>
    <p className="text-[11px] font-medium text-on-surface-variant">{item.label}</p>
    <p className="font-headline-md text-headline-md text-on-surface leading-none">{item.value}</p>
  </Card>
)

const ThreeDotMenu = ({ onProAction }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={[
          'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
          open
            ? 'bg-primary-container/20 text-primary'
            : 'glass-card text-on-surface-variant hover:text-on-surface border border-outline-variant/30',
        ].join(' ')}
      >
        <MaterialIcon name="more_vert" size="text-xl" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-40 w-52 glass-card rounded-xl py-1.5 shadow-2xl border border-outline-variant/30">
            <button
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
            >
              <MaterialIcon name="folder_open" size="text-base" />
              Open File Location
            </button>
            <div className="my-1.5 mx-3 border-t border-outline-variant/30" />
            <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-widest text-outline">Pro Features</p>
            {PRO_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => { setOpen(false); onProAction?.() }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium text-outline hover:bg-surface-variant transition-colors"
              >
                <MaterialIcon name={action.icon} size="text-base" />
                <span className="flex-1 text-left">{action.label}</span>
                <MaterialIcon name="lock" size="text-sm" className="text-outline/50" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const AppDetailPanel = ({ app, chartRange, onRangeChange, onProAction }) => {
  // Load real sessions for this specific app
  const { data: sessions, loading: sessionsLoading } = useAppSessions(app.executableName, 20)

  // Build timeline entries from real session data
  const timeline = sessions.flatMap((s, idx) => {
    const entries = []
    if (s.startedAt) {
      entries.push({
        id:       `s${idx}-start`,
        time:     fmtTime(s.startedAt),
        type:     'start',
        label:    'Application Started',
        detail:   app.name,
        duration: null,
      })
    }
    if (s.endedAt) {
      entries.push({
        id:       `s${idx}-end`,
        time:     fmtTime(s.endedAt),
        type:     'end',
        label:    'Application Closed',
        detail:   null,
        duration: fmtSeconds(s.durationSeconds),
      })
    }
    return entries
  })

  // Build week bar chart from sessions (group by day)
  const weeklyBars = (() => {
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    const map  = Object.fromEntries(days.map(d => [d, 0]))
    sessions.forEach(s => {
      if (!s.startedAt) return
      const day = new Date(s.startedAt).toLocaleDateString('en-US', { weekday: 'short' })
      if (map[day] !== undefined) map[day] += s.durationSeconds / 3600
    })
    return days.map(d => ({ day: d, hours: parseFloat(map[d].toFixed(2)) }))
  })()

  const metrics = [
    { id: 'total',    label: 'Today',    value: fmtSeconds(app.todayMinutes * 60), icon: 'schedule' },
    { id: 'week',     label: 'This Week', value: fmtSeconds(app.weekMinutes * 60),  icon: 'today'    },
    { id: 'sessions', label: 'Sessions',  value: String(app.sessions),              icon: 'repeat'   },
    { id: 'last',     label: 'Last Used', value: app.lastUsed,                      icon: 'history'  },
  ]

  return (
    <Card className="flex flex-col overflow-hidden h-full" hoverable={false}>
      {/* App header */}
      <div className="px-6 py-5 flex items-center gap-4 border-b border-outline-variant/20">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white text-2xl font-bold overflow-hidden"
          style={{ background: app.iconBg }}
        >
          <AppIcon
            icon={app.icon}
            letter={app.iconLetter}
            className="w-10 h-10 object-contain"
            fallbackClassName="text-white text-2xl font-bold"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-headline-md text-headline-md text-on-surface truncate">{app.name}</h3>
          <p className="text-[12px] text-on-surface-variant">{app.executableName}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="ghost">
            <MaterialIcon name="folder_open" size="text-sm" />
            Open Location
          </Button>
          <ThreeDotMenu onProAction={onProAction} />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-thin">
        {/* 4 metric tiles */}
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((m, i) => (
            <MetricTile key={m.id} item={m} tokens={METRIC_TOKENS[i]} />
          ))}
        </div>

        <div className="border-t border-outline-variant/20" />

        {/* Usage chart */}
        <AppUsageChart
          data={weeklyBars}
          chartRange={chartRange}
          onRangeChange={onRangeChange}
        />

        <div className="border-t border-outline-variant/20" />

        {/* Timeline */}
        {sessionsLoading ? (
          <div className="py-6 text-center text-on-surface-variant animate-pulse text-sm">
            Loading session history…
          </div>
        ) : (
          <UsageTimeline events={timeline} />
        )}
      </div>
    </Card>
  )
}

export default AppDetailPanel
