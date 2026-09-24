/**
 * AIInsightCard.jsx
 * Insight card driven by real backend data.
 * Shows today's most-used app and a simple heatmap from weekly data.
 * Visual design unchanged.
 */

import MaterialIcon  from '../ui/MaterialIcon'
import SectionTitle  from '../ui/SectionTitle'
import { useTodayUsage, useWeeklyUsage } from '../../hooks/useUsageData'
import { fmtSeconds } from '../../services/usageApi'

// Build a 16-slot heatmap from weekly DayUsageResponse[]
// Each slot = one day block coloured by totalSeconds magnitude
const buildHeatmap = (weekly) => {
  if (!weekly || weekly.length === 0) return []
  const max = Math.max(...weekly.map(d => d.totalSeconds), 1)
  const OPACITY_CLASSES = [
    'bg-primary/10', 'bg-primary/20', 'bg-primary/40',
    'bg-primary/60', 'bg-primary/80', 'bg-primary',
  ]
  return weekly.map((d, i) => {
    const ratio = d.totalSeconds / max
    const idx   = Math.min(Math.floor(ratio * OPACITY_CLASSES.length), OPACITY_CLASSES.length - 1)
    return {
      id:           i,
      hour:         new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
      opacityClass: OPACITY_CLASSES[idx],
    }
  })
}

const AIInsightCard = () => {
  const { data: todayApps, loading: appsLoading } = useTodayUsage()
  const { data: weekly }                           = useWeeklyUsage()

  const topApp    = todayApps[0]
  const heatmap   = buildHeatmap(weekly)

  const message         = appsLoading
    ? 'Loading your usage data…'
    : topApp
      ? `Your most active app today is `
      : 'No usage recorded yet today.'

  const highlightedTime = topApp ? topApp.application : ''
  const hintSuffix      = topApp ? ` with ${fmtSeconds(topApp.durationSeconds)} of use.` : ''

  return (
    <div className="col-span-12 lg:col-span-4 bg-primary-container/10 border border-primary/20 rounded-2xl p-8 flex flex-col justify-between">
      {/* Top */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary flex-shrink-0">
            <MaterialIcon name="smart_toy" size="text-xl" />
          </div>
          <span className="text-primary font-bold text-[11px] tracking-widest uppercase">
            Today's Insight
          </span>
        </div>

        <p className="font-headline-md text-headline-md leading-snug">
          &ldquo;{message}
          {highlightedTime && (
            <span className="text-primary underline underline-offset-4 decoration-2">
              {highlightedTime}
            </span>
          )}
          {hintSuffix}&rdquo;
        </p>
      </div>

      {/* Bottom: heatmap */}
      <div className="mt-8 space-y-3">
        <SectionTitle>Weekly Activity</SectionTitle>
        {heatmap.length > 0 ? (
          <div className="flex gap-1 h-12">
            {heatmap.map(block => (
              <div
                key={block.id}
                title={block.hour}
                className={`flex-1 rounded-sm ${block.opacityClass}`}
              />
            ))}
          </div>
        ) : (
          <div className="h-12 flex items-center">
            <p className="text-xs text-outline">No weekly data yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AIInsightCard
