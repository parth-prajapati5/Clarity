/**
 * AnalyticsPage.jsx — uses project design tokens exclusively.
 * All state/logic unchanged.
 */

import {
  AnalyticsHeader,
  AnalyticsOverviewCard,
  WeeklyScreenTimeChart,
  MonthChart,
  UsageBarChart,
  FocusTrendChart,
  PeakHoursCard,
  ActivityHeatmap,
  AIInsightsPanel,
  AchievementsCard,
  ExportSection,
} from '../components/analytics'

import useAnalyticsSelection from '../hooks/useAnalyticsSelection'

const AnalyticsPage = () => {
  const sel = useAnalyticsSelection()
  const {
    view, selectedWeekIdx, selectedDayIdx,
    selectView, selectDay, selectWeek, goBack,
    contextLabel, showBackBtn,
    overviewData, monthBars, weekDayBars,
    appsData, focusData, hourlyData, insightsData, heatmap,
  } = sel

  return (
    <div className="flex flex-col min-h-full bg-surface-dim text-on-surface">

      {/* Sticky header */}
      <AnalyticsHeader
        view={view}
        onViewChange={selectView}
        contextLabel={contextLabel}
        showBackBtn={showBackBtn}
        onBack={goBack}
      />

      {/* Canvas */}
      <div className="px-8 py-6 w-full max-w-[1440px] mx-auto space-y-6">

        {/* 1 — KPI cards — pass tokenIdx so each card picks the right icon colour */}
        <div className="grid grid-cols-4 gap-4">
          {overviewData.map((card, idx) => (
            <AnalyticsOverviewCard key={card.id} card={card} tokenIdx={idx} />
          ))}
        </div>

        {/* 2 — Primary chart */}
        {view === 'Week' ? (
          <WeeklyScreenTimeChart
            data={weekDayBars ?? []}
            selectedDayIdx={selectedDayIdx}
            onDayClick={selectDay}
            contextLabel={selectedDayIdx !== null ? contextLabel : null}
          />
        ) : (
          <MonthChart
            monthBars={monthBars}
            weekDayBars={weekDayBars}
            selectedWeekIdx={selectedWeekIdx}
            selectedDayIdx={selectedDayIdx}
            onWeekClick={selectWeek}
            onDayClick={selectDay}
          />
        )}

        {/* 3 — App usage + Focus trend */}
        <div className="grid grid-cols-2 gap-5">
          <UsageBarChart data={appsData} />
          <FocusTrendChart data={focusData} />
        </div>

        {/* 4 — Hourly activity + Heatmap */}
        <div className="grid grid-cols-2 gap-5">
          <PeakHoursCard data={hourlyData} />
          <ActivityHeatmap data={heatmap} />
        </div>

        {/* 5 — AI Insights */}
        <AIInsightsPanel insights={insightsData} />

        {/* 6 — Achievements */}
        <AchievementsCard />

        {/* 7 — Export */}
        <ExportSection />

        <div className="h-4" />
      </div>
    </div>
  )
}

export default AnalyticsPage
