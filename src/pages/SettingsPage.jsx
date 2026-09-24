/**
 * SettingsPage.jsx
 * Settings module — two-column layout: left section-nav + right content area.
 * All settings state managed locally; replace with Tauri IPC when ready.
 */

import { useState, useEffect } from 'react'
import SettingsSidebar       from '../components/settings/SettingsSidebar'
import GeneralSettings       from '../components/settings/sections/GeneralSettings'
import AppearanceSettings    from '../components/settings/sections/AppearanceSettings'
import NotificationSettings  from '../components/settings/sections/NotificationSettings'
import PrivacySettings       from '../components/settings/sections/PrivacySettings'
import TrackingSettings      from '../components/settings/sections/TrackingSettings'
import AccountSettings       from '../components/settings/sections/AccountSettings'
import AboutSettings         from '../components/settings/sections/AboutSettings'
import MaterialIcon          from '../components/ui/MaterialIcon'

import {
  generalSettings,
  appearanceSettings,
  notificationSettings,
  privacySettings,
  trackingSettings,
  aboutData,
} from '../data/settings'

import {
  getSettings,
  saveSetting,
  getAppVersion,
  exportUsageData,
  deleteAllData,
} from '../services/usageApi'

import { applyAppearance, applyShowInTaskbar } from '../services/appearance'

const SECTION_TITLES = {
  general:       { label: 'General',         description: 'Startup, goals and regional preferences.'               },
  appearance:    { label: 'Appearance',       description: 'Theme, accent colour and display density.'             },
  notifications: { label: 'Notifications',    description: 'Alerts, reminders and report delivery.'                },
  privacy:       { label: 'Privacy & Data',   description: 'What data is collected and how long it is kept.'       },
  tracking:      { label: 'Tracking',         description: 'Activity detection, idle time and browser tracking.'   },
  account:       { label: 'Account',          description: 'Your profile, plan and account actions.'               },
  about:         { label: 'About',            description: 'Version info, resources and acknowledgements.'         },
}

function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
}

function mergeSettingsToSection(sectionName, currentSection, dbSettings) {
  if (!dbSettings || typeof dbSettings !== 'object') return currentSection
  const updated = { ...currentSection }
  for (const [key, defVal] of Object.entries(currentSection)) {
    if (Array.isArray(defVal)) continue
    const dbKey = `${sectionName}.${camelToSnake(key)}`
    if (dbKey in dbSettings) {
      const rawVal = dbSettings[dbKey]
      if (typeof defVal === 'boolean') {
        updated[key] = rawVal === 'true' || rawVal === '1'
      } else if (typeof defVal === 'number') {
        const num = Number(rawVal)
        updated[key] = isNaN(num) ? defVal : num
      } else {
        updated[key] = rawVal
      }
    }
  }
  return updated
}

