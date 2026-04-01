import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { startGoogleLogin } from '../utils/helpers'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import logo from '../assets/images/unisphere.png'

const googleIconUrl = 'https://cdn-icons-png.flaticon.com/512/300/300221.png'
import './css/profile.css'


export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const message = params.get('error')
    if (message) {
      setError(message)
    }
  }, [params])

  const submit = async (e) => {
    e.preventDefault()
    try {
      setError('')
      const loggedIn = await login(form)
      const target = loggedIn?.role === 'ADMIN' || loggedIn?.role === 'MANAGER' ? '/admin' : '/dashboard'
      navigate(target)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="auth-shell" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="auth-hero">
        <div className="auth-hero-glass">
          <img className="auth-logo" src={logo} alt="UniSphere" />
          <p className="auth-eyebrow">Built for campus facilities</p>
          <h1>Welcome to UniSphere</h1>
          <p className="auth-subhead">Submit requests, track progress, and stay connected with campus services.</p>
        </div>
      </div>

      <div className="auth-panel">
        <h2>Login</h2>
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
          <button className="ghost google-btn" type="button" onClick={() => startGoogleLogin()}>
            <img className="google-icon" src={googleIconUrl} alt="Google" />
            Continue with Google
          </button>
          {error && <p className="error">{error}</p>}
        </form>
        <div className="auth-footer">
          <p className="muted">
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </p>
          <Link className="link-button" to="/contact-admin">
            Contact admin
          </Link>
        </div>
      </div>
    </div>
  )
}
