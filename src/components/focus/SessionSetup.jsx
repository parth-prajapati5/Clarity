/**
 * SessionSetup.jsx
 * Left panel — configure a new focus session.
 * Duration picker (HH:MM spinners + quick presets), name, goal,
 * and the "Choose What to Block" section with app/website tabs.
 *
 * Props:
 *   hours, minutes : current duration values
 *   onHoursChange, onMinutesChange : setters
 *   sessionName, onNameChange
 *   goal, onGoalChange
 *   activeTab, onTabChange : 'apps' | 'websites'
 *   items : array of blockable apps or websites (based on activeTab)
 *   onToggleItem : (id) => void
 *   onStartSession : () => void
 *   selectedCount : number of checked items
 *   onProAction : () => void — opens upgrade modal
 */

import { useState, useMemo } from 'react'
import Card         from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon      from '../ui/AppIcon'
import { DURATION_PRESETS } from '../../data/focus'

// ── Duration stepper ────────────────────────────────────────
const TimeUnit = ({ value, label, onInc, onDec }) => (
  <div className="flex flex-col items-center">
    <button
      onClick={onInc}
      className="p-1 text-on-surface-variant hover:text-primary transition-colors"
    >
      <MaterialIcon name="keyboard_arrow_up" size="text-lg" />
    </button>
    <div className="glass-card w-16 h-14 flex items-center justify-center rounded-xl border border-outline-variant/30 my-1">
      <span className="font-bold text-[22px] text-on-surface">
        {String(value).padStart(2, '0')}
      </span>
    </div>
    <button
      onClick={onDec}
      className="p-1 text-on-surface-variant hover:text-primary transition-colors"
    >
      <MaterialIcon name="keyboard_arrow_down" size="text-lg" />
    </button>
    <span className="text-[11px] text-outline mt-0.5">{label}</span>
  </div>
)

// ── Blockable item row ───────────────────────────────────────
const BlockItemRow = ({ item, onToggle }) => (
  <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-variant/40 transition-colors group">
    {/* Checkbox */}
    <button
      onClick={() => onToggle(item.id)}
      className={[
        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors border',
        item.checked
          ? 'bg-primary border-primary'
          : 'border-outline-variant/50 bg-transparent',
      ].join(' ')}
    >
      {item.checked && (
        <MaterialIcon name="check" size="text-xs" className="text-on-primary" />
      )}
    </button>

    {/* Icon */}
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
      style={{ background: item.iconBg }}
    >
      <AppIcon
        icon={item.icon}
        symbol={item.iconSymbol}
        className="w-5 h-5 object-contain"
        fallbackClassName="text-white"
      />
    </div>

    {/* Name */}
    <span className="text-[13px] font-medium text-on-surface flex-1">{item.name}</span>

    {/* Category */}
    <span className="text-[11px] text-outline">{item.category}</span>
  </div>
)

