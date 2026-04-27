import BookingStatusBadge from './BookingStatusBadge'

const formatTime = (value) => (value ? String(value).slice(0, 5) : '--:--')

export default function BookingCard({
  booking,
  isAdmin = false,
  onApprove,
  onReject,
  onCancel,
  onDelete,
  showCancel = true,
  showDelete = false,
  busyAction,
}) {
  const hasValidId = booking?.id !== null && booking?.id !== undefined && booking?.id !== ''
  const canApprove = isAdmin && booking.status === 'PENDING'
  const canReject = isAdmin && booking.status === 'PENDING'
  const canCancel = showCancel && (booking.status === 'PENDING' || booking.status === 'APPROVED')
  const canDelete = showDelete && isAdmin

  return (
    <article className="booking-card card">
      <div className="booking-card-head">
        <div>
          <h3>{booking.resourceName}</h3>
          <p className="muted">{booking.resourceLocation}</p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>

      <div className="booking-card-grid">
        <p>
          <strong>Date:</strong> {booking.bookingDate}
        </p>
        <p>
          <strong>Time:</strong> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
        </p>
        <p>
          <strong>Attendees:</strong> {booking.expectedAttendees}
        </p>
        <p>
          <strong>Purpose:</strong> {booking.purpose}
        </p>
        {isAdmin && (
          <p>
            <strong>Requested by:</strong> {booking.userName || booking.userEmail}
          </p>
        )}
      </div>

      {booking.adminReason && (
        <p className="booking-admin-reason">
          <strong>Admin reason:</strong> {booking.adminReason}
        </p>
      )}

      <div className="booking-card-actions">
        {canApprove && (
          <button
            type="button"
            className="btn booking-approve-btn"
            onClick={() => onApprove?.(booking)}
            disabled={!hasValidId || busyAction === `approve-${booking.id}`}
          >
            Approve
          </button>
        )}

        {canReject && (
          <button
            type="button"
            className="btn booking-reject-btn"
            onClick={() => onReject?.(booking)}
            disabled={!hasValidId || busyAction === `reject-${booking.id}`}
          >
            Reject
          </button>
        )}

        {canCancel && (
          <button
            type="button"
            className="btn booking-cancel-btn"
            onClick={() => onCancel?.(booking)}
            disabled={!hasValidId || busyAction === `cancel-${booking.id}`}
          >
            Cancel
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            className="btn danger"
            onClick={() => onDelete?.(booking)}
            disabled={!hasValidId || busyAction === `delete-${booking.id}`}
          >
            Delete
          </button>
        )}
      </div>
    </article>
  )
}
