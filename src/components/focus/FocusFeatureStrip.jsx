/**
 * FocusFeatureStrip.jsx
 * Bottom banner: headline + 3 feature highlights.
 * Uses existing design tokens only.
 */
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'
import { focusFeatures } from '../../data/focus'

const FeatureTile = ({ item }) => (
  <div className="flex items-center gap-3">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-container/10">
      <MaterialIcon name={item.icon} size="text-lg" className="text-primary" />
    </div>
    <div>
      <p className="text-[13px] font-semibold text-on-surface">{item.title}</p>
      <p className="text-[11px] text-outline">{item.sub}</p>
    </div>
  </div>
)

const FocusFeatureStrip = () => (
  <Card className="p-5 flex items-center gap-8" hoverable={false}>
    {/* Headline */}
    <div className="flex items-center gap-4 flex-shrink-0">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-primary-container/10">
        <MaterialIcon name="center_focus_strong" size="text-xl" className="text-primary" filled />
      </div>
      <div>
        <p className="text-[14px] font-bold text-on-surface">Stay focused, achieve more</p>
        <p className="text-[12px] text-on-surface-variant">
          Focus Mode helps you eliminate distractions and build productive habits.
        </p>
      </div>
    </div>

    {/* Divider */}
    <div className="h-10 w-px bg-outline-variant/30 flex-shrink-0" />

    {/* Feature tiles */}
    <div className="flex flex-1 items-center justify-around gap-6">
      {focusFeatures.map(f => <FeatureTile key={f.id} item={f} />)}
    </div>
  </Card>
)

export default FocusFeatureStrip
