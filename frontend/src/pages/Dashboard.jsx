import NotificationPanel from '../components/NotificationPanel'
import heroImg from '../assets/images/SLIIT-malabe.jpg'
import campusImgOne from '../assets/images/1.jpg'
import campusImgTwo from '../assets/images/2.jpg'

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

      <section className="tiles tiles--overlap">
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

      <section className="dashboard-home">
        <article
          className="home-feature home-feature--sun"
          style={{ backgroundImage: `url(${campusImgOne})` }}
        >
          <div className="home-feature__media">
            <img src={campusImgOne} alt="Campus spaces" />
            <span className="media-tag">Live availability</span>
          </div>
          <div className="home-feature__content">
            <p className="eyebrow">Campus Spaces</p>
            <h2>Reserve study zones, labs, and halls in minutes.</h2>
            <p>
              Check live availability, set your time window, and send a single request to book a space for your team.
            </p>
            <div className="home-cta">
              <button className="btn primary">Browse Spaces</button>
              <button className="btn ghost">View Live Map</button>
            </div>
          </div>
        </article>

        <article
          className="home-feature home-feature--night home-feature--reverse"
          style={{ backgroundImage: `url(${campusImgTwo})` }}
        >
          <div className="home-feature__media">
            <img src={campusImgTwo} alt="Response teams" />
            <span className="media-tag">24/7 coverage</span>
          </div>
          <div className="home-feature__content">
            <p className="eyebrow">Response Teams</p>
            <h2>Keep maintenance and safety crews in sync.</h2>
            <p>
              Prioritize urgent issues, schedule inspections, and share progress updates with everyone who needs them.
            </p>
            <div className="home-cta">
              <button className="btn primary">Report an Issue</button>
              <button className="btn ghost">Track My Requests</button>
            </div>
          </div>
        </article>

      </section>
    </div>
  )
}
