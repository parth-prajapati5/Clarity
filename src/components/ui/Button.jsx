/**
 * Button.jsx
 * Reusable button primitives matching the design system.
 *
 * Variants:
 *  - primary   : filled primary color (e.g. "Start Focus" CTA)
 *  - ghost     : glass-card border style (e.g. Export / Customize)
 *  - text      : no background, text-only (e.g. "View Full Timeline")
 */

const variantClasses = {
  primary:
    'bg-primary text-on-primary px-5 py-2 rounded-full font-label-md hover:brightness-110 active:opacity-80 flex items-center gap-2',
  ghost:
    'glass-card px-4 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-2 hover:bg-surface-variant text-on-surface text-xs font-medium',
  text: 'text-primary font-bold text-sm hover:underline bg-transparent p-0',
}

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  return (
    <button
      className={[
        'transition-all cursor-pointer',
        variantClasses[variant] ?? variantClasses.primary,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
