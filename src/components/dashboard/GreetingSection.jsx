/**
 * GreetingSection.jsx
 * Greeting + date, real-time current app from backend.
 * Visual design unchanged.
 */

import Button        from '../ui/Button'
import MaterialIcon  from '../ui/MaterialIcon'
import { useCurrentApp } from '../../hooks/useUsageData'

const getGreeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

const getDateLabel = () =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

const GreetingSection = () => {
  const { app: currentApp } = useCurrentApp()

  const subline = currentApp
    ? `Currently tracking: ${currentApp}`
    : 'Tracking your usage in real time'

  return (
    <div className="flex justify-between items-end">
      {/* Left */}
      <div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-1">
          {getGreeting()}
        </h1>
        <p className="text-on-surface-variant font-body-md">
          {getDateLabel()}&nbsp;•&nbsp;
          <span className="text-secondary">{subline}</span>
        </p>
      </div>

      {/* Right */}
      <div className="flex gap-2">
        <Button variant="ghost">
          <MaterialIcon name="download" size="text-sm" />
          <span>Export</span>
        </Button>
        <Button variant="ghost">
          <MaterialIcon name="tune" size="text-sm" />
          <span>Customize</span>
        </Button>
      </div>
    </div>
  )
}

export default GreetingSection
