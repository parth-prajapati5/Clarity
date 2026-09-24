/**
 * AchievementsCard.jsx — uses project design tokens exclusively.
 * Shows real stats from backend. Visual design unchanged.
 */
import Card         from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import { useSummaryStats } from '../../hooks/useUsageData'
import { fmtSeconds } from '../../services/usageApi'

const TILE_TOKENS = [
  { iconBg: 'bg-tertiary-container/10',  iconClass: 'text-tertiary'  },
  { iconBg: 'bg-primary-container/10',   iconClass: 'text-primary'   },
  { iconBg: 'bg-secondary-container/10', iconClass: 'text-secondary' },
  { iconBg: 'bg-tertiary-container/10',  iconClass: 'text-tertiary'  },
]

const Tile = ({ item, tok }) => (
  <div className="glass-card flex items-start gap-4 p-4 rounded-xl border border-outline-variant/20 transition-transform duration-200 hover:-translate-y-0.5">
    <div className={`p-2.5 rounded-xl flex-shrink-0 ${tok.iconBg}`}>
      <MaterialIcon name={item.icon} size="text-lg" className={tok.iconClass} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-outline">{item.label}</p>
      <p className="text-[16px] font-bold text-on-surface">{item.value}</p>
      <p className="text-[11px] mt-0.5 leading-snug text-on-surface-variant">{item.description}</p>
    </div>
  </div>
)

const AchievementsCard = () => {
  const { data: stats, loading } = useSummaryStats()

  const items = [
    {
      id:          'weekly-screen',
      icon:        'schedule',
      label:       'Weekly Screen Time',
      value:       loading ? '…' : fmtSeconds(stats?.weekSeconds),
      description: 'Total screen time recorded this week',
    },
    {
      id:          'daily-avg',
      icon:        'bar_chart',
      label:       'Daily Average',
      value:       loading ? '…' : fmtSeconds(stats?.avgDailySeconds),
      description: '7-day rolling daily average',
    },
    {
      id:          'active-today',
      icon:        'apps',
      label:       'Active Apps Today',
      value:       loading ? '…' : String(stats?.activeToday ?? 0),
      description: 'Distinct applications used today',
    },
    {
      id:          'today',
      icon:        'today',
      label:       "Today's Screen Time",
      value:       loading ? '…' : fmtSeconds(stats?.todaySeconds),
      description: 'Total screen time recorded today',
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-5">
        <MaterialIcon name="emoji_events" size="text-2xl" className="text-tertiary" filled />
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Milestones</h3>
          <p className="text-body-md text-on-surface-variant">Your recorded stats this period</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {items.map((item, i) => (
          <Tile key={item.id} item={item} tok={TILE_TOKENS[i % TILE_TOKENS.length]} />
        ))}
      </div>
    </Card>
  )
}

export default AchievementsCard
