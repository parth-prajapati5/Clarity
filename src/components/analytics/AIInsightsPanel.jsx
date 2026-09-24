/**
 * AIInsightsPanel.jsx — uses project design tokens exclusively.
 */
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

const InsightCard = ({ insight }) => (
  <div className="
    glass-card rounded-2xl p-5 flex flex-col gap-3
    border border-primary/15
    bg-primary-container/5
    transition-transform duration-200 hover:-translate-y-0.5
  ">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-xl flex-shrink-0 bg-primary-container/10">
        <MaterialIcon name={insight.icon} size="text-lg" className="text-primary" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5 text-primary">
          Insight
        </p>
        <h4 className="text-[13px] font-bold text-on-surface leading-snug">
          {insight.title}
        </h4>
      </div>
    </div>
    <p className="text-[12px] leading-relaxed text-on-surface-variant">{insight.body}</p>
    <div className="mt-auto pt-1">
      <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-primary-container/10 text-primary">
        {insight.highlight}
      </span>
    </div>
  </div>
)

const AIInsightsPanel = ({ insights = [] }) => {
  if (!insights.length) return null
  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-on-primary">
          <MaterialIcon name="smart_toy" size="text-base" />
        </div>
        <div>
          <h3 className="font-headline-md text-headline-md text-on-surface">Insights</h3>
          <p className="text-body-md text-on-surface-variant">
            Observations based on your recorded activity
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {insights.map(i => <InsightCard key={i.id} insight={i} />)}
      </div>
    </div>
  )
}

export default AIInsightsPanel
