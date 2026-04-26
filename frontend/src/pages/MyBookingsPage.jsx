import { useEffect, useMemo, useState } from 'react'
import BookingCard from '../components/BookingCard'
import api from '../services/api'
import { useAuth } from '../hooks/useAuth'
import { useCancelBooking, useMyBookings } from '../hooks/useBookings'
import './css/bookings.css'

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback
  if (message.includes('already booked')) {
    return 'This resource is already booked for the selected time.'
  }
  return message
}

export default function MyBookingsPage() {
  const { user } = useAuth()
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState(null)
  const [ticketHistory, setTicketHistory] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)
  const [ticketsError, setTicketsError] = useState('')

  const { data, isLoading, isError, error, refetch } = useMyBookings()
  const cancelMutation = useCancelBooking()

  const bookings = useMemo(() => (data || []).slice().sort((a, b) => (b.id || 0) - (a.id || 0)), [data])

  useEffect(() => {
    const loadTicketHistory = async () => {
      if (!user?.id) {
        setTicketHistory([])
        return
      }

      setTicketsLoading(true)
      setTicketsError('')
      try {
        const { data: notifications } = await api.get('/notifications', { params: { userId: user.id } })
        const normalizedTickets = (notifications || [])
          .filter((item) => {
            const fullText = `${item?.title || ''} ${item?.message || ''} ${item?.type || ''}`.toLowerCase()
            return item?.type?.toUpperCase() === 'TICKET' || fullText.includes('ticket')
          })
          .map((item) => {
            const text = `${item?.title || ''} ${item?.message || ''}`.toLowerCase()
            const responded = text.includes('responded') || text.includes('resolved') || text.includes('replied')
            return {
              id: item.id,
              title: item.title || 'Support Ticket',
              message: item.message || '',
              createdAt: item.createdAt,
              status: responded ? 'RESPONDED' : 'PENDING',
            }
          })
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))

        setTicketHistory(normalizedTickets)
      } catch (err) {
        setTicketsError(getErrorMessage(err, 'Failed to load ticket history.'))
      } finally {
        setTicketsLoading(false)
      }
    }

    loadTicketHistory()
  }, [user?.id])

  const handleCancel = async (booking) => {
    setBusyAction(`cancel-${booking.id}`)
    setFeedback(null)
    try {
      await cancelMutation.mutateAsync(booking.id)
      setFeedback({ kind: 'success', message: 'Booking cancelled successfully.' })
    } catch (err) {
      setFeedback({ kind: 'error', message: getErrorMessage(err, 'Failed to cancel booking.') })
    } finally {
      setBusyAction(null)
    }
  }

  return (
    <section className="bookings-layout">
      <div className="card bookings-header">
        <h2>My Bookings</h2>
        <p className="muted">Track your booking requests and cancel pending or approved items.</p>
      </div>

      {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

      {isLoading && (
        <div className="card">
          <p>Loading your bookings...</p>
        </div>
      )}

      {isError && (
        <div className="card">
          <h3>Unable to load bookings</h3>
          <p>{getErrorMessage(error, 'Please try again in a moment.')}</p>
          <button type="button" className="btn" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="bookings-history-wrap">
          <div className="card">
            <h3>Booking Request History</h3>
            <p className="muted">All your booking requests with approval status.</p>
            <div className="bookings-grid">
              {bookings.length === 0 && (
                <div className="card">
                  <h3>No bookings yet</h3>
                  <p className="muted">Create your first booking request from the Bookings page.</p>
                </div>
              )}

              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} onCancel={handleCancel} busyAction={busyAction} />
              ))}
            </div>
          </div>

          <div className="card">
            <h3>Ticket History</h3>
            <p className="muted">Track whether your support tickets are responded or still pending.</p>

            {ticketsLoading && <p>Loading your ticket history...</p>}
            {!ticketsLoading && ticketsError && <p className="error">{ticketsError}</p>}

            {!ticketsLoading && !ticketsError && ticketHistory.length === 0 && (
              <p className="muted">No ticket history found yet.</p>
            )}

            {!ticketsLoading && !ticketsError && ticketHistory.length > 0 && (
              <div className="ticket-history-list">
                {ticketHistory.map((ticket) => (
                  <article key={ticket.id} className="ticket-history-item">
                    <div className="ticket-history-head">
                      <h4>{ticket.title}</h4>
                      <span className={`ticket-status ${ticket.status.toLowerCase()}`}>{ticket.status}</span>
                    </div>
                    {ticket.message && <p className="muted">{ticket.message}</p>}
                    {ticket.createdAt && <small className="muted">Created: {new Date(ticket.createdAt).toLocaleString()}</small>}
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
