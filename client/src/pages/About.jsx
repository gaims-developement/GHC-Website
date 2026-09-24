import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Globe2, Lightbulb, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../home-redesign.css'

const highlights = [
  {
    icon: <Globe2 size={32} />,
    title: 'Global Collaboration',
    desc: 'Connecting healthcare professionals, researchers, institutions and innovators under one platform for meaningful exchange.',
  },
  {
    icon: <Lightbulb size={32} />,
    title: 'Knowledge Exchange',
    desc: 'Workshops, abstract sessions, keynote speakers, and interdisciplinary discussions that push boundaries.',
  },
  {
    icon: <Target size={32} />,
    title: 'Impact Driven',
    desc: 'Focused on public health innovation, research outcomes, and measurable progress in global healthcare.',
  },
]

export default function About() {
  useEffect(() => {
    document.body.classList.add('redesign-active')
    return () => document.body.classList.remove('redesign-active')
  }, [])

  return (
    <div className="bg-white" style={{ minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* --- NAVIGATION (Matching Home) --- */}
      <nav style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: '1200px', zIndex: 100,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
        borderRadius: '999px', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid var(--c-border)',
        boxShadow: '0 4px 24px rgba(16,24,40,0.06)'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '1.125rem', color: 'var(--c-deep-navy)', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--c-gaims-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
            G
          </div>
          GHC 2026
        </Link>
        <div className="nav-links" style={{ display: 'flex', gap: '32px' }}>
          {['About', 'Program', 'Speakers', 'Sponsors'].map(item => (
            <Link key={item} to={`/#${item.toLowerCase()}`} style={{ color: 'var(--c-text-secondary)', fontWeight: 500, fontSize: '0.95rem', transition: 'color 0.2s', textDecoration: 'none' }} 
               onMouseOver={(e) => e.target.style.color = 'var(--c-gaims-blue)'}
               onMouseOut={(e) => e.target.style.color = 'var(--c-text-secondary)'}>
              {item}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/register" className="btn-premium" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
            Register Now
          </Link>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="bg-white section-padding" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '64px' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-eyebrow" style={{ marginBottom: '16px' }}>About Global Health Conclave</div>
              <h1 className="heading-xl" style={{ marginBottom: '24px', fontSize: '3.5rem' }}>
                Building the future of<br />
                <span>healthcare collaboration</span>
              </h1>
              <p className="text-body-lg" style={{ marginBottom: '40px' }}>
                Global Health Conclave serves as a platform bringing together healthcare leaders, researchers, students, innovators and institutions to exchange ideas, present research and create meaningful impact in healthcare.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/program" className="btn-premium">
                  Explore Events <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
                </Link>
                <Link to="/speakers" className="btn-outline-premium">
                  View Speakers
                </Link>
              </div>
            </motion.div>

            <motion.div className="grid-1" style={{ gap: '24px' }} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>
              {highlights.map((item, i) => (
                <div key={i} className="card-rounded-sm bg-white" style={{ display: 'flex', gap: '20px', padding: '32px' }}>
                  <div style={{ color: 'var(--c-ghc-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'var(--c-bg-lavender)', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="heading-md" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>{item.title}</h3>
                    <p className="text-body" style={{ color: 'var(--c-text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- MISSION STATS --- */}
      <section className="bg-white section-padding">
        <div className="container">
          <div className="grid-3">
            {[
              { num: '60+', label: 'Healthcare Leaders', desc: 'Renowned practitioners and policy experts from across the globe.' },
              { num: '18+', label: 'Focused Sessions', desc: 'Workshops, panels, and keynotes across critical health domains.' },
              { num: '12+', label: 'Partner Institutions', desc: 'Leading universities, hospitals, and research organizations.' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                className="card-rounded-md bg-soft"
                style={{ padding: '48px 40px', textAlign: 'center' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <div style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '16px' }} className="grad-text-premium">
                  {s.num}
                </div>
                <h3 className="heading-md" style={{ fontSize: '1.5rem', marginBottom: '12px' }}>{s.label}</h3>
                <p className="text-body">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- BOTTOM CTA --- */}
      <section className="section-padding" style={{ paddingBottom: '0' }}>
        <div className="container">
          <div className="card-rounded-lg bg-gradient-premium" style={{ padding: '80px 48px', textAlign: 'center' }}>
            <h2 className="heading-lg" style={{ color: 'white', marginBottom: '24px' }}>Be Part of the Global Health Conversation</h2>
            <p className="text-body-lg" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '40px', maxWidth: '600px', margin: '0 auto 40px' }}>
              Secure your spot at GHC 2026. Limited seats available across all delegate tiers.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn-premium" style={{ background: 'white', color: 'var(--c-deep-navy)' }}>
                Register Now
              </Link>
              <Link to="/partner" className="btn-outline-premium" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
                Become a Partner
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-navy" style={{ marginTop: '120px', paddingTop: '80px', paddingBottom: '40px', borderTop: '4px solid var(--c-ghc-purple)' }}>
        <div className="container">
          <div className="grid-4" style={{ marginBottom: '80px' }}>
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '1.25rem', color: 'white', marginBottom: '24px', textDecoration: 'none' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'var(--c-deep-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                  G
                </div>
                GHC 2026
              </Link>
              <p className="text-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Global Healthcare Conclave<br/>
                New Delhi, India<br/>
                22-24 November 2026
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '24px' }}>Conference</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link to="/about" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>About GHC</Link></li>
                <li><Link to="/program" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Scientific Programme</Link></li>
                <li><Link to="/speakers" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Speakers</Link></li>
                <li><Link to="/workshops" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Workshops</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '24px' }}>Important Links</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><Link to="/register" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Register Now</Link></li>
                <li><Link to="/abstracts" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Submit Abstract</Link></li>
                <li><Link to="/nominations" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Nominate for Awards</Link></li>
                <li><Link to="/partner" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Become a Partner</Link></li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '24px' }}>Contact</h4>
              <p className="text-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Email: secretariat@ghc.gaims.org<br/>
                Support: +91 11 2345 6789
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '32px' }}>
            <p className="text-body" style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.4)' }}>
              © 2026 Global Healthcare Conclave. All rights reserved.
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
              <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Privacy Policy</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}