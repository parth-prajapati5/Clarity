/**
 * appearance.js
 * Applies Appearance settings to the live document and native window.
 * Theme (Dark/Light/System), accent colour, font size and compact mode are
 * mapped onto data-* attributes consumed by index.css design tokens.
 */

import { getCurrentWindow } from '@tauri-apps/api/window'

/** Map an Appearance.theme value to a concrete 'dark' | 'light'. */
export function resolveTheme(theme) {
  if (theme === 'System') {
    return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  }
  return theme?.toLowerCase() === 'light' ? 'light' : 'dark'
}

/** Apply theme / accent / font-size / compact-mode to the document root. */
export function applyAppearance({ theme, accentColor, fontSize, compactMode } = {}) {
  const root = document.documentElement
  if (theme) root.dataset.theme = resolveTheme(String(theme))
  if (accentColor) root.dataset.accent = String(accentColor).toLowerCase()
  if (fontSize) root.dataset.fontSize = String(fontSize).toLowerCase()
  if (typeof compactMode === 'boolean') root.dataset.compact = compactMode ? 'true' : 'false'
}

/**
 * Reflect "show in taskbar" on the native window.
 * Errors are swallowed so the app still works when run outside Tauri
 * (e.g. plain-browser Vite dev).
 */
export async function applyShowInTaskbar(enabled) {
  try {
    await getCurrentWindow().setSkipTaskbar(!enabled)
  } catch {
    // Running outside a Tauri WebView — nothing to do.
  }
}