import NotificationPanel from '../components/NotificationPanel'
import heroImg from '../assets/images/SLIIT-malabe.jpg'

export default function Dashboard() {
  return (
    <div className="dashboard">
      <section className="hero" style={{ backgroundImage: `url(${heroImg})` }}>
        <div className="hero__overlay" />
        <div className="hero__content">
          <p className="eyebrow">Built for campus facilities</p>
          <h1>Efficiently managing our campus for a better tomorrow.</h1>
          <p className="subhead">
            Submit maintenance requests, track progress, access services, and reach help quickly—all in one place.
          </p>
          <div className="hero__actions">
            <button className="btn primary">Learn More Info</button>
            <button className="btn ghost">Get Started Today</button>
          </div>
        </div>
      </section>

      <section className="tiles">
        <div className="tile">
          <div className="tile__icon">🔧</div>
          <h3>Submit a Request</h3>
          <p>Log a maintenance request with a few clicks.</p>
          <button className="btn action">Submit Now</button>
        </div>
        <div className="tile">
          <div className="tile__icon">📄</div>
          <h3>Track Requests</h3>
          <p>See status updates and expected resolution times.</p>
          <button className="btn action">Check Status</button>
        </div>
        <div className="tile">
          <div className="tile__icon">📚</div>
          <h3>Services & Resources</h3>
          <p>Find equipment, rooms, and guides in one hub.</p>
          <button className="btn action">Explore</button>
        </div>
        <div className="tile">
          <div className="tile__icon">📞</div>
          <h3>Emergency Contacts</h3>
          <p>Reach campus emergency teams immediately.</p>
          <button className="btn action">Contact Us</button>
        </div>
      </section>

      <section className="grid-two">
        <div className="card">
          <h2>Overview</h2>
          <p className="muted">Key metrics and quick actions will live here.</p>
        </div>
        <NotificationPanel />
      </section>
    </div>
  )
}
