/**
 * TrackingSettings.jsx
 */
import { SettingsSection, ToggleRow, SelectRow } from '../SettingsWidgets'

const TrackingSettings = ({ settings, onChange }) => {
  const set = (key) => (val) => onChange({ ...settings, [key]: val })
  const idleLabels = settings.idleOptions.map(m => `${m} min`)

  return (
    <div className="space-y-5">
      <SettingsSection title="Activity Detection" description="How Clarity detects and measures your activity.">
        <ToggleRow label="Track idle time" description="Include periods of keyboard/mouse inactivity in reports."
          value={settings.trackIdleTime} onChange={set('trackIdleTime')} />
        <SelectRow label="Idle threshold"
          description="Mark as idle after this many minutes with no input."
          value={`${settings.idleThresholdMinutes} min`}
          options={idleLabels}
          onChange={v => set('idleThresholdMinutes')(parseInt(v))} />
        <ToggleRow label="Pause on screensaver" description="Stop recording when the screensaver or lock screen is active."
          value={settings.pauseOnScreensaver} onChange={set('pauseOnScreensaver')} />
      </SettingsSection>

      <SettingsSection title="Browser & Private Windows" description="How Clarity handles private browsing.">
        <ToggleRow label="Track incognito / private windows"
          description="Record activity in browser private/incognito windows."
          value={settings.trackIncognito} onChange={set('trackIncognito')} />
      </SettingsSection>

      <SettingsSection title="Screenshots" description="Optional periodic screenshot capture (Pro feature).">
        <ToggleRow label="Capture periodic screenshots"
          description="Take a screenshot every 30 minutes for activity evidence. Stored locally only."
          value={settings.captureScreenshots} onChange={set('captureScreenshots')} />
      </SettingsSection>
    </div>
  )
}

export default TrackingSettings
