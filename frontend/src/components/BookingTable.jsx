import BookingStatusBadge from './BookingStatusBadge'

const formatTime = (value) => (value ? String(value).slice(0, 5) : '--:--')

export default function BookingTable({ bookings, onApprove, onOpenReject, onCancel, busyAction }) {
  if (!bookings.length) {
    return (
      <div className="card">
        <h3>No bookings found</h3>
        <p className="muted">Try adjusting your filters.</p>
      </div>
    )
  }

  return (
    <div className="card admin-bookings-table-wrap">
      <table className="admin-bookings-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Resource</th>
            <th>Date</th>
            <th>Time</th>
            <th>Purpose</th>
            <th>Expected Attendees</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => {
            const canApprove = booking.status === 'PENDING'
            const canReject = booking.status === 'PENDING'
            const canCancel = booking.status === 'APPROVED'

            return (
              <tr key={booking.id}>
                <td>{booking.userName || booking.userEmail || booking.userId}</td>
                <td>{booking.resourceName || booking.resourceId}</td>
                <td>{booking.bookingDate || booking.date}</td>
                <td>
                  {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                </td>
                <td className="admin-bookings-purpose">{booking.purpose}</td>
                <td>{booking.expectedAttendees}</td>
                <td>
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td>
                  <div className="admin-bookings-actions">
                    {canApprove && (
                      <button
                        type="button"
                        className="btn primary"
                        onClick={() => onApprove(booking)}
                        disabled={busyAction === `approve-${booking.id}`}
                      >
                        {busyAction === `approve-${booking.id}` ? 'Approving...' : 'Approve'}
                      </button>
                    )}
                    {canReject && (
                      <button
                        type="button"
                        className="btn"
                        onClick={() => onOpenReject(booking)}
                        disabled={busyAction === `reject-${booking.id}`}
                      >
                        Reject
                      </button>
                    )}
                    {canCancel && (
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => onCancel(booking)}
                        disabled={busyAction === `cancel-${booking.id}`}
                      >
                        {busyAction === `cancel-${booking.id}` ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                  {booking.rejectionReason && (
                    <p className="admin-bookings-reason">
                      <strong>Reason:</strong> {booking.rejectionReason}
                    </p>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
