import { useEffect, useMemo, useState } from 'react'
import api from '../../services/api'

const formatDate = (value) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleString()
}

export default function AdminNotifications() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [activeRequest, setActiveRequest] = useState(null)
  const [adminReply, setAdminReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

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

  useEffect(() => {
    loadRequests()
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

  return (
    <div className="stack">
      <div className="card">
        <h2>Notifications</h2>
        <p className="muted">User support messages sent from Contact Admin.</p>
        <p className="muted">Pending problems: {pendingCount}</p>
        {status && <p className="muted">{status}</p>}
        {error && <p className="error">{error}</p>}
      </div>

      {loading ? (
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
