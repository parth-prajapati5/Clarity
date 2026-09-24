/**
 * FocusTrendChart.jsx — uses project design tokens exclusively.
 * All logic/props unchanged.
 */
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Cell,
} from 'recharts'
import Card from '../ui/Card'
import { fmtSeconds } from '../../services/usageApi'

const T = {
  primary:    '#c0c1ff',
  primaryDim: 'rgba(192,193,255,0.35)',
  tertiary:   '#ffb783',
  axis:       '#908fa0',
  grid:       'rgba(70,69,84,0.12)',
}

const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val  = payload[0]?.value ?? 0
  const goal = payload[0]?.payload?.goal
  return (
    <div className="glass-card px-4 py-3 rounded-xl text-xs shadow-xl border border-outline-variant/30">
      <p className="font-bold uppercase tracking-wider mb-2 text-outline">{label}</p>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-on-surface-variant">Focus:</span>
        <span className="font-bold text-on-surface">{fmtSeconds(val * 3600)}</span>
      </div>
      {goal != null && (
        <p className="text-[10px] font-bold mt-1 text-outline">
          Goal: {fmtSeconds(goal * 3600)}
        </p>
      )}
    </div>
  )
}

const FocusTrendChart = ({ data = [] }) => {
  if (!data.length) return null
  const goalValue = data[0]?.goal
  const showGoal  = data.length > 1 && goalValue != null
  const single    = data.length === 1

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Focus Time</h3>
          <p className="text-body-md text-on-surface-variant mt-0.5">
            {single ? 'Focus hours recorded this day'
              : `Daily focus hours${showGoal ? ` · ${goalValue}h goal` : ''}`}
          </p>
        </div>
        {showGoal && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-primary" />
              <span className="text-[11px] font-semibold text-outline">Focus Hours</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6" style={{ borderTop: `2px dashed ${T.tertiary}` }} />
              <span className="text-[11px] font-semibold text-outline">Daily Goal</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ height: single ? 160 : 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 20, left: -20, bottom: 0 }} barCategoryGap="35%">
            <CartesianGrid vertical={false} stroke={T.grid} />
            <XAxis dataKey="day" axisLine={false} tickLine={false}
              tick={{ fill: T.axis, fontSize: 11, fontWeight: 600 }} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fill: T.axis, fontSize: 11 }} tickFormatter={v => `${v}h`}
              domain={[0, single ? 'auto' : 6]} />
            <Tooltip content={<Tip />} cursor={{ fill: 'rgba(192,193,255,0.04)' }} />
            {showGoal && (
              <ReferenceLine y={goalValue} stroke={T.tertiary} strokeWidth={2} strokeDasharray="6 4"
                label={{ value: `${goalValue}h goal`, position: 'insideTopRight',
                  fill: T.tertiary, fontSize: 10, fontWeight: 700, dy: -6 }} />
            )}
            <Bar dataKey="focusHours" name="Focus Hours" radius={[5, 5, 0, 0]}
              maxBarSize={single ? 64 : 36} isAnimationActive animationDuration={500} animationEasing="ease-out">
              {data.map(e => (
                <Cell key={e.day} fill={
                  showGoal && e.focusHours >= goalValue ? T.primary
                    : showGoal ? T.primaryDim
                    : T.primary
                } />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default FocusTrendChart
