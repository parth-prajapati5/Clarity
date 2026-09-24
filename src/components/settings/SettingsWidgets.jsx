/**
 * SettingsWidgets.jsx
 * Reusable primitive widgets used across all settings sections.
 * All use existing design tokens — no hardcoded colours.
 */

import MaterialIcon from '../ui/MaterialIcon'

// ── Section wrapper ──────────────────────────────────────────
export const SettingsSection = ({ title, description, children }) => (
  <div className="glass-card rounded-2xl overflow-hidden">
    <div className="px-6 py-4 border-b border-outline-variant/20">
      <h3 className="text-[15px] font-bold text-on-surface">{title}</h3>
      {description && (
        <p className="text-[12px] text-on-surface-variant mt-0.5">{description}</p>
      )}
    </div>
    <div className="px-6 py-2 divide-y divide-outline-variant/10">
      {children}
    </div>
  </div>
)

// ── Toggle row ───────────────────────────────────────────────
export const ToggleRow = ({ label, description, value, onChange }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-on-surface">{label}</p>
      {description && (
        <p className="text-[12px] text-on-surface-variant mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!value)}
      className={[
        'relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0',
        value ? 'bg-primary' : 'bg-surface-variant',
      ].join(' ')}
    >
      <span className={[
        'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200',
        value ? 'left-5' : 'left-0.5',
      ].join(' ')} />
    </button>
  </div>
)

// ── Select row ───────────────────────────────────────────────
export const SelectRow = ({ label, description, value, options, onChange }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <div className="min-w-0">
      <p className="text-[13px] font-medium text-on-surface">{label}</p>
      {description && (
        <p className="text-[12px] text-on-surface-variant mt-0.5">{description}</p>
      )}
    </div>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="
        px-3 py-2 rounded-xl text-[12px] font-medium
        bg-surface-variant/50 border border-outline-variant/30
        text-on-surface focus:outline-none focus:ring-1 focus:ring-primary
        transition-all cursor-pointer min-w-[120px]
      "
    >
      {options.map(o => (
        <option key={o} value={o} className="bg-surface-container">{o}</option>
      ))}
    </select>
  </div>
)

// ── Info row (read-only) ─────────────────────────────────────
export const InfoRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <p className="text-[13px] font-medium text-on-surface">{label}</p>
    <p className="text-[13px] text-on-surface-variant font-medium">{value}</p>
  </div>
)

// ── Button row ───────────────────────────────────────────────
export const ButtonRow = ({ label, description, buttonLabel, buttonVariant = 'ghost', onClick, danger = false, icon }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <div className="min-w-0">
      <p className={`text-[13px] font-medium ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</p>
      {description && (
        <p className="text-[12px] text-on-surface-variant mt-0.5">{description}</p>
      )}
    </div>
    <button
      onClick={onClick}
      className={[
        'flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all flex-shrink-0',
        danger
          ? 'bg-error-container/20 border border-error/30 text-error hover:bg-error-container/30'
          : 'glass-card border border-outline-variant/30 text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {icon && <MaterialIcon name={icon} size="text-sm" />}
      {buttonLabel}
    </button>
  </div>
)

// ── Accent colour picker ─────────────────────────────────────
const ACCENT_TOKENS = {
  Indigo:  'bg-primary',
  Violet:  'bg-[#a78bfa]',
  Cyan:    'bg-secondary',
  Emerald: 'bg-[#34d399]',
  Rose:    'bg-[#fb7185]',
}

export const AccentRow = ({ value, options, onChange }) => (
  <div className="flex items-center justify-between py-4 gap-4">
    <p className="text-[13px] font-medium text-on-surface">Accent Colour</p>
    <div className="flex items-center gap-2">
      {options.map(opt => (
        <button
          key={opt}
          title={opt}
          onClick={() => onChange(opt)}
          className={[
            'w-7 h-7 rounded-full transition-all',
            ACCENT_TOKENS[opt] ?? 'bg-primary',
            value === opt ? 'ring-2 ring-offset-2 ring-primary ring-offset-surface-container-low scale-110' : 'hover:scale-105',
          ].join(' ')}
        />
      ))}
    </div>
  </div>
)

// ── Slider row ───────────────────────────────────────────────
export const SliderRow = ({ label, description, value, min, max, step = 1, format, onChange }) => (
  <div className="py-4">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[13px] font-medium text-on-surface">{label}</p>
      <span className="text-[13px] font-semibold text-primary">
        {format ? format(value) : value}
      </span>
    </div>
    {description && (
      <p className="text-[12px] text-on-surface-variant mb-3">{description}</p>
    )}
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full accent-primary h-1.5 rounded-full bg-surface-variant cursor-pointer"
    />
    <div className="flex justify-between mt-1">
      <span className="text-[10px] text-outline">{format ? format(min) : min}</span>
      <span className="text-[10px] text-outline">{format ? format(max) : max}</span>
    </div>
  </div>
)
