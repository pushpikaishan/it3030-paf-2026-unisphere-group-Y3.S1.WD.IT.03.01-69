import { Link } from 'react-router-dom'
import BookingForm from '../components/BookingForm'
import { useCreateBooking } from '../hooks/useBookings'
import { useResources } from '../hooks/useResources'
import { useState } from 'react'
import './css/bookings.css'

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback
  if (message.includes('already booked')) {
    return 'This resource is already booked for the selected time.'
  }
  return message
}

export default function BookingPage() {
  const [feedback, setFeedback] = useState(null)
  const createBookingMutation = useCreateBooking()
  const { data: resourcesData, isLoading: resourcesLoading } = useResources({
    status: 'ACTIVE',
    page: 0,
    size: 100,
  })

  const handleSubmit = async (payload) => {
    setFeedback(null)
    try {
      await createBookingMutation.mutateAsync(payload)
      setFeedback({ kind: 'success', message: 'Booking request submitted successfully.' })
    } catch (error) {
      setFeedback({ kind: 'error', message: getErrorMessage(error, 'Failed to create booking request.') })
    }
  }

  return (
    <section className="bookings-layout">
      <div className="card bookings-header">
        <h2>Booking Workflow</h2>
        <p className="muted">
          Request a booking for active resources. Your request will stay pending until an admin approves or rejects it.
        </p>
        <p>
          Want to track statuses? <Link to="/my-bookings">Go to My Bookings</Link>
        </p>
      </div>

      {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

      <BookingForm
        resources={resourcesData?.content || []}
        onSubmit={handleSubmit}
        loading={createBookingMutation.isPending || resourcesLoading}
      />
    </section>
  )
}
