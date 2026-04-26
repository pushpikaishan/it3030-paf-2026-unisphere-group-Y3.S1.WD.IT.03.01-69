import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import TwoFactorChallengeModal from '../components/TwoFactorChallengeModal'
import { userService } from '../services/userService'

export default function OAuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [showTwoFactor, setShowTwoFactor] = useState(false)
  const [challengeId, setChallengeId] = useState('')
  const [challengeMethods, setChallengeMethods] = useState({ email: false, app: false })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')
    const isPending = params.get('pending') === 'true'
    const isTwoFactorRequired = params.get('twoFactorRequired') === 'true'
    const challenge = params.get('challengeId')
    const emailMethod = params.get('emailMethod') === 'true'
    const appMethod = params.get('appMethod') === 'true'

    if (isPending) {
      setPending(true)
      navigate('/pending/technician', { replace: true })
      return
    }

    if (isTwoFactorRequired && challenge) {
      setChallengeId(challenge)
      setChallengeMethods({ email: emailMethod, app: appMethod })
      setShowTwoFactor(true)
      return
    }

    if (token) {
      localStorage.setItem('token', token)
      refresh().finally(() => {
        navigate('/dashboard', { replace: true })
      })
      return
    }

    const message = error === 'google_login_failed' ? 'Google sign-in failed. Please try again.' : 'Login failed.'
    setError(message)
  }, [params, navigate, refresh])

  const handleSendCode = async (method) => {
    try {
      setLoading(true)
      setStatus('')
      const res = await userService.sendLoginTwoFactorCode({ challengeId, method })
      setStatus(res?.message || 'Verification code sent.')
    } catch (err) {
      setStatus(err?.message || 'Could not send verification code.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async ({ method, code }) => {
    try {
      setLoading(true)
      setStatus('')
      const res = await userService.verifyLoginTwoFactorCode({ challengeId, method, code })
      await refresh()
      const role = res?.user?.role
      const target = role === 'ADMIN' || role === 'MANAGER' ? '/admin' : '/dashboard'
      setShowTwoFactor(false)
      navigate(target, { replace: true })
    } catch (err) {
      setStatus(err?.message || 'Could not verify login code.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-card">
      {!pending && !error && (
        <>
          <h1>Finishing sign in...</h1>
          <p className="muted">Please wait while we complete your login.</p>
        </>
      )}
      {pending && (
        <>
          <h1>Registration submitted</h1>
          <p className="muted">Your technician account is pending admin approval. We will notify you once approved.</p>
          <button className="button" type="button" onClick={() => navigate('/login', { replace: true })}>
            Return to login
          </button>
        </>
      )}
      {error && (
        <>
          <h1>Sign in error</h1>
          <p className="error">{error}</p>
          <button className="button" type="button" onClick={() => navigate('/login', { replace: true })}>
            Back to login
          </button>
        </>
      )}

      <TwoFactorChallengeModal
        open={showTwoFactor}
        title="Login Verification"
        subtitle="Choose your two-factor method and verify to complete Google sign-in."
        methods={challengeMethods}
        status={status}
        loading={loading}
        onClose={() => navigate('/login', { replace: true })}
        onSendCode={handleSendCode}
        onVerify={handleVerify}
      />
    </div>
  )
}
