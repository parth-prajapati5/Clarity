/**
 * GeneralSettings.jsx — General section of the Settings page.
 */
import { SettingsSection, ToggleRow, SelectRow, SliderRow } from '../SettingsWidgets'

const GeneralSettings = ({ settings, onChange }) => {
  const set = (key) => (val) => onChange({ ...settings, [key]: val })
  const fmtHours = (m) => {
    const h = Math.floor(m / 60); const min = m % 60
    return h > 0 ? (min > 0 ? `${h}h ${min}m` : `${h}h`) : `${min}m`
  }

  return (
    <div className="space-y-5">
      {/* Startup */}
      <SettingsSection title="Startup & System" description="Control how Clarity launches and runs on your system.">
        <ToggleRow label="Launch on startup" description="Automatically start Clarity when Windows starts."
          value={settings.launchOnStartup} onChange={set('launchOnStartup')} />
        <ToggleRow label="Minimize to system tray" description="Keep Clarity running in the background when closed."
          value={settings.minimizeToTray} onChange={set('minimizeToTray')} />
        <ToggleRow label="Show in taskbar" description="Display Clarity in the Windows taskbar."
          value={settings.showInTaskbar} onChange={set('showInTaskbar')} />
      </SettingsSection>

      {/* Goals */}
      <SettingsSection title="Usage Goals" description="Set your daily screen time target.">
        <SliderRow label="Daily screen time goal" description="Set your target daily screen time limit."
          value={settings.dailyGoalMinutes} min={60} max={600} step={15}
          format={fmtHours} onChange={set('dailyGoalMinutes')} />
      </SettingsSection>

      {/* Locale */}
      <SettingsSection title="Regional" description="Language and calendar preferences.">
        <SelectRow label="Language" description="Interface display language."
          value={settings.language} options={settings.languageOptions} onChange={set('language')} />
        <SelectRow label="Week starts on" description="First day of the week in charts and reports."
          value={settings.weekStartDay} options={settings.weekStartOptions} onChange={set('weekStartDay')} />
      </SettingsSection>
    </div>
  )
}

export default GeneralSettings
