import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import api from '../services/api'
import { ticketService } from '../services/ticketService'
import './css/TicketPage.css'

const CATEGORY_OPTIONS = ['HARDWARE', 'SOFTWARE', 'FACILITY', 'NETWORK', 'OTHER']
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUS_OPTIONS = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED']

const friendly = (value) => value?.replaceAll('_', ' ') || '-'

const toIso = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export default function TicketPage() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [technicians, setTechnicians] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [statusPayload, setStatusPayload] = useState({
    status: 'IN_PROGRESS',
    resolutionNotes: '',
    rejectionReason: '',
  })
  const [form, setForm] = useState({
    resourceId: '',
    location: '',
    category: 'HARDWARE',
    priority: 'MEDIUM',
    description: '',
    preferredContact: '',
    attachments: [],
  })

  const role = user?.role
  const isAdmin = role === 'ADMIN'
  const isManager = role === 'MANAGER'
  const isStaff = role === 'TECHNICIAN' || isAdmin || isManager

  const selectedTicket = useMemo(
    () => detail || tickets.find((ticket) => ticket.id === selectedId) || null,
    [detail, tickets, selectedId],
  )

  const canAssign = isAdmin || isManager
  const canReject = isAdmin
  const isReporter = selectedTicket?.reporter?.id === user?.id
  const isAssignedTechnician = selectedTicket?.assignedTechnician?.id === user?.id
  const canProgressOrResolve = canAssign || isAssignedTechnician
  const canClose = canAssign || isReporter

  const loadTickets = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await ticketService.list({ status: filterStatus || undefined, priority: filterPriority || undefined })
      setTickets(data || [])
      const defaultId = selectedId && data.some((ticket) => ticket.id === selectedId) ? selectedId : data?.[0]?.id || null
      setSelectedId(defaultId)
      if (defaultId) {
        const ticket = await ticketService.getById(defaultId)
        setDetail(ticket)
      } else {
        setDetail(null)
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    if (!canAssign) return
    try {
      const { data } = await api.get('/users')
      const approvedTechs = (data || []).filter((entry) => entry?.role === 'TECHNICIAN' && entry?.status === 'APPROVED')
      setTechnicians(approvedTechs)
    } catch {
      setTechnicians([])
    }
  }

  useEffect(() => {
    loadTickets()
    loadTechnicians()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, filterPriority])

  const refreshDetail = async (ticketId) => {
    const data = await ticketService.getById(ticketId)
    setDetail(data)
    setTickets((prev) => prev.map((entry) => (entry.id === ticketId ? { ...entry, ...data } : entry)))
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!form.resourceId && !form.location.trim()) {
      setError('Provide either resource ID or location.')
      return
    }
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
      await loadTickets()
      setSelectedId(created.id)
      await refreshDetail(created.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to create ticket')
    }
  }

  const handleSelectTicket = async (ticketId) => {
    setSelectedId(ticketId)
    setError('')
    try {
      await refreshDetail(ticketId)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load ticket details')
    }
  }

  const handleStatusUpdate = async () => {
    if (!selectedTicket) return
    setError('')
    setNotice('')

    if (statusPayload.status === 'REJECTED' && !statusPayload.rejectionReason.trim()) {
      setError('Rejection reason is required.')
      return
    }
    if (statusPayload.status === 'RESOLVED' && !statusPayload.resolutionNotes.trim()) {
      setError('Resolution notes are required for RESOLVED status.')
      return
    }

    try {
      await ticketService.updateStatus(selectedTicket.id, {
        status: statusPayload.status,
        rejectionReason: statusPayload.rejectionReason || null,
        resolutionNotes: statusPayload.resolutionNotes || null,
      })
      setNotice('Ticket status updated.')
      await loadTickets()
      await refreshDetail(selectedTicket.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update status')
    }
  }

  const handleAssign = async (technicianId) => {
    if (!selectedTicket || !technicianId) return
    setError('')
    setNotice('')
    try {
      await ticketService.assignTechnician(selectedTicket.id, Number(technicianId))
      setNotice('Technician assigned.')
      await refreshDetail(selectedTicket.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to assign technician')
    }
  }

  const handleAddComment = async (event) => {
    event.preventDefault()
    if (!selectedTicket) return
    setError('')
    setNotice('')

    if (commentText.trim().length < 2) {
      setError('Comment must be at least 2 characters.')
      return
    }

    try {
      await ticketService.addComment(selectedTicket.id, commentText.trim())
      setCommentText('')
      setNotice('Comment added.')
      await refreshDetail(selectedTicket.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to add comment')
    }
  }

  const handleUpdateComment = async (commentId) => {
    if (!selectedTicket) return
    setError('')
    setNotice('')

    if (editingCommentText.trim().length < 2) {
      setError('Comment must be at least 2 characters.')
      return
    }

    try {
      await ticketService.updateComment(selectedTicket.id, commentId, editingCommentText.trim())
      setEditingCommentId(null)
      setEditingCommentText('')
      setNotice('Comment updated.')
      await refreshDetail(selectedTicket.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!selectedTicket) return
    setError('')
    setNotice('')

    try {
      await ticketService.deleteComment(selectedTicket.id, commentId)
      setNotice('Comment deleted.')
      await refreshDetail(selectedTicket.id)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete comment')
    }
  }

  const canShowStatusUpdate =
    selectedTicket &&
    ((statusPayload.status === 'IN_PROGRESS' && canProgressOrResolve && selectedTicket.status === 'OPEN') ||
      (statusPayload.status === 'RESOLVED' && canProgressOrResolve && selectedTicket.status === 'IN_PROGRESS') ||
      (statusPayload.status === 'CLOSED' && canClose && selectedTicket.status === 'RESOLVED') ||
      (statusPayload.status === 'REJECTED' && canReject && ['OPEN', 'IN_PROGRESS'].includes(selectedTicket.status)))

  return (
    <div className="ticket-page stack">
      <div className="card">
        <h2>Incident Tickets</h2>
        <p className="muted">Create and track maintenance incidents with attachments, status updates, and comments.</p>
      </div>

      {error && <div className="ticket-alert error">{error}</div>}
      {notice && <div className="ticket-alert success">{notice}</div>}

      <section className="card">
        <h3>Create Incident Ticket</h3>
        <form className="ticket-form" onSubmit={handleCreate}>
          <label>
            Resource ID (optional)
            <input
              type="number"
              min="1"
              value={form.resourceId}
              onChange={(event) => setForm((prev) => ({ ...prev, resourceId: event.target.value }))}
              placeholder="e.g. 2"
            />
          </label>

          <label>
            Location (optional if resource ID is given)
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

      <section className="ticket-grid">
        <div className="card">
          <div className="ticket-list-header">
            <h3>Ticket List</h3>
            <button type="button" className="btn ghost" onClick={loadTickets}>
              Refresh
            </button>
          </div>

          <div className="ticket-filters">
            <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {friendly(status)}
                </option>
              ))}
            </select>
            <select value={filterPriority} onChange={(event) => setFilterPriority(event.target.value)}>
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map((priority) => (
                <option key={priority} value={priority}>
                  {friendly(priority)}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="muted">Loading tickets...</p>
          ) : tickets.length === 0 ? (
            <p className="muted">No tickets found.</p>
          ) : (
            <div className="ticket-list">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  className={`ticket-list-item ${ticket.id === selectedId ? 'active' : ''}`}
                  onClick={() => handleSelectTicket(ticket.id)}
                >
                  <div className="ticket-list-row">
                    <strong>#{ticket.id}</strong>
                    <span className={`ticket-chip status-${ticket.status?.toLowerCase()}`}>{friendly(ticket.status)}</span>
                  </div>
                  <div className="ticket-list-row">
                    <span className="ticket-chip priority">{friendly(ticket.priority)}</span>
                    <span className="muted small">{toIso(ticket.createdAt)}</span>
                  </div>
                  <p>{ticket.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Ticket Details</h3>
          {!selectedTicket ? (
            <p className="muted">Select a ticket to see details.</p>
          ) : (
            <div className="ticket-detail stack">
              <div className="ticket-list-row">
                <strong>Ticket #{selectedTicket.id}</strong>
                <span className={`ticket-chip status-${selectedTicket.status?.toLowerCase()}`}>{friendly(selectedTicket.status)}</span>
              </div>

              <div className="ticket-meta-grid">
                <p>
                  <strong>Category:</strong> {friendly(selectedTicket.category)}
                </p>
                <p>
                  <strong>Priority:</strong> {friendly(selectedTicket.priority)}
                </p>
                <p>
                  <strong>Resource ID:</strong> {selectedTicket.resourceId ?? '-'}
                </p>
                <p>
                  <strong>Location:</strong> {selectedTicket.location || '-'}
                </p>
                <p>
                  <strong>Reporter:</strong> {selectedTicket.reporter?.name || selectedTicket.reporter?.email || '-'}
                </p>
                <p>
                  <strong>Assigned Technician:</strong>{' '}
                  {selectedTicket.assignedTechnician?.name || selectedTicket.assignedTechnician?.email || 'Unassigned'}
                </p>
              </div>

              <p>
                <strong>Description:</strong> {selectedTicket.description}
              </p>
              <p>
                <strong>Preferred Contact:</strong> {selectedTicket.preferredContact || '-'}
              </p>
              {selectedTicket.resolutionNotes && (
                <p>
                  <strong>Resolution Notes:</strong> {selectedTicket.resolutionNotes}
                </p>
              )}
              {selectedTicket.rejectionReason && (
                <p>
                  <strong>Rejection Reason:</strong> {selectedTicket.rejectionReason}
                </p>
              )}

              <div>
                <strong>Attachments</strong>
                {selectedTicket.attachments?.length ? (
                  <div className="ticket-attachments">
                    {selectedTicket.attachments.map((attachment) => (
                      <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noreferrer" className="ticket-attachment-link">
                        {attachment.fileName}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="muted">No attachments</p>
                )}
              </div>

              {canAssign && (
                <div className="ticket-action-block">
                  <label>
                    Assign Technician
                    <select
                      defaultValue=""
                      onChange={(event) => {
                        if (event.target.value) {
                          handleAssign(event.target.value)
                          event.target.value = ''
                        }
                      }}
                    >
                      <option value="">Select technician</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.name || tech.email}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}

              {isStaff && (
                <div className="ticket-action-block">
                  <h4>Update Status</h4>
                  <div className="ticket-status-editor">
                    <select
                      value={statusPayload.status}
                      onChange={(event) => setStatusPayload((prev) => ({ ...prev, status: event.target.value }))}
                    >
                      {STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {friendly(status)}
                        </option>
                      ))}
                    </select>
                    <textarea
                      rows={2}
                      value={statusPayload.resolutionNotes}
                      onChange={(event) => setStatusPayload((prev) => ({ ...prev, resolutionNotes: event.target.value }))}
                      placeholder="Resolution notes (required when RESOLVED)"
                    />
                    <textarea
                      rows={2}
                      value={statusPayload.rejectionReason}
                      onChange={(event) => setStatusPayload((prev) => ({ ...prev, rejectionReason: event.target.value }))}
                      placeholder="Rejection reason (required when REJECTED)"
                    />
                    <button
                      className="btn primary"
                      type="button"
                      onClick={handleStatusUpdate}
                      disabled={!canShowStatusUpdate}
                      title={!canShowStatusUpdate ? 'Selected transition is not allowed for your role or current status' : ''}
                    >
                      Apply Status Update
                    </button>
                  </div>
                </div>
              )}

              <div className="ticket-action-block">
                <h4>Comments</h4>
                <form className="ticket-comment-form" onSubmit={handleAddComment}>
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="Add a comment"
                  />
                  <button className="btn ghost" type="submit">
                    Add Comment
                  </button>
                </form>

                <div className="ticket-comments">
                  {(selectedTicket.comments || []).map((comment) => {
                    const canManageComment = canAssign || comment.author?.id === user?.id
                    const isEditing = editingCommentId === comment.id

                    return (
                      <div key={comment.id} className="ticket-comment-item">
                        <div className="ticket-comment-head">
                          <strong>{comment.author?.name || comment.author?.email || 'Unknown'}</strong>
                          <span className="muted small">{toIso(comment.updatedAt)}</span>
                        </div>

                        {isEditing ? (
                          <div className="ticket-comment-editor">
                            <textarea
                              rows={2}
                              value={editingCommentText}
                              onChange={(event) => setEditingCommentText(event.target.value)}
                            />
                            <div className="ticket-comment-actions">
                              <button type="button" className="btn primary" onClick={() => handleUpdateComment(comment.id)}>
                                Save
                              </button>
                              <button
                                type="button"
                                className="btn ghost"
                                onClick={() => {
                                  setEditingCommentId(null)
                                  setEditingCommentText('')
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p>{comment.message}</p>
                        )}

                        {canManageComment && !isEditing && (
                          <div className="ticket-comment-actions">
                            <button
                              type="button"
                              className="btn ghost"
                              onClick={() => {
                                setEditingCommentId(comment.id)
                                setEditingCommentText(comment.message)
                              }}
                            >
                              Edit
                            </button>
                            <button type="button" className="btn ghost" onClick={() => handleDeleteComment(comment.id)}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {!selectedTicket.comments?.length && <p className="muted">No comments yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
