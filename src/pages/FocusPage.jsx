/**
 * FocusPage.jsx
 * Focus Mode — UI layout, colours and components are UNCHANGED.
 * All state flows from the real Tauri/SQLite backend via useFocusSession.
 */

import { useState, useMemo, useEffect, useRef } from 'react'
import ProBanner          from '../components/focus/ProBanner'
import SessionSetup       from '../components/focus/SessionSetup'
import ActiveSessionPanel from '../components/focus/ActiveSessionPanel'
import FocusFeatureStrip  from '../components/focus/FocusFeatureStrip'
import FocusUpgradeModal  from '../components/focus/FocusUpgradeModal'
import { DEV_PREMIUM_BYPASS } from '../config/devFlags'
import { useFocusSession }    from '../hooks/useFocusSession'
import { useTrackedApplications } from '../hooks/useUsageData'
import { appColor, fmtSeconds, fmtTime } from '../services/usageApi'
import { DEFAULT_HOURS, DEFAULT_MINUTES } from '../data/focus'

// ── Time helpers ──────────────────────────────────────────────

function sessionTimeLabel(isoString) {
  if (!isoString) return '—'
  return fmtTime(isoString)
}

function addSecondsToIso(isoString, seconds) {
  if (!isoString) return '—'
  return new Date(new Date(isoString).getTime() + seconds * 1000)
    .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// ─────────────────────────────────────────────────────────────

const FocusPage = () => {
  // ── Setup-form state ──────────────────────────────────────
  const [hours,       setHours]       = useState(DEFAULT_HOURS)
  const [minutes,     setMinutes]     = useState(DEFAULT_MINUTES)
  const [sessionName, setSessionName] = useState('')
  const [goal,        setGoal]        = useState('')
  const [activeTab,   setActiveTab]   = useState('apps')
  const [modalOpen,   setModalOpen]   = useState(false)
  const [startError,  setStartError]  = useState('')

  // ── Backend session ───────────────────────────────────────
  const focus = useFocusSession()

  // ── Auto-end when countdown reaches zero (in useEffect, NOT render) ──
  const autoEndCalledRef = useRef(false)
  useEffect(() => {
    if (focus.isActive && focus.remaining === 0 && focus.session && !autoEndCalledRef.current) {
      autoEndCalledRef.current = true
      focus.end(true).then(() => { autoEndCalledRef.current = false })
    }
    // Reset flag when session changes
    if (!focus.session) autoEndCalledRef.current = false
  }, [focus.isActive, focus.remaining, focus.session]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real tracked apps for the block-list picker ───────────
  const { data: trackedApps } = useTrackedApplications()
  const [checkedExes, setCheckedExes] = useState(new Set())

  const appItems = useMemo(() => {
    if (!trackedApps || trackedApps.length === 0) return []
    return trackedApps.map(a => ({
      id:         a.executableName,
      name:       a.name,
      category:   'Application',
      iconBg:     appColor(a.name),
      iconSymbol: 'desktop_windows',
      icon:       a.icon,
      checked:    checkedExes.has(a.executableName),
    }))
  }, [trackedApps, checkedExes])

  const toggleItem = (id) => {
    setCheckedExes(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Pro gate ──────────────────────────────────────────────
  const isPro = DEV_PREMIUM_BYPASS || false
  const handleProAction = () => { if (!isPro) setModalOpen(true) }

  // ── Start ─────────────────────────────────────────────────
  const handleStartSession = async () => {
    if (!isPro) { setModalOpen(true); return }

    const totalSeconds = hours * 3600 + minutes * 60
    if (totalSeconds === 0) {
      setStartError('Please set a session duration.')
      return
    }
    setStartError('')

    try {
      await focus.start(
        sessionName.trim() || 'Focus Session',
        goal.trim(),
        totalSeconds,
        [...checkedExes],
      )
    } catch (err) {
      const msg = String(err)
      if (msg === 'not_pro') setModalOpen(true)
      else setStartError(msg)
    }
  }

  // ── Pause / Resume ────────────────────────────────────────
  const handlePause = async () => {
    if (!isPro) { setModalOpen(true); return }
    if (focus.isActive) await focus.pause()
    else if (focus.isPaused) await focus.resume()
  }

  // ── End (manual) ─────────────────────────────────────────
  const handleEnd = async () => {
    if (!isPro) { setModalOpen(true); return }
    await focus.end(false)
  }

  // ── Build session prop for ActiveSessionPanel ─────────────
  const sessionProp = focus.session ? {
    name:         focus.session.name || 'Focus Session',
    totalSeconds: focus.session.totalSeconds,
    startedAt:    sessionTimeLabel(focus.session.startedAt),
    endTime:      addSecondsToIso(focus.session.startedAt, focus.session.totalSeconds),
    isPaused:     focus.isPaused,
    blockedItems: (() => {
      try {
        return JSON.parse(focus.session.blockedApps || '[]').slice(0, 3).map(exe => {
          const tracked = (trackedApps || []).find(t => t.executableName.toLowerCase() === exe.toLowerCase())
          return {
            id: exe,
            iconBg: appColor(exe),
            iconSymbol: 'desktop_windows',
            icon: tracked?.icon,
          }
        })
      } catch { return [] }
    })(),
    extraCount: (() => {
      try {
        return Math.max(JSON.parse(focus.session.blockedApps || '[]').length - 3, 0)
      } catch { return 0 }
    })(),
  } : null

  // ── Build history prop ────────────────────────────────────
  const historyProp = focus.history.map(s => ({
    id:       String(s.id),
    name:     s.name || 'Focus Session',
    timeRange: (() => {
      if (!s.startedAt) return ''
      const start = sessionTimeLabel(s.startedAt)
      const end   = s.endedAt ? sessionTimeLabel(s.endedAt) : '—'
      const day   = new Date(s.startedAt).toLocaleDateString()
      const today = new Date().toLocaleDateString()
      const label = day === today
        ? 'Today'
        : new Date(s.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      return `${label}, ${start} – ${end}`
    })(),
    duration:  fmtSeconds(s.elapsedSeconds),
    completed: s.status === 'completed',
  }))

  return (
    <div className="flex flex-col h-full bg-surface-dim">

      {/* Pro banner — hidden when dev bypass is active */}
      {!isPro && <ProBanner onUpgrade={() => setModalOpen(true)} />}

      {/* Page header */}
      <div className="flex items-center gap-3 px-8 py-5 flex-shrink-0 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-sm">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-0.5">
            <h1 className="font-headline-md text-headline-md text-on-surface">Focus Mode</h1>
            <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-primary-container/20 text-primary border border-primary/30">
              PRO
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">
            Stay focused by blocking distractions and building better habits.
          </p>
        </div>
      </div>

      {/* Scrollable canvas */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scrollbar-thin">
        <div className="grid gap-5" style={{ gridTemplateColumns: '2fr 3fr', minHeight: 640 }}>
          <SessionSetup
            hours={hours}
            minutes={minutes}
            onHoursChange={setHours}
            onMinutesChange={setMinutes}
            sessionName={sessionName}
            onNameChange={setSessionName}
            goal={goal}
            onGoalChange={setGoal}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            items={appItems}
            onToggleItem={toggleItem}
            onStartSession={handleStartSession}
            selectedCount={checkedExes.size}
            onProAction={handleProAction}
            startError={startError}
            hasActiveSession={focus.hasSession}
          />

          <ActiveSessionPanel
            session={sessionProp}
            history={historyProp}
            onPause={handlePause}
            onEnd={handleEnd}
            onProAction={handleProAction}
            loading={focus.loading}
            remaining={focus.remaining}
            elapsed={focus.elapsed}
          />
        </div>

        <FocusFeatureStrip />
      </div>

      <FocusUpgradeModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  )
}

export default FocusPage
