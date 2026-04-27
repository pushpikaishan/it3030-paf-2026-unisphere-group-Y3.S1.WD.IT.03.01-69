import { useEffect, useMemo, useState } from 'react'

const emptyForm = {
  name: '',
  type: 'LECTURE_HALL',
  capacity: 1,
  location: '',
  availabilityWindows: '',
  status: 'ACTIVE',
  description: '',
  imageUrl: '',
}

export default function ResourceForm({ isOpen, onClose, onSubmit, resource, types }) {
  const initialForm = useMemo(() => {
    if (!resource) return emptyForm
    return {
      name: resource.name || '',
      type: resource.type || 'LECTURE_HALL',
      capacity: resource.capacity || 1,
      location: resource.location || '',
      availabilityWindows: resource.availabilityWindows || '',
      status: resource.status || 'ACTIVE',
      description: resource.description || '',
      imageUrl: resource.imageUrl || '',
    }
  }, [resource])

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setForm(initialForm)
    setErrors({})
  }, [initialForm, isOpen])

  if (!isOpen) return null

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const nextErrors = {}

    if (!form.name.trim()) nextErrors.name = 'Name is required'
    if (!form.location.trim()) nextErrors.location = 'Location is required'
    if (Number(form.capacity) < 1) nextErrors.capacity = 'Capacity must be at least 1'

    if (form.imageUrl && !/^https?:\/\//i.test(form.imageUrl)) {
      nextErrors.imageUrl = 'Image URL must start with http:// or https://'
    }

    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    await onSubmit({
      ...form,
      name: form.name.trim(),
      location: form.location.trim(),
      capacity: Number(form.capacity),
      description: form.description?.trim() || null,
      availabilityWindows: form.availabilityWindows?.trim() || null,
      imageUrl: form.imageUrl?.trim() || null,
    })
  }

  return (
    <div className="resource-modal-backdrop" role="dialog" aria-modal="true">
      <div className="resource-modal card">
        <div className="resource-modal-header">
          <h3>{resource ? 'Edit Resource' : 'Create Resource'}</h3>
          <button className="btn" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form className="resource-form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input value={form.name} onChange={(e) => setField('name', e.target.value)} />
            {errors.name && <small className="form-error">{errors.name}</small>}
          </label>

          <label>
            <span>Type</span>
            <select value={form.type} onChange={(e) => setField('type', e.target.value)}>
              {types?.map((type) => (
                <option key={type} value={type}>
                  {type.replaceAll('_', ' ')}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Capacity</span>
            <input
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setField('capacity', e.target.value)}
            />
            {errors.capacity && <small className="form-error">{errors.capacity}</small>}
          </label>

          <label>
            <span>Location</span>
            <input value={form.location} onChange={(e) => setField('location', e.target.value)} />
            {errors.location && <small className="form-error">{errors.location}</small>}
          </label>

          <label>
            <span>Availability Windows</span>
            <input
              value={form.availabilityWindows}
              placeholder="e.g., Mon-Fri 08:00-17:00"
              onChange={(e) => setField('availabilityWindows', e.target.value)}
            />
          </label>

          <label>
            <span>Status</span>
            <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="OUT_OF_SERVICE">OUT OF SERVICE</option>
            </select>
          </label>

          <label>
            <span>Description</span>
            <textarea
              rows="3"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </label>

          <label>
            <span>Image URL</span>
            <input value={form.imageUrl} onChange={(e) => setField('imageUrl', e.target.value)} />
            {errors.imageUrl && <small className="form-error">{errors.imageUrl}</small>}
          </label>

          <button className="btn primary" type="submit">
            {resource ? 'Save changes' : 'Create resource'}
          </button>
        </form>
      </div>
    </div>
  )
}
