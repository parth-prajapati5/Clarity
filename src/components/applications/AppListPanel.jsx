/**
 * AppListPanel.jsx
 * Left column — sortable application list. Visual design unchanged.
 * Now uses fmtSeconds from usageApi instead of fmtMinutes from mock data.
 */

import Card         from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import AppIcon      from '../ui/AppIcon'
import { fmtSeconds } from '../../services/usageApi'

const SORT_TABS = [
  { id: 'most',   label: 'Most Used'     },
  { id: 'recent', label: 'Recently Used' },
  { id: 'az',     label: 'A – Z'         },
]

const VISIBLE_DEFAULT = 6

const AppRow = ({ app, isSelected, onSelect }) => {
  // weekMinutes is already stored in minutes on the transformed object
  const maxMins = 600  // scale bar relative to ~10h max
  return (
    <button
      onClick={() => onSelect(app)}
      className={[
        'w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 flex items-center gap-3',
        isSelected
          ? 'bg-primary-container/10 border border-primary/40 text-primary'
          : 'border border-transparent hover:bg-surface-variant/50 text-on-surface-variant hover:text-on-surface',
      ].join(' ')}
    >
      {/* App icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold overflow-hidden"
        style={{ background: app.iconBg }}
      >
        <AppIcon
          icon={app.icon}
          letter={app.iconLetter}
          className="w-6 h-6 object-contain"
        />
      </div>

      {/* Name + bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-[13px] font-semibold truncate ${isSelected ? 'text-on-surface' : ''}`}>
            {app.name}
          </span>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <span className="text-[12px] font-bold text-on-surface">
              {fmtSeconds(app.weekMinutes * 60)}
            </span>
            <span className={`text-[11px] font-medium w-8 text-right ${isSelected ? 'text-primary' : 'text-outline'}`}>
              {app.percent}%
            </span>
          </div>
        </div>
        <div className="h-1 rounded-full overflow-hidden bg-surface-variant">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-primary' : 'bg-primary/40'}`}
            style={{ width: `${Math.min((app.weekMinutes / maxMins) * 100, 100)}%` }}
          />
        </div>
      </div>

      <MaterialIcon
        name="chevron_right"
        size="text-base"
        className={`flex-shrink-0 ${isSelected ? 'text-primary' : 'text-outline/40'}`}
      />
    </button>
  )
}

const AppListPanel = ({
  apps = [], selectedId, onSelect,
  sortTab, onSortChange, showAll, onShowMore,
}) => {
  const visible = showAll ? apps : apps.slice(0, VISIBLE_DEFAULT)

  return (
    <Card className="flex flex-col overflow-hidden h-full" hoverable={false}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-outline-variant/20">
        <div className="flex gap-0.5 p-1 rounded-xl bg-surface-variant/30">
          {SORT_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => onSortChange(tab.id)}
              className={[
                'px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200',
                sortTab === tab.id
                  ? 'bg-primary-container/20 text-primary'
                  : 'text-on-surface-variant hover:text-on-surface',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button className="p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors">
          <MaterialIcon name="format_list_bulleted" size="text-lg" />
        </button>
      </div>

      {/* App rows */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5 scrollbar-thin">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <MaterialIcon name="search_off" size="text-4xl" className="text-outline/40" />
            <p className="text-sm text-on-surface-variant">No applications found</p>
          </div>
        ) : (
          visible.map(app => (
            <AppRow key={app.id} app={app} isSelected={app.id === selectedId} onSelect={onSelect} />
          ))
        )}
      </div>

      {/* Show More */}
      {!showAll && apps.length > VISIBLE_DEFAULT && (
        <div className="border-t border-outline-variant/20">
          <button
            onClick={onShowMore}
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Show More
            <MaterialIcon name="expand_more" size="text-base" />
          </button>
        </div>
      )}
    </Card>
  )
}

export default AppListPanel
