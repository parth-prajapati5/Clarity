/**
 * AppUsageTable.jsx
 * "Top Used Apps" list — real backend data, unchanged visual design.
 */

import Card from '../ui/Card'
import AppIcon from '../ui/AppIcon'
import { useTodayUsage } from '../../hooks/useUsageData'
import { fmtSeconds, appColor } from '../../services/usageApi'

const AppRow = ({ app, maxSec }) => {
  const pct      = maxSec > 0 ? (app.durationSeconds / maxSec) * 100 : 0
  const barColor = pct > 50 ? 'bg-primary' : 'bg-secondary'
  const color    = appColor(app.application)

  return (
    <div className="flex items-center justify-between p-4 rounded-xl transition-colors hover:bg-surface-variant/30">
      {/* Left: icon + name */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden"
          style={{ backgroundColor: color }}
        >
          <AppIcon
            icon={app.icon}
            letter={app.application.charAt(0).toUpperCase()}
            className="w-7 h-7 object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-bold text-on-surface truncate">{app.application}</h4>
          <p className="text-xs text-outline truncate">{app.executableName}</p>
        </div>
      </div>

      {/* Right: duration + bar */}
      <div className="text-right ml-4">
        <p className="font-bold text-on-surface">{fmtSeconds(app.durationSeconds)}</p>
        <div className="w-32 h-1.5 bg-surface-variant rounded-full mt-1 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  )
}

const AppUsageTable = () => {
  const { data: apps, loading } = useTodayUsage()
  const top    = apps.slice(0, 5)
  const maxSec = top.length > 0 ? top[0].durationSeconds : 0

  if (loading) {
    return (
      <Card className="p-8 col-span-12 lg:col-span-7">
        <h3 className="font-headline-md text-headline-md mb-6">Top Used Apps</h3>
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4 p-4">
              <div className="w-10 h-10 bg-surface-variant rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-surface-variant rounded w-32" />
                <div className="h-3 bg-surface-variant rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    )
  }

  if (top.length === 0) {
    return (
      <Card className="p-8 col-span-12 lg:col-span-7">
        <h3 className="font-headline-md text-headline-md mb-6">Top Used Apps</h3>
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-30">apps</span>
          <p className="text-sm">No usage data recorded yet.</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-8 col-span-12 lg:col-span-7">
      <h3 className="font-headline-md text-headline-md mb-6">Top Used Apps</h3>
      <div className="space-y-1">
        {top.map(app => (
          <AppRow key={app.executableName} app={app} maxSec={maxSec} />
        ))}
      </div>
    </Card>
  )
}

export default AppUsageTable
