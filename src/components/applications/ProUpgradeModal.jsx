/**
 * ProUpgradeModal.jsx
 * Premium upgrade overlay — uses glass-card, Button (primary/text),
 * MaterialIcon, and existing design tokens throughout.
 */

import Button from '../ui/Button'
import MaterialIcon from '../ui/MaterialIcon'

const FEATURES = [
  'Block applications',
  'Set daily usage limits',
  'Create blocking schedules',
  'Use Focus Mode integration',
  'Cloud sync across devices',
]

const ProUpgradeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="glass-card relative w-[440px] rounded-2xl p-8 shadow-2xl border border-primary/20"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors"
        >
          <MaterialIcon name="close" size="text-lg" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-primary-container/20 border border-primary/30">
            <MaterialIcon name="workspace_premium" size="text-3xl" className="text-primary" filled />
          </div>
        </div>

        {/* Copy */}
        <h3 className="font-headline-md text-headline-md text-on-surface text-center mb-2">
          Unlock Application Controls
        </h3>
        <p className="text-[13px] text-on-surface-variant text-center mb-7">
          Take control of how applications are accessed on your computer.
        </p>

        {/* Feature list */}
        <div className="space-y-2.5 mb-8">
          {FEATURES.map(f => (
            <div key={f} className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-container/20">
                <MaterialIcon name="check" size="text-xs" className="text-primary" />
              </div>
              <span className="text-[13px] text-on-surface-variant">{f}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="space-y-3">
          <Button variant="primary" className="w-full justify-center py-3 rounded-xl text-[14px]">
            Upgrade to Pro
          </Button>
          <Button variant="text" className="w-full justify-center py-2.5 text-[13px] text-on-surface-variant hover:text-on-surface" onClick={onClose}>
            Maybe Later
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ProUpgradeModal
