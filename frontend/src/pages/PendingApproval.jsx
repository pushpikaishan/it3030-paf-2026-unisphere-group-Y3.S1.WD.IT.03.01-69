import { Link } from 'react-router-dom'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import logo from '../assets/images/unisphere.png'

export default function PendingApproval() {
  return (
    <div className="auth-shell pending-shell" style={{ backgroundImage: `url(${heroImg})` }}>
      <div className="auth-hero">
        <div className="pending-hero-glass">
          <img className="pending-logo" src={logo} alt="UniSphere" />
          <p className="auth-eyebrow">Technician registration</p>
          <h1 className="pending-title">Registration submitted</h1>
          <p className="auth-subhead">
            Your technician account is pending admin approval. We will notify you once approved.
          </p>

          <div className="nav-session" style={{ gap: 12 }}>
            <Link className="button" to="/login">
              Return to login
            </Link>
            <Link className="ghost" to="/contact-admin">
              Contact admin
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
