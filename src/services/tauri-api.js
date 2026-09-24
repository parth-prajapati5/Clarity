/**
 * tauri-api.js
 * Service layer for communicating with Tauri Rust backend.
 * All Tauri IPC commands are wrapped here for easy frontend access.
 */

import { invoke } from '@tauri-apps/api'

/**
 * Get today's per-app usage totals
 * @returns {Promise<Array<{application: string, executable_name: string, duration_seconds: number, session_count: number, last_used: string}>>}
 */
export async function getTodayUsage() {
  try {
    console.log('Fetching today usage from backend...')
    const result = await invoke('get_today_usage')
    console.log('Today usage received:', result)
    return result
  } catch (error) {
    console.error('Error fetching today usage:', error)
    return []
  }
}

/**
 * Get application usage data (alias for getTodayUsage)
 * @returns {Promise<Array<{application: string, executable_name: string, duration_seconds: number, session_count: number, last_used: string}>>}
 */
export async function getApplicationUsage() {
  try {
    return await invoke('get_application_usage')
  } catch (error) {
    console.error('Error fetching application usage:', error)
    return []
  }
}

/**
 * Get usage for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<Array<{application: string, executable_name: string, duration_seconds: number, session_count: number, last_used: string}>>}
 */
export async function getUsageForDate(date) {
  try {
    return await invoke('get_usage_for_date', { date })
  } catch (error) {
    console.error('Error fetching usage for date:', error)
    return []
  }
}

/**
 * Get weekly usage (last 7 days)
 * @returns {Promise<Array<{date: string, total_seconds: number, active_apps: number, session_count: number}>>}
 */
export async function getWeeklyUsage() {
  try {
    return await invoke('get_weekly_usage')
  } catch (error) {
    console.error('Error fetching weekly usage:', error)
    return []
  }
}

/**
 * Get sessions for a specific application
 * @param {string} executable - Executable name (e.g., "code.exe")
 * @param {number} limit - Maximum number of sessions to return
 * @returns {Promise<Array<{id: number, application_id: number, app_name: string, executable_name: string, started_at: string, ended_at: string, duration_seconds: number}>>}
 */
export async function getApplicationSessions(executable, limit = 50) {
  try {
    return await invoke('get_application_sessions', { executable, limit })
  } catch (error) {
    console.error('Error fetching application sessions:', error)
    return []
  }
}

/**
 * Get currently active application
 * @returns {Promise<string|null>}
 */
export async function getCurrentApp() {
  try {
    return await invoke('get_current_app')
  } catch (error) {
    console.error('Error fetching current app:', error)
    return null
  }
}

/**
 * Get summary statistics for dashboard
 * @returns {Promise<{today_seconds: number, week_seconds: number, active_today: number, avg_daily_seconds: number}>}
 */
export async function getSummaryStats() {
  try {
    console.log('Fetching summary stats from backend...')
    const result = await invoke('get_summary_stats')
    console.log('Summary stats received:', result)
    return result
  } catch (error) {
    console.error('Error fetching summary stats:', error)
    return {
      today_seconds: 0,
      week_seconds: 0,
      active_today: 0,
      avg_daily_seconds: 0
    }
  }
}

// Utility functions

/**
 * Format seconds to human readable time
 * @param {number} seconds
 * @returns {string}
 */
export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0s'
  
  if (seconds < 60) return `${Math.round(seconds)}s`
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Format seconds to hours with decimal
 * @param {number} seconds
 * @returns {string}
 */
export function secondsToHours(seconds) {
  if (!seconds || isNaN(seconds)) return '0.0'
  return (seconds / 3600).toFixed(1)
}

/**
 * Format time of day from ISO timestamp
 * @param {string} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format date from ISO timestamp
 * @param {string} timestamp
 * @returns {string}
 */
export function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString()
}
