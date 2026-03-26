import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      const loggedIn = await login(form)
      const target = loggedIn?.role === 'ADMIN' ? '/admin' : '/dashboard'
      navigate(target)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-card">
      <h1>Welcome back</h1>
      <p className="muted">Sign in with your email and password.</p>
      <form className="stack" onSubmit={submit}>
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
          Login
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="muted">
        Don&apos;t have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}
