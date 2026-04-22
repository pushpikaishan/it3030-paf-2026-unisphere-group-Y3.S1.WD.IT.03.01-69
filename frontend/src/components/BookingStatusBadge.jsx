const STATUS_LABELS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export default function BookingStatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status || 'Unknown'
  return <span className={`booking-status booking-status--${String(status || '').toLowerCase()}`}>{label}</span>
}