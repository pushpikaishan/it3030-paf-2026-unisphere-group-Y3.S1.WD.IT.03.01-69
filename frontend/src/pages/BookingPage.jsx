import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import BookingForm from '../components/BookingForm'

export default function BookingPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="stack booking-shell">
      <div className="card booking-hero">
        {/* MEMBER 2: booking landing area that routes users into request creation and booking tracking. */}
        <h2>Bookings</h2>
        <p className="muted">Submit resource requests, track your bookings, and review approval status in one place.</p>
        <div className="booking-quick-links">
          <Link className="button" to="/bookings/my">
            My Bookings
          </Link>
          {isAdmin && (
            <Link className="ghost" to="/admin/bookings">
              Admin Booking Management
            </Link>
          )}
        </div>
      </div>

      <div className="booking-grid">
        <BookingForm />

        <div className="card">
          <h3>Workflow</h3>
          <p className="muted">Bookings move from pending to approved, rejected, or cancelled depending on the decision path.</p>
          <ul className="booking-list">
            <li>Users create requests with date, time, purpose, and attendees.</li>
            <li>Conflict checking blocks overlapping resource reservations.</li>
            <li>Admins approve or reject bookings with a required reason.</li>
            <li>Approved bookings can be cancelled by the booking owner.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
