/**
 * ExportSection.jsx — uses project design tokens exclusively.
 */
import Card from '../ui/Card'
import Button from '../ui/Button'
import MaterialIcon from '../ui/MaterialIcon'

const ACTIONS = [
  { id: 'pdf',   label: 'Export PDF',   icon: 'picture_as_pdf', variant: 'ghost'   },
  { id: 'csv',   label: 'Export CSV',   icon: 'table_chart',    variant: 'ghost'   },
  { id: 'share', label: 'Share Report', icon: 'share',          variant: 'primary' },
]

const ExportSection = () => (
  <Card className="p-5 flex items-center justify-between" hoverable={false}>
    <div className="flex items-center gap-4">
      <div className="p-2.5 rounded-xl bg-secondary-container/10">
        <MaterialIcon name="summarize" size="text-xl" className="text-secondary" />
      </div>
      <div>
        <h4 className="font-bold text-on-surface">Export Report</h4>
        <p className="text-[12px] text-on-surface-variant">
          Save or share your usage data for this period
        </p>
      </div>
    </div>

    <div className="flex items-center gap-3">
      {ACTIONS.map(a => (
        <Button key={a.id} variant={a.variant}>
          <MaterialIcon name={a.icon} size="text-sm" />
          {a.label}
        </Button>
      ))}
    </div>
  </Card>
)

export default ExportSection
