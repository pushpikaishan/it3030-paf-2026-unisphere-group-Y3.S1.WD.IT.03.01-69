import { useState } from 'react'
import api from '../../services/api'

const roleOptions = ['USER', 'ADMIN', 'TECHNICIAN', 'LECTURE']

export default function AddAllUser({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'USER' })
  const [status, setStatus] = useState({ type: null, message: '' })

  const submit = async (e) => {
    e.preventDefault()
    try {
      setStatus({ type: 'loading', message: '' })
      await api.post('/users', { ...form, provider: 'LOCAL' })
      setStatus({ type: 'success', message: 'User created successfully.' })
      setForm({ name: '', email: '', password: '', role: 'USER' })
      onCreated?.()
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to create user'
      setStatus({ type: 'error', message })
    }
  }

  return (
    <div className="card">
      <h3>Add User</h3>
      <p className="muted">Create users with any role: USER, ADMIN, TECHNICIAN, or LECTURE.</p>
      <form className="stack" onSubmit={submit}>
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          {roleOptions.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
        <button className="button" type="submit" disabled={status.type === 'loading'}>
          {status.type === 'loading' ? 'Saving...' : 'Create User'}
        </button>
        {status.type === 'error' && <p className="error">{status.message}</p>}
        {status.type === 'success' && <p className="muted">{status.message}</p>}
      </form>
    </div>
  )
}
