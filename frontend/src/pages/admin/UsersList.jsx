import { useEffect, useState } from 'react'
import api from '../../services/api'

export default function UsersList({ refreshKey }) {
  const [users, setUsers] = useState([])
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [rowBusy, setRowBusy] = useState(null)

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

  const startEdit = (user) => {
    setEditingId(user.id)
    setEditForm({ name: user.name || '', email: user.email || '' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: '', email: '' })
  }

  const saveEdit = async (id) => {
    try {
      setRowBusy(id)
      await api.put(`/users/${id}`, editForm)
      await load()
      cancelEdit()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to update user'
      setStatus({ type: 'error', message })
    } finally {
      setRowBusy(null)
    }
  }

  const deleteUser = async (id) => {
    try {
      setRowBusy(id)
      await api.delete(`/users/${id}`)
      await load()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete user'
      setStatus({ type: 'error', message })
    } finally {
      setRowBusy(null)
    }
  }

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
            {editingId === user.id ? (
              <div className="stack">
                <input
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  disabled={rowBusy === user.id}
                />
                <input
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  disabled={rowBusy === user.id}
                />
                <div className="nav-session" style={{ justifyContent: 'flex-start', gap: 8 }}>
                  <button
                    className="button"
                    type="button"
                    onClick={() => saveEdit(user.id)}
                    disabled={rowBusy === user.id}
                  >
                    {rowBusy === user.id ? 'Saving...' : 'Save'}
                  </button>
                  <button className="ghost" type="button" onClick={cancelEdit} disabled={rowBusy === user.id}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="nav-session" style={{ justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <span>
                  <strong>{user.name || 'Unnamed User'}</strong> • {user.email} • Role: {user.role}
                </span>
                <div className="nav-session" style={{ justifyContent: 'flex-start', gap: 8 }}>
                  <button className="ghost" type="button" onClick={() => startEdit(user)}>
                    Edit
                  </button>
                  <button
                    className="button danger"
                    type="button"
                    onClick={() => deleteUser(user.id)}
                    disabled={rowBusy === user.id}
                  >
                    {rowBusy === user.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {status.type !== 'loading' && users.length === 0 && <li className="muted">No users found.</li>}
      </ul>
    </div>
  )
}
