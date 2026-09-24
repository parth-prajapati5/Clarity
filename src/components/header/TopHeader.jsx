/**
 * TopHeader.jsx
 * Sticky top application bar — pixel-perfect match to the Stitch design.
 *
 * Contains:
 *  - SearchBar
 *  - Quick-nav links (Focus Mode, Deep Work)
 *  - NotificationButton
 *  - Calendar icon button
 *  - Start Focus CTA button
 *  - UserProfile avatar
 */

import SearchBar from './SearchBar'
import NotificationButton from './NotificationButton'
import UserProfile from './UserProfile'
import Button from '../ui/Button'
import MaterialIcon from '../ui/MaterialIcon'

const TopHeader = ({ userName = 'Alex', avatarUrl }) => {
  return (
    <header className="
      flex justify-between items-center
      h-16 px-edge-margin w-full
      sticky top-0 z-50
      bg-surface/80 backdrop-blur-md
      border-b border-outline-variant/30
    ">
      {/* Left: search + quick nav */}
      <div className="flex items-center gap-8">
        <SearchBar />

        <nav className="flex gap-6">
          <a
            href="#"
            className="font-body-md text-on-surface-variant hover:text-primary transition-all duration-200"
          >
            Focus Mode
          </a>
          <a
            href="#"
            className="font-body-md text-on-surface-variant hover:text-primary transition-all duration-200"
          >
            Deep Work
          </a>
        </nav>
      </div>

      {/* Right: actions + avatar */}
      <div className="flex items-center gap-4">
        <NotificationButton />

        <button
          className="p-2 text-on-surface-variant hover:text-primary transition-all"
          aria-label="Calendar"
        >
          <MaterialIcon name="calendar_today" />
        </button>

        <Button variant="primary">
          <MaterialIcon name="bolt" size="text-sm" />
          Start Focus
        </Button>

        <UserProfile avatarUrl={avatarUrl} name={userName} />
      </div>
    </header>
  )
}

export default TopHeader
