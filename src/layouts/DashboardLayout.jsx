/**
 * DashboardLayout.jsx
 * Root shell. onUpgradeClick is threaded to the Sidebar's Upgrade card.
 */

import Sidebar from '../components/sidebar/Sidebar'

const DashboardLayout = ({ children, activeNavId, onNavChange, onUpgradeClick }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-dim text-on-surface">
      <Sidebar activeId={activeNavId} onNavClick={onNavChange} onUpgradeClick={onUpgradeClick} />
      <main className="flex-1 flex flex-col h-screen overflow-y-auto scrollbar-thin bg-surface-dim">
        {children}
      </main>
    </div>
  )
}

export default DashboardLayout
