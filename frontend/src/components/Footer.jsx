import logoImg from '../assets/images/unisphere.png'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__glow" aria-hidden="true" />
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <img className="site-footer__logo" src={logoImg} alt="UniSphere logo" />
          <h3 className="site-footer__title">Stay connected to every campus service.</h3>
          <p className="site-footer__text">
            One hub for maintenance, resources, and support so teams stay in sync.
          </p>
        </div>
        <div className="site-footer__links">
          <h4 className="site-footer__label">Quick Links</h4>
          <a href="/dashboard">Dashboard</a>
          <a href="/resources">Resources</a>
          <a href="/tickets">Tickets</a>
          <a href="/profile">Profile</a>
        </div>
        <div className="site-footer__support">
          <h4 className="site-footer__label">Support</h4>
          <p className="site-footer__text">helpdesk@campus.local</p>
          <p className="site-footer__text">+94 11 234 5678</p>
          <p className="site-footer__text">Mon-Fri, 8:00 - 18:00</p>
        </div>
      </div>
      <div className="site-footer__bottom">© 2026 UniSphere. All rights reserved.</div>
    </footer>
  )
}
