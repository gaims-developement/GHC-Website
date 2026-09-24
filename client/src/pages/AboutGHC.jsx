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

export default function AboutGHC() {
  useEffect(() => {
    document.body.classList.add('redesign-active')
    return () => document.body.classList.remove('redesign-active')
  }, [])

  return (
    <>
      {/* --- HERO SECTION --- */}
      <section className="bg-white section-padding" style={{ paddingTop: '160px', paddingBottom: '80px' }}>
        <div className="container">
          <div className="grid-2" style={{ alignItems: 'center', gap: '64px' }}>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
              <div className="text-eyebrow" style={{ marginBottom: '16px', color: '#081B33' }}>About Global Health Conclave</div>
              <h1 className="heading-xl" style={{ marginBottom: '24px', fontSize: '3.5rem', color: '#081B33' }}>
                Building the future of<br />
                <span className="grad-text-premium">healthcare collaboration</span>
              </h1>
              <p className="text-body-lg" style={{ marginBottom: '40px', color: '#081B33' }}>
                Global Health Conclave serves as a platform bringing together healthcare leaders, researchers, students, innovators and institutions to exchange ideas, present research and create meaningful impact in healthcare.
              </p>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/program" className="btn-premium">
                  Explore Events <ArrowRight size={18} style={{ marginLeft: '8px' }}/>
                </Link>
                <a href="/#speakers" className="btn-outline-premium">
                  View Speakers
                </a>
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

      {/* --- VISION SECTION --- */}
      <section className="bg-white section-padding">
        <div className="container grid-2" style={{ alignItems: 'center', gap: '64px' }}>
          <div>
            <div className="text-eyebrow" style={{ marginBottom: '16px' }}>About GHC — The Vision</div>
            <h2 className="heading-lg" style={{ marginBottom: '24px' }}>Where Healthcare Leaders, Innovators & Changemakers Connect</h2>
            <p className="text-body-lg" style={{ marginBottom: '24px' }}>
              The Global Health Conclave (GHC) is a multidisciplinary platform bringing together medical professionals, students, researchers, innovators, healthcare organisations, and changemakers from across the world.
            </p>
            <p className="text-body" style={{ marginBottom: '24px', color: 'var(--c-text-muted)' }}>
              GHC is built around one idea: healthcare advances when people, ideas, and opportunities come together. Through thought-provoking sessions, scientific exchange, workshops, networking, awards, and collaborative initiatives, the conclave creates an environment where knowledge moves beyond the conference hall and translates into meaningful action.
            </p>
            <p className="text-body" style={{ color: 'var(--c-text-muted)' }}>
              From emerging medical research to healthcare innovation and community impact, GHC celebrates the people shaping the future of health.
            </p>
          </div>
          <div style={{ position: 'relative', height: '100%', minHeight: '400px', background: 'var(--c-bg-soft)', borderRadius: '24px', overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=2070&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Vision" />
          </div>
        </div>
      </section>

      {/* --- EXPERIENCE SECTION --- */}
      <section className="bg-soft section-padding" style={{ background: '#F7FBFF' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px', maxWidth: '800px', margin: '0 auto 64px' }}>
            <div className="text-eyebrow" style={{ marginBottom: '16px' }}>Why GHC — The Experience</div>
            <h2 className="heading-lg" style={{ marginBottom: '24px' }}>More Than a Conference. A Global Healthcare Experience.</h2>
            <p className="text-body-lg" style={{ color: 'var(--c-text-secondary)' }}>
              GHC brings together multiple dimensions of healthcare under one roof. Attendees can engage with leading voices, discover emerging research, develop practical skills, and connect with peers and organisations working to create meaningful change.
            </p>
          </div>
          <div className="grid-2" style={{ gap: '32px' }}>
            {[
              'Learn through scientific sessions, expert discussions, and hands-on workshops.',
              'Connect with healthcare professionals, researchers, students, innovators, and organisations.',
              'Showcase research, ideas, initiatives, and innovations to a diverse global audience.',
              'Collaborate across disciplines and build relationships that extend beyond the conclave.',
              'Celebrate excellence through recognition of outstanding contributions to healthcare.'
            ].map((point, i) => (
              <motion.div key={i} className="card-rounded-sm bg-white" style={{ padding: '24px', display: 'flex', gap: '16px', alignItems: 'flex-start', border: '1px solid var(--c-border)' }}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <div style={{ color: 'var(--c-ghc-purple)' }}><Target size={24} /></div>
                <p className="text-body" style={{ fontWeight: 500 }}>{point}</p>
              </motion.div>
            ))}
          </div>
          <motion.p className="text-body-lg" style={{ marginTop: '48px', textAlign: 'center', maxWidth: '800px', margin: '48px auto 0', color: 'var(--c-text-secondary)' }}
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Whether you are a student taking your first steps in medicine, an established professional, a researcher, an entrepreneur, or a healthcare organisation, GHC offers a space to learn, contribute, and connect.
          </motion.p>
        </div>
      </section>

      {/* --- IMPACT SECTION --- */}
      <section className="bg-white section-padding">
        <div className="container grid-2" style={{ alignItems: 'center', gap: '64px' }}>
          <div style={{ position: 'relative', height: '100%', minHeight: '400px', background: 'var(--c-bg-lavender)', borderRadius: '24px', overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1551076805-e1869033e561?q=80&w=2070&auto=format&fit=crop" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Impact" />
          </div>
          <div>
            <div className="text-eyebrow" style={{ marginBottom: '16px' }}>The Future of Healthcare</div>
            <h2 className="heading-lg" style={{ marginBottom: '24px' }}>Shaping the Healthcare of Tomorrow</h2>
            <p className="text-body-lg" style={{ marginBottom: '24px' }}>
              The future of healthcare will not be defined by one discipline, one profession, or one breakthrough. It will be shaped by collaboration.
            </p>
            <p className="text-body" style={{ marginBottom: '24px', color: 'var(--c-text-muted)' }}>
              GHC aims to create a global ecosystem where medical knowledge meets innovation, research meets implementation, and young healthcare leaders meet the experience needed to turn ideas into impact.
            </p>
            <p className="text-body" style={{ marginBottom: '24px', color: 'var(--c-text-muted)' }}>
              Through scientific exchange, innovation, leadership, community initiatives, and cross-border collaboration, GHC seeks to foster conversations that matter and partnerships that last.
            </p>
            <p className="text-body" style={{ fontWeight: 600, color: 'var(--c-deep-navy)' }}>
              The goal is simple: connect the people shaping healthcare today with the ideas that will shape it tomorrow.
            </p>
          </div>
        </div>
      </section>


      {/* --- BOTTOM CTA --- */}
      <section className="section-padding">
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
    </>
  )
}
