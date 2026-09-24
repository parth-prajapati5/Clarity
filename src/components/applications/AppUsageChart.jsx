/**
 * AppUsageChart.jsx
 * Vertical bar chart — uses existing primary color and design system tokens.
 * Recharts BarChart with rounded-top bars, minimal grid, existing axis text color.
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import { fmtSeconds } from '../../services/usageApi'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 rounded-xl text-xs shadow-xl border border-outline-variant/30">
      <p className="text-outline font-semibold mb-0.5">{label}</p>
      <p className="font-bold text-on-surface">{fmtSeconds(payload[0].value * 3600)}</p>
    </div>
  )
}

const RANGE_TABS = [
  { id: 'week',  label: 'This Week'  },
  { id: 'month', label: 'This Month' },
]

const AppUsageChart = ({ data = [], chartRange = 'week', onRangeChange }) => {
  const maxH = Math.max(...data.map(d => d.hours), 1)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-[14px] font-semibold text-on-surface">Usage Over Time</h4>
        <div className="flex gap-0.5 p-1 rounded-xl bg-surface-variant/30">
          {RANGE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onRangeChange(tab.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200',
                chartRange === tab.id
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: 168 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="35%">
            <defs>
              {/* Primary gradient using the project's primary token value */}
              <linearGradient id="appBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#c0c1ff" stopOpacity={1}   />
                <stop offset="100%" stopColor="#8083ff" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="appBarDim" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#c0c1ff" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#8083ff" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="rgba(70,69,84,0.12)" />
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#908fa0', fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#908fa0', fontSize: 10 }}
              tickFormatter={v => v === 0 ? '0' : `${v}h`}
              domain={[0, Math.ceil(maxH + 0.5)]}
              tickCount={5}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(192,193,255,0.06)', radius: 6 }}
            />
            <Bar
              dataKey="hours"
              radius={[5, 5, 0, 0]}
              maxBarSize={32}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            >
              {data.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.hours === maxH ? 'url(#appBarGrad)' : 'url(#appBarDim)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default AppUsageChart
