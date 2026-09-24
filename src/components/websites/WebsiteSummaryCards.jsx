/**
 * WebsiteSummaryCards.jsx
 * Identical structure to AppSummaryCards — website-specific labels & icons.
 */

import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import { useWebsiteSummaryStats } from '../../hooks/useUsageData'
import { formatDuration } from '../../services/usageApi'

const TOKEN_MAP = [
  { iconBg: 'bg-primary-container/10',   iconClass: 'text-primary'   },
  { iconBg: 'bg-secondary-container/10', iconClass: 'text-secondary' },
  { iconBg: 'bg-tertiary-container/10',  iconClass: 'text-tertiary'  },
  { iconBg: 'bg-secondary-container/10', iconClass: 'text-secondary' },
]

const SummaryCard = ({ card, tokens }) => (
  <Card className="flex-1 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tokens.iconBg}`}>
      <MaterialIcon name={card.icon} size="text-xl" className={tokens.iconClass} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-0.5">
        {card.label}
      </p>
      <p className="font-metric-large text-metric-large text-on-surface leading-none mb-0.5">
        {card.value}
      </p>
      <p className="text-[11px] text-on-surface-variant">{card.sub}</p>
    </div>
  </Card>
)

const WebsiteSummaryCards = () => {
  const { data: stats, loading } = useWebsiteSummaryStats()

  const cards = [
    {
      id:    'total-browse-time',
      label: 'Total Browse Time',
      value: loading ? '…' : formatDuration(stats?.weekSeconds),
      sub:   'This Week',
      icon:  'schedule',
    },
    {
      id:    'total-websites',
      label: 'Total Websites',
      value: loading ? '…' : String(stats?.totalWebsites ?? 0),
      sub:   'Visited',
      icon:  'language',
    },
    {
      id:    'active-today',
      label: 'Active Today',
      value: loading ? '…' : String(stats?.activeToday ?? 0),
      sub:   'Visited',
      icon:  'today',
    },
    {
      id:    'avg-daily-browsing',
      label: 'Avg. Daily Browsing',
      value: loading ? '…' : formatDuration(stats?.avgDailySeconds),
      sub:   'This Week',
      icon:  'trending_up',
    },
  ]

  return (
    <div className="flex gap-4">
      {cards.map((card, i) => (
        <SummaryCard key={card.id} card={card} tokens={TOKEN_MAP[i] ?? TOKEN_MAP[0]} />
      ))}
    </div>
  )
}

export default WebsiteSummaryCards
