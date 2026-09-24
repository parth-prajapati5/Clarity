/**
 * ActivityHeatmap.jsx — uses project design tokens exclusively.
 * Intensity cells use primary color at graduated opacities.
 */
import Card         from '../ui/Card'
import SectionTitle from '../ui/SectionTitle'

const HEATMAP_HOURS = ['6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21']

// Primary = #c0c1ff from tailwind.config.js
const CELLS = [
  'rgba(70,69,84,0.2)',       // 0 — none  (outline-variant tint)
  'rgba(192,193,255,0.15)',   // 1 — low
  'rgba(192,193,255,0.35)',   // 2 — mid
  'rgba(192,193,255,0.65)',   // 3 — high
  '#c0c1ff',                  // 4 — peak  (primary)
]

const HeatCell = ({ intensity, label }) => (
  <div
    title={label}
    className="rounded-sm transition-opacity hover:opacity-70 cursor-default"
    style={{ minWidth: 0, background: CELLS[intensity] ?? CELLS[0] }}
  />
)

const ActivityHeatmap = ({ data = [], hours = HEATMAP_HOURS }) => {
  if (!data.length) return null

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="font-headline-md text-headline-md text-on-surface">Activity Heatmap</h3>
        <p className="text-body-md text-on-surface-variant mt-0.5">
          Screen activity intensity by hour and day
        </p>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 580 }}>
          {/* Hour labels */}
          <div className="flex mb-2 pl-10">
            {hours.map(h => (
              <div key={h} className="flex-1 text-center text-[10px] font-bold uppercase text-outline">
                {h}
              </div>
            ))}
          </div>

          {/* Day rows */}
          <div className="space-y-1.5">
            {data.map(row => (
              <div key={row.day} className="flex items-center gap-1">
                <div className="w-8 flex-shrink-0 text-[11px] font-bold text-right pr-2 text-outline">
                  {row.day}
                </div>
                <div className="flex flex-1 gap-1 h-6">
                  {row.hours.map(cell => (
                    <HeatCell
                      key={cell.hour}
                      intensity={cell.intensity}
                      label={`${row.day} ${cell.hour}:00`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 justify-end">
            <SectionTitle>Less</SectionTitle>
            {CELLS.map((bg, i) => (
              <div key={i} className="w-4 h-4 rounded-sm" style={{ background: bg }} />
            ))}
            <SectionTitle>More</SectionTitle>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default ActivityHeatmap
