import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      if (!form.password || !form.password.trim()) {
        setError('Password is required')
        return
      }
      if (form.password.trim().length < 6) {
        setError('Password must be at least 6 characters')
        return
      }
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <p className="muted">Register with your email and password to get started.</p>
      <form className="stack" onSubmit={submit}>
        <input
          required
          placeholder="Full name"
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
        <button className="button" type="submit">
          Register
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
