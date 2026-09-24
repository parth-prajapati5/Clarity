/**
 * ProBanner.jsx
 * Sticky top banner for Focus Mode — "This is a Pro feature, upgrade to unlock."
 * Uses existing design tokens only.
 */
import MaterialIcon from '../ui/MaterialIcon'
import Button from '../ui/Button'

const ProBanner = ({ onUpgrade }) => (
  <div className="
    flex items-center justify-between px-8 py-3 flex-shrink-0
    bg-primary-container/10 border-b border-primary/20
  ">
    <div className="flex items-center gap-3">
      <MaterialIcon name="workspace_premium" size="text-lg" className="text-tertiary" filled />
      <div>
        <p className="text-[13px] font-bold text-on-surface">Focus Mode is a Pro feature</p>
        <p className="text-[12px] text-on-surface-variant">
          Upgrade to unlock Focus Mode and boost your productivity.
        </p>
      </div>
    </div>
    <Button variant="primary" className="px-6 py-2.5 rounded-xl text-[13px]" onClick={onUpgrade}>
      Upgrade to Pro
    </Button>
  </div>
)

export default ProBanner
