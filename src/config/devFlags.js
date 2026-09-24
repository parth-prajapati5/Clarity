/**
 * devFlags.js — DEVELOPMENT-ONLY FLAGS
 *
 * These flags exist purely for local testing.
 * They must ALL be set to `false` before shipping to production.
 *
 * HOW TO DISABLE:
 *   Set DEV_PREMIUM_BYPASS to false and rebuild.
 *   The full premium/subscription architecture remains intact below.
 *
 * WHAT THIS FILE DOES NOT DO:
 *   - It does not remove the UpgradePage, upgrade modals, or subscription logic.
 *   - It does not change the Rust backend premium checks (see commands/blocking.rs).
 *   - It does not permanently grant Pro to any user in the database.
 */

// ─── TEMPORARY DEVELOPMENT FLAG ──────────────────────────────
// true  → treat every user as PRO (bypass all upgrade modals / banners)
// false → production behaviour (real premium check via Tauri is_pro_user command)
export const DEV_PREMIUM_BYPASS = true // ← set false before release
