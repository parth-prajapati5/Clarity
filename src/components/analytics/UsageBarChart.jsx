/**
 * UsageBarChart.jsx — visual design unchanged.
 * Removed dependency on fmtDuration from mock data/analytics.js.
 */
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, LabelList } from 'recharts'
import Card         from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import { fmtSeconds } from '../../services/usageApi'

const T = { axis: '#908fa0', grid: 'rgba(70,69,84,0.12)' }

const Tip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d    = payload[0].payload
  const prev = d.prevMinutes ?? 0
  const diff = d.minutes - prev
  const pct  = prev > 0 ? Math.round((diff / prev) * 100) : null
  return (
    <div className="glass-card px-4 py-3 rounded-xl text-xs shadow-xl space-y-1 border border-outline-variant/30">
      <p className="font-bold text-on-surface mb-1">{d.app}</p>
      <p className="text-on-surface-variant">{fmtSeconds(d.minutes * 60)} · {d.percent}%</p>
      {pct !== null && (
        <p className={`text-[10px] font-bold ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
          {diff >= 0 ? `+${pct}%` : `${pct}%`} vs prev period
        </p>
      )}
    </div>
  )
}

const UsageBarChart = ({ data = [] }) => {
  if (!data.length) return null
  const sorted  = [...data].sort((a, b) => b.minutes - a.minutes)
  const maxMins = sorted[0]?.minutes ?? 1

  return (
    <Card className="p-6 flex flex-col">
      <div className="mb-5">
        <h3 className="font-headline-md text-headline-md text-on-surface">Application Usage</h3>
        <p className="text-body-md text-on-surface-variant mt-0.5">Time spent per app — sorted by usage</p>
      </div>

      <div style={{ height: sorted.length * 44 + 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={sorted} layout="vertical"
            margin={{ top: 0, right: 52, left: 8, bottom: 0 }} barCategoryGap="35%">
            <XAxis type="number" hide domain={[0, maxMins * 1.18]} />
            <YAxis type="category" dataKey="app" axisLine={false} tickLine={false}
              width={88} tick={{ fill: '#c7c4d7', fontSize: 12, fontWeight: 600 }} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(192,193,255,0.05)' }} />
            <Bar dataKey="minutes" radius={[0, 5, 5, 0]} maxBarSize={16}
              isAnimationActive animationDuration={500} animationEasing="ease-out">
              {sorted.map(e => <Cell key={e.app} fill={e.color ?? '#c0c1ff'} />)}
              <LabelList dataKey="percent" position="right" formatter={v => `${v}%`}
                style={{ fill: T.axis, fontSize: 11, fontWeight: 700 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detail rows */}
      <div className="mt-4 pt-4 space-y-2.5 border-t border-outline-variant/20">
        {sorted.map(entry => {
          const prev = entry.prevMinutes ?? 0
          const diff = entry.minutes - prev
          const pct  = prev > 0 ? Math.round((diff / prev) * 100) : null
          return (
            <div key={entry.app} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: entry.iconBg ?? '#34343d' }}>
                <MaterialIcon name={entry.icon ?? 'apps'} size="text-sm" className="text-white" />
              </div>
              <span className="text-[12px] font-semibold flex-1 truncate text-on-surface">{entry.app}</span>
              {pct !== null && (
                <span className={`text-[11px] font-bold ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
                  {diff >= 0 ? `+${pct}%` : `${pct}%`}
                </span>
              )}
              <span className="text-[12px] font-bold text-on-surface w-14 text-right flex-shrink-0">
                {fmtSeconds(entry.minutes * 60)}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default UsageBarChart
