/**
 * ApplicationsPage.jsx
 * Applications module — connected to real Tauri backend.
 * UI/design unchanged.
 */

import { useState, useMemo, useEffect } from 'react'
import AppSummaryCards from '../components/applications/AppSummaryCards'
import AppListPanel    from '../components/applications/AppListPanel'
import AppDetailPanel  from '../components/applications/AppDetailPanel'
import ProUpgradeModal from '../components/applications/ProUpgradeModal'
import MaterialIcon    from '../components/ui/MaterialIcon'
import { useApplicationUsage } from '../hooks/useUsageData'
import { appColor, fmtSeconds, fmtLastUsed } from '../services/usageApi'

const ApplicationsPage = () => {
  const { data: raw, loading } = useApplicationUsage()

  // Transform backend AppUsageResponse[] into the shape UI components expect
  const applicationList = useMemo(() => {
    if (!raw || raw.length === 0) return []
    const totalSec = raw.reduce((s, a) => s + a.durationSeconds, 0)
    return raw.map((app) => ({
      id:           app.executableName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name:         app.application,
      publisher:    '',
      category:     'Application',
      iconBg:       appColor(app.application),
      iconLetter:   app.application.charAt(0).toUpperCase(),
      iconSymbol:   'apps',
      icon:         app.icon,
      weekMinutes:  Math.round(app.durationSeconds / 60),
      todayMinutes: Math.round(app.durationSeconds / 60),
      sessions:     app.sessionCount,
      lastUsed:     fmtLastUsed(app.lastUsed),
      lastUsedTs:   app.lastUsed ? new Date(app.lastUsed).getTime() : 0,
      percent:      totalSec > 0 ? Math.round((app.durationSeconds / totalSec) * 100) : 0,
      executableName: app.executableName,
      // chart data stubs — AppDetailPanel reads these; real sessions loaded inside that component
      weeklyBars:  [],
      monthlyBars: [],
      timeline:    [],
    }))
  }, [raw])

  const [searchQuery, setSearchQuery] = useState('')
  const [sortTab,     setSortTab]     = useState('most')
  const [showAll,     setShowAll]     = useState(false)
  const [selectedApp, setSelectedApp] = useState(null)
  const [chartRange,  setChartRange]  = useState('week')
  const [modalOpen,   setModalOpen]   = useState(false)

  // Auto-select first app once list loads
  useEffect(() => {
    if (!selectedApp && applicationList.length > 0) {
      setSelectedApp(applicationList[0])
    }
  }, [applicationList, selectedApp])

  // Keep selectedApp in sync if list refreshes
  useEffect(() => {
    if (selectedApp && applicationList.length > 0) {
      const refreshed = applicationList.find(a => a.id === selectedApp.id)
      if (refreshed) setSelectedApp(refreshed)
    }
  }, [applicationList]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortByUsage  = (list) => [...list].sort((a, b) => b.weekMinutes - a.weekMinutes)
  const sortByRecent = (list) => [...list].sort((a, b) => b.lastUsedTs - a.lastUsedTs)
  const sortByName   = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name))

  const filteredApps = useMemo(() => {
    let list = [...applicationList]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q))
    }
    if (sortTab === 'most')   return sortByUsage(list)
    if (sortTab === 'recent') return sortByRecent(list)
    if (sortTab === 'az')     return sortByName(list)
    return list
  }, [searchQuery, sortTab, applicationList])

  const handleSelectApp = (app) => {
    setSelectedApp(app)
    setChartRange('week')
  }

  return (
    <div className="flex flex-col h-full bg-surface-dim">

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-sm">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-0.5">Applications</h1>
          <p className="text-body-md text-on-surface-variant">
            Detailed usage statistics for all your applications
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <MaterialIcon
              name="search"
              size="text-lg"
              className="absolute left-3 pointer-events-none text-outline"
            />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="
                w-64 pl-10 pr-4 py-2 rounded-full text-[13px]
                bg-surface-variant/40 border border-outline-variant/30
                text-on-surface placeholder:text-outline
                focus:outline-none focus:ring-1 focus:ring-primary
                transition-all
              "
            />
          </div>
          <button className="glass-card flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors border border-outline-variant/30">
            <MaterialIcon name="tune" size="text-base" />
            Filter
          </button>
        </div>
      </div>

      {/* ── Scrollable canvas ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">

        <AppSummaryCards />

        {/* Loading state */}
        {loading && applicationList.length === 0 && (
          <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
            <span>Loading application data…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && applicationList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">apps</span>
            <p className="text-lg font-medium">No usage data recorded yet.</p>
            <p className="text-sm opacity-60">Switch between apps and come back in a moment.</p>
          </div>
        )}

        {/* Two-column grid: left 40% / right 60% */}
        {applicationList.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 3fr', minHeight: 640 }}>
            <AppListPanel
              apps={filteredApps}
              selectedId={selectedApp?.id}
              onSelect={handleSelectApp}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortTab={sortTab}
              onSortChange={t => { setSortTab(t); setShowAll(false) }}
              showAll={showAll}
              onShowMore={() => setShowAll(true)}
            />
            {selectedApp && (
              <AppDetailPanel
                app={selectedApp}
                chartRange={chartRange}
                onRangeChange={setChartRange}
                onProAction={() => setModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>

      <ProUpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default ApplicationsPage
