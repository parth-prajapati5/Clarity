/**
 * AnalyticsOverviewCard.jsx — uses project design tokens exclusively.
 */
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

// Map card index → existing token pairs (same as AppSummaryCards)
const TOKEN_MAP = [
  { iconBg: 'bg-primary-container/10',   iconClass: 'text-primary',   spark: '#c0c1ff' },
  { iconBg: 'bg-secondary-container/10', iconClass: 'text-secondary',  spark: '#89ceff' },
  { iconBg: 'bg-tertiary-container/10',  iconClass: 'text-tertiary',   spark: '#ffb783' },
  { iconBg: 'bg-primary-container/10',   iconClass: 'text-primary',   spark: '#c0c1ff' },
]

const AnalyticsOverviewCard = ({ card, tokenIdx = 0 }) => {
  const { label, value, icon, sparkline = [] } = card
  const tok = TOKEN_MAP[tokenIdx] ?? TOKEN_MAP[0]
  const sparkData = sparkline.map((v, i) => ({ i, v }))

  return (
    <Card className="p-5 flex flex-col gap-3">
      {/* Circular icon */}
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${tok.iconBg}`}>
        <MaterialIcon name={icon} size="text-xl" className={tok.iconClass} />
      </div>

      {/* Label + value */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-outline mb-0.5">
          {label}
        </p>
        <p className="font-metric-large text-metric-large text-on-surface leading-none">
          {value}
        </p>
      </div>

      {/* Sparkline */}
      {sparkData.length > 1 && (
        <div className="h-9 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={tok.spark}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

export default AnalyticsOverviewCard
