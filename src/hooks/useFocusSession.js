/**
 * useFocusSession.js
 *
 * The Rust backend is the source of truth.
 * - On mount: load the active/paused session from the DB.
 * - elapsed is a client-side counter that starts from session.elapsedSeconds.
 * - A heartbeat ref (not a new interval) writes elapsed to DB every 5 s.
 * - All callbacks read elapsed via elapsedRef to avoid stale-closure bugs.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getActiveFocusSession,
  getFocusHistory,
  startFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  endFocusSession,
  updateFocusElapsed,
} from '../services/usageApi'

export function useFocusSession() {
  const [session,  setSession]  = useState(null)
  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)
  const [elapsed,  setElapsed]  = useState(0)

  // Refs that are always current — used inside intervals to avoid stale closures
  const elapsedRef   = useRef(0)
  const sessionRef   = useRef(null)
  const tickRef      = useRef(null)   // 1-second countdown interval
  const heartRef     = useRef(null)   // 5-second DB persist interval

  // Keep refs in sync with state
  useEffect(() => { elapsedRef.current  = elapsed  }, [elapsed])
  useEffect(() => { sessionRef.current  = session  }, [session])

  // ── Tick helpers ─────────────────────────────────────────

  const stopTick = useCallback(() => {
    if (tickRef.current)  { clearInterval(tickRef.current);  tickRef.current  = null }
    if (heartRef.current) { clearInterval(heartRef.current); heartRef.current = null }
  }, [])

  const startTick = useCallback((fromElapsed) => {
    stopTick()
    // Set state and ref together
    setElapsed(fromElapsed)
    elapsedRef.current = fromElapsed

    // Tick every second
    tickRef.current = setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1
        elapsedRef.current = next
        return next
      })
    }, 1000)

    // Heartbeat: persist to DB every 5 s using the ref (always current)
    heartRef.current = setInterval(() => {
      const s = sessionRef.current
      if (s && s.status === 'active') {
        updateFocusElapsed(s.id, elapsedRef.current).catch(() => {})
      }
    }, 5000)
  }, [stopTick])

  // ── Load session on mount ────────────────────────────────

  const loadSession = useCallback(async () => {
    try {
      setLoading(true)
      const [active, hist] = await Promise.all([
        getActiveFocusSession(),
        getFocusHistory(10),
      ])
      setSession(active)
      setHistory(hist)

      if (active) {
        if (active.status === 'active') {
          // Calculate true elapsed: base elapsed_seconds + time since last heartbeat.
          // This handles the case where the app was closed and reopened mid-session.
          const serverElapsed = active.elapsedSeconds
          const msSinceStarted = Date.now() - new Date(active.startedAt).getTime()
          const secSinceStarted = Math.floor(msSinceStarted / 1000)
          // Use whichever is larger — the DB value or wall-clock calculation
          const trueElapsed = Math.max(serverElapsed, Math.min(secSinceStarted, active.totalSeconds))
          startTick(trueElapsed)
        } else if (active.status === 'paused') {
          setElapsed(active.elapsedSeconds)
          elapsedRef.current = active.elapsedSeconds
        }
      }
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [startTick])

  useEffect(() => {
    loadSession()
    return () => stopTick()
  }, [loadSession, stopTick])

  // ── Actions ──────────────────────────────────────────────

  const start = useCallback(async (name, goal, totalSeconds, blockedAppExes) => {
    try {
      const s = await startFocusSession(name, goal, totalSeconds, blockedAppExes)
      setSession(s)
      startTick(0)
      setError(null)
      return s
    } catch (e) {
      setError(String(e))
      throw e
    }
  }, [startTick])

  const pause = useCallback(async () => {
    const s = sessionRef.current
    if (!s || s.status !== 'active') return
    stopTick()
    const currentElapsed = elapsedRef.current
    try {
      await pauseFocusSession(s.id, currentElapsed)
      setSession(prev => prev ? { ...prev, status: 'paused', elapsedSeconds: currentElapsed } : prev)
      setError(null)
    } catch (e) {
      setError(String(e))
      // Re-start tick if pause failed
      startTick(currentElapsed)
    }
  }, [stopTick, startTick])

  const resume = useCallback(async () => {
    const s = sessionRef.current
    if (!s || s.status !== 'paused') return
    const currentElapsed = elapsedRef.current
    try {
      await resumeFocusSession(s.id)
      setSession(prev => prev ? { ...prev, status: 'active' } : prev)
      startTick(currentElapsed)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [startTick])

  const end = useCallback(async (completed = false) => {
    const s = sessionRef.current
    if (!s) return
    stopTick()
    const finalElapsed = elapsedRef.current
    try {
      await endFocusSession(s.id, finalElapsed, completed)
      setSession(null)
      setElapsed(0)
      elapsedRef.current = 0
      const hist = await getFocusHistory(10)
      setHistory(hist)
      setError(null)
    } catch (e) {
      setError(String(e))
    }
  }, [stopTick])

  // Computed
  const remaining = session
    ? Math.max(session.totalSeconds - elapsed, 0)
    : 0

  return {
    session,
    elapsed,
    remaining,
    history,
    loading,
    error,
    isActive:   session?.status === 'active',
    isPaused:   session?.status === 'paused',
    hasSession: session !== null,
    start,
    pause,
    resume,
    end,
    reload: loadSession,
  }
}
