export default function BookingStatusBadge({ status }) {
  const normalized = (status || '').toUpperCase()
  const className = `booking-status ${normalized.toLowerCase()}`

  return <span className={className}>{normalized || 'UNKNOWN'}</span>
}