// ─────────────────────────────────────────────────────────────
const SessionSetup = ({
  hours, minutes, onHoursChange, onMinutesChange,
  sessionName, onNameChange,
  goal, onGoalChange,
  activeTab, onTabChange,
  items, onToggleItem,
  onStartSession,
  selectedCount,
  onProAction,
  startError,
  hasActiveSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(it =>
      (it.name && it.name.toLowerCase().includes(q)) ||
      (it.id && it.id.toLowerCase().includes(q))
    )
  }, [items, searchQuery])

  return (
    <Card className="p-6 flex flex-col gap-5 h-full" hoverable={false}>

      {/* Section: Start a Focus Session */}
      <div>
        <h3 className="font-headline-md text-headline-md text-on-surface mb-0.5">
          Start a Focus Session
        </h3>
        <p className="text-body-md text-on-surface-variant">
          Configure your session and eliminate distractions.
        </p>
      </div>

      {/* Duration */}
      <div>
        <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
          Session Duration
        </p>
        <div className="flex items-center gap-4">
          <TimeUnit
            value={hours}
            label="Hours"
            onInc={() => onHoursChange(Math.min(hours + 1, 12))}
            onDec={() => onHoursChange(Math.max(hours - 1, 0))}
          />
          <span className="text-[22px] font-bold text-outline pb-4">:</span>
          <TimeUnit
            value={minutes}
            label="Minutes"
            onInc={() => onMinutesChange(minutes === 55 ? 0 : minutes + 5)}
            onDec={() => onMinutesChange(minutes === 0  ? 55 : minutes - 5)}
          />
        </div>

        {/* Quick presets */}
        <div className="flex gap-2 mt-3 flex-wrap">
          {DURATION_PRESETS.map(p => {
            const isActive = p.minutes === hours * 60 + minutes
            return (
              <button
                key={p.id}
                onClick={() => {
                  onHoursChange(Math.floor(p.minutes / 60))
                  onMinutesChange(p.minutes % 60)
                }}
                className={[
                  'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all',
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'glass-card border border-outline-variant/30 text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {p.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Session Name */}
      <div>
        <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
          Session Name <span className="normal-case font-normal text-outline">(Optional)</span>
        </p>
        <input
          type="text"
          placeholder="e.g., Deep Work, Study, Coding..."
          value={sessionName}
          onChange={e => onNameChange(e.target.value)}
          className="
            w-full px-4 py-2.5 rounded-xl text-[13px]
            bg-surface-variant/40 border border-outline-variant/30
            text-on-surface placeholder:text-outline
            focus:outline-none focus:ring-1 focus:ring-primary transition-all
          "
        />
      </div>

      {/* Goal */}
      <div>
        <p className="text-[12px] font-semibold text-on-surface-variant uppercase tracking-wider mb-2">
          Goal <span className="normal-case font-normal text-outline">(Optional)</span>
        </p>
        <input
          type="text"
          placeholder="What do you want to achieve?"
          value={goal}
          onChange={e => onGoalChange(e.target.value)}
          className="
            w-full px-4 py-2.5 rounded-xl text-[13px]
            bg-surface-variant/40 border border-outline-variant/30
            text-on-surface placeholder:text-outline
            focus:outline-none focus:ring-1 focus:ring-primary transition-all
          "
        />
      </div>

      {/* Choose What to Block */}
      <div className="flex-1 flex flex-col min-h-0">
        <p className="text-[13px] font-semibold text-on-surface mb-0.5">
          Choose What to Block
        </p>
        <p className="text-[12px] text-on-surface-variant mb-3">
          Select applications and websites to block during your focus session.
        </p>

        {/* App / Website tabs + search */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-0.5 p-1 rounded-xl bg-surface-variant/30">
            {[{ id: 'apps', label: 'Applications' }, { id: 'websites', label: 'Websites' }].map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={[
                  'px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200',
                  activeTab === tab.id
                    ? 'bg-primary-container/20 text-primary'
                    : 'text-on-surface-variant hover:text-on-surface',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <MaterialIcon name="search" size="text-base" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              type="text"
              placeholder={`Search ${activeTab} to block...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="
                pl-8 pr-3 py-1.5 rounded-lg text-[12px] w-44
                bg-surface-variant/40 border border-outline-variant/30
                text-on-surface placeholder:text-outline
                focus:outline-none focus:ring-1 focus:ring-primary transition-all
              "
            />
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto space-y-0.5 scrollbar-thin min-h-0" style={{ maxHeight: 200 }}>
          {filteredItems.length === 0 ? (
            <p className="text-center text-[12px] text-outline py-6">
              No matching {activeTab === 'apps' ? 'applications' : 'websites'} found
            </p>
          ) : (
            filteredItems.map(item => (
              <BlockItemRow key={item.id} item={item} onToggle={onToggleItem} />
            ))
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/20">
          <span className="text-[12px] text-primary font-semibold">
            {selectedCount} {activeTab === 'apps' ? 'application' : 'website'}{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            className="text-[12px] text-on-surface-variant hover:text-primary transition-colors font-medium flex items-center gap-1"
            onClick={onProAction}
          >
            Manage Block List
            <MaterialIcon name="chevron_right" size="text-base" />
          </button>
        </div>
      </div>

      {/* Start CTA */}
      <button
        onClick={onStartSession}
        disabled={hasActiveSession}
        className="
          w-full flex items-center justify-center gap-3 py-4 rounded-2xl
          bg-primary text-on-primary font-bold text-[15px]
          hover:brightness-110 active:opacity-80 transition-all
          shadow-lg disabled:opacity-40 disabled:cursor-not-allowed
        "
        style={{ boxShadow: '0 4px 24px rgba(192,193,255,0.2)' }}
      >
        <MaterialIcon name="play_arrow" size="text-xl" className="text-on-primary" filled />
        {hasActiveSession ? 'Session Already Active' : 'Start Focus Session'}
      </button>
      {startError && (
        <p className="text-center text-[11px] text-error -mt-2">{startError}</p>
      )}
      {!startError && (
        <p className="text-center text-[11px] text-outline -mt-2">
          You can pause or stop the session anytime
        </p>
      )}
    </Card>
  )
}

export default SessionSetup
