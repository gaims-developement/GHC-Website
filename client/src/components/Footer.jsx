import React from 'react';
import { Mail, Stethoscope } from 'lucide-react';
import { navLinks } from '../config/nav';

export default function Footer() {
  return (
    <footer id="contact" className="footer-shell reveal-section">
      <div className="newsletter-card">
        <div>
          <p className="section-kicker">Newsletter</p>
          <h2>Stay inside the GHC circle.</h2>
          <p>Receive speaker announcements, abstract deadlines, workshop releases and partner updates.</p>
        </div>
        <form>
          <input type="email" placeholder="Email address" aria-label="Email address" />
          <button aria-label="Subscribe"><Mail className="h-5 w-5" /></button>
        </form>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-5 pb-12 pt-12 md:px-8 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="brand-mark"><Stethoscope className="h-5 w-5" /></span>
            <h3 className="font-['Sora'] text-xl font-bold">Global Healthcare Conclave 2026</h3>
          </div>
          <p className="mt-5 max-w-md leading-7 text-[#12385f]/62">The flagship global health initiative of GAIMS for clinicians, researchers, students and innovators.</p>
        </div>
        <div>
          <h4 className="footer-heading">Quick links</h4>
          <div className="mt-5 grid gap-3">
            {navLinks?.slice(1)?.map(([label, id]) => <a key={id} href={label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : `#${id}`}>{label}</a>)}
          </div>
        </div>
        <div>
          <h4 className="footer-heading">Contact</h4>
          <p className="mt-5 text-sm leading-7 text-[#12385f]/62">GAIMS Global Healthcare Conclave Office<br />conference@gaims.org</p>
        </div>
      </div>
    </footer>
  );
}
