/**
 * ProgressRing.jsx
 * SVG circular progress ring — pixel-perfect match to the Stitch design.
 *
 * Props:
 *  - percentage      : 0–100, how much of the ring is filled
 *  - remainingLabel  : small text below the percentage (e.g. "Remaining: 1h 15m")
 *  - size            : diameter in px (default 192 = w-48 h-48)
 *  - strokeWidth     : ring stroke width in SVG units (default 8)
 */

const ProgressRing = ({
  percentage = 68,
  remainingLabel = '',
  size = 192,
  strokeWidth = 8,
}) => {
  const viewBox = 100
  const radius = (viewBox - strokeWidth) / 2  // 46 when strokeWidth=8
  const circumference = 2 * Math.PI * radius  // ≈ 289
  // Stitch uses stroke-dasharray="264" stroke-dashoffset="80" which gives ~68%
  // We replicate this calculation dynamically:
  const dashArray = circumference
  const dashOffset = circumference * (1 - percentage / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="w-full h-full -rotate-90"
        viewBox={`0 0 ${viewBox} ${viewBox}`}
      >
        {/* Track */}
        <circle
          className="text-surface-variant/30"
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          className="text-primary"
          cx={viewBox / 2}
          cy={viewBox / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold text-on-surface">
          {parseFloat(Number(percentage).toFixed(2))}%
        </span>
        <span className="text-[10px] text-outline uppercase tracking-wider mt-0.5">
          {remainingLabel}
        </span>
      </div>
    </div>
  )
}

export default ProgressRing
