import { useEffect, useState } from 'react'
import api from '../../services/api'

export default function UsersList({ refreshKey }) {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState({ type: 'idle', message: '' })

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
  }, [refreshKey])

  return (
    <div className="card">
      <div className="nav-session" style={{ justifyContent: 'space-between' }}>
        <h3>All Users</h3>
        <button className="ghost" type="button" onClick={load} disabled={status.type === 'loading'}>
          {status.type === 'loading' ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {status.type === 'error' && <p className="error">{status.message}</p>}
      <ul className="list">
        {users.map((user) => (
          <li key={user.id} className="stack">
            <span className="list-title">{user.name || 'Unnamed User'}</span>
            <span className="muted">{user.email}</span>
            <span className="muted">Role: {user.role}</span>
          </li>
        ))}
        {status.type !== 'loading' && users.length === 0 && <li className="muted">No users found.</li>}
      </ul>
    </div>
  )
}
