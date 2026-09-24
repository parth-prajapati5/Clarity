/**
 * NotificationSettings.jsx
 */
import { SettingsSection, ToggleRow, SelectRow } from '../SettingsWidgets'

const NotificationSettings = ({ settings, onChange }) => {
  const set = (key) => (val) => onChange({ ...settings, [key]: val })
  return (
    <div className="space-y-5">
      <SettingsSection title="Alerts & Reports" description="Control which notifications Clarity sends.">
        <ToggleRow label="Daily summary" description="Receive a summary of your usage at the end of each day."
          value={settings.dailySummary} onChange={set('dailySummary')} />
        <ToggleRow label="Goal alerts" description="Get notified when you approach or reach your usage goal."
          value={settings.goalAlerts} onChange={set('goalAlerts')} />
        <ToggleRow label="Focus reminders" description="Periodic reminders to stay on track during work."
          value={settings.focusReminders} onChange={set('focusReminders')} />
        <ToggleRow label="Weekly report" description="Receive a weekly overview of your activity every Monday."
          value={settings.weeklyReport} onChange={set('weeklyReport')} />
      </SettingsSection>

      <SettingsSection title="Timing" description="When and how often notifications are sent.">
        <SelectRow label="Daily summary time" description="Time at which the daily summary notification is sent."
          value={settings.dailySummaryTime}
          options={['08:00 AM','09:00 PM','10:00 PM','11:00 PM']}
          onChange={set('dailySummaryTime')} />
        <SelectRow label="Focus reminder interval"
          description="How often focus reminders appear during an active session."
          value={settings.focusReminderInterval}
          options={settings.intervalOptions}
          onChange={set('focusReminderInterval')} />
      </SettingsSection>
    </div>
  )
}

export default NotificationSettings
