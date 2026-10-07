import { useEffect, useState } from 'react'
import api from '../services/api'
import { ticketService } from '../services/ticketService'
import './css/TicketPage.css'

const CATEGORY_OPTIONS = ['HARDWARE', 'SOFTWARE', 'FACILITY', 'NETWORK', 'OTHER']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const friendly = (value) => value?.replaceAll('_', ' ') || '-'

export default function TicketPage() {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [resourceOptions, setResourceOptions] = useState([])
  const [loadingResources, setLoadingResources] = useState(true)
  const [form, setForm] = useState({
    resourceId: '',
    location: '',
    category: 'HARDWARE',
    priority: 'MEDIUM',
    description: '',
    preferredContact: '',
    attachments: [],
  })

  useEffect(() => {
    let mounted = true
    const loadResources = async () => {
      setLoadingResources(true)
      try {
        const { data } = await api.get('/resources', { params: { page: 0, size: 200 } })
        if (!mounted) return
        const list = Array.isArray(data?.content) ? data.content : []
        setResourceOptions(list)
      } catch {
        if (mounted) setResourceOptions([])
      } finally {
        if (mounted) setLoadingResources(false)
      }
    }

    loadResources()
    return () => {
      mounted = false
    }
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (form.description.trim().length < 10) {
      setError('Description must be at least 10 characters.')
      return
    }
    if (form.preferredContact.trim().length < 5) {
      setError('Preferred contact must be at least 5 characters.')
      return
    }
    if (form.attachments.length > 3) {
      setError('You can upload up to 3 images only.')
      return
    }

    try {
      const payload = {
        resourceId: form.resourceId ? Number(form.resourceId) : null,
        location: form.location || null,
        category: form.category,
        priority: form.priority,
        description: form.description.trim(),
        preferredContact: form.preferredContact.trim(),
      }

      const created = await ticketService.create({ payload, attachments: form.attachments })
      setNotice('Ticket created successfully.')
      setForm((prev) => ({
        ...prev,
        resourceId: '',
        location: '',
        description: '',
        preferredContact: '',
        attachments: [],
      }))
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create ticket')
    }
  }

  return (
    <div className="ticket-page stack ticket-create-only">
      <div className="card">
        <h2>Create Incident Ticket</h2>
        <p className="muted">Use this compact form to submit a new maintenance incident.</p>
      </div>

      {error && <div className="ticket-alert error">{error}</div>}
      {notice && <div className="ticket-alert success">{notice}</div>}

      <section className="card">
        <h3>Create Incident Ticket</h3>
        <form className="ticket-form" onSubmit={handleCreate}>
          <label>
            Resource (optional)
            <select
              value={form.resourceId}
              onChange={(event) => setForm((prev) => ({ ...prev, resourceId: event.target.value }))}
              disabled={loadingResources || resourceOptions.length === 0}
            >
              <option value="">
                {loadingResources ? 'Loading resources...' : resourceOptions.length ? 'Select a resource' : 'No resources in database'}
              </option>
              {resourceOptions.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} ({resource.location})
                </option>
              ))}
            </select>
          </label>

          <label>
            Location (optional)
            <input
              type="text"
              value={form.location}
              onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
              placeholder="Lab 3B / Block C"
            />
          </label>

          <label>
            Category
            <select value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {friendly(option)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select value={form.priority} onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value }))}>
              {PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {friendly(option)}
                </option>
              ))}
            </select>
          </label>

          <label className="ticket-form-wide">
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Describe the issue clearly (minimum 10 characters)"
            />
          </label>

          <label>
            Preferred Contact
            <input
              type="text"
              value={form.preferredContact}
              onChange={(event) => setForm((prev) => ({ ...prev, preferredContact: event.target.value }))}
              placeholder="Email, extension, or phone"
            />
          </label>

          <label>
            Evidence Images (max 3)
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || [])
                setForm((prev) => ({ ...prev, attachments: files.slice(0, 3) }))
              }}
            />
          </label>

          <button className="btn primary ticket-form-wide" type="submit">
            Create Ticket
          </button>
        </form>
      </section>

    </div>
  )
}
