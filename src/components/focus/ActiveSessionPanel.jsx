/**
 * ActiveSessionPanel.jsx
 * Right column — shows the running session: countdown ring, session info,
 * blocked items, pause/end controls, and session history.
 *
 * Props:
 *   session        : real session data object | null
 *   history        : real session history array
 *   onPause        : () => void  (also handles resume when paused)
 *   onEnd          : () => void
 *   onProAction    : () => void
 *   loading        : bool
 *   remaining      : seconds remaining (live, from useFocusSession hook)
 *   elapsed        : seconds elapsed (live)
 *
 * Visual design is unchanged from the original.
 */

import { useEffect, useState } from 'react'
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon from '../ui/AppIcon'

// ── Countdown ring SVG ───────────────────────────────────────
const CountdownRing = ({ totalSeconds, remainingSeconds, isPaused }) => {
  const pct  = totalSeconds > 0 ? remainingSeconds / totalSeconds : 0
  const r    = 70
  const circ = 2 * Math.PI * r
  const dash = circ * pct
  const mm   = String(Math.floor(remainingSeconds / 60)).padStart(2, '0')
  const ss   = String(remainingSeconds % 60).padStart(2, '0')

  return (
    <div className="relative" style={{ width: 168, height: 168 }}>
      <svg width="168" height="168" className="-rotate-90">
        <circle cx="84" cy="84" r={r} fill="none"
          stroke="rgba(192,193,255,0.1)" strokeWidth="8" />
        <circle cx="84" cy="84" r={r} fill="none"
          stroke={isPaused ? '#908fa0' : '#c0c1ff'} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-bold text-on-surface">{mm}:{ss}</span>
        <span className="text-[11px] text-outline">
          {isPaused ? 'paused' : 'remaining'}
        </span>
      </div>
    </div>
  )
}

// ── History row ──────────────────────────────────────────────
const HistoryRow = ({ item }) => (
  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-surface-variant/40 transition-colors group text-left">
    <div className={[
      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
      item.completed ? 'bg-primary-container/15' : 'bg-error-container/15',
    ].join(' ')}>
      <MaterialIcon
        name={item.completed ? 'check_circle' : 'cancel'}
        size="text-base"
        className={item.completed ? 'text-primary' : 'text-error'}
        filled
      />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[13px] font-semibold text-on-surface truncate">{item.name}</p>
      <p className="text-[11px] text-outline">{item.timeRange}</p>
    </div>
    <span className={`text-[13px] font-bold flex-shrink-0 ${item.completed ? 'text-primary' : 'text-error'}`}>
      {item.duration}
    </span>
    <MaterialIcon name="chevron_right" size="text-base" className="text-outline/40 flex-shrink-0" />
  </button>
)

// ── Empty state (no active session) ─────────────────────────
const NoSession = ({ history, onProAction }) => (
  <div className="flex flex-col gap-5 h-full">
    <Card className="p-6 flex flex-col items-center justify-center gap-4 flex-1" hoverable={false}>
      <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center">
        <MaterialIcon name="timer" size="text-4xl" className="text-primary/40" />
      </div>
      <div className="text-center">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-1">No Active Session</h3>
        <p className="text-[13px] text-on-surface-variant">
          Configure your session on the left and press<br />
          <span className="text-primary font-semibold">Start Focus Session</span> to begin.
        </p>
      </div>
    </Card>

    {history.length > 0 && (
      <Card className="p-6 flex flex-col min-h-0" hoverable={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Session History</h3>
          <button
            className="text-[12px] text-primary hover:text-primary/80 font-semibold transition-colors"
            onClick={onProAction}
          >
            View all
          </button>
        </div>
        <div className="overflow-y-auto space-y-0.5 scrollbar-thin">
          {history.slice(0, 4).map(item => (
            <HistoryRow key={item.id} item={item} />
          ))}
        </div>
      </Card>
    )}
  </div>
)

// ─────────────────────────────────────────────────────────────
const ActiveSessionPanel = ({
  session, history, onPause, onEnd, onProAction, loading, remaining, elapsed
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined text-4xl text-outline animate-spin">
          progress_activity
        </span>
      </div>
    )
  }

  if (!session) {
    return <NoSession history={history ?? []} onProAction={onProAction} />
  }

  const isPaused = session.isPaused ?? false

  return (
    <div className="flex flex-col gap-5 h-full">
      {/* ── Active Session card ───────────────────────── */}
      <Card className="p-6 flex flex-col gap-5" hoverable={false}>
        <div className="flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-on-surface">
            {isPaused ? 'Session Paused' : 'Active Session'}
          </h3>
          <span className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-outline' : 'bg-primary animate-pulse'}`} />
        </div>

        {/* Ring + session info */}
        <div className="flex items-center gap-6">
          <CountdownRing
            totalSeconds={session.totalSeconds}
            remainingSeconds={remaining ?? 0}
            isPaused={isPaused}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-[16px] font-bold text-on-surface">{session.name}</h4>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[11px] text-outline mb-0.5">Started at</p>
                <p className="text-[14px] font-semibold text-on-surface">{session.startedAt}</p>
              </div>
              <div>
                <p className="text-[11px] text-outline mb-0.5">End time</p>
                <p className="text-[14px] font-semibold text-on-surface">{session.endTime}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Blocked items */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-outline font-medium">Blocked Items</span>
            <div className="flex -space-x-2">
              {(session.blockedItems ?? []).map((b, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-2 border-surface-container flex items-center justify-center -ml-2 first:ml-0 overflow-hidden"
                  style={{ background: b.iconBg }}
                >
                  <AppIcon
                    icon={b.icon}
                    symbol={b.iconSymbol}
                    className="w-4 h-4 object-contain"
                    fallbackClassName="text-white"
                  />
                </div>
              ))}
              {session.extraCount > 0 && (
                <div className="w-7 h-7 rounded-full border-2 border-surface-container bg-surface-variant flex items-center justify-center">
                  <span className="text-[10px] font-bold text-on-surface-variant">
                    +{session.extraCount}
                  </span>
                </div>
              )}
              {(session.blockedItems ?? []).length === 0 && session.extraCount === 0 && (
                <span className="text-[12px] text-outline">None selected</span>
              )}
            </div>
          </div>
          <button
            onClick={onProAction}
            className="text-[12px] text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            View All
          </button>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onPause}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold glass-card border border-outline-variant/30 text-on-surface hover:bg-surface-variant transition-colors"
          >
            <MaterialIcon name={isPaused ? 'play_arrow' : 'pause'} size="text-lg" />
            {isPaused ? 'Resume Session' : 'Pause Session'}
          </button>
          <button
            onClick={onEnd}
            className="flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-colors bg-error-container/20 border border-error/30 text-error hover:bg-error-container/30"
          >
            <MaterialIcon name="stop_circle" size="text-lg" />
            End Session
          </button>
        </div>
      </Card>

      {/* ── Session History card ──────────────────────── */}
      <Card className="p-6 flex-1 flex flex-col min-h-0" hoverable={false}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline-md text-headline-md text-on-surface">Session History</h3>
          <button
            className="text-[12px] text-primary hover:text-primary/80 font-semibold transition-colors"
            onClick={onProAction}
          >
            View all
          </button>
        </div>

        {(history ?? []).length === 0 ? (
          <p className="text-[12px] text-on-surface-variant py-4 text-center">
            No previous sessions yet.
          </p>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin">
            {(history ?? []).slice(0, 5).map(item => (
              <HistoryRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default ActiveSessionPanel
