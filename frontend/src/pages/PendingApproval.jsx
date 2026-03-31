export default function PendingApproval() {
  return (
    <div className="auth-card">
      <h1>Registration submitted</h1>
      <p className="muted">Your technician account is pending admin approval. We will notify you once approved.</p>
      <a className="button" href="/login">
        Return to login
      </a>
    </div>
  )
}
