/**
 * DashboardPage.jsx
 * The main dashboard canvas — assembles the bento grid from individual
 * dashboard components. Mirrors the 12-column grid in the Stitch design.
 *
 * Grid layout (col-span values match the HTML exactly):
 *
 *   Row 1 — Greeting
 *   Row 2 — HeroMetric (5) + SecondaryMetrics 2×2 (7)
 *   Row 3 — ScreenTimeChart (8) + AIInsightCard (4)
 *   Row 4 — AppUsageTable (7) + ActivityFeed (5)
 */

import GreetingSection from '../components/dashboard/GreetingSection'
import HeroMetricCard  from '../components/dashboard/HeroMetricCard'
import MetricCard      from '../components/dashboard/MetricCard'
import ScreenTimeChart from '../components/dashboard/ScreenTimeChart'
import AIInsightCard   from '../components/dashboard/AIInsightCard'
import AppUsageTable   from '../components/dashboard/AppUsageTable'
import ActivityFeed    from '../components/dashboard/ActivityFeed'
import { useSummaryStats } from '../hooks/useUsageData'
import { formatDuration } from '../services/usageApi'

const DashboardPage = () => {
  const { data: stats, loading } = useSummaryStats()

  // Secondary metric cards — real backend values, same visual layout
  const secondaryMetrics = [
    {
      id: 'weekly',
      label: 'This Week',
      value: loading ? '…' : formatDuration(stats?.weekSeconds),
      delta: null,
      icon: 'calendar_today',
      iconColor: 'text-secondary',
      iconBg: 'bg-secondary-container/10',
    },
    {
      id: 'daily-avg',
      label: 'Daily Average',
      value: loading ? '…' : formatDuration(stats?.avgDailySeconds),
      delta: null,
      icon: 'trending_up',
      iconColor: 'text-tertiary',
      iconBg: 'bg-tertiary-container/10',
    },
    {
      id: 'apps',
      label: 'Apps Today',
      value: loading ? '…' : String(stats?.activeToday ?? 0),
      delta: null,
      icon: 'apps',
      iconColor: 'text-primary',
      iconBg: 'bg-primary-container/10',
    },
    {
      id: 'focus',
      label: 'Focus Sessions',
      value: '—',
      delta: null,
      icon: 'psychology',
      iconColor: 'text-on-surface',
      iconBg: 'bg-outline-variant/20',
    },
  ]

  return (
    <div className="p-8 max-w-[1440px] mx-auto w-full space-y-8">

      {/* ── Greeting + actions ───────────────────────────── */}
      <GreetingSection />

      {/* ── Bento grid ──────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">

        {/* Row 1: Hero metric (col-span-5) */}
        <HeroMetricCard />

        {/* Row 1: Secondary 2×2 metrics (col-span-7) */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-6">
          {secondaryMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>

        {/* Row 2: Screen time chart (col-span-8) */}
        <ScreenTimeChart />

        {/* Row 2: AI insight (col-span-4) */}
        <AIInsightCard />

        {/* Row 3: App usage table (col-span-7) */}
        <AppUsageTable />

        {/* Row 3: Activity feed (col-span-5) */}
        <ActivityFeed />

      </div>
    </div>
  )
}

export default DashboardPage
