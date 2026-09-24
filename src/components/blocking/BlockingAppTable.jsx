/**
 * BlockingAppTable.jsx
 * Left panel table — Application or Website blocking list with:
 * search, filter, add button, status badge, toggle switch, three-dot menu.
 *
 * Pixel-perfect to the original screenshot.
 * Changes from original:
 *   - First column header derives from `label` prop ("Application" or "Website")
 *   - `searchQuery` + `onSearchChange` wired so search actually filters
 *   - Everything else unchanged
 */
import { useState } from 'react'
import Card         from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon      from '../ui/AppIcon'
import { STATUS_STYLES } from '../../data/blocking'

// ── Toggle Switch ────────────────────────────────────────────
const Toggle = ({ on, onChange, disabled = false }) => (
  <button
    onClick={() => !disabled && onChange(!on)}
    disabled={disabled}
    className={[
      'relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0',
      disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      on ? 'bg-primary' : 'bg-surface-variant',
    ].join(' ')}
  >
    <span
      className={[
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
        on ? 'left-5' : 'left-0.5',
      ].join(' ')}
    />
  </button>
)

// ── Status Badge ─────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.Allowed
  return (
    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

// ── Single table row ─────────────────────────────────────────
const ItemRow = ({ item, onToggle, onMenuAction, disableToggle = false }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const lines = (item.limitSchedule ?? 'Always').split('\n')

  return (
    <tr className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-variant/20 transition-colors group">
      {/* Name + icon */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: item.iconBg ?? '#6750A4' }}
          >
            <AppIcon
              icon={item.icon}
              symbol={item.iconSymbol ?? 'language'}
              className="w-5 h-5 object-contain"
              fallbackClassName="text-white"
            />
          </div>
          <span className="text-[13px] font-medium text-on-surface">{item.name}</span>
        </div>
      </td>

      {/* Status */}
      <td className="px-3 py-3">
        <StatusBadge status={item.status ?? 'Blocked'} />
      </td>

      {/* Limit / Schedule */}
      <td className="px-3 py-3">
        {lines.map((l, i) => (
          <p key={i} className={`text-[12px] ${i === 0 ? 'text-on-surface' : 'text-outline'}`}>{l}</p>
        ))}
      </td>

      {/* Toggle + three-dot */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Toggle on={item.toggleOn} onChange={() => onToggle(item.id)} disabled={disableToggle} />
          <div className="relative">
            <button
              onClick={() => setMenuOpen(p => !p)}
              className="p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              <MaterialIcon name="more_vert" size="text-base" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-40 w-44 glass-card rounded-xl py-1.5 shadow-2xl border border-outline-variant/30">
                  {/* Pause / Resume depends on current state */}
                  <button
                    onClick={() => { setMenuOpen(false); onMenuAction(item.id, item.toggleOn ? 'Pause Rule' : 'Resume Rule') }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[12px] font-medium transition-colors hover:bg-surface-variant text-on-surface-variant hover:text-on-surface"
                  >
                    <MaterialIcon name={item.toggleOn ? 'pause' : 'play_arrow'} size="text-sm" />
                    {item.toggleOn ? 'Pause Rule' : 'Resume Rule'}
                  </button>
                  <div className="my-1 mx-3 border-t border-outline-variant/20" />
                  <button
                    onClick={() => { setMenuOpen(false); onMenuAction(item.id, 'Unblock') }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[12px] font-medium transition-colors hover:bg-surface-variant text-error"
                  >
                    <MaterialIcon name="lock_open" size="text-sm" />
                    Unblock
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
const BlockingAppTable = ({
  items        = [],
  label        = 'Applications',
  description  = 'Block or limit applications on your device.',
  onToggle,
  onMenuAction,
  onAddNew,
  onFilter,
  searchQuery      = '',
  onSearchChange   = () => {},
  disableToggle    = false,
  emptyMessage     = null,
}) => {
  // First column header: "Website" when label is "Websites", else "Application"
  const colHeader = label === 'Websites' ? 'Website' : 'Application'

  return (
    <Card className="p-0 overflow-hidden flex flex-col" hoverable={false}>
      {/* Panel header */}
      <div className="px-5 pt-5 pb-4 border-b border-outline-variant/20">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-0.5">{label}</h3>
        <p className="text-[12px] text-on-surface-variant">{description}</p>

        {/* Search + Filter + Add */}
        <div className="flex items-center gap-3 mt-4">
          <div className="relative flex-1">
            <MaterialIcon name="search" size="text-base" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${label.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="
                w-full pl-9 pr-4 py-2 rounded-xl text-[12px]
                bg-surface-variant/40 border border-outline-variant/30
                text-on-surface placeholder:text-outline
                focus:outline-none focus:ring-1 focus:ring-primary transition-all
              "
            />
          </div>
          <button
            onClick={onFilter}
            className="glass-card flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-on-surface-variant hover:text-on-surface transition-colors border border-outline-variant/30"
          >
            <MaterialIcon name="filter_list" size="text-base" />
            Filter
          </button>
          <button
            onClick={onAddNew}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold bg-primary text-on-primary hover:brightness-110 transition-all"
          >
            <MaterialIcon name="add" size="text-base" />
            Add {label.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/15">
              {[colHeader, 'Status', 'Limit / Schedule', 'Action'].map(col => (
                <th key={col} className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-outline">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-[12px] text-on-surface-variant">
                  {emptyMessage ?? `No ${label.toLowerCase()} blocked yet.`}
                </td>
              </tr>
            ) : (
              items.map(item => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                  onMenuAction={onMenuAction}
                  disableToggle={disableToggle}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-outline-variant/15">
        <p className="text-[12px] text-outline">
          Showing {items.length} {label.toLowerCase()}
        </p>
      </div>
    </Card>
  )
}

export default BlockingAppTable