const SettingsPage = ({ onUpgrade }) => {
  const [activeSection, setActiveSection] = useState('general')

  // Per-section state
  const [general,       setGeneral]       = useState(generalSettings)
  const [appearance,    setAppearance]    = useState(appearanceSettings)
  const [notifications, setNotifications] = useState(notificationSettings)
  const [privacy,       setPrivacy]       = useState(privacySettings)
  const [tracking,      setTracking]      = useState(trackingSettings)
  const [appVersion,    setAppVersion]    = useState(aboutData.version)

  // Load persisted settings on mount
  useEffect(() => {
    let mounted = true
    getSettings()
      .then(dbSettings => {
        if (!mounted) return

        const nextGeneral       = mergeSettingsToSection('general',       generalSettings,       dbSettings)
        const nextAppearance    = mergeSettingsToSection('appearance',    appearanceSettings,    dbSettings)
        const nextNotifications = mergeSettingsToSection('notifications', notificationSettings,  dbSettings)
        const nextPrivacy       = mergeSettingsToSection('privacy',       privacySettings,       dbSettings)
        const nextTracking      = mergeSettingsToSection('tracking',      trackingSettings,      dbSettings)

        setGeneral(nextGeneral)
        setAppearance(nextAppearance)
        setNotifications(nextNotifications)
        setPrivacy(nextPrivacy)
        setTracking(nextTracking)

        // Reflect persisted appearance + window behaviour immediately.
        applyAppearance(nextAppearance)
        applyShowInTaskbar(nextGeneral.showInTaskbar)
      })
      .catch(err => {
        console.warn('Could not load settings from backend:', err)
      })

    getAppVersion()
      .then(ver => {
        if (mounted && ver) setAppVersion(ver)
      })
      .catch(err => {
        console.warn('Could not load app version:', err)
      })

    return () => { mounted = false }
  }, [])

  const handleSectionChange = (sectionName, setter, currentVal) => (newVal) => {
    setter(newVal)
    // Persist every changed key to the backend; apply runtime effects only
    // after the backend accepts the change, and revert the UI otherwise so
    // what's shown always matches what's actually saved.
    for (const [k, v] of Object.entries(newVal)) {
      if (Array.isArray(v)) continue
      if (currentVal[k] !== v) {
        const dbKey = `${sectionName}.${camelToSnake(k)}`
        saveSetting(dbKey, String(v))
          .then(() => {
            if (sectionName === 'appearance') {
              applyAppearance(newVal)
            } else if (k === 'showInTaskbar') {
              applyShowInTaskbar(Boolean(v))
            }
          })
          .catch(err => {
            console.warn(`Failed to persist setting ${dbKey}:`, err)
            setter({ ...newVal, [k]: currentVal[k] })
            alert(`Could not save "${k}": ${err?.message || String(err)}`)
          })
      }
    }
  }

  const handleExportData = async () => {
    try {
      const csv = await exportUsageData()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `clarity-usage-export-${new Date().toISOString().slice(0, 10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to export usage data:', err)
      alert('Could not export data: ' + (err?.message || String(err)))
    }
  }

  const handleDeleteData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete all recorded usage data?\n\nThis will permanently erase all tracked application and website activity. Settings, blocked app rules, and focus sessions will be preserved. This action cannot be undone.'
    )
    if (!confirmed) return

    try {
      await deleteAllData()
      alert('All recorded usage data has been permanently deleted.')
    } catch (err) {
      console.error('Failed to delete usage data:', err)
      alert('Failed to delete data: ' + (err?.message || String(err)))
    }
  }

  const handleCheckUpdate = () => {
    alert(`Clarity is up to date (version ${appVersion}).`)
  }

  const section = SECTION_TITLES[activeSection]

  const renderSection = () => {
    switch (activeSection) {
      case 'general':
        return (
          <GeneralSettings
            settings={general}
            onChange={handleSectionChange('general', setGeneral, general)}
          />
        )
      case 'appearance':
        return (
          <AppearanceSettings
            settings={appearance}
            onChange={handleSectionChange('appearance', setAppearance, appearance)}
          />
        )
      case 'notifications':
        return (
          <NotificationSettings
            settings={notifications}
            onChange={handleSectionChange('notifications', setNotifications, notifications)}
          />
        )
      case 'privacy':
        return (
          <PrivacySettings
            settings={privacy}
            onChange={handleSectionChange('privacy', setPrivacy, privacy)}
            onExport={handleExportData}
            onDelete={handleDeleteData}
          />
        )
      case 'tracking':
        return (
          <TrackingSettings
            settings={tracking}
            onChange={handleSectionChange('tracking', setTracking, tracking)}
          />
        )
      case 'account':
        return <AccountSettings onUpgrade={onUpgrade || (() => {})} onSignOut={() => {}} />
      case 'about':
        return <AboutSettings version={appVersion} onCheckUpdate={handleCheckUpdate} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-dim">

      {/* Page header */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0 border-b border-outline-variant/30 bg-surface/60 backdrop-blur-sm">
        <div>
          <h1 className="font-headline-md text-headline-md text-on-surface mb-0.5">Settings</h1>
          <p className="text-body-md text-on-surface-variant">
            Manage your preferences, privacy and account.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="px-8 py-6 max-w-[1200px] mx-auto w-full">
          <div className="grid gap-6" style={{ gridTemplateColumns: '220px 1fr' }}>

            {/* Left: section nav */}
            <SettingsSidebar activeSection={activeSection} onSelect={setActiveSection} />

            {/* Right: section content */}
            <div className="min-w-0">
              {/* Section title */}
              <div className="mb-5">
                <h2 className="text-[18px] font-bold text-on-surface mb-0.5">{section?.label}</h2>
                <p className="text-[13px] text-on-surface-variant">{section?.description}</p>
              </div>

              {renderSection()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
