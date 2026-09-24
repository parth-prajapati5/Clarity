/**
 * PeakHoursCard.jsx — uses project design tokens exclusively.
 * All logic/props unchanged.
 */
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts'
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

const T = { primary: '#c0c1ff', axis: '#908fa0', grid: 'rgba(70,69,84,0.12)' }

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2 rounded-xl text-xs shadow-xl border border-outline-variant/30">
      <p className="text-outline font-semibold mb-0.5">{label}</p>
      <p className="font-bold text-on-surface">Activity: {payload[0].value}</p>
    </div>
  )
}

const PeakHoursCard = ({ data = [] }) => {
  if (!data.length) return null
  const peak      = data.reduce((b, h) => h.score > b.score ? h : b, data[0])
  const highHours = data.filter(h => h.score >= 70)
  const windowLabel = highHours.length >= 2
    ? `${highHours[0].hour} – ${highHours[highHours.length - 1].hour}`
    : peak.hour

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-5">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Hourly Activity</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            Activity intensity throughout the day
          </p>
        </div>
        {/* Peak window pill — using existing active token styling */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-container/10 border border-primary/20">
          <MaterialIcon name="av_timer" size="text-sm" className="text-primary" />
          <span className="text-[11px] font-bold text-primary">Peak: {windowLabel}</span>
        </div>
      </div>

      <div style={{ height: 216 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="peakAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={T.primary} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.primary} stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={T.grid} />
            <XAxis dataKey="hour" axisLine={false} tickLine={false}
              tick={{ fill: T.axis, fontSize: 10, fontWeight: 600 }} interval={1} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: T.axis, fontSize: 10 }} domain={[0, 100]} tickCount={5} />
            <Tooltip content={<Tip />} cursor={false} />
            <ReferenceLine x={peak.hour} stroke={T.primary}
              strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="score" stroke={T.primary} strokeWidth={2.5}
              fill="url(#peakAreaGrad)" dot={false}
              activeDot={{ r: 5, fill: T.primary, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default PeakHoursCard
