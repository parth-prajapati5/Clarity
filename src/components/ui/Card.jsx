/**
 * Card.jsx
 * Base glass-card surface used throughout the dashboard.
 * Accepts optional hover lift micro-interaction via `hoverable` prop.
 */

const Card = ({ children, className = '', hoverable = true, ...props }) => {
  return (
    <div
      className={[
        'glass-card rounded-2xl',
        hoverable ? 'transition-transform duration-300 ease-out hover:-translate-y-0.5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
