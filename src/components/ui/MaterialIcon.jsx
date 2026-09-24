/**
 * MaterialIcon.jsx
 * Thin wrapper around Material Symbols Outlined icon font.
 * Keeps icon rendering consistent and co-located with className control.
 *
 * Props:
 *  - name      : Material Symbol ligature string (e.g. "dashboard")
 *  - filled    : boolean — sets FILL=1 for active/selected state
 *  - size      : Tailwind text size class override (default "text-2xl")
 *  - className : additional classes
 */

const MaterialIcon = ({ name, filled = false, size = 'text-2xl', className = '' }) => {
  return (
    <span
      className={[
        'material-symbols-outlined',
        filled ? 'active-fill' : '',
        size,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {name}
    </span>
  )
}

export default MaterialIcon
