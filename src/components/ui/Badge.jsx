/**
 * Badge.jsx
 * Small label pill / badge for metric deltas, status tags, etc.
 *
 * Variants:
 *  - secondary  : secondary color pill (e.g. "DAILY GOAL: 4h")
 *  - positive   : secondary text, no bg (e.g. "+12% vs yesterday")
 *  - neutral    : outline-muted text (e.g. "3/5 Complete")
 *  - tertiary   : tertiary color (e.g. "Tier: High")
 */

const variantClasses = {
  secondary: 'bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-[11px] font-bold',
  positive: 'text-secondary text-[10px] font-bold',
  neutral: 'text-outline text-[10px] font-bold',
  tertiary: 'text-tertiary text-[10px] font-bold',
  live: 'flex items-center gap-2',
}

const Badge = ({ children, variant = 'secondary', className = '', ...props }) => {
  return (
    <span
      className={[variantClasses[variant] ?? variantClasses.secondary, className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </span>
  )
}

export default Badge
