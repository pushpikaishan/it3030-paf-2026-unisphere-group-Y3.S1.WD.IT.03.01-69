import { useEffect, useMemo, useState } from 'react'
import BookingCard from '../../components/BookingCard'
import BookingDecisionModal from '../../components/BookingDecisionModal'
import BookingFilters from '../../components/BookingFilters'
import BookingStatusBadge from '../../components/BookingStatusBadge'
import {
  useAdminBookings,
  useApproveBooking,
  useCancelBooking,
  useRejectBooking,
} from '../../hooks/useBookings'
import { useResources } from '../../hooks/useResources'
import '../css/bookings.css'

const initialFilters = {
  status: 'PENDING',
  resourceId: '',
  date: '',
}

const getErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback
  if (message.includes('already booked')) {
    return 'This resource is already booked for the selected time.'
  }
  if (message.includes('Booking not found')) {
    return 'This booking no longer exists. The list has been refreshed.'
  }
  return message
}

export default function AdminBookings() {
  const [filters, setFilters] = useState(initialFilters)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [busyAction, setBusyAction] = useState(null)

  const queryParams = {
    status: filters.status || undefined,
    resourceId: filters.resourceId || undefined,
    date: filters.date || undefined,
    page: 0,
    size: 10,
  }

  const recentQueryParams = {
    status: undefined,
    resourceId: filters.resourceId || undefined,
    date: filters.date || undefined,
    page: 0,
    size: 40,
  }

  const { data, isLoading, isFetching, isError, error, refetch } = useAdminBookings(queryParams)
  const { data: recentData } = useAdminBookings(recentQueryParams)
  const { data: resourcesData } = useResources({ page: 0, size: 200 })

  const approveMutation = useApproveBooking()
  const rejectMutation = useRejectBooking()
  const cancelMutation = useCancelBooking()

  const bookings = data?.content || []
  const recentDecisions = useMemo(
    () =>
      (recentData?.content || [])
        .filter((item) => item?.status && item.status !== 'PENDING')
        .sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime()
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime()
          return bTime - aTime
        })
        .slice(0, 8),
    [recentData?.content],
  )

  const onFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  const withAction = async (actionId, action, successMessage, fallbackError) => {
    setBusyAction(actionId)
    setFeedback(null)
    try {
      await action()
      await refetch()
      setFeedback({ kind: 'success', message: successMessage })
    } catch (err) {
      if (err?.response?.status === 404) {
        await refetch()
        setFeedback({ kind: 'success', message: 'This booking was already processed. List refreshed.' })
        return
      }
      setFeedback({ kind: 'error', message: getErrorMessage(err, fallbackError) })
    } finally {
      setBusyAction(null)
    }
  }

  useEffect(() => {
    if (!feedback) return
    const timer = setTimeout(() => setFeedback(null), 3500)
    return () => clearTimeout(timer)
  }, [feedback])

  const resolveBookingId = (booking) => {
    const parsed = Number(booking?.id)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  }

  const handleApprove = (booking) =>
    {
      const bookingId = resolveBookingId(booking)
      if (!bookingId) {
        setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
        return Promise.resolve()
      }
      return withAction(
        `approve-${bookingId}`,
        () => approveMutation.mutateAsync(bookingId),
        'Booking approved successfully.',
        'Failed to approve booking.',
      )
    }

  const handleReject = async (reason) => {
    if (!rejectTarget) return
    const bookingId = resolveBookingId(rejectTarget)
    if (!bookingId) {
      setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
      setRejectTarget(null)
      return
    }

    await withAction(
      `reject-${bookingId}`,
      () => rejectMutation.mutateAsync({ id: bookingId, reason }),
      'Booking rejected successfully.',
      'Failed to reject booking.',
    )
    setRejectTarget(null)
  }

  const handleCancel = (booking) =>
    {
      const bookingId = resolveBookingId(booking)
      if (!bookingId) {
        setFeedback({ kind: 'error', message: 'This booking has an invalid ID. Please refresh the list.' })
        return Promise.resolve()
      }
      return withAction(
        `cancel-${bookingId}`,
        () => cancelMutation.mutateAsync(bookingId),
        'Booking cancelled successfully.',
        'Failed to cancel booking.',
      )
    }

  return (
    <section className="booking-admin-layout">
      <BookingFilters
        filters={filters}
        onChange={onFilterChange}
        onReset={resetFilters}
        resources={resourcesData?.content || []}
      />

      <div className="booking-list-wrap">
        <div className="card bookings-header">
          <div className="booking-header-row">
            <div>
              <h2>Booking Management</h2>
              <p className="muted">Review booking requests and make approval decisions.</p>
            </div>
            <button type="button" className="btn" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {feedback && <div className={`resource-toast ${feedback.kind}`}>{feedback.message}</div>}

        {isLoading && (
          <div className="card">
            <p>Loading bookings...</p>
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
          <>
            <div className="bookings-grid">
              {bookings.length === 0 && (
                <div className="card">
                  <h3>No bookings found</h3>
                  <p className="muted">Try changing your filters.</p>
                </div>
              )}

              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  isAdmin={true}
                  onApprove={handleApprove}
                  onReject={setRejectTarget}
                  onCancel={handleCancel}
                  showCancel={true}
                  showDelete={false}
                  busyAction={busyAction}
                />
              ))}
            </div>

            <div className="card booking-compact-list">
              <div className="booking-compact-head">
                <h3>Recent Decisions</h3>
                <p className="muted">Compact view of approved, rejected, and cancelled requests.</p>
              </div>
              {recentDecisions.length === 0 ? (
                <p className="muted">No approved/rejected/cancelled bookings yet.</p>
              ) : (
                <div className="booking-compact-rows">
                  {recentDecisions.map((item) => (
                    <div key={`compact-${item.id}`} className="booking-compact-row">
                      <div className="booking-compact-main">
                        <strong>{item.resourceName || 'Unknown Resource'}</strong>
                        <span>
                          {item.bookingDate} | {String(item.startTime || '--:--').slice(0, 5)} -{' '}
                          {String(item.endTime || '--:--').slice(0, 5)}
                        </span>
                      </div>
                      <div className="booking-compact-user">{item.userName || item.userEmail || 'Unknown user'}</div>
                      <BookingStatusBadge status={item.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <BookingDecisionModal
        isOpen={Boolean(rejectTarget)}
        booking={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleReject}
        loading={busyAction?.startsWith('reject-')}
      />
    </section>
  )
}
