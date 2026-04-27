import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'
import { announcementApi } from '../../services/announcementApi'

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString()
}

export default function AdminNotifications() {
  const [activeTab, setActiveTab] = useState('messages')
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState([])
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [activeRequest, setActiveRequest] = useState(null)
  const [adminReply, setAdminReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [announcementRole, setAnnouncementRole] = useState('USER')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementAttachment, setAnnouncementAttachment] = useState(null)
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState(false)
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState(null)

  const pendingCount = useMemo(() => requests.filter((item) => !item.resolved).length, [requests])

  const loadRequests = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.get('/support-requests')
      setRequests(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load support requests.')
    } finally {
      setLoading(false)
    }
  }

  const loadAnnouncements = async () => {
    try {
      setLoadingAnnouncements(true)
      const response = await announcementApi.getAdminAnnouncements()
      setAnnouncements(Array.isArray(response) ? response : [])
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not load announcements.')
    } finally {
      setLoadingAnnouncements(false)
    }
  }

  useEffect(() => {
    loadRequests()
    loadAnnouncements()
  }, [])

  const openResolveModal = (request) => {
    setStatus('')
    setError('')
    setActiveRequest(request)
    setAdminReply('')
  }

  const closeResolveModal = () => {
    if (sendingReply) return
    setActiveRequest(null)
    setAdminReply('')
  }

  const sendReply = async () => {
    if (!activeRequest) return
    if (!adminReply.trim()) {
      setError('Please enter a message for the user.')
      return
    }

    try {
      setSendingReply(true)
      setError('')
      await api.post(`/support-requests/${activeRequest.id}/resolve`, {
        adminMessage: adminReply.trim(),
      })
      setStatus('Reply sent to user email and marked as solved.')
      setActiveRequest(null)
      setAdminReply('')
      await loadRequests()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not send email reply.')
    } finally {
      setSendingReply(false)
    }
  }

  const submitAnnouncement = async (event) => {
    event.preventDefault()
    if (!announcementMessage.trim()) {
      setError('Please enter an announcement message.')
      return
    }

    try {
      setSubmittingAnnouncement(true)
      setError('')
      await announcementApi.createAnnouncement({
        targetRole: announcementRole,
        title: announcementTitle,
        message: announcementMessage,
        attachment: announcementAttachment,
      })
      setStatus('Announcement submitted successfully.')
      setAnnouncementTitle('')
      setAnnouncementMessage('')
      setAnnouncementAttachment(null)
      await loadAnnouncements()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not submit announcement.')
    } finally {
      setSubmittingAnnouncement(false)
    }
  }

  const deleteAnnouncement = async (announcement) => {
    if (!announcement?.id) return
    const title = announcement?.title || `#${announcement.id}`
    const confirmed = window.confirm(`Delete announcement ${title}?`)
    if (!confirmed) return

    try {
      setDeletingAnnouncementId(announcement.id)
      setError('')
      await announcementApi.deleteAnnouncement(announcement.id)
      setStatus('Announcement deleted successfully.')
      await loadAnnouncements()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Could not delete announcement.')
    } finally {
      setDeletingAnnouncementId(null)
    }
  }

  return (
    <div className="stack">
      <div className="card admin-notify-header-card">
        <h2>Notifications</h2>
        <p className="muted">Manage support messages and publish announcements to USER or TECHNICIAN roles.</p>
        <p className="muted admin-notify-subline">
          {activeTab === 'messages' ? `Pending problems: ${pendingCount}` : '\u00A0'}
        </p>
        {status && <p className="muted">{status}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      <div className="admin-notify-tabs">
        <button
          type="button"
          className={`admin-notify-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          User Messages
        </button>
        <button
          type="button"
          className={`admin-notify-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Announcements
        </button>
      </div>

      {activeTab === 'messages' && (loading ? (
        <div className="card">
          <p className="muted">Loading support requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="card">
          <p className="muted">No support messages found.</p>
        </div>
      ) : (
        <div className="stack">
          {requests.map((request) => (
            <article key={request.id} className="card support-request-card">
              <div className="support-request-head">
                <h3>Support Message #{request.id}</h3>
                <span className={request.resolved ? 'support-badge resolved' : 'support-badge pending'}>
                  {request.resolved ? 'Solved' : 'Pending'}
                </span>
              </div>

              <p>
                <strong>User email:</strong> {request.email}
              </p>
              <p>
                <strong>Created:</strong> {formatDate(request.createdAt)}
              </p>
              <div>
                <strong>User problem:</strong>
                <p className="support-request-message">{request.userMessage}</p>
              </div>

              {request.adminReply && (
                <div>
                  <strong>Admin message:</strong>
                  <p className="support-request-reply">{request.adminReply}</p>
                </div>
              )}

              {request.resolvedAt && (
                <p>
                  <strong>Solved at:</strong> {formatDate(request.resolvedAt)}
                </p>
              )}

              {!request.resolved && (
                <div>
                  <button type="button" className="button" onClick={() => openResolveModal(request)}>
                    Solve problem
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      ))}

      {activeTab === 'announcements' && (
        <>
          <div className="card announcement-form-card">
            <h3>Create Announcement</h3>
            <form className="stack" onSubmit={submitAnnouncement}>
              <label className="admin-form-label" htmlFor="announcement-role">Target role</label>
              <select
                id="announcement-role"
                value={announcementRole}
                onChange={(event) => setAnnouncementRole(event.target.value)}
                disabled={submittingAnnouncement}
              >
                <option value="USER">USER</option>
                <option value="TECHNICIAN">TECHNICIAN</option>
              </select>

              <label className="admin-form-label" htmlFor="announcement-title">Title (optional)</label>
              <input
                id="announcement-title"
                type="text"
                placeholder="Announcement title"
                value={announcementTitle}
                onChange={(event) => setAnnouncementTitle(event.target.value)}
                disabled={submittingAnnouncement}
              />

              <label className="admin-form-label" htmlFor="announcement-message">Message</label>
              <textarea
                id="announcement-message"
                rows={5}
                placeholder="Type announcement message"
                value={announcementMessage}
                onChange={(event) => setAnnouncementMessage(event.target.value)}
                disabled={submittingAnnouncement}
              />

              <label className="admin-form-label" htmlFor="announcement-attachment">Attachment (optional)</label>
              <input
                id="announcement-attachment"
                type="file"
                onChange={(event) => setAnnouncementAttachment(event.target.files?.[0] || null)}
                disabled={submittingAnnouncement}
              />

              <div>
                <button className="button" type="submit" disabled={submittingAnnouncement}>
                  {submittingAnnouncement ? 'Submitting...' : 'Submit announcement'}
                </button>
              </div>
            </form>
          </div>

          {loadingAnnouncements ? (
            <div className="card">
              <p className="muted">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="card">
              <p className="muted">No announcements yet.</p>
            </div>
          ) : (
            <div className="stack">
              {announcements.map((item) => (
                <article key={item.id} className="card support-request-card">
                  <div className="support-request-head">
                    <h3>{item.title || 'Announcement'}</h3>
                    <span className="support-badge pending">{item.targetRole}</span>
                  </div>

                  <p className="support-request-message">{item.message}</p>

                  {item.attachmentUrl && (
                    <p>
                      <strong>Attachment:</strong>{' '}
                      <a href={item.attachmentUrl} target="_blank" rel="noreferrer">
                        Open attachment
                      </a>
                    </p>
                  )}

                  <p>
                    <strong>Created:</strong> {formatDate(item.createdAt)}
                  </p>

                  <div>
                    <button
                      type="button"
                      className="button danger"
                      onClick={() => deleteAnnouncement(item)}
                      disabled={deletingAnnouncementId === item.id}
                    >
                      {deletingAnnouncementId === item.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      {activeRequest && (
        <div className="support-modal-overlay" onClick={closeResolveModal}>
          <div className="support-modal-card" onClick={(event) => event.stopPropagation()}>
            <h3>Enter message to user</h3>
            <p className="muted">This message will be sent to {activeRequest.email}.</p>

            <div>
              <strong>User problem:</strong>
              <p className="support-request-message">{activeRequest.userMessage}</p>
            </div>

            <textarea
              rows={6}
              placeholder="Type admin message for the user"
              value={adminReply}
              onChange={(event) => setAdminReply(event.target.value)}
              disabled={sendingReply}
            />

            <div className="support-modal-actions">
              <button type="button" className="ghost" onClick={closeResolveModal} disabled={sendingReply}>
                Cancel
              </button>
              <button type="button" className="button" onClick={sendReply} disabled={sendingReply}>
                {sendingReply ? 'Sending...' : 'Send email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
