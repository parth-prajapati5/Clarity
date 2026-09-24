/**
 * ScreenTimeChart.jsx
 * Weekly area chart — real backend data, unchanged visual design.
 */

import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import Card from '../ui/Card'
import { useWeeklyUsage } from '../../hooks/useUsageData'
import { fmtSeconds } from '../../services/usageApi'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const totalSeconds = payload[0].value * 60  // stored as minutes for area scale
  return (
    <div className="glass-card px-3 py-2 rounded-lg text-xs">
      <p className="text-outline font-bold mb-0.5">{label}</p>
      <p className="text-primary font-bold">{fmtSeconds(totalSeconds)}</p>
    </div>
  )
}

const ScreenTimeChart = () => {
  const { data: weekly, loading } = useWeeklyUsage()

  // DayUsageResponse: { date, totalSeconds, activeApps, sessionCount }
  const chartData = weekly.map(day => ({
    day:     new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    minutes: Math.round(day.totalSeconds / 60),
  }))

  return (
    <Card className="p-8 col-span-12 lg:col-span-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-headline-md text-headline-md">Screen Time Trend</h3>
          <p className="text-on-surface-variant font-body-md">Last 7 days usage pattern</p>
        </div>
      </div>

      <div className="h-64 w-full">
        {loading ? (
          <div className="h-full flex items-center justify-center text-outline animate-pulse">
            Loading chart…
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-on-surface-variant flex-col gap-2">
            <span className="material-symbols-outlined text-4xl opacity-30">show_chart</span>
            <p className="text-sm">No usage data recorded yet.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="screenTimeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#c0c1ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#c0c1ff" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="rgba(70,69,84,0.1)" />
              <XAxis
                dataKey="day"
                tick={{ fill:'#908fa0', fontSize:10, fontWeight:700, letterSpacing:'0.08em' }}
                axisLine={false} tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              <Area
                type="monotone" dataKey="minutes"
                stroke="#c0c1ff" strokeWidth={3}
                fill="url(#screenTimeGradient)"
                dot={false}
                activeDot={{ r:4, fill:'#c0c1ff', strokeWidth:0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  )
}

export default ScreenTimeChart
