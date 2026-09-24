/**
 * NotificationButton.jsx
 * Icon button for the notification bell in the top header.
 */

import MaterialIcon from '../ui/MaterialIcon'

const NotificationButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 text-on-surface-variant hover:text-primary transition-all"
      aria-label="Notifications"
    >
      <MaterialIcon name="notifications" />
    </button>
  )
}

export default NotificationButton
