import { useMemo, useState } from 'react'
import { BOOKING_RESOURCES, bookingService } from '../services/bookingService'

const initialState = {
  resourceName: '',
  bookingDate: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: 1,
}

export default function BookingForm({ onCreated }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(
    () => Boolean(form.resourceName && form.bookingDate && form.startTime && form.endTime && form.purpose),
    [form],
  )

  const handleChange = (field) => (event) => {
    const value = field === 'expectedAttendees' ? Number(event.target.value) : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    // MEMBER 2: client-side validation keeps the booking workflow aligned with the backend conflict checks.
    if (!canSubmit) {
      setError('Please complete all required booking fields.')
      return
    }

    if (form.endTime <= form.startTime) {
      setError('End time must be after start time.')
      return
    }

    setLoading(true)
    try {
      await bookingService.createBooking(form)
      setMessage('Booking request submitted successfully.')
      setForm(initialState)
      onCreated?.()
    } catch (err) {
      const rawMessage = err?.message || 'Booking request failed'
      setError(rawMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card booking-form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <h3>Request a Booking</h3>
          <p className="muted">Choose a resource, date, and time slot. Conflict checks run on submit.</p>
        </div>
      </div>

      <div className="booking-form__grid">
        <label className="field">
          <span>Resource</span>
          <select value={form.resourceName} onChange={handleChange('resourceName')}>
            <option value="">Select resource</option>
            {BOOKING_RESOURCES.map((resource) => (
              <option key={resource.value} value={resource.value}>
                {resource.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Date</span>
          <input type="date" value={form.bookingDate} onChange={handleChange('bookingDate')} />
        </label>

        <label className="field">
          <span>Start Time</span>
          <input type="time" value={form.startTime} onChange={handleChange('startTime')} />
        </label>

        <label className="field">
          <span>End Time</span>
          <input type="time" value={form.endTime} onChange={handleChange('endTime')} />
        </label>

        <label className="field booking-form__span-2">
          <span>Purpose</span>
          <textarea rows="3" value={form.purpose} onChange={handleChange('purpose')} placeholder="Describe the booking purpose" />
        </label>

        <label className="field">
          <span>Expected Attendees</span>
          <input type="number" min="1" value={form.expectedAttendees} onChange={handleChange('expectedAttendees')} />
        </label>
      </div>

      {message && <div className="booking-alert booking-alert--success">{message}</div>}
      {error && <div className="booking-alert booking-alert--error">{error}</div>}

      <div className="booking-form__actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Booking Request'}
        </button>
      </div>
    </form>
  )
}