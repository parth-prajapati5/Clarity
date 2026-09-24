/**
 * AnalyticsHeader.jsx — uses project design tokens exclusively.
 */

const FILTER_TABS = ['Week', 'Month']

const AnalyticsHeader = ({ view, onViewChange, contextLabel, showBackBtn, onBack }) => (
  <div className="
    flex justify-between items-center h-16 px-8
    sticky top-0 z-40 flex-shrink-0
    bg-surface/80 backdrop-blur-md
    border-b border-outline-variant/30
  ">
    {/* Left */}
    <div className="flex items-center gap-3 min-w-0">
      <h2 className="font-headline-md text-headline-md text-on-surface flex-shrink-0">
        Usage Insights
      </h2>

      {showBackBtn && (
        <button
          onClick={onBack}
          className="
            flex items-center gap-1 px-2.5 py-1.5 rounded-lg
            text-[12px] font-semibold flex-shrink-0
            text-primary hover:bg-primary-container/10
            transition-colors
          "
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_left</span>
          Back
        </button>
      )}

      {contextLabel && (
        <span className="text-outline-variant flex-shrink-0">·</span>
      )}
      {contextLabel && (
        <span className="text-[13px] truncate text-outline">{contextLabel}</span>
      )}
    </div>

    {/* Right — Week / Month toggle */}
    <div className="flex gap-0.5 p-1 rounded-xl bg-surface-variant/30">
      {FILTER_TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onViewChange(tab)}
          className={[
            'px-5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200',
            view === tab
              ? 'bg-primary text-on-primary shadow-sm'
              : 'text-on-surface-variant hover:text-on-surface',
          ].join(' ')}
        >
          {tab}
        </button>
      ))}
    </div>
  </div>
)

export default AnalyticsHeader
