/**
 * BlockingInfoStrip.jsx — bottom info banner matching the screenshot.
 */
import Card from '../ui/Card'
import MaterialIcon from '../ui/MaterialIcon'

const BlockingInfoStrip = ({ onLearnMore }) => (
  <Card className="p-5 flex items-center gap-5" hoverable={false}>
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-primary-container/10">
      <MaterialIcon name="shield" size="text-xl" className="text-primary" filled />
    </div>
    <div className="flex-1">
      <p className="text-[14px] font-bold text-on-surface mb-0.5">Blocking helps you stay focused</p>
      <p className="text-[12px] text-on-surface-variant">
        Blocked apps and websites will be restricted across the system. Changes will apply in real-time.
      </p>
    </div>
    <button
      onClick={onLearnMore}
      className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors flex-shrink-0"
    >
      How does blocking work?
      <MaterialIcon name="chevron_right" size="text-base" />
    </button>
  </Card>
)

export default BlockingInfoStrip
