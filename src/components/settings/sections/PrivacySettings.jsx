/**
 * PrivacySettings.jsx
 */
import { SettingsSection, ToggleRow, SelectRow, ButtonRow } from '../SettingsWidgets'

const PrivacySettings = ({ settings, onChange, onExport, onDelete }) => {
  const set = (key) => (val) => onChange({ ...settings, [key]: val })
  const retentionLabels = settings.retentionOptions.map(d => `${d} days`)

  return (
    <div className="space-y-5">
      <SettingsSection title="Data Collection" description="Control what data Clarity collects and stores.">
        <ToggleRow label="Usage data collection" description="Allow Clarity to record app and website usage."
          value={settings.dataCollection} onChange={set('dataCollection')} />
        <ToggleRow label="Store data locally only" description="Never upload any data. All records stay on this device."
          value={settings.localStorageOnly} onChange={set('localStorageOnly')} />
        <ToggleRow label="Crash reports" description="Send anonymous crash reports to help improve the app."
          value={settings.crashReports} onChange={set('crashReports')} />
        <ToggleRow label="Anonymous analytics" description="Help improve Clarity by sharing anonymised usage patterns."
          value={settings.analyticsSharing} onChange={set('analyticsSharing')} />
      </SettingsSection>

      <SettingsSection title="Data Retention" description="How long Clarity keeps your usage history.">
        <SelectRow label="Keep history for"
          description="Usage data older than this will be automatically deleted."
          value={`${settings.dataRetentionDays} days`}
          options={retentionLabels}
          onChange={v => set('dataRetentionDays')(parseInt(v))} />
      </SettingsSection>

      <SettingsSection title="Your Data" description="Export or permanently delete your usage data.">
        <ButtonRow label="Export all data" description="Download a full copy of your usage history as CSV."
          buttonLabel="Export Data" icon="download" onClick={onExport} />
        <ButtonRow label="Delete all data" description="Permanently erase all recorded usage data. This cannot be undone."
          buttonLabel="Delete Data" icon="delete_forever" onClick={onDelete} danger />
      </SettingsSection>
    </div>
  )
}

export default PrivacySettings
