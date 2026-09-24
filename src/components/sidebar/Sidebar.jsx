/**
 * Sidebar.jsx
 * Uses the project's existing Tailwind design tokens exclusively.
 * No hardcoded hex colours — every value maps to tailwind.config.js.
 *
 * Token reference (from tailwind.config.js):
 *   bg               → surface-container-low   (#1b1b23)
 *   border           → outline-variant/30       (#464554 @ 30%)
 *   active bg        → primary-container/10     (#8083ff @ 10%)
 *   active border    → primary/40               (#c0c1ff @ 40%)
 *   active icon/text → primary                  (#c0c1ff)
 *   hover bg         → surface-variant/50       (#34343d @ 50%)
 *   muted text       → on-surface-variant       (#c7c4d7)
 *   inactive icon    → outline                  (#908fa0)
 *   locked           → outline/30               (#908fa0 @ 30%)
 *   brand text       → on-surface               (#e4e1ed)
 *   surface (menu)   → surface-container        (#1f1f27)
 *   upgrade bg       → primary-container/10     (#8083ff @ 10%)
 *   upgrade border   → primary/20               (#c0c1ff @ 20%)
 */

const FREE_NAV = [
  { id: 'dashboard',    label: 'Dashboard',      icon: 'dashboard'            },
  { id: 'analytics',    label: 'Usage Insights',  icon: 'insights'             },
  { id: 'applications', label: 'Applications',    icon: 'grid_view'            },
  { id: 'website',      label: 'Website Usage',   icon: 'language'             },
  { id: 'reports',      label: 'Reports',         icon: 'bar_chart'            },
  { id: 'focus',        label: 'Focus Mode',      icon: 'center_focus_strong'  },
  { id: 'app-blocking', label: 'Blocking',        icon: 'block'                },
]

const PRO_NAV = [
  { id: 'website-blocking', label: 'Website Blocking', icon: 'public_off'          },
  { id: 'ai-coach',         label: 'AI Insights',      icon: 'psychology'          },
  { id: 'cloud-sync',       label: 'Cloud Sync',       icon: 'cloud_sync'          },
]

// ── NavRow ────────────────────────────────────────────────────
const NavRow = ({ item, isActive, onClick, locked = false }) => (
  <button
    onClick={() => !locked && onClick?.(item)}
    className={[
      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
      'transition-all duration-150 text-left',
      isActive
        ? 'bg-primary-container/10 border border-primary/40'
        : locked
          ? 'border border-transparent cursor-default opacity-40'
          : 'border border-transparent hover:bg-surface-variant/50',
    ].join(' ')}
  >
    {/* Icon */}
    <span
      className={[
        'material-symbols-outlined flex-shrink-0',
        isActive ? 'text-primary' : 'text-outline',
      ].join(' ')}
      style={{
        fontSize: 18,
        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
      }}
    >
      {item.icon}
    </span>

    {/* Label */}
    <span
      className={[
        'flex-1 text-[13px] font-medium truncate',
        isActive ? 'text-on-surface' : 'text-on-surface-variant',
      ].join(' ')}
    >
      {item.label}
    </span>

    {/* Lock icon for Pro items */}
    {locked && (
      <span
        className="material-symbols-outlined flex-shrink-0 text-outline/50"
        style={{ fontSize: 14 }}
      >
        lock
      </span>
    )}
  </button>
)

// ── Sidebar ───────────────────────────────────────────────────
const Sidebar = ({ activeId = 'dashboard', onNavClick }) => (
  <aside
    className="
      flex-shrink-0 flex flex-col h-screen overflow-hidden
      bg-surface-container-low
      border-r border-outline-variant/30
    "
    style={{ width: 220 }}
  >
    {/* ── Brand ───────────────────────────────────────────── */}
    <div className="flex items-center gap-2.5 px-5 pt-5 pb-5">
      <div className="
        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
        bg-primary-container/10 border border-primary/30
      ">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}
        >
          blur_on
        </span>
      </div>

      <span className="text-[16px] font-bold text-on-surface">Clarity</span>

      <button className="
        ml-auto p-1 rounded-md
        text-outline hover:text-on-surface-variant
        transition-colors
      ">
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>menu</span>
      </button>
    </div>

    {/* ── Free navigation ─────────────────────────────────── */}
    <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin space-y-0.5">
      {FREE_NAV.map(item => (
        <NavRow
          key={item.id}
          item={item}
          isActive={item.id === activeId}
          onClick={onNavClick}
        />
      ))}

      {/* PRO FEATURES label */}
      <div className="pt-5 pb-2 px-2 flex items-center gap-2">
        <span
          className="material-symbols-outlined text-tertiary"
          style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}
        >
          workspace_premium
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
          Pro Features
        </span>
      </div>

      {/* Locked Pro nav items */}
      {PRO_NAV.map(item => (
        <NavRow
          key={item.id}
          item={item}
          isActive={false}
          onClick={() => {}}
          locked
        />
      ))}
    </nav>

    {/* ── Bottom: Settings + Upgrade card ─────────────────── */}
    <div className="px-3 pb-4 pt-3 space-y-1 border-t border-outline-variant/30">
      <NavRow
        item={{ id: 'settings', label: 'Settings', icon: 'settings' }}
        isActive={activeId === 'settings'}
        onClick={onNavClick}
      />

      {/* Upgrade to Pro card */}
      <div className="
        mt-3 rounded-2xl px-4 py-4
        bg-primary-container/10
        border border-primary/20
      ">
        <div className="flex items-center gap-2 mb-1.5">
          <span
            className="material-symbols-outlined text-tertiary"
            style={{ fontSize: 15, fontVariationSettings: "'FILL' 1" }}
          >
            workspace_premium
          </span>
          <span className="text-[13px] font-bold text-on-surface">Upgrade to Pro</span>
        </div>
        <p className="text-[11px] leading-snug text-on-surface-variant">
          Unlock powerful features
        </p>
      </div>
    </div>
  </aside>
)

export default Sidebar
