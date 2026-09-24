/**
 * BlockingPage.jsx
 *
 * Layout (unchanged from original design):
 *   ProBanner (top)
 *   Page header
 *   Summary cards row
 *   BlockingAppTable  ←  now uses real backend data
 *   ActiveRulesPanel  ←  shows real enabled blocks
 *   BlockingInfoStrip (bottom)
 *   BlockingUpgradeModal
 *
 * The UI components (cards, table, colours, spacing) are unchanged.
 * The only difference is that data now comes from SQLite via Tauri IPC
 * and blocking actually terminates the process via Win32 TerminateProcess.
 */

import { useState, useMemo } from 'react'
import BlockingSummaryCards  from '../components/blocking/BlockingSummaryCards'
import BlockingAppTable      from '../components/blocking/BlockingAppTable'
import ActiveRulesPanel      from '../components/blocking/ActiveRulesPanel'
import BlockingInfoStrip     from '../components/blocking/BlockingInfoStrip'
import BlockingUpgradeModal  from '../components/blocking/BlockingUpgradeModal'
import MaterialIcon          from '../components/ui/MaterialIcon'
import { DEV_PREMIUM_BYPASS } from '../config/devFlags'

import {
  useBlockedApps,
  useTrackedApplications,
  useIsProUser,
} from '../hooks/useUsageData'
import {
  addBlockedApp,
  removeBlockedApp,
  setAppBlockEnabled,
  appColor,
} from '../services/usageApi'

