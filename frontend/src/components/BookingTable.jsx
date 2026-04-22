import BookingStatusBadge from './BookingStatusBadge'

const formatDate = (value) => {
  if (!value) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}T00:00:00Z`))
}

const formatTimeRange = (booking) => {
  if (!booking?.startTime || !booking?.endTime) return '-'
  return `${booking.startTime} - ${booking.endTime}`
}

export default function BookingTable({ bookings = [], showOwner = false, emptyMessage = 'No bookings found.', renderActions }) {
  return (
    <div className="booking-table-wrap">
      <table className="booking-table">
        <thead>
          <tr>
            {showOwner && <th>User</th>}
            <th>Resource</th>
            <th>Date</th>
            <th>Time</th>
            <th>Purpose</th>
            <th>Attendees</th>
            <th>Status</th>
            <th>Rejection Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={showOwner ? 9 : 8} className="booking-empty-row">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            bookings.map((booking) => (
              <tr key={booking.id}>
                {showOwner && (
                  <td>
                    <div className="booking-owner-name">{booking.userName || 'Unknown user'}</div>
                    <div className="muted booking-owner-email">{booking.userEmail || '-'}</div>
                  </td>
                )}
                <td>{booking.resourceName}</td>
                <td>{formatDate(booking.bookingDate)}</td>
                <td>{formatTimeRange(booking)}</td>
                <td>{booking.purpose}</td>
                <td>{booking.expectedAttendees}</td>
                <td>
                  <BookingStatusBadge status={booking.status} />
                </td>
                <td>{booking.rejectionReason || '-'}</td>
                <td>{renderActions ? renderActions(booking) : null}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}