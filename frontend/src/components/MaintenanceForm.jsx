import { useMemo, useState } from 'react'

const MAINTENANCE_CATEGORIES = [
  { value: 'electrical', label: 'Electrical Issue' },
  { value: 'plumbing', label: 'Plumbing Issue' },
  { value: 'hvac', label: 'HVAC/Climate Control' },
  { value: 'equipment', label: 'Equipment Malfunction' },
  { value: 'structural', label: 'Structural/Damage' },
  { value: 'safety', label: 'Safety Hazard' },
  { value: 'cleaning', label: 'Cleaning/Sanitation' },
  { value: 'it', label: 'IT/Network Infrastructure' },
  { value: 'other', label: 'Other' },
]

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Low - Non-urgent' },
  { value: 'medium', label: 'Medium - Should be addressed soon' },
  { value: 'high', label: 'High - Urgent' },
  { value: 'critical', label: 'Critical - Safety/Operations risk' },
]

const initialState = {
  category: '',
  priority: 'medium',
  location: '',
  description: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

export default function MaintenanceForm({ onCreated }) {
  const [form, setForm] = useState(initialState)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canSubmit = useMemo(
    () => Boolean(form.category && form.location && form.description && form.contactName && form.contactEmail),
    [form],
  )

  const handleChange = (field) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!canSubmit) {
      setError('Please complete all required fields.')
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.contactEmail)) {
      setError('Please enter a valid email address.')
      return
    }

    setLoading(true)
    try {
      // TODO: Connect to backend maintenance/ticket API
      // await maintenanceService.createTicket(form)
      setMessage('Maintenance request submitted successfully. A technician will contact you shortly.')
      setForm(initialState)
      onCreated?.()
    } catch (err) {
      const rawMessage = err?.message || 'Maintenance request failed'
      setError(rawMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="card maintenance-form" onSubmit={handleSubmit}>
      <div className="section-header">
        <div>
          <h3>Report Maintenance Issue</h3>
          <p className="muted">Submit a maintenance or incident report. A technician will review and respond.</p>
        </div>
      </div>

      <div className="maintenance-form__grid">
        <label className="field">
          <span>Issue Category *</span>
          <select value={form.category} onChange={handleChange('category')} required>
            <option value="">Select category</option>
            {MAINTENANCE_CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Priority Level</span>
          <select value={form.priority} onChange={handleChange('priority')}>
            {PRIORITY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field maintenance-form__span-2">
          <span>Location *</span>
          <input
            type="text"
            value={form.location}
            onChange={handleChange('location')}
            placeholder="e.g., Building A, Room 201"
            required
          />
        </label>

        <label className="field maintenance-form__span-2">
          <span>Detailed Description *</span>
          <textarea
            rows="4"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Describe the issue in detail, including any symptoms or when it started"
            required
          />
        </label>

        <label className="field">
          <span>Your Name *</span>
          <input
            type="text"
            value={form.contactName}
            onChange={handleChange('contactName')}
            placeholder="Full name"
            required
          />
        </label>

        <label className="field">
          <span>Email Address *</span>
          <input
            type="email"
            value={form.contactEmail}
            onChange={handleChange('contactEmail')}
            placeholder="your.email@university.edu"
            required
          />
        </label>

        <label className="field">
          <span>Phone Number</span>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={handleChange('contactPhone')}
            placeholder="Optional: +1 (555) 123-4567"
          />
        </label>
      </div>

      {message && <div className="maintenance-alert maintenance-alert--success">{message}</div>}
      {error && <div className="maintenance-alert maintenance-alert--error">{error}</div>}

      <div className="maintenance-form__actions">
        <button className="button button--primary" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Maintenance Request'}
        </button>
      </div>
    </form>
  )
}
