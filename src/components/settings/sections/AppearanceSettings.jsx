/**
 * AppearanceSettings.jsx
 */
import { SettingsSection, SelectRow, ToggleRow, AccentRow } from '../SettingsWidgets'

const AppearanceSettings = ({ settings, onChange }) => {
  const set = (key) => (val) => onChange({ ...settings, [key]: val })
  return (
    <div className="space-y-5">
      <SettingsSection title="Theme" description="Choose how Clarity looks.">
        <SelectRow label="Colour theme" description="Pick a colour scheme for the interface."
          value={settings.theme} options={settings.themeOptions} onChange={set('theme')} />
        <AccentRow value={settings.accentColor} options={settings.accentOptions} onChange={set('accentColor')} />
      </SettingsSection>

      <SettingsSection title="Typography & Density" description="Adjust text size and interface density.">
        <SelectRow label="Font size" description="Controls the size of text throughout the app."
          value={settings.fontSize} options={settings.fontSizeOptions} onChange={set('fontSize')} />
        <ToggleRow label="Compact mode" description="Reduce spacing for more information on screen."
          value={settings.compactMode} onChange={set('compactMode')} />
      </SettingsSection>
    </div>
  )
}

export default AppearanceSettings
