import { useEffect, useState } from 'react'

export default function BookingDecisionModal({ isOpen, booking, onClose, onConfirm, loading = false }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setError('')
    }
  }, [isOpen])

  if (!isOpen || !booking) return null

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!reason.trim()) {
      setError('Reject reason is required')
      return
    }

    await onConfirm(reason.trim())
  }

  return (
    <div className="booking-modal-backdrop" role="dialog" aria-modal="true">
      <div className="booking-modal card">
        <div className="booking-modal-head">
          <h3>Reject Booking</h3>
          <button type="button" className="btn" onClick={onClose} disabled={loading}>
            Close
          </button>
        </div>

        <p>
          You are rejecting booking <strong>#{booking.id}</strong> for <strong>{booking.resourceName}</strong>.
        </p>

        <form className="booking-decision-form" onSubmit={handleSubmit}>
          <label>
            <span>Reason</span>
            <textarea
              rows="4"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                setError('')
              }}
              placeholder="Provide a clear reason for rejection"
            />
            {error && <small className="form-error">{error}</small>}
          </label>

          <button type="submit" className="btn danger" disabled={loading}>
            {loading ? 'Rejecting...' : 'Reject Booking'}
          </button>
        </form>
      </div>
    </div>
  )
}
