import React, { useState } from 'react';
import { Mail, Stethoscope, CheckCircle2, Loader2 } from 'lucide-react';
import { navLinks } from '../config/nav';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setStatus('loading');
    setErrorMessage('');
    
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      if (res.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const data = await res.json();
        throw new Error(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message);
    }
  };

  return (
    <footer id="contact" className="bg-[#F8F9FC] border-t border-gray-100 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)] p-10 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#173B8F] rounded-full blur-[80px] opacity-10 -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="flex-1 max-w-2xl relative z-10">
            <p className="text-[#00A6A6] font-['Inter'] font-bold tracking-widest uppercase text-sm mb-3">Newsletter</p>
            <h2 className="font-['Outfit'] text-3xl md:text-4xl font-extrabold text-[#101828] mb-4">Stay inside the GHC circle.</h2>
            <p className="text-[#475467] font-['Inter'] text-lg leading-relaxed">Receive speaker announcements, abstract deadlines, workshop releases and partner updates.</p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md relative z-10">
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address" 
                aria-label="Email address" 
                required
                disabled={status === 'loading' || status === 'success'}
                className="flex-1 bg-[#F8F9FC] border border-gray-200 text-[#101828] placeholder-gray-400 px-6 py-4 rounded-full font-medium focus:outline-none focus:border-[#173B8F] focus:ring-2 focus:ring-[#173B8F]/20 transition-all disabled:opacity-70" 
              />
              <button 
                type="submit"
                disabled={status === 'loading' || status === 'success'}
                aria-label="Subscribe" 
                className="w-full sm:w-auto bg-[#173B8F] text-white px-8 py-4 sm:py-0 rounded-full hover:bg-[#0D47A1] transition-colors shadow-md flex items-center justify-center gap-2 font-bold disabled:opacity-70"
              >
                {status === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : status === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-300" /> : <><Mail className="h-5 w-5" /><span className="sm:hidden">Subscribe</span></>}
              </button>
            </form>
            {status === 'error' && (
              <p className="text-red-500 text-sm mt-2 ml-4 font-medium">{errorMessage}</p>
            )}
            {status === 'success' && (
              <p className="text-[#00A6A6] text-sm mt-2 ml-4 font-medium">Successfully subscribed!</p>
            )}
          </div>
        </div>

        <div className="grid gap-12 lg:grid-cols-3 pb-12 border-b border-gray-200">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-[#173B8F] text-white flex items-center justify-center shadow-sm"><Stethoscope className="h-5 w-5" /></span>
              <h3 className="font-['Outfit'] text-xl font-extrabold text-[#101828]">Global Healthcare Conclave 2026</h3>
            </div>
            <p className="mt-6 max-w-sm leading-relaxed text-[#475467] font-medium">The flagship global health initiative of GAIMS for clinicians, researchers, students and innovators.</p>
          </div>
          <div>
            <h4 className="font-['Outfit'] text-lg font-bold text-[#101828] mb-6">Quick links</h4>
            <div className="grid grid-cols-2 gap-4">
              {navLinks?.slice(1)?.map(([label, id]) => <a key={id} href={label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : `#${id}`} className="text-[#475467] font-medium hover:text-[#173B8F] transition-colors">{label}</a>)}
            </div>
          </div>
          <div>
            <h4 className="font-['Outfit'] text-lg font-bold text-[#101828] mb-6">Contact</h4>
            <div className="grid gap-3">
              {[
                "scientificghcscientific@gmail.com",
                "itd@gaims.org",
                "president@gaims.org",
                "vpe@gaims.org",
                "vpa@gaims.org",
                "vpi@gaims.org",
                "secretary@gaims.org",
              ].map((email) => (
                <a key={email} href={`mailto:${email}`} className="text-[#173B8F] hover:underline font-bold text-sm break-all">{email}</a>
              ))}
            </div>
          </div>
        </div>
        
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#475467] font-medium">
          <p>&copy; 2026 GAIMS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-[#173B8F] transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-[#173B8F] transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
