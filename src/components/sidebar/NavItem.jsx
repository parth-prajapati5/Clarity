/**
 * NavItem.jsx
 * Single navigation link row in the sidebar.
 * Handles active / inactive visual states exactly as in the Stitch design.
 */

import MaterialIcon from '../ui/MaterialIcon'

const NavItem = ({ item, onClick }) => {
  const { label, icon, active, filled } = item

  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault()
        onClick?.(item)
      }}
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200',
        active
          ? 'text-primary font-bold bg-primary-container/10 border-l-2 border-primary'
          : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-variant',
      ].join(' ')}
    >
      <MaterialIcon name={icon} filled={active && filled} />
      <span className="font-body-md text-body-md">{label}</span>
    </a>
  )
}

export default NavItem
