import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const highlights = [
  {
    title: 'Global Collaboration',
    desc: 'Connecting healthcare professionals, researchers, institutions and innovators under one platform for meaningful exchange.',
  },
  {
    title: 'Knowledge Exchange',
    desc: 'Workshops, abstract sessions, keynote speakers, and interdisciplinary discussions that push boundaries.',
  },
  {
    title: 'Impact Driven',
    desc: 'Focused on public health innovation, research outcomes, and measurable progress in global healthcare.',
  },
]

function About() {
  return (
    <div style={{ background: '#0a0a0f', minHeight: '100vh', fontFamily: "'Syne', sans-serif", color: '#fff', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .about-nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(10,10,15,0.8); backdrop-filter: blur(20px);
        }
        .about-nav-logo {
          display: flex; align-items: center; gap: 10px;
          font-size: 17px; font-weight: 700; text-decoration: none; color: #fff;
        }
        .about-nav-logo-dot {
          width: 32px; height: 32px; border-radius: 10px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 800;
        }
        .about-nav-cta {
          padding: 10px 22px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          color: #fff; font-size: 13px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
        }

        .about-hero {
          position: relative; padding: 100px 48px 80px;
          overflow: hidden;
        }
        .about-hero-glow {
          position: absolute; top: -100px; right: -100px;
          width: 600px; height: 600px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,61,127,0.2) 0%, rgba(192,38,211,0.1) 40%, transparent 70%);
          pointer-events: none;
        }
        .about-hero-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center;
        }
        .about-kicker {
          font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase;
          color: #ff6b9d; font-family: 'DM Sans', sans-serif;
          font-weight: 600; margin-bottom: 20px;
        }
        .about-h1 {
          font-size: clamp(2.4rem, 4vw, 3.5rem);
          font-weight: 800; line-height: 1.1; letter-spacing: -2px;
        }
        .about-h1 .accent {
          background: linear-gradient(135deg, #ff6b9d 0%, #ff3d7f 50%, #c026d3 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .about-body {
          margin-top: 24px; font-size: 16px; line-height: 1.75;
          color: rgba(255,255,255,0.5); font-family: 'DM Sans', sans-serif;
          max-width: 480px;
        }
        .about-actions { margin-top: 36px; display: flex; gap: 14px; flex-wrap: wrap; }
        .btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 26px; border-radius: 100px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          color: #fff; font-size: 14px; font-weight: 600;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 30px rgba(255,61,127,0.4);
          transition: transform 0.2s;
        }
        .btn-primary:hover { transform: translateY(-2px); }
        .btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 13px 26px; border-radius: 100px;
          border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 500;
          text-decoration: none; font-family: 'DM Sans', sans-serif;
          backdrop-filter: blur(10px); transition: border-color 0.2s;
        }
        .btn-outline:hover { border-color: rgba(255,61,127,0.4); }

        .highlight-cards { display: flex; flex-direction: column; gap: 16px; }
        .highlight-card {
          border-radius: 20px; padding: 28px 30px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          display: flex; gap: 20px; align-items: flex-start;
          transition: border-color 0.3s, transform 0.3s, background 0.3s;
          cursor: default;
        }
        .highlight-card:hover {
          border-color: rgba(255,61,127,0.3); transform: translateX(6px);
          background: rgba(255,61,127,0.05);
        }
        .highlight-icon {
          width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,61,127,0.25), rgba(192,38,211,0.25));
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }
        .highlight-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
        .highlight-desc {
          font-size: 14px; color: rgba(255,255,255,0.5);
          font-family: 'DM Sans', sans-serif; line-height: 1.65;
        }

        .about-mission {
          padding: 80px 48px;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .about-mission-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
        }
        .mission-stat {
          border-radius: 24px; padding: 36px 32px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          position: relative; overflow: hidden;
          transition: border-color 0.3s, transform 0.3s;
        }
        .mission-stat:hover {
          border-color: rgba(255,61,127,0.3); transform: translateY(-4px);
        }
        .mission-stat-bg {
          position: absolute; top: -40px; right: -40px;
          width: 150px; height: 150px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,61,127,0.1), transparent 70%);
          pointer-events: none;
        }
        .mission-stat-num {
          font-size: 3rem; font-weight: 800; letter-spacing: -2px;
          background: linear-gradient(135deg, #ff6b9d, #ff3d7f);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .mission-stat-label {
          margin-top: 8px; font-size: 16px; font-weight: 600;
        }
        .mission-stat-desc {
          margin-top: 10px; font-size: 14px; color: rgba(255,255,255,0.45);
          font-family: 'DM Sans', sans-serif; line-height: 1.6;
        }

        @media (max-width: 900px) {
          .about-hero { padding: 80px 24px 60px; }
          .about-hero-inner { grid-template-columns: 1fr; gap: 40px; }
          .about-mission { padding: 60px 24px; }
          .about-mission-inner { grid-template-columns: 1fr; }
          .about-nav { padding: 16px 24px; }
        }
      `}</style>

      <nav className="about-nav">
        <a href="/" className="about-nav-logo">
          <div className="about-nav-logo-dot">G</div>
          GHC 2026
        </a>
        <a href="/register" className="about-nav-cta">Register Now</a>
      </nav>

      <section className="about-hero">
        <div className="about-hero-glow" />
        <div className="about-hero-inner">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="about-kicker">About Global Health Conclave</p>
            <h1 className="about-h1">
              Building the future of<br />
              <span className="accent">healthcare collaboration</span>
            </h1>
            <p className="about-body">
              Global Health Conclave serves as a platform bringing together healthcare leaders, researchers, students, innovators and institutions to exchange ideas, present research and create meaningful impact in healthcare.
            </p>
            <div className="about-actions">
              <a href="#" className="btn-primary">Explore Events <ArrowRight size={15} /></a>
              <a href="#" className="btn-outline">View Speakers</a>
            </div>
          </motion.div>

          <motion.div className="highlight-cards" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
            {highlights.map((item, i) => (
              <div key={i} className="highlight-card">
                <div className="highlight-icon">
                  {['🌐', '💡', '🎯'][i]}
                </div>
                <div>
                  <div className="highlight-title">{item.title}</div>
                  <div className="highlight-desc">{item.desc}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="about-mission">
        <div className="about-mission-inner">
          {[
            { num: '60+', label: 'Healthcare Leaders', desc: 'Renowned practitioners and policy experts from across the globe.' },
            { num: '18+', label: 'Focused Sessions', desc: 'Workshops, panels, and keynotes across critical health domains.' },
            { num: '12+', label: 'Partner Institutions', desc: 'Leading universities, hospitals, and research organizations.' },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              className="mission-stat"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="mission-stat-bg" />
              <div className="mission-stat-num">{s.num}</div>
              <div className="mission-stat-label">{s.label}</div>
              <div className="mission-stat-desc">{s.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  )
}

export default About