// ── "Add Application" inline dialog ─────────────────────────
const AddAppDialog = ({ trackedApps, onAdd, onCancel, busy, error }) => {
  const [selected, setSelected] = useState('')
  const [filterText, setFilterText] = useState('')
  const [customExe, setCustomExe] = useState('')
  const [useCustom, setUseCustom] = useState(false)

  const filteredApps = useMemo(() => {
    const list = trackedApps || []
    if (!filterText.trim()) return list
    const q = filterText.toLowerCase()
    return list.filter(a =>
      a.name.toLowerCase().includes(q) || a.executableName.toLowerCase().includes(q)
    )
  }, [trackedApps, filterText])

  const handleAdd = () => {
    if (useCustom) {
      const exe = customExe.trim()
      if (!exe) return
      // derive a display name from the exe
      const name = exe.replace(/\.exe$/i, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
      onAdd(exe, name)
    } else {
      if (!selected) return
      const app = (trackedApps || []).find(a => a.executableName === selected)
      if (!app) return
      onAdd(app.executableName, app.name)
    }
  }

  return (
    <div className="px-5 py-4 border-b border-outline-variant/20 bg-surface-container-low/60">
      <p className="text-[12px] font-semibold text-on-surface mb-3">
        Choose an application to block
      </p>

      {!useCustom ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search apps..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="
              w-56 px-3 py-2 rounded-xl text-[12px]
              bg-surface-variant/40 border border-outline-variant/30
              text-on-surface placeholder:text-outline
              focus:outline-none focus:ring-1 focus:ring-primary
            "
          />
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            className="
              flex-1 px-3 py-2 rounded-xl text-[12px]
              bg-surface-variant/40 border border-outline-variant/30
              text-on-surface focus:outline-none focus:ring-1 focus:ring-primary
            "
          >
            <option value="">
              — Select application ({filteredApps.length} found) —
            </option>
            {filteredApps.map(a => (
              <option key={a.executableName} value={a.executableName}>
                {a.name} ({a.executableName})
              </option>
            ))}
          </select>
          <button
            onClick={handleAdd}
            disabled={busy || !selected}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {busy
              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              : <MaterialIcon name="block" size="text-sm" />}
            Block
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-xl text-[12px] font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            placeholder="e.g. discord.exe"
            value={customExe}
            onChange={e => setCustomExe(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="
              flex-1 px-3 py-2 rounded-xl text-[12px]
              bg-surface-variant/40 border border-outline-variant/30
              text-on-surface placeholder:text-outline
              focus:outline-none focus:ring-1 focus:ring-primary
            "
          />
          <button
            onClick={handleAdd}
            disabled={busy || !customExe.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold bg-primary text-on-primary hover:brightness-110 disabled:opacity-50 transition-all"
          >
            {busy
              ? <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              : <MaterialIcon name="block" size="text-sm" />}
            Block
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-2 rounded-xl text-[12px] font-medium text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="flex items-center gap-3 mt-2">
        <button
          onClick={() => setUseCustom(p => !p)}
          className="text-[11px] text-primary hover:underline"
        >
          {useCustom ? '← Pick from detected apps' : 'Enter executable name manually →'}
        </button>
        {error && <p className="text-[11px] text-error">{error}</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

const BlockingPage = () => {
  const [modalOpen,     setModalOpen]     = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [addBusy,       setAddBusy]       = useState(false)
  const [addError,      setAddError]      = useState('')
  const [appSearch,     setAppSearch]     = useState('')

  // Real backend data
  const { data: blockedList, loading: listLoading, refresh: refreshList } = useBlockedApps()
  const { data: trackedApps }                                              = useTrackedApplications()
  const { isPro: isProFromDb }                                             = useIsProUser()
  const isPro = DEV_PREMIUM_BYPASS || isProFromDb

  // Transform BlockedApp[] → shape BlockingAppTable expects
  const tableItems = useMemo(() => {
    const list = blockedList ?? []
    const filtered = appSearch.trim()
      ? list.filter(a =>
          a.displayName.toLowerCase().includes(appSearch.toLowerCase()) ||
          a.executableName.toLowerCase().includes(appSearch.toLowerCase())
        )
      : list
    return filtered.map(app => {
      const tracked = (trackedApps || []).find(t => t.executableName.toLowerCase() === app.executableName.toLowerCase())
      return {
        id:            app.executableName,
        name:          app.displayName,
        iconBg:        appColor(app.displayName),
        iconSymbol:    'desktop_windows',
        icon:          tracked?.icon,
        status:        app.enabled ? 'Blocked' : 'Allowed',
        limitSchedule: app.enabled ? 'Always' : 'Paused',
        toggleOn:      app.enabled,
        _raw:          app,
      }
    })
  }, [blockedList, appSearch, trackedApps])

  // Active rules for the right panel
  const activeRules = useMemo(() =>
    (blockedList ?? [])
      .filter(a => a.enabled)
      .map(a => {
        const tracked = (trackedApps || []).find(t => t.executableName.toLowerCase() === a.executableName.toLowerCase())
        return {
          id:        a.executableName,
          name:      a.displayName,
          sub:       'Blocked',
          schedule:  'Always',
          iconBg:    appColor(a.displayName),
          iconSymbol: 'desktop_windows',
          icon:      tracked?.icon,
          statusKey: 'Blocked',
        }
      }),
    [blockedList, trackedApps]
  )

  const handleAddNew = () => {
    if (!isPro) { setModalOpen(true); return }
    setAddError('')
    setShowAddDialog(true)
  }

  const handleAdd = async (executableName, displayName) => {
    setAddBusy(true)
    setAddError('')
    try {
      await addBlockedApp(executableName, displayName)
      setShowAddDialog(false)
      refreshList()
    } catch (err) {
      const msg = String(err)
      if (msg === 'not_pro') { setModalOpen(true); setShowAddDialog(false) }
      else setAddError(msg)
    } finally {
      setAddBusy(false)
    }
  }

  const handleToggle = async (executableName) => {
    if (!isPro) { setModalOpen(true); return }
    const rule = (blockedList ?? []).find(a => a.executableName === executableName)
    if (!rule) return
    try {
      await setAppBlockEnabled(executableName, !rule.enabled)
      refreshList()
    } catch (err) {
      const msg = String(err)
      if (msg === 'not_pro') setModalOpen(true)
      else console.error('[BlockingPage] toggle error:', err)
    }
  }

  const handleMenuAction = async (executableName, action) => {
    if (!isPro) { setModalOpen(true); return }

    if (action === 'Unblock') {
      // Permanently remove the rule — app is free to run again
      try {
        await removeBlockedApp(executableName)
        refreshList()
      } catch (err) {
        if (String(err) === 'not_pro') setModalOpen(true)
        else console.error('[BlockingPage] unblock error:', err)
      }
    }

    if (action === 'Pause Rule' || action === 'Resume Rule') {
      // Toggle enabled state without deleting the rule
      await handleToggle(executableName)
    }
  }

  const tableProps = {
    items:           tableItems,
    label:           'Applications',
    description:     'Block applications from running on your device.',
    onToggle:        handleToggle,
    onMenuAction:    handleMenuAction,
    onAddNew:        handleAddNew,
    onFilter:        () => {},
    searchQuery:     appSearch,
    onSearchChange:  setAppSearch,
    disableToggle:   !isPro,
    emptyMessage:    listLoading
      ? 'Loading blocked applications…'
      : 'No applications blocked yet. Click "Add Application" to get started.',
  }

  return (
    <div className="flex flex-col h-full bg-surface-dim">

      {/* ── Pro banner ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-8 py-3 flex-shrink-0 bg-primary-container/10 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <MaterialIcon name="workspace_premium" size="text-lg" className="text-tertiary" filled />
          <div>
            <p className="text-[13px] font-bold text-on-surface">
              {isPro ? 'Blocking — Pro Feature Active' : 'Blocking is a Pro feature'}
            </p>
            <p className="text-[12px] text-on-surface-variant">
              {isPro
                ? 'App blocks terminate the process immediately and persist across restarts.'
                : 'Upgrade to unlock app blocking controls.'}
            </p>
          </div>
        </div>
        {!isPro && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold bg-primary text-on-primary hover:brightness-110 transition-all"
          >
            <MaterialIcon name="workspace_premium" size="text-sm" className="text-on-primary" filled />
            Upgrade to Pro
          </button>
        )}
      </div>

      {/* ── Page header ───────────────────────────────────── */}
      <div className="flex items-center gap-3 px-8 py-5 flex-shrink-0 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="font-headline-md text-headline-md text-on-surface">App Blocking</h1>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-container/20 text-primary border border-primary/30">
              PRO
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Block distracting applications. Clarity will terminate them immediately and prevent them from running while blocked.
          </p>
        </div>
      </div>

      {/* ── Scrollable canvas ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scrollbar-thin">

        <BlockingSummaryCards blockedCount={(blockedList ?? []).filter(a => a.enabled).length} />

        {/* Add-app inline dialog — shown above the table */}
        {showAddDialog && (
          <AddAppDialog
            trackedApps={trackedApps ?? []}
            onAdd={handleAdd}
            onCancel={() => { setShowAddDialog(false); setAddError('') }}
            busy={addBusy}
            error={addError}
          />
        )}

        <div className="grid gap-5" style={{ gridTemplateColumns: '3fr 2fr' }}>
          <BlockingAppTable {...tableProps} />
          <ActiveRulesPanel
            rules={activeRules}
            onViewAll={() => setModalOpen(true)}
          />
        </div>

        <BlockingInfoStrip onLearnMore={() => setModalOpen(true)} />
      </div>

      <BlockingUpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default BlockingPage
