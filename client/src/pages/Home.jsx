import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Globe2, Users, Calendar, MapPin, ExternalLink, ChevronRight, Play } from 'lucide-react'
import { Link } from 'react-router-dom'
import '../home-redesign.css'

export default function Home() {
  // We add 'redesign-active' class to body when on Home to apply global styles
  // cleanly without breaking other pages initially.
  useEffect(() => {
    document.body.classList.add('redesign-active')
    return () => document.body.classList.remove('redesign-active')
  }, [])

  return (
    <div className="bg-white" style={{ minHeight: '100vh', overflowX: 'hidden' }}>

      {/* --- 1. NAVIGATION --- */}
      <nav style={{
        position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)', maxWidth: '1200px', zIndex: 100,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(16px)',
        borderRadius: '999px', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: '1px solid var(--c-border)',
        boxShadow: '0 4px 24px rgba(16,24,40,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '1.125rem', color: 'var(--c-deep-navy)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--c-gaims-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
            G
          </div>
          GHC 2026
        </div>
        <div className="nav-links" style={{ display: 'flex', gap: '32px' }}>
          {['About', 'Program', 'Speakers', 'Sponsors'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} style={{ color: 'var(--c-text-secondary)', fontWeight: 500, fontSize: '0.95rem', transition: 'color 0.2s', textDecoration: 'none' }} 
               onMouseOver={(e) => e.target.style.color = 'var(--c-gaims-blue)'}
               onMouseOut={(e) => e.target.style.color = 'var(--c-text-secondary)'}>
              {item}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link to="/register" className="btn-premium" style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
            Register Now
          </Link>
        </div>
      </nav>

      {/* --- 2. HERO SECTION --- */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        padding: '160px 48px 80px',
        backgroundImage: "url('/assets/bg/herosectionbg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8 }}
            style={{ maxWidth: '640px' }}
          >
            <div className="badge-pill" style={{ marginBottom: '24px' }}>
              GLOBAL HEALTHCARE CONCLAVE 2026
            </div>
            
            <h1 className="heading-xl" style={{ marginBottom: '24px' }}>
              Global<br />
              <span className="grad-text-premium">Healthcare</span><br />
              Conclave 2026
            </h1>
            
            <p className="text-body-lg" style={{ marginBottom: '40px', maxWidth: '480px' }}>
              Bringing together healthcare leaders, researchers, innovators, and institutions to shape the future of global health and medical science.
            </p>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '48px' }}>
              <Link to="/register" className="btn-premium">
                Register Now
              </Link>
              <Link to="/partner" className="btn-outline-premium">
                Become a Partner
              </Link>
              <button className="btn-outline-premium" style={{ border: 'none', background: 'transparent' }}>
                <Play size={20} style={{ marginRight: '8px' }}/> Watch Trailer
              </button>
            </div>

            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--c-deep-navy)' }}>
                <MapPin size={20} color="var(--c-gaims-blue)" /> NEW DELHI, INDIA
              </div>
              <div style={{ width: '1px', height: '24px', background: 'var(--c-border)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--c-deep-navy)' }}>
                <Calendar size={20} color="var(--c-ghc-purple)" /> 22–24 NOV 2026
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- 3. EVENT INFORMATION (STATS) --- */}
      <section className="bg-soft section-padding">
        <div className="container">
          <div className="grid-4">
            {[
              { label: 'Days of Innovation', value: '3+', icon: <Calendar size={32}/> },
              { label: 'Global Delegates', value: '2,500+', icon: <Globe2 size={32}/> },
              { label: 'Expert Speakers', value: '150+', icon: <Users size={32}/> },
              { label: 'Research Papers', value: '500+', icon: <ExternalLink size={32}/> },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="card-rounded-sm" 
                style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div style={{ color: 'var(--c-gaims-blue)' }}>{stat.icon}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--c-deep-navy)' }}>{stat.value}</div>
                <div className="text-body" style={{ fontWeight: 600 }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 4. ABOUT GHC --- */}
      <section id="about" className="bg-white section-padding">
        <div className="container grid-2" style={{ alignItems: 'center' }}>
          <div>
            <div className="text-eyebrow" style={{ marginBottom: '16px' }}>About The Conclave</div>
            <h2 className="heading-lg" style={{ marginBottom: '24px' }}>Reimagining Healthcare Beyond Borders</h2>
            <p className="text-body-lg" style={{ marginBottom: '24px' }}>
              The Global Healthcare Conclave 2026 is the premier international gathering of medical professionals, policymakers, and innovators. 
            </p>
            <p className="text-body" style={{ marginBottom: '32px' }}>
              Hosted by GAIMS, this landmark event bridges the gap between academic research and clinical practice, fostering cross-border collaborations that drive meaningful health outcomes worldwide.
            </p>
            <Link to="/about" className="btn-outline-premium">
              Discover Our Mission <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
            </Link>
          </div>
          <div style={{ position: 'relative', height: '500px' }}>
            {/* Generic Collage Placeholders for now */}
            <div className="card-rounded-lg" style={{ position: 'absolute', top: 0, right: 0, width: '70%', height: '70%', background: 'var(--c-bg-soft)', overflow: 'hidden' }}>
              <img src="https://images.unsplash.com/photo-1576091160550-2173ff9e5ee5?q=80&w=2069&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Conference" />
            </div>
            <div className="card-rounded-lg" style={{ position: 'absolute', bottom: 0, left: 0, width: '60%', height: '60%', background: 'var(--c-bg-lavender)', overflow: 'hidden', border: '8px solid white' }}>
              <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2070&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Medical" />
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. SCHEDULE / TIMELINE --- */}
      <section id="program" className="bg-soft section-padding">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div className="text-eyebrow" style={{ marginBottom: '16px' }}>Scientific Programme</div>
            <h2 className="heading-lg">3 Days of Discovery</h2>
          </div>
          <div className="grid-3">
            {[
              { day: 'Day 01', date: '22 Nov', title: 'Opening & Global Health', tags: ['KEYNOTE', 'NETWORKING'] },
              { day: 'Day 02', date: '23 Nov', title: 'Scientific Sessions & Research', tags: ['SCIENTIFIC', 'PANEL'] },
              { day: 'Day 03', date: '24 Nov', title: 'Innovation & Collaboration', tags: ['WORKSHOP', 'AWARDS'] }
            ].map((d, i) => (
              <motion.div key={i} className="card-rounded-md" style={{ padding: '40px' }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--c-gaims-blue)' }}>{d.day}</span>
                  <span style={{ fontWeight: 600, color: 'var(--c-text-muted)' }}>{d.date}</span>
                </div>
                <h3 className="heading-md" style={{ marginBottom: '24px', fontSize: '1.5rem' }}>{d.title}</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
                  {d.tags.map(tag => (
                    <span key={tag} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', background: 'var(--c-bg-soft)', borderRadius: '99px', color: 'var(--c-text-secondary)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <Link to="/program" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--c-gaims-blue)', fontWeight: 600, textDecoration: 'none' }}>
                  View Agenda <ChevronRight size={18} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 6. SPEAKERS --- */}
      <section id="speakers" className="bg-gradient-speakers section-padding" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '64px' }}>
            <div>
              <div className="text-eyebrow" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>Distinguished Faculty</div>
              <h2 className="heading-lg" style={{ color: 'white' }}>World-Class Speakers</h2>
            </div>
            <Link to="/speakers" className="btn-outline-premium" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
              View All Speakers
            </Link>
          </div>

          <div className="grid-4">
            {/* Mocked Speakers pending CMS integration */}
            {[1,2,3,4].map((s, i) => (
              <motion.div key={i} className="card-rounded-sm" style={{ padding: '24px', textAlign: 'center' }}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--c-bg-soft)', margin: '0 auto 24px', border: '4px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' }}>
                  {/* Avatar Placeholder */}
                </div>
                <h3 className="heading-md" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Speaker Name</h3>
                <div className="text-body" style={{ fontSize: '0.875rem', marginBottom: '4px', fontWeight: 600 }}>Designation</div>
                <div className="text-body" style={{ fontSize: '0.875rem', color: 'var(--c-text-muted)' }}>Institution, Country</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 7. ABSTRACTS & WORKSHOPS --- */}
      <section className="bg-white section-padding">
        <div className="container grid-2">
          {/* Abstracts */}
          <div className="card-rounded-lg" style={{ padding: '48px', background: 'var(--c-bg-soft)' }}>
            <div className="badge-pill" style={{ marginBottom: '24px', background: 'rgba(108, 74, 182, 0.1)', color: 'var(--c-ghc-purple)', borderColor: 'rgba(108, 74, 182, 0.2)' }}>
              CALL FOR PAPERS OPEN
            </div>
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>Abstract Submission</h2>
            <p className="text-body" style={{ marginBottom: '32px' }}>
              Present your groundbreaking research to a global audience. We are currently accepting abstracts for oral and poster presentations.
            </p>
            <Link to="/abstracts" className="btn-premium" style={{ background: 'var(--c-ghc-purple)' }}>
              Submit Abstract <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
            </Link>
          </div>

          {/* Workshops */}
          <div className="card-rounded-lg" style={{ padding: '48px', border: '1px solid var(--c-border)' }}>
            <div className="badge-pill" style={{ marginBottom: '24px' }}>LIMITED SEATS</div>
            <h2 className="heading-md" style={{ marginBottom: '16px' }}>Interactive Workshops</h2>
            <p className="text-body" style={{ marginBottom: '32px' }}>
              Engage in hands-on clinical and research workshops led by global experts. Pre-registration is mandatory.
            </p>
            <Link to="/workshops" className="btn-outline-premium">
              Explore Workshops <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
            </Link>
          </div>
        </div>
      </section>

      {/* --- 8. COMMITTEES --- */}
      <section className="bg-soft section-padding">
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="text-eyebrow" style={{ marginBottom: '16px' }}>Leadership</div>
          <h2 className="heading-lg" style={{ marginBottom: '64px' }}>Conference Committees</h2>
          <div className="grid-3">
            {[
              { title: 'Organising Committee', desc: 'Leading the execution and vision of GHC 2026.' },
              { title: 'Scientific Committee', desc: 'Curating the academic and research programme.' },
              { title: 'Jury & Advisory', desc: 'Reviewing abstracts and prestigious award nominations.' }
            ].map((c, i) => (
              <motion.div key={i} className="card-rounded-sm" style={{ padding: '32px', textAlign: 'left' }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <h3 className="heading-md" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>{c.title}</h3>
                <p className="text-body" style={{ marginBottom: '24px' }}>{c.desc}</p>
                <Link to="/committees" style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--c-gaims-blue)', fontWeight: 600, textDecoration: 'none' }}>
                  View Members <ChevronRight size={18} />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 9. SPONSORS --- */}
      <section id="sponsors" className="bg-white section-padding" style={{ borderTop: '1px solid var(--c-border)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div className="text-eyebrow" style={{ marginBottom: '40px' }}>Strategic Partners & Sponsors</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '64px', opacity: 0.6, filter: 'grayscale(100%)' }}>
            {/* Logos Placeholders */}
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>PARTNER 1</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>ACADEMIA</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>SPONSOR CO</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>HEALTH INC</div>
          </div>
        </div>
      </section>

      {/* --- 10. BOTTOM CTA --- */}
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

      {/* --- 11. FOOTER --- */}
      <footer className="bg-navy" style={{ marginTop: '120px', paddingTop: '80px', paddingBottom: '40px', borderTop: '4px solid var(--c-ghc-purple)' }}>
        <div className="container">
          <div className="grid-4" style={{ marginBottom: '80px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: 700, fontSize: '1.25rem', color: 'white', marginBottom: '24px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'white', color: 'var(--c-deep-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800 }}>
                  G
                </div>
                GHC 2026
              </div>
              <p className="text-body" style={{ color: 'rgba(255,255,255,0.6)' }}>
                Global Healthcare Conclave<br/>
                New Delhi, India<br/>
                22-24 November 2026
              </p>
            </div>
            <div>
              <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '24px' }}>Conference</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li><a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>About GHC</a></li>
                <li><a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Scientific Programme</a></li>
                <li><a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Speakers</a></li>
                <li><a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>Workshops</a></li>
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
