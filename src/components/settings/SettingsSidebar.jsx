/**
 * SettingsSidebar.jsx
 * Left section-nav for Settings page.
 * Uses existing design tokens — mirrors the app's NavRow pattern.
 */
import MaterialIcon from '../ui/MaterialIcon'
import { SETTINGS_SECTIONS } from '../../data/settings'

const SettingsSidebar = ({ activeSection, onSelect }) => (
  <div className="glass-card rounded-2xl p-3 flex flex-col gap-0.5 h-fit sticky top-6">
    {SETTINGS_SECTIONS.map(s => (
      <button
        key={s.id}
        onClick={() => onSelect(s.id)}
        className={[
          'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
          activeSection === s.id
            ? 'bg-primary-container/10 border border-primary/40'
            : 'border border-transparent hover:bg-surface-variant/50',
        ].join(' ')}
      >
        <MaterialIcon
          name={s.icon}
          size="text-lg"
          className={activeSection === s.id ? 'text-primary' : 'text-outline'}
          filled={activeSection === s.id}
        />
        <span className={`text-[13px] font-medium ${activeSection === s.id ? 'text-on-surface' : 'text-on-surface-variant'}`}>
          {s.label}
        </span>
      </button>
    ))}
  </div>
)

export default SettingsSidebar
