import { useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useBookings } from '../hooks/useBookings'
import './css/resources.css'

const formatDateTime = (value) => {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export default function BookingPage() {
  const { user } = useAuth()
  const { getBookingsForUser, cancelBooking } = useBookings()
  const [selectedId, setSelectedId] = useState(null)

  const bookings = useMemo(() => getBookingsForUser(user), [getBookingsForUser, user])
  const selectedBooking = bookings.find((booking) => booking.id === selectedId) || null

  if (!user) {
    return (
      <div className="card">
        <h2>Bookings</h2>
        <p className="muted">Please log in to view and manage your bookings.</p>
      </div>
    )
  }

  return (
    <div className="booking-page">
      <div className="card">
        <h2>Bookings</h2>
        <p className="muted">View your booked resources, check status, and cancel if needed.</p>
      </div>

      <div className="card">
        {bookings.length === 0 ? (
          <p className="muted">No bookings yet. Open Resources and click Book Now on any facility.</p>
        ) : (
          <div className="booking-table-wrap">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Resource</th>
                  <th>Date / Time</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.resourceName}</td>
                    <td>{formatDateTime(booking.bookedAt)}</td>
                    <td>
                      <span className={`resource-status ${booking.status === 'CANCELLED' ? 'danger' : 'success'}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="booking-actions-cell">
                      <button className="btn" type="button" onClick={() => setSelectedId(booking.id)}>
                        View details
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        disabled={booking.status === 'CANCELLED'}
                        onClick={() => cancelBooking(booking.id)}
                      >
                        Cancel booking
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedBooking && (
        <div className="card booking-details">
          <h3>Booking Details</h3>
          <p>
            <strong>Resource:</strong> {selectedBooking.resourceName}
          </p>
          <p>
            <strong>Type:</strong> {selectedBooking.resourceType?.replaceAll('_', ' ')}
          </p>
          <p>
            <strong>Location:</strong> {selectedBooking.location}
          </p>
          <p>
            <strong>Capacity:</strong> {selectedBooking.capacity}
          </p>
          <p>
            <strong>Booked On:</strong> {formatDateTime(selectedBooking.bookedAt)}
          </p>
          <p>
            <strong>Status:</strong> {selectedBooking.status}
          </p>
          <button className="btn" type="button" onClick={() => setSelectedId(null)}>
            Close details
          </button>
        </div>
      )}
    </div>
  )
}
