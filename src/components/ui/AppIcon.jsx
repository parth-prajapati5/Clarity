import { useState } from 'react'
import MaterialIcon from './MaterialIcon'

/**
 * AppIcon
 * Displays the native application icon if available (Data URL / PNG).
 * If the icon fails to load or is not provided, seamlessly renders
 * the fallback letter or MaterialIcon symbol with the exact same
 * sizing and styling as the original design.
 */
export default function AppIcon({
  icon,
  letter,
  symbol,
  className = 'w-full h-full object-contain p-1.5',
  fallbackClassName = 'text-white font-bold',
}) {
  const [loadFailed, setLoadFailed] = useState(false)

  if (icon && !loadFailed) {
    return (
      <img
        src={icon}
        alt=""
        className={className}
        onError={() => setLoadFailed(true)}
        draggable={false}
      />
    )
  }

  if (letter) {
    return <span className={fallbackClassName}>{letter}</span>
  }

  if (symbol) {
    return <MaterialIcon name={symbol} size="text-sm" className={fallbackClassName} />
  }

  return null
}
