/**
 * WebsiteUsagePage.jsx
 * Website Usage module — identical structure to ApplicationsPage.
 * All "app" terminology replaced with "website/site" equivalents.
 */

import { useState, useMemo, useEffect } from 'react'
import WebsiteSummaryCards from '../components/websites/WebsiteSummaryCards'
import WebsiteListPanel    from '../components/websites/WebsiteListPanel'
import WebsiteDetailPanel  from '../components/websites/WebsiteDetailPanel'
import WebsiteUpgradeModal from '../components/websites/WebsiteUpgradeModal'
import MaterialIcon        from '../components/ui/MaterialIcon'
import { useWebsiteUsage } from '../hooks/useUsageData'
import { appColor, fmtLastUsed } from '../services/usageApi'

const getWebsiteCategory = (domain) => {
  const dom = domain.toLowerCase();
  if (dom.includes("youtube.com") || dom.includes("netflix.com") || dom.includes("twitch.tv")) {
    return { category: "Entertainment", iconSymbol: "smart_display" };
  }
  if (dom.includes("github.com") || dom.includes("stackoverflow.com") || dom.includes("gitlab.com")) {
    return { category: "Development", iconSymbol: "code" };
  }
  if (dom.includes("google.com") || dom.includes("bing.com") || dom.includes("yahoo.com")) {
    return { category: "Search", iconSymbol: "search" };
  }
  if (dom.includes("facebook.com") || dom.includes("twitter.com") || dom.includes("x.com") || dom.includes("instagram.com") || dom.includes("linkedin.com") || dom.includes("reddit.com")) {
    return { category: "Social Media", iconSymbol: "alternate_email" };
  }
  return { category: "Website", iconSymbol: "language" };
};

const WebsiteUsagePage = () => {
  const { data: raw, loading } = useWebsiteUsage()

  // Transform backend WebsiteUsageResponse[] into the shape UI components expect
  const websiteListTransformed = useMemo(() => {
    if (!raw || raw.length === 0) return []
    const totalSec = raw.reduce((s, w) => s + w.durationSeconds, 0)
    return raw.map((site) => {
      const { category, iconSymbol } = getWebsiteCategory(site.domain);
      const parts = site.domain.split('.');
      const friendlyName = parts.length > 1 
        ? parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1)
        : site.domain;
      return {
        id:           site.domain.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name:         friendlyName,
        url:          site.domain,
        category,
        iconBg:       appColor(site.domain),
        iconSymbol,
        weekMinutes:  Math.round(site.durationSeconds / 60),
        todayMinutes: Math.round(site.durationSeconds / 60),
        pageViews:    site.sessionCount,
        lastVisited:  fmtLastUsed(site.lastUsed),
        lastUsedTs:   site.lastUsed ? new Date(site.lastUsed).getTime() : 0,
        percent:      totalSec > 0 ? Math.round((site.durationSeconds / totalSec) * 100) : 0,
        weeklyBars:   [],
        monthlyBars:  [],
        timeline:     [],
        location:     `https://${site.domain}`,
      };
    })
  }, [raw])

  const [searchQuery, setSearchQuery] = useState('')
  const [sortTab,     setSortTab]     = useState('most')
  const [showAll,     setShowAll]     = useState(false)
  const [selectedSite,setSelectedSite]= useState(null)
  const [chartRange,  setChartRange]  = useState('week')
  const [modalOpen,   setModalOpen]   = useState(false)

  // Auto-select first site once list loads
  useEffect(() => {
    if (!selectedSite && websiteListTransformed.length > 0) {
      setSelectedSite(websiteListTransformed[0])
    }
  }, [websiteListTransformed, selectedSite])

  // Keep selectedSite in sync if list refreshes
  useEffect(() => {
    if (selectedSite && websiteListTransformed.length > 0) {
      const refreshed = websiteListTransformed.find(s => s.id === selectedSite.id)
      if (refreshed) setSelectedSite(refreshed)
    }
  }, [websiteListTransformed]) // eslint-disable-line react-hooks/exhaustive-deps

  const sortByUsage  = (list) => [...list].sort((a, b) => b.weekMinutes - a.weekMinutes)
  const sortByRecent = (list) => [...list].sort((a, b) => b.lastUsedTs - a.lastUsedTs)
  const sortByName   = (list) => [...list].sort((a, b) => a.name.localeCompare(b.name))

  const filteredSites = useMemo(() => {
    let list = [...websiteListTransformed]
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.url.toLowerCase().includes(q)  ||
        s.category.toLowerCase().includes(q)
      )
    }
    if (sortTab === 'most')   return sortByUsage(list)
    if (sortTab === 'recent') return sortByRecent(list)
    if (sortTab === 'az')     return sortByName(list)
    return list
  }, [searchQuery, sortTab, websiteListTransformed])

  const handleSelectSite = (site) => {
    setSelectedSite(site)
    setChartRange('week')
  }

  return (
    <div className="flex flex-col h-full bg-surface-dim">

      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-sm">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-0.5">Website Usage</h1>
          <p className="text-body-md text-on-surface-variant">
            Detailed browsing statistics for all your visited websites
          </p>
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <MaterialIcon
              name="search"
              size="text-lg"
              className="absolute left-3 pointer-events-none text-outline"
            />
            <input
              type="text"
              placeholder="Search websites..."
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

      {/* Scrollable canvas */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 scrollbar-thin">

        <WebsiteSummaryCards />

        {/* Loading state */}
        {loading && websiteListTransformed.length === 0 && (
          <div className="flex items-center justify-center py-24 text-on-surface-variant gap-3">
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
            <span>Loading website data…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && websiteListTransformed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl opacity-30">language</span>
            <p className="text-lg font-medium">No website usage data recorded yet.</p>
            <p className="text-sm opacity-60">Visit some websites in your browser and come back in a moment.</p>
          </div>
        )}

        {/* Two-column grid: left 40% / right 60% */}
        {websiteListTransformed.length > 0 && (
          <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 3fr', minHeight: 640 }}>
            <WebsiteListPanel
              sites={filteredSites}
              selectedId={selectedSite?.id}
              onSelect={handleSelectSite}
              sortTab={sortTab}
              onSortChange={t => { setSortTab(t); setShowAll(false) }}
              showAll={showAll}
              onShowMore={() => setShowAll(true)}
            />
            {selectedSite && (
              <WebsiteDetailPanel
                site={selectedSite}
                chartRange={chartRange}
                onRangeChange={setChartRange}
                onProAction={() => setModalOpen(true)}
              />
            )}
          </div>
        )}
      </div>

      <WebsiteUpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default WebsiteUsagePage
