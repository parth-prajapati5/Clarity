/**
 * HeroMetricCard.jsx
 * Large left metric card — real backend data, unchanged visual design.
 */

import Card          from '../ui/Card'
import Badge         from '../ui/Badge'
import MaterialIcon  from '../ui/MaterialIcon'
import ProgressRing  from './ProgressRing'
import { useSummaryStats } from '../../hooks/useUsageData'
import { formatDuration } from '../../services/usageApi'

const DAILY_GOAL_SEC = 8 * 3600   // 8 h — adjust as needed

const HeroMetricCard = () => {
  const { data: stats, loading } = useSummaryStats()

  const todaySec       = stats?.todaySeconds ?? 0
  const pct            = Math.min((todaySec / DAILY_GOAL_SEC) * 100, 100)
  const remainingSec   = Math.max(DAILY_GOAL_SEC - todaySec, 0)

  const value          = loading ? '…' : formatDuration(todaySec)
  const remainingLabel = loading ? '…' : `${formatDuration(remainingSec)} left`

  return (
    <Card className="p-8 flex flex-col relative overflow-hidden group col-span-12 lg:col-span-5">
      {/* Background watermark */}
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
        <MaterialIcon name="schedule" size="text-9xl" />
      </div>

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-outline uppercase text-[11px] font-bold tracking-widest mb-1">
            Today's Screen Time
          </h3>
          <p className="font-metric-large text-metric-large text-on-surface">
            {value}
          </p>
        </div>
        <Badge variant="secondary">DAILY GOAL: 8h</Badge>
      </div>

      {/* Progress ring */}
      <div className="flex-1 flex items-center justify-center py-4">
        <ProgressRing
          percentage={pct}
          remainingLabel={remainingLabel}
          size={192}
        />
      </div>
    </Card>
  )
}

export default HeroMetricCard
