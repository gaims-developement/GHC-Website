import { motion } from 'framer-motion'
import { ArrowRight, Activity, Shield, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import GlobeCanvas from '../components/GlobeCanvas'

const features = [
  {
    icon: <Activity size={22} />,
    title: 'Research & Abstracts',
    desc: 'Submit and showcase groundbreaking healthcare research to a global audience of experts.',
    accent: false,
  },
  {
    icon: <Zap size={22} />,
    title: 'Live Sessions',
    desc: 'Real-time keynotes, panel discussions, and workshops from world-renowned healthcare innovators.',
    accent: true,
  },
  {
    icon: <Shield size={22} />,
    title: 'Global Network',
    desc: 'Connect with institutions, researchers, and policy leaders driving measurable health outcomes.',
    accent: false,
  },
]

export default function Home() {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: '#fff', overflowX: 'hidden' }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .home-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          background: rgba(10,10,15,0.7);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .home-nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 17px; font-weight: 700; letter-spacing: -0.3px;
        }
        .home-nav-logo-dot {
          width: 32px; height: 32px; border-radius: 10px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
        }
        .home-nav-links { display: flex; gap: 32px; }
        .home-nav-links a {
          color: rgba(255,255,255,0.6); text-decoration: none;
          font-size: 14px; font-family: 'DM Sans', sans-serif;
          transition: color 0.2s;
        }
        .home-nav-links a:hover { color: #fff; }
        .home-nav-cta {
          padding: 10px 22px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          color: #fff; font-size: 13px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: opacity 0.2s;
        }
        .home-nav-cta:hover { opacity: 0.85; }

        .hero-section {
          position: relative; min-height: 100vh;
          display: flex; align-items: center;
          padding: 140px 48px 80px;
          overflow: hidden;
        }
        .hero-glow {
          position: absolute; bottom: -100px; left: 50%; transform: translateX(-50%);
          width: 120%; height: 500px;
          background: radial-gradient(ellipse at center, rgba(255,61,127,0.35) 0%, rgba(155,50,255,0.2) 40%, transparent 70%);
          pointer-events: none;
        }
        .hero-wave {
          position: absolute; bottom: 0; left: 0; right: 0;
          height: 280px; pointer-events: none;
          background: linear-gradient(to top, rgba(255,100,150,0.07), transparent);
          clip-path: ellipse(90% 100% at 50% 100%);
        }
        .hero-grid {
          position: relative; max-width: 1200px; margin: 0 auto; width: 100%;
          display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 6px 14px; border-radius: 100px;
          background: rgba(255,61,127,0.12);
          border: 1px solid rgba(255,61,127,0.3);
          font-size: 12px; font-weight: 600; letter-spacing: 0.12em;
          text-transform: uppercase; color: #ff6b9d;
          font-family: 'DM Sans', sans-serif;
          margin-bottom: 28px;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ff3d7f; animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,100% { opacity: 1; } 50% { opacity: 0.3; }
        }
        .hero-h1 {
          font-size: clamp(2.6rem, 5vw, 4rem);
          font-weight: 800; line-height: 1.08;
          letter-spacing: -2px; color: #fff;
        }
        .hero-h1 .accent {
          background: linear-gradient(135deg, #ff6b9d 0%, #ff3d7f 50%, #c026d3 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-p {
          margin-top: 24px; font-size: 17px; line-height: 1.7;
          color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif;
          max-width: 460px;
        }
        .hero-actions { margin-top: 40px; display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          color: #fff; font-size: 14px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 8px 30px rgba(255,61,127,0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(255,61,127,0.5); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 14px 28px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.75); font-size: 14px; font-weight: 500;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          backdrop-filter: blur(10px);
          transition: border-color 0.2s, background 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,61,127,0.5); background: rgba(255,61,127,0.08); }

        .hero-right { display: flex; flex-direction: column; gap: 16px; }
        .hero-card {
          border-radius: 20px; padding: 24px 28px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
        }
        .hero-card-kicker {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(255,255,255,0.4); font-family: 'DM Sans', sans-serif;
          margin-bottom: 8px;
        }
        .hero-card-title { font-size: 20px; font-weight: 700; color: #fff; }
        .hero-card-body {
          margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif; line-height: 1.6;
        }
        .hero-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
        .hero-stat {
          border-radius: 16px; padding: 18px 16px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
          text-align: center;
        }
        .hero-stat-num {
          font-size: 26px; font-weight: 800; letter-spacing: -1px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-stat-label {
          font-size: 12px; color: rgba(255,255,255,0.4);
          font-family: 'DM Sans', sans-serif; margin-top: 4px;
        }

        .trust-section {
          padding: 60px 48px;
          border-top: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
        }
        .trust-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between; gap: 32px;
        }
        .trust-heading { font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 800; letter-spacing: -1px; }
        .trust-heading .accent {
          background: linear-gradient(135deg, #ff6b9d, #c026d3);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .trust-body {
          max-width: 420px; font-size: 15px; line-height: 1.7;
          color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif;
        }

        .features-section { padding: 100px 48px; }
        .features-inner { max-width: 1200px; margin: 0 auto; }
        .features-header { text-align: center; margin-bottom: 60px; }
        .features-header h2 { font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 800; letter-spacing: -1.5px; }
        .features-header p {
          margin-top: 16px; font-size: 16px; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif;
        }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .feature-card {
          border-radius: 24px; padding: 36px 32px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          transition: transform 0.3s, border-color 0.3s, background 0.3s;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,61,127,0.3);
          background: rgba(255,61,127,0.06);
        }
        .feature-card.featured {
          background: linear-gradient(145deg, rgba(255,61,127,0.18), rgba(192,38,211,0.12));
          border-color: rgba(255,61,127,0.4);
        }
        .feature-card.featured:hover { border-color: rgba(255,61,127,0.6); }
        .feature-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,61,127,0.3), rgba(192,38,211,0.3));
          display: flex; align-items: center; justify-content: center;
          color: #ff6b9d; margin-bottom: 24px;
        }
        .feature-title { font-size: 18px; font-weight: 700; margin-bottom: 12px; }
        .feature-desc {
          font-size: 14px; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif; line-height: 1.7;
        }
        .feature-link {
          display: inline-flex; align-items: center; gap: 6px;
          margin-top: 20px; font-size: 13px; font-weight: 600;
          color: #ff6b9d; text-decoration: none; font-family: 'DM Sans', sans-serif;
          transition: gap 0.2s;
        }
        .feature-link:hover { gap: 10px; }

        .cta-section {
          margin: 0 48px 100px;
          border-radius: 32px;
          padding: 80px 60px;
          background: linear-gradient(135deg, rgba(255,61,127,0.2) 0%, rgba(192,38,211,0.15) 50%, rgba(10,10,15,0) 100%);
          border: 1px solid rgba(255,61,127,0.2);
          text-align: center; position: relative; overflow: hidden;
        }
        .cta-glow {
          position: absolute; top: -60px; left: 50%; transform: translateX(-50%);
          width: 400px; height: 200px;
          background: radial-gradient(ellipse, rgba(255,61,127,0.3), transparent 70%);
          pointer-events: none;
        }
        .cta-section h2 {
          font-size: clamp(2rem, 3.5vw, 2.8rem); font-weight: 800;
          letter-spacing: -1.5px; position: relative;
        }
        .cta-section p {
          margin-top: 16px; font-size: 16px; color: rgba(255,255,255,0.55);
          font-family: 'DM Sans', sans-serif; position: relative;
        }
        .cta-actions {
          margin-top: 40px; display: flex; gap: 14px; justify-content: center;
          position: relative;
        }

        @media (max-width: 900px) {
          .home-nav { padding: 16px 24px; }
          .home-nav-links { display: none; }
          .hero-section { padding: 120px 24px 60px; }
          .hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .trust-section, .features-section { padding: 60px 24px; }
          .trust-inner { flex-direction: column; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-section { margin: 0 24px 60px; padding: 60px 30px; }
        }
      `}</style>

      {/* Nav */}
      <nav className="home-nav">
        <div className="home-nav-logo">
          <div className="home-nav-logo-dot">G</div>
          GHC 2026
        </div>
        <div className="home-nav-links">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="#">Program</a>
          <a href="#">Speakers</a>
        </div>
        <Link to="/register" className="home-nav-cta">Register Now</Link>
      </nav>

      {/* Hero */}
      <section className="hero-section">
        <div className="hero-glow" />
        <div className="hero-wave" />
        <div className="hero-grid">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              Policy · Practice · Research · Innovation
            </div>
            <h1 className="hero-h1">
              Global Healthcare<br />
              <span className="accent">Conclave 2026</span>
            </h1>
            <p className="hero-p">
              Bringing together healthcare leaders, researchers, innovators and institutions to exchange ideas, drive research, and shape the future of global health.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn-primary">
                Register Now <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="btn-outline">
                Explore Program
              </Link>
            </div>
          </motion.div>

          <motion.div className="hero-right" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.15 }}>
            <GlobeCanvas className="hero-globe" />
          </motion.div>
        </div>
      </section>

      {/* Trust */}
      <section className="trust-section">
        <div className="trust-inner">
          <div>
            <h2 className="trust-heading">
              Trusted By <span className="accent">Leaders.</span><br />
              Designed For <span className="accent">Impact.</span>
            </h2>
          </div>
          <p className="trust-body">
            Join a global community of healthcare professionals who trust GHC to simplify and elevate their experience. From abstract submissions to secure registrations, we've got everything covered.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-inner">
          <div className="features-header">
            <h2>All-In-One Platform<br />For Healthcare Collaboration</h2>
            <p>Powerful tools designed to give you an edge in global healthcare discourse.</p>
          </div>
          <div className="features-grid">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className={`feature-card${f.accent ? ' featured' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
                <a href="#" className="feature-link">Learn More <ArrowRight size={14} /></a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="cta-section">
        <div className="cta-glow" />
        <h2>Ready to Join the Conclave?</h2>
        <p>Secure your spot at GHC 2026. Limited seats available across all tiers.</p>
        <div className="cta-actions">
          <Link to="/register" className="btn-primary">
            Start Registration <ArrowRight size={16} />
          </Link>
          <Link to="/about" className="btn-outline">Learn More</Link>
        </div>
      </div>

    </div>
  )
}
