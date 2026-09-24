/**
 * MetricCard.jsx
 * Secondary metric tile used in the 2×2 grid beside the HeroMetricCard.
 * Handles streak dots, delta badges, and all icon/color variants
 * defined in src/data/metrics.js.
 */

import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

const MetricCard = ({ metric }) => {
  const {
    label,
    value,
    delta,
    icon,
    iconColor,
    iconBg,
    showStreakDots = false,
  } = metric

  return (
    <Card className="p-6 flex flex-col justify-between hover:border-primary/50 cursor-pointer group">
      {/* Top row: icon + delta / streak dots */}
      <div className="flex justify-between items-start">
        <div className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>
          <MaterialIcon name={icon} />
        </div>

        {showStreakDots ? (
          <div className="flex -space-x-1 items-center">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <div className="w-2 h-2 rounded-full bg-secondary/50" />
          </div>
        ) : delta ? (
          <span
            className={[
              'text-[10px] font-bold',
              delta.startsWith('+') ? 'text-secondary' : 'text-outline',
              delta === 'Tier: High' && 'text-tertiary',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {delta}
          </span>
        ) : null}
      </div>

      {/* Bottom row: label + value */}
      <div>
        <p className="text-outline font-label-md mb-1">{label}</p>
        <h4 className="font-headline-md text-headline-md">{value}</h4>
      </div>
    </Card>
  )
}

export default MetricCard
