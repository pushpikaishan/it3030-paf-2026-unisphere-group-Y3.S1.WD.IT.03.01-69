import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TwoFactorChallengeModal from '../components/TwoFactorChallengeModal'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { userService } from '../services/userService'
import { startGoogleLogin } from '../utils/helpers'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import logo from '../assets/images/unisphere.png'

const googleIconUrl = 'https://cdn-icons-png.flaticon.com/512/300/300221.png'
import './css/profile.css'


export default function Login() {
  const { login, refresh } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [twoFactorStatus, setTwoFactorStatus] = useState('')
  const [challengeId, setChallengeId] = useState('')
  const [challengeMethods, setChallengeMethods] = useState({ email: false, app: false })
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const resetTwoFactorState = () => {
    setShowTwoFactor(false)
    setTwoFactorStatus('')
    setChallengeId('')
    setChallengeMethods({ email: false, app: false })
  }

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
      setLoading(true)
      resetTwoFactorState()
      const loggedIn = await login(form)
      if (loggedIn?.twoFactorRequired) {
        setChallengeId(loggedIn.challengeId)
        setChallengeMethods({
          email: Boolean(loggedIn?.methods?.email),
          app: Boolean(loggedIn?.methods?.app),
        })
        setShowTwoFactor(true)
        return
      }
      const target = loggedIn?.role === 'ADMIN' || loggedIn?.role === 'MANAGER' ? '/admin' : '/dashboard'
      navigate(target)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = () => {
    resetTwoFactorState()
    startGoogleLogin()
  }

  const handleSendLoginCode = async (method) => {
    try {
      setLoading(true)
      setTwoFactorStatus('')
      const res = await userService.sendLoginTwoFactorCode({ challengeId, method })
      setTwoFactorStatus(res?.message || 'Verification code sent.')
    } catch (err) {
      setTwoFactorStatus(err?.message || 'Could not send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyLoginCode = async ({ method, code }) => {
    try {
      setLoading(true)
      setTwoFactorStatus('')
      const res = await userService.verifyLoginTwoFactorCode({ challengeId, method, code })
      await refresh()
      const role = res?.user?.role
      const target = role === 'ADMIN' || role === 'MANAGER' ? '/admin' : '/dashboard'
      setShowTwoFactor(false)
      navigate(target)
    } catch (err) {
      setTwoFactorStatus(err?.message || 'Could not verify login code.')
    } finally {
      setLoading(false)
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
            {loading ? 'Please wait...' : 'Login'}
          </button>
          <button className="ghost google-btn" type="button" onClick={handleGoogleSignIn}>
            <img className="google-icon" src={googleIconUrl} alt="Google" />
            Continue with Google
          </button>
          <button className="link-button" type="button" onClick={() => setShowForgotPassword(true)}>
            Forgot password?
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

      <TwoFactorChallengeModal
        open={showTwoFactor}
        title="Login Verification"
        subtitle="Choose your two-factor method and verify to sign in."
        methods={challengeMethods}
        status={twoFactorStatus}
        loading={loading}
        onClose={() => setShowTwoFactor(false)}
        onSendCode={handleSendLoginCode}
        onVerify={handleVerifyLoginCode}
      />

      <ForgotPasswordModal
        open={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </div>
  )
}
