/**
 * ActiveRulesPanel.jsx — right column: Active Blocking Rules list.
 * Pixel-perfect to the screenshot layout.
 */
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon from '../ui/AppIcon'
import { activeRules, STATUS_STYLES } from '../../data/blocking'

const RuleRow = ({ rule }) => {
  const style = STATUS_STYLES[rule.statusKey] ?? STATUS_STYLES.Allowed
  const lines = rule.schedule.split('\n')
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-surface-variant/30 transition-colors border border-transparent hover:border-outline-variant/20">
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
        style={{ background: rule.iconBg }}
      >
        <AppIcon
          icon={rule.icon}
          symbol={rule.iconSymbol}
          className="w-6 h-6 object-contain"
          fallbackClassName="text-white"
        />
      </div>

      {/* Name + sub */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-on-surface">{rule.name}</p>
        <p className={`text-[11px] font-medium ${style.text}`}>{rule.sub}</p>
      </div>

      {/* Schedule + active badge */}
      <div className="text-right flex-shrink-0">
        {lines.map((l, i) => (
          <p key={i} className={`text-[11px] ${i === 0 ? 'text-on-surface font-medium' : 'text-outline'}`}>{l}</p>
        ))}
      </div>
      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${style.bg} ${style.text}`}>
        Active
      </span>
      <MaterialIcon name="chevron_right" size="text-base" className="text-outline/40 flex-shrink-0" />
    </div>
  )
}

const ActiveRulesPanel = ({ rules, onViewAll }) => {
  const displayRules = rules ?? activeRules
  return (
  <Card className="p-6 flex flex-col h-full" hoverable={false}>
    <div className="flex items-start justify-between mb-1">
      <h3 className="font-headline-md text-headline-md text-on-surface">Active Blocking Rules</h3>
    </div>
    <p className="text-[12px] text-on-surface-variant mb-5">
      All your active app and website blocking rules.
    </p>

    <div className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
      {displayRules.map(rule => <RuleRow key={rule.id} rule={rule} />)}
    </div>

    {/* View all rules */}
    <button
      onClick={onViewAll}
      className="mt-4 pt-4 border-t border-outline-variant/20 w-full flex items-center justify-between text-[13px] font-semibold text-on-surface-variant hover:text-primary transition-colors"
    >
      <span>View all rules</span>
      <MaterialIcon name="chevron_right" size="text-base" />
    </button>
  </Card>
)}

export default ActiveRulesPanel
