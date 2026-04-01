import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { startGoogleLogin } from '../utils/helpers'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import logo from '../assets/images/unisphere.png'

const googleIconUrl = 'https://cdn-icons-png.flaticon.com/512/300/300221.png'
import './css/profile.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('user')
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [techForm, setTechForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [userError, setUserError] = useState('')
  const [techError, setTechError] = useState('')
  const [techSuccess, setTechSuccess] = useState('')

  const validatePassword = (pwd) => {
    if (!pwd || !pwd.trim()) return 'Password is required'
    if (pwd.trim().length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const validatePasswordAndConfirm = ({ password, confirm }) => {
    const pwdError = validatePassword(password)
    if (pwdError) return pwdError
    if (password !== confirm) return 'Passwords do not match'
    return ''
  }

  const submitUser = async (e) => {
    e.preventDefault()
    setUserError('')
    const validationError = validatePasswordAndConfirm(userForm)
    if (validationError) {
      setUserError(validationError)
      return
    }
    try {
      const { confirm, ...payload } = userForm
      const res = await register({ ...payload, role: 'USER' })
      if (res?.token) {
        navigate('/dashboard')
      } else {
        setUserError('Registration succeeded but no session was created. Please login.')
      }
    } catch (err) {
      setUserError(err.message)
    }
  }

  const submitTech = async (e) => {
    e.preventDefault()
    setTechError('')
    setTechSuccess('')
    const validationError = validatePasswordAndConfirm(techForm)
    if (validationError) {
      setTechError(validationError)
      return
    }
    try {
      const { confirm, ...payload } = techForm
      const res = await register({ ...payload, role: 'TECHNICIAN' })
      const message = res?.message || 'Technician registration submitted for approval.'
      setTechSuccess(message)
      setTechForm({ name: '', email: '', password: '', confirm: '' })
    } catch (err) {
      setTechError(err.message)
    }
  }

  return (
    <div className="auth-shell" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="auth-hero">
        <div className="auth-hero-glass">
          <img className="auth-logo" src={logo} alt="UniSphere" />
          <p className="auth-eyebrow">Built for campus facilities</p>
          <h1>Join UniSphere</h1>
          <p className="auth-subhead">Create your account to request services, track issues, and collaborate.</p>
        </div>
      </div>

      <div className="auth-panel">
        <h2>Create account</h2>
        <p className="muted">Please sign in to your account or register to submit support requests, track maintenance updates, and access help resources</p>

        <div className="nav-session" style={{ gap: 12 }}>
          <button
            className={activeTab === 'user' ? 'button' : 'ghost'}
            type="button"
            onClick={() => setActiveTab('user')}
          >
            User
          </button>
          <button
            className={activeTab === 'technician' ? 'button' : 'ghost'}
            type="button"
            onClick={() => setActiveTab('technician')}
          >
            Technician
          </button>
        </div>

        {activeTab === 'user' && (
          <form className="stack" onSubmit={submitUser}>
            <button className="ghost google-btn" type="button" onClick={() => startGoogleLogin()} style={{ width: '100%' }}>
              <img className="google-icon" src={googleIconUrl} alt="Google" />
              Continue with Google
            </button>

            <div className="muted" style={{ textAlign: 'center' }}>
              — or register with email —
            </div>

            <input
              required
              placeholder="Full name"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Re-enter password"
              value={userForm.confirm}
              onChange={(e) => setUserForm({ ...userForm, confirm: e.target.value })}
            />
            <button className="button" type="submit">
              Register & Login
            </button>
            {userError && <p className="error">{userError}</p>}
          </form>
        )}

        {activeTab === 'technician' && (
          <form className="stack" onSubmit={submitTech}>
            <button
              className="ghost google-btn"
              type="button"
              onClick={() => startGoogleLogin('TECHNICIAN')}
              style={{ width: '100%' }}
            >
              <img className="google-icon" src={googleIconUrl} alt="Google" />
              Continue with Google as Technician
            </button>

            <div className="muted" style={{ textAlign: 'center' }}>
              — or register with email —
            </div>

            <input
              required
              placeholder="Full name"
              value={techForm.name}
              onChange={(e) => setTechForm({ ...techForm, name: e.target.value })}
            />
            <input
              required
              type="email"
              placeholder="Email"
              value={techForm.email}
              onChange={(e) => setTechForm({ ...techForm, email: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={techForm.password}
              onChange={(e) => setTechForm({ ...techForm, password: e.target.value })}
            />
            <input
              required
              type="password"
              placeholder="Re-enter password"
              value={techForm.confirm}
              onChange={(e) => setTechForm({ ...techForm, confirm: e.target.value })}
            />
            <div className="muted">Admin approval is required before technicians can log in.</div>
            <button className="button" type="submit">
              Submit for Approval
            </button>
            {techError && <p className="error">{techError}</p>}
            {techSuccess && <p className="muted">{techSuccess}</p>}
          </form>
        )}

        <div className="auth-footer">
          <p className="muted">
            Already have an account? <Link to="/login">Login</Link>
          </p>
          <Link className="link-button" to="/contact-admin">
            Contact admin
          </Link>
        </div>
      </div>
    </div>
  )
}
