/**
 * WeeklyScreenTimeChart.jsx — uses project design tokens exclusively.
 * All logic/props unchanged.
 */
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell,
} from 'recharts'
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import { fmtSeconds } from '../../services/usageApi'

// Token hex values pulled directly from tailwind.config.js
const T = {
  primary:       '#c0c1ff',
  primaryDim:    'rgba(192,193,255,0.25)',
  secondary:     '#00a2e6',
  secondaryDim:  'rgba(0,162,230,0.2)',
  grid:          'rgba(70,69,84,0.12)',
  axis:          '#908fa0',
  tooltipBg:     '#1f1f27',
  tooltipBorder: 'rgba(192,193,255,0.2)',
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-4 py-3 rounded-xl text-xs shadow-xl space-y-1.5 border border-outline-variant/30">
      <p className="font-bold uppercase tracking-wider mb-1 text-outline">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-on-surface-variant">{p.name}:</span>
          <span className="font-bold text-on-surface">{fmtSeconds(p.value * 3600)}</span>
        </div>
      ))}
      <p className="text-[10px] pt-1 text-outline border-t border-outline-variant/20">
        Click to drill into this day
      </p>
    </div>
  )
}

const DayTick = ({ x, y, payload, selectedDayIdx, days }) => {
  const idx = days.findIndex(d => d.day === payload.value)
  const sel = idx === selectedDayIdx
  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="middle" dy={14} fontSize={11} fontWeight={sel ? 800 : 600}
        fill={sel ? T.primary : T.axis}>
        {payload.value}
      </text>
      {sel && <circle cx={0} cy={24} r={3} fill={T.primary} />}
    </g>
  )
}

const WeeklyScreenTimeChart = ({ data = [], selectedDayIdx, onDayClick, contextLabel }) => {
  const handleClick = d => {
    const p = d?.activePayload?.[0]?.payload
    if (p) onDayClick?.(p.dayIdx)
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Screen Time</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Click any bar to view that day's details
          </p>
        </div>
        <div className="flex gap-5">
          {[
            { color: T.primary,   label: 'Screen Time' },
            { color: T.secondary, label: 'Focus Time'  },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: color }} />
              <span className="text-[11px] font-semibold text-outline">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Context label */}
      {contextLabel && (
        <div className="flex items-center gap-2 mb-4 px-1">
          <MaterialIcon name="calendar_today" size="text-sm" className="text-primary" />
          <span className="text-[13px] font-bold text-primary">{contextLabel}</span>
        </div>
      )}

      <div style={{ height: 256 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 12 }}
            barCategoryGap="28%" barGap={4} onClick={handleClick} style={{ cursor: 'pointer' }}>
            <CartesianGrid vertical={false} stroke={T.grid} />
            <XAxis dataKey="day" axisLine={false} tickLine={false}
              tick={props => <DayTick {...props} selectedDayIdx={selectedDayIdx} days={data} />} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: T.axis, fontSize: 11 }} tickFormatter={v => `${v}h`} domain={[0, 'auto']} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(192,193,255,0.06)', radius: 6 }} />
            <Bar dataKey="hours" name="Screen Time" radius={[5, 5, 0, 0]} maxBarSize={28}
              isAnimationActive animationDuration={500} animationEasing="ease-out">
              {data.map(e => (
                <Cell key={e.day} fill={
                  e.dayIdx === selectedDayIdx ? T.primary
                    : selectedDayIdx !== null ? T.primaryDim
                    : T.primary
                } />
              ))}
            </Bar>
            <Bar dataKey="focusHours" name="Focus Time" radius={[5, 5, 0, 0]} maxBarSize={28}
              isAnimationActive animationDuration={600} animationEasing="ease-out">
              {data.map(e => (
                <Cell key={e.day} fill={
                  e.dayIdx === selectedDayIdx ? T.secondary
                    : selectedDayIdx !== null ? T.secondaryDim
                    : T.secondary
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default WeeklyScreenTimeChart
