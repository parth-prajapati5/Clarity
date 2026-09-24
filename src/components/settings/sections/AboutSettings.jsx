/**
 * AboutSettings.jsx
 */
import Card from '../../ui/Card'
import MaterialIcon from '../../ui/MaterialIcon'
import { SettingsSection, InfoRow, ButtonRow } from '../SettingsWidgets'
import { aboutData } from '../../../data/settings'

const AboutSettings = ({ version = aboutData.version, onCheckUpdate }) => (
  <div className="space-y-5">
    {/* App identity card */}
    <Card className="p-6 flex items-center gap-5" hoverable={false}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-primary-container/10 border border-primary/30">
        <span className="material-symbols-outlined text-primary text-3xl"
          style={{ fontVariationSettings: "'FILL' 1" }}>blur_on</span>
      </div>
      <div>
        <p className="text-[18px] font-bold text-on-surface">Clarity</p>
        <p className="text-[13px] text-on-surface-variant">Digital Wellbeing · v{version}</p>
      </div>
      <div className="ml-auto">
        <button
          onClick={onCheckUpdate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-semibold glass-card border border-outline-variant/30 text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <MaterialIcon name="system_update" size="text-sm" />
          Check for Updates
        </button>
      </div>
    </Card>

    <SettingsSection title="Version Information">
      <InfoRow label="Version"   value={`v${version}`}  />
      <InfoRow label="Build"     value={aboutData.build}          />
      <InfoRow label="Platform"  value={aboutData.platform}       />
      <InfoRow label="License"   value={aboutData.license}        />
    </SettingsSection>

    <SettingsSection title="Resources">
      <ButtonRow label="Website"      description={aboutData.website}   buttonLabel="Open" icon="open_in_new" onClick={() => {}} />
      <ButtonRow label="Changelog"    description="What's new in this version."          buttonLabel="View"  icon="list_alt"   onClick={() => {}} />
      <ButtonRow label="Support"      description="Get help or report a problem."         buttonLabel="Open"  icon="help"       onClick={() => {}} />
      <ButtonRow label="Privacy Policy" description="How we handle your data."            buttonLabel="Read"  icon="policy"     onClick={() => {}} />
    </SettingsSection>

    <SettingsSection title="Acknowledgements">
      <div className="py-4 space-y-1">
        {['React 18', 'Vite 5', 'Tailwind CSS 3', 'Recharts 3', 'Tauri 2'].map(lib => (
          <div key={lib} className="flex items-center gap-2">
            <MaterialIcon name="check_circle" size="text-sm" className="text-primary/60" />
            <span className="text-[12px] text-on-surface-variant">{lib}</span>
          </div>
        ))}
      </div>
    </SettingsSection>
  </div>
)

export default AboutSettings
