import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'

export default function UsersList({ refreshKey, statusFilter, title, actions }) {
  const { user: currentUser } = useAuth()
  const canManageUsers = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER'
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
    if (!canManageUsers) {
      setStatus({ type: 'error', message: 'Only admins and managers can delete users.' })
      return
    }

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

  const setUserStatus = async (id, status, errorMessage) => {
    try {
      setRowBusy(id)
      await api.post(`/users/${id}/${status}`)
      await load()
    } catch (err) {
      const message = err?.response?.data?.message || errorMessage
      setStatus({ type: 'error', message })
    } finally {
      setRowBusy(null)
    }
  }

  const filteredUsers = statusFilter ? users.filter((u) => u.status === statusFilter) : users

  return (
    <div className="card">
      <div className="nav-session" style={{ justifyContent: 'space-between' }}>
        <h3>{title || 'All Users'}</h3>
        <button className="ghost" type="button" onClick={load} disabled={status.type === 'loading'}>
          {status.type === 'loading' ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      {status.type === 'error' && <p className="error">{status.message}</p>}
      <ul className="list">
        {filteredUsers.map((user) => (
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
                  <strong>{user.name || 'Unnamed User'}</strong> • {user.email} • Role: {user.role} • Status: {user.status}
                </span>
                <div className="nav-session" style={{ justifyContent: 'flex-start', gap: 8 }}>
                  {actions?.approve && (
                    <button
                      className="button"
                      type="button"
                      onClick={() => setUserStatus(user.id, 'approve', 'Failed to approve user')}
                      disabled={rowBusy === user.id}
                    >
                      {rowBusy === user.id ? 'Working...' : 'Approve'}
                    </button>
                  )}
                  {actions?.reject && (
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => setUserStatus(user.id, 'reject', 'Failed to reject user')}
                      disabled={rowBusy === user.id}
                    >
                      Reject
                    </button>
                  )}
                  {actions?.disable && (
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => setUserStatus(user.id, 'disable', 'Failed to disable user')}
                      disabled={rowBusy === user.id}
                    >
                      Disable
                    </button>
                  )}
                  {actions?.edit && (
                    <button className="ghost" type="button" onClick={() => startEdit(user)}>
                      Edit
                    </button>
                  )}
                  {actions?.delete && (
                    <button
                      className="button danger"
                      type="button"
                      onClick={() => deleteUser(user.id)}
                      disabled={rowBusy === user.id || !canManageUsers}
                    >
                      {rowBusy === user.id ? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
        {status.type !== 'loading' && filteredUsers.length === 0 && <li className="muted">No users found.</li>}
      </ul>
    </div>
  )
}
