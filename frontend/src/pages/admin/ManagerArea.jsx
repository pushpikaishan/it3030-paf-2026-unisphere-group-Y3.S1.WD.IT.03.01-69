import { useEffect, useState } from 'react'
import api from '../../services/api'

const ROLE_OPTIONS = ['USER', 'MANAGER', 'ADMIN', 'TECHNICIAN', 'LECTURE']

export default function ManagerArea() {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [busyId, setBusyId] = useState(null)

  const load = async () => {
    try {
      setStatus({ type: 'loading', message: '' })
      const { data } = await api.get('/users')
      setUsers(data)
      setStatus({ type: 'idle', message: '' })
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to load users'
      setStatus({ type: 'error', message })
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateRole = async (id, role) => {
    try {
      setBusyId(id)
      await api.put(`/users/${id}`, { role })
      await load()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update role'
      setStatus({ type: 'error', message })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="stack">
      <div className="card">
        <h2>Manager Area</h2>
        <p className="muted">Assign roles for users (manager-only access).</p>
      </div>

      {status.type === 'error' && <p className="error">{status.message}</p>}

      <div className="card">
        <div className="nav-session" style={{ justifyContent: 'space-between' }}>
          <h3>Role Assignment</h3>
          <button className="ghost" type="button" onClick={load} disabled={status.type === 'loading'}>
            {status.type === 'loading' ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="stack">
          {users.map((u) => (
            <div key={u.id} className="nav-session" style={{ justifyContent: 'space-between' }}>
              <div className="stack">
                <span className="list-title">{u.name || 'Unnamed User'}</span>
                <span className="muted">{u.email}</span>
              </div>
              <div className="nav-session" style={{ gap: 8 }}>
                <select
                  value={u.role}
                  onChange={(e) => updateRole(u.id, e.target.value)}
                  disabled={busyId === u.id}
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                {busyId === u.id && <span className="muted">Saving...</span>}
              </div>
            </div>
          ))}
          {status.type !== 'loading' && users.length === 0 && <p className="muted">No users found.</p>}
        </div>
      </div>
    </div>
  )
}
