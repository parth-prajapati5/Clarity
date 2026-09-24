/**
 * UsageTimeline.jsx
 * Vertical timeline — uses existing text-primary, text-on-surface,
 * text-on-surface-variant, border-outline-variant tokens.
 */

const TimelineEvent = ({ event, isLast }) => {
  const isStart = event.type === 'start'
  return (
    <div className="flex gap-4 relative">
      {/* Connector line */}
      {!isLast && (
        <div
          className="absolute left-[15px] top-8 w-px bg-primary/20"
          style={{ bottom: '-4px' }}
        />
      )}

      {/* Dot */}
      <div className="flex-shrink-0" style={{ width: 32 }}>
        <div
          className={[
            'w-8 h-8 rounded-full flex items-center justify-center z-10',
            isStart
              ? 'bg-primary-container/20 border border-primary/40'
              : 'bg-surface-variant border border-outline-variant/50',
          ].join(' ')}
        >
          <span
            className={[
              'material-symbols-outlined',
              isStart ? 'text-primary' : 'text-outline',
            ].join(' ')}
            style={{ fontSize: 14 }}
          >
            {isStart ? 'play_arrow' : 'stop'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-outline mb-0.5">
              {event.time}
            </p>
            <p className="text-[13px] font-semibold text-on-surface mb-0.5">{event.label}</p>
            {event.detail && (
              <p className="text-[12px] text-on-surface-variant">{event.detail}</p>
            )}
          </div>
          {event.duration && (
            <div className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-primary-container/10 text-primary border border-primary/20">
              {event.duration}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const UsageTimeline = ({ events = [] }) => (
  <div>
    <h4 className="text-[14px] font-semibold text-on-surface mb-5">
      Usage Timeline{' '}
      <span className="text-[12px] font-normal text-on-surface-variant">(Today)</span>
    </h4>
    {events.length === 0 ? (
      <p className="text-sm text-on-surface-variant py-4 text-center">No activity recorded today</p>
    ) : (
      <div>
        {events.map((event, idx) => (
          <TimelineEvent key={event.id} event={event} isLast={idx === events.length - 1} />
        ))}
      </div>
    )}
  </div>
)

export default UsageTimeline
