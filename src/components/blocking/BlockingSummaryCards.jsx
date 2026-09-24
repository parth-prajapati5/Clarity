/**
 * BlockingSummaryCards.jsx — 4 KPI cards matching the screenshot.
 * Same structure as AppSummaryCards, blocking-specific tokens.
 * Now accepts real `blockedCount` from the backend.
 */
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

const SummaryCard = ({ card }) => (
  <Card className="flex-1 p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconBg}`}>
      <MaterialIcon name={card.icon} size="text-xl" className={card.iconClass} />
    </div>
    <div className="min-w-0">
      <p className="font-metric-large text-metric-large text-on-surface leading-none mb-0.5">
        {card.value}
      </p>
      <p className="text-[12px] font-semibold text-on-surface">{card.label}</p>
      <p className="text-[11px] text-on-surface-variant">{card.sub}</p>
    </div>
  </Card>
)

const BlockingSummaryCards = ({ blockedCount = 0 }) => {
  const cards = [
    {
      id:        'active-blocks',
      icon:      'block',
      iconBg:    'bg-error/10',
      iconClass: 'text-error',
      value:     String(blockedCount),
      label:     'Active Blocks',
      sub:       'Applications blocked',
    },
    {
      id:        'protection',
      icon:      'security',
      iconBg:    'bg-primary-container/10',
      iconClass: 'text-primary',
      value:     blockedCount > 0 ? 'ON' : 'OFF',
      label:     'Protection',
      sub:       blockedCount > 0 ? 'Blocking active' : 'No rules set',
    },
    {
      id:        'schedule',
      icon:      'schedule',
      iconBg:    'bg-secondary-container/10',
      iconClass: 'text-secondary',
      value:     '24/7',
      label:     'Schedule',
      sub:       'Always enforced',
    },
    {
      id:        'sessions',
      icon:      'workspace_premium',
      iconBg:    'bg-tertiary-container/10',
      iconClass: 'text-tertiary',
      value:     'PRO',
      label:     'Feature',
      sub:       'Premium feature',
    },
  ]

  return (
    <div className="flex gap-4">
      {cards.map(card => <SummaryCard key={card.id} card={card} />)}
    </div>
  )
}

export default BlockingSummaryCards
