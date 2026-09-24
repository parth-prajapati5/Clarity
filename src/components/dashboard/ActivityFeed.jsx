/**
 * ActivityFeed.jsx
 * "Recent Activity" vertical timeline — real session data from backend.
 * Visual design unchanged.
 */

import Card   from '../ui/Card'
import Button from '../ui/Button'
import { useTodayUsage } from '../../hooks/useUsageData'
import { fmtSeconds, fmtTime, appColor } from '../../services/usageApi'

const DOT_COLORS = ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-outline-variant']

const TimelineEntry = ({ activity }) => {
  const { time, title, description, dotColor } = activity
  return (
    <div className="relative pl-10">
      <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-4 border-surface shadow-lg ${dotColor}`} />
      <p className="text-xs text-outline font-bold uppercase mb-1">{time}</p>
      <h5 className="font-bold text-on-surface">{title}</h5>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  )
}

const ActivityFeed = () => {
  const { data: apps, loading } = useTodayUsage()

  // Build timeline entries from top apps used today
  const activities = apps.slice(0, 4).map((app, i) => ({
    id:          app.executableName,
    time:        app.lastUsed ? fmtTime(app.lastUsed) : 'Today',
    title:       app.application,
    description: `${fmtSeconds(app.durationSeconds)} used · ${app.sessionCount} session${app.sessionCount !== 1 ? 's' : ''}`,
    dotColor:    DOT_COLORS[i % DOT_COLORS.length],
  }))

  return (
    <Card className="p-8 flex flex-col col-span-12 lg:col-span-5">
      <h3 className="font-headline-md text-headline-md mb-6">Recent Activity</h3>

      <div className="flex-1 space-y-6 relative before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[1px] before:bg-outline-variant/30">
        {loading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="animate-pulse pl-10 space-y-1">
              <div className="h-3 bg-surface-variant rounded w-16" />
              <div className="h-4 bg-surface-variant rounded w-32" />
              <div className="h-3 bg-surface-variant rounded w-48" />
            </div>
          ))
        ) : activities.length === 0 ? (
          <div className="pl-10 py-8 text-center text-on-surface-variant">
            <p className="text-sm">No activity recorded yet.</p>
          </div>
        ) : (
          activities.map(a => <TimelineEntry key={a.id} activity={a} />)
        )}
      </div>

      <Button variant="text" className="mt-8 self-start">
        View Full Timeline
      </Button>
    </Card>
  )
}

export default ActivityFeed
