import '../styles/landingpage.css';

export default function LandingPage() {
  return (
    <div className="landing-container">
      <header className="landing-header">
        <h1>🎓 Collab Sphere</h1>
        <p>Bridging Students and Alumni Together</p>
        <div className="cta-buttons">
          <a href="/login" className="btn login">Login</a>
          <a href="/signup" className="btn signup">Signup</a>
        </div>
      </header>

      <section className="features-section">
        <h2>Why Join Collab Sphere?</h2>
        <div className="features">
          <div className="feature-box">
            <h3>🤝 Connect</h3>
            <p>Students can reach out to alumni for guidance and networking.</p>
          </div>
          <div className="feature-box">
            <h3>📅 Events</h3>
            <p>Discover alumni events, webinars, and workshops.</p>
          </div>
          <div className="feature-box">
            <h3>🎯 Mentorship</h3>
            <p>Alumni can mentor students to guide them in their careers.</p>
          </div>
          <div className="feature-box">
            <h3>💼 Jobs</h3>
            <p>Explore job postings and opportunities shared by alumni.</p>
          </div>
          <div className="feature-box">
            <h3>💰 Donate</h3>
            <p>Alumni can contribute to college initiatives and scholarships.</p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2025 Collab Sphere. All rights reserved.</p>
      </footer>
    </div>
  );
}
