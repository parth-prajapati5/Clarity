/**
 * AccountSettings.jsx
 */
import Card from '../../ui/Card'
import Button from '../../ui/Button'
import MaterialIcon from '../../ui/MaterialIcon'
import { SettingsSection, InfoRow, ButtonRow } from '../SettingsWidgets'
import { accountData } from '../../../data/settings'

const AccountSettings = ({ onUpgrade, onSignOut }) => (
  <div className="space-y-5">
    {/* Profile card */}
    <Card className="p-6 flex items-center gap-5" hoverable={false}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 bg-primary-container/10 border-2 border-primary/30">
        <MaterialIcon name={accountData.avatarIcon} size="text-4xl" className="text-primary" filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[17px] font-bold text-on-surface">{accountData.name}</p>
        <p className="text-[13px] text-on-surface-variant">{accountData.email}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-surface-variant text-outline uppercase tracking-wider">
            {accountData.plan} Plan
          </span>
          <span className="text-[11px] text-outline">· Member since {accountData.joinDate}</span>
        </div>
      </div>
      <Button variant="primary" className="flex-shrink-0 px-5 py-2.5 rounded-xl text-[13px]" onClick={onUpgrade}>
        <MaterialIcon name="workspace_premium" size="text-sm" className="text-on-primary" filled />
        Upgrade to Pro
      </Button>
    </Card>

    <SettingsSection title="Account Details">
      <InfoRow label="Name"          value={accountData.name}   />
      <InfoRow label="Email"         value={accountData.email}  />
      <InfoRow label="Plan"          value={accountData.plan}   />
      <InfoRow label="Member since"  value={accountData.joinDate} />
    </SettingsSection>

    <SettingsSection title="Account Actions">
      <ButtonRow label="Edit profile" description="Update your name, email or avatar."
        buttonLabel="Edit Profile" icon="edit" onClick={() => {}} />
      <ButtonRow label="Change password" description="Update your Clarity account password."
        buttonLabel="Change Password" icon="lock" onClick={() => {}} />
      <ButtonRow label="Sign out" description="Sign out of your Clarity account on this device."
        buttonLabel="Sign Out" icon="logout" onClick={onSignOut} />
      <ButtonRow label="Delete account"
        description="Permanently delete your account and all associated data. This cannot be undone."
        buttonLabel="Delete Account" icon="delete_forever" onClick={() => {}} danger />
    </SettingsSection>
  </div>
)

export default AccountSettings
