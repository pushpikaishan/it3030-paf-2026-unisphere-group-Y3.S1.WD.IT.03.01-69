import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { startGoogleLogin } from '../utils/helpers'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('user')
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '' })
  const [techForm, setTechForm] = useState({ name: '', email: '', password: '' })
  const [userError, setUserError] = useState('')
  const [techError, setTechError] = useState('')
  const [techSuccess, setTechSuccess] = useState('')

  const validatePassword = (pwd) => {
    if (!pwd || !pwd.trim()) return 'Password is required'
    if (pwd.trim().length < 6) return 'Password must be at least 6 characters'
    return ''
  }

  const submitUser = async (e) => {
    e.preventDefault()
    setUserError('')
    const pwdError = validatePassword(userForm.password)
    if (pwdError) {
      setUserError(pwdError)
      return
    }
    try {
      const res = await register({ ...userForm, role: 'USER' })
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
    const pwdError = validatePassword(techForm.password)
    if (pwdError) {
      setTechError(pwdError)
      return
    }
    try {
      const res = await register({ ...techForm, role: 'TECHNICIAN' })
      const message = res?.message || 'Technician registration submitted for approval.'
      setTechSuccess(message)
      setTechForm({ name: '', email: '', password: '' })
    } catch (err) {
      setTechError(err.message)
    }
  }

  return (
    <div className="auth-card">
      <h1>Create account</h1>
      <p className="muted">Choose your registration type. Technicians require admin approval before logging in.</p>

      <div className="nav-session" style={{ gap: 12 }}>
        <button
          className={activeTab === 'user' ? 'button' : 'ghost'}
          type="button"
          onClick={() => setActiveTab('user')}
        >
          Normal User
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
          <button className="ghost" type="button" onClick={() => startGoogleLogin()} style={{ width: '100%' }}>
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
          <button className="button" type="submit">
            Register & Login
          </button>
          {userError && <p className="error">{userError}</p>}
        </form>
      )}

      {activeTab === 'technician' && (
        <form className="stack" onSubmit={submitTech}>
          <button
            className="ghost"
            type="button"
            onClick={() => startGoogleLogin('TECHNICIAN')}
            style={{ width: '100%' }}
          >
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
          <div className="muted">Admin approval is required before technicians can log in.</div>
          <button className="button" type="submit">
            Submit for Approval
          </button>
          {techError && <p className="error">{techError}</p>}
          {techSuccess && <p className="muted">{techSuccess}</p>}
        </form>
      )}
      <p className="muted">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  )
}
