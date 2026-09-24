/**
 * App.jsx
 * Application root.
 *
 * Lightweight client-side navigation — no router library needed yet.
 * activeNavId is the single source of truth for which page is visible.
 *
 * To add more pages:
 *   1. Create src/pages/YourPage.jsx
 *   2. Add its nav id to the PAGE_MAP below
 */

import { useEffect, useState } from 'react'
import DashboardLayout     from './layouts/DashboardLayout'
import DashboardPage       from './pages/DashboardPage'
import AnalyticsPage       from './pages/AnalyticsPage'
import ApplicationsPage    from './pages/ApplicationsPage'
import WebsiteUsagePage    from './pages/WebsiteUsagePage'
import FocusPage           from './pages/FocusPage'
import BlockingPage        from './pages/BlockingPage'
import SettingsPage        from './pages/SettingsPage'
import UpgradePage         from './pages/UpgradePage'

import { getSettings }              from './services/usageApi'
import { applyAppearance, applyShowInTaskbar } from './services/appearance'

const PAGE_MAP = {
  dashboard:      <DashboardPage />,
  analytics:      <AnalyticsPage />,
  applications:   <ApplicationsPage />,
  website:        <WebsiteUsagePage />,
  focus:          <FocusPage />,
  'app-blocking': <BlockingPage />,
  settings:       <SettingsPage />,
}

/** Fallback for nav items that don't have a page yet */
const PlaceholderPage = ({ navId }) => (
  <div className="flex flex-col items-center justify-center h-96 gap-4 text-on-surface-variant">
    <span className="material-symbols-outlined text-6xl opacity-30">construction</span>
    <p className="text-lg font-bold capitalize opacity-50">{navId} — Coming Soon</p>
  </div>
)

const App = () => {
  const [activeNavId,  setActiveNavId]  = useState('dashboard')
  const [showUpgrade,  setShowUpgrade]  = useState(false)

  // Apply saved Appearance + window settings on startup so the theme,
  // accent and taskbar behaviour are correct before any page is opened.
  useEffect(() => {
    let cancelled = false
    getSettings()
      .then(s => {
        if (cancelled || !s) return
        applyAppearance({
          theme:       s['appearance.theme'] ?? 'Dark',
          accentColor: s['appearance.accent_color'] ?? 'Indigo',
          fontSize:    s['appearance.font_size'] ?? 'Medium',
          compactMode: s['appearance.compact_mode'] === 'true',
        })
        applyShowInTaskbar(s['general.show_in_taskbar'] !== 'false')
      })
      .catch(() => {
        // Keep defaults; Appearance applies its own defaults on normal render.
      })
    return () => { cancelled = true }
  }, [])

  const activePage = activeNavId === 'settings'
    ? <SettingsPage onUpgrade={() => setShowUpgrade(true)} />
    : (PAGE_MAP[activeNavId] ?? <PlaceholderPage navId={activeNavId} />)

  // Upgrade page is a full-screen overlay on top of the layout
  if (showUpgrade) {
    return (
      <DashboardLayout activeNavId={activeNavId} onNavChange={(item) => { setActiveNavId(item.id); setShowUpgrade(false) }}>
        <UpgradePage onBack={() => setShowUpgrade(false)} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      activeNavId={activeNavId}
      onNavChange={(item) => setActiveNavId(item.id)}
      onUpgradeClick={() => setShowUpgrade(true)}
    >
      {activePage}
    </DashboardLayout>
  )
}

export default App
