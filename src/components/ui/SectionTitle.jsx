/**
 * SectionTitle.jsx
 * Small uppercase section label used above groupings in the sidebar
 * and inside cards (e.g. "Restrictions", "Historical Heatmap").
 */

const SectionTitle = ({ children, className = '' }) => {
  return (
    <span
      className={[
        'text-[11px] font-bold text-outline uppercase tracking-wider',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </span>
  )
}

export default SectionTitle
