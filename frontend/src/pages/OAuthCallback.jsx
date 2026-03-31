import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function OAuthCallback() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')
    const isPending = params.get('pending') === 'true'

    if (isPending) {
      navigate('/pending/technician', { replace: true })
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
    </div>
  )
}
