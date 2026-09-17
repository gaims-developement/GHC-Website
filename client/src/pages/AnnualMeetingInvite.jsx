import { CalendarDays, MapPin, MailOpen } from "lucide-react";

function AnnualMeetingInvite() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap');
      `}</style>
      
      <div className="w-full max-w-2xl relative">
        {/* Ornate border and glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#d4af37] via-[#fff3cc] to-[#d4af37] opacity-20 blur-xl rounded-sm pointer-events-none" />
        
        <div className="relative bg-[#061428] border border-[#d4af37]/30 p-8 md:p-14 shadow-2xl text-center">
          {/* Inner decorative border */}
          <div className="absolute inset-4 border border-[#d4af37]/20 pointer-events-none" />
          <div className="absolute inset-5 border border-[#d4af37]/10 pointer-events-none" />

          <div className="w-16 h-16 mx-auto bg-[#d4af37]/10 rounded-full flex items-center justify-center mb-8 border border-[#d4af37]/30">
            <MailOpen size={28} className="text-[#d4af37]" />
          </div>

          <h2 className="text-[#d4af37] tracking-[0.25em] uppercase text-sm font-bold mb-6 font-['DM_Sans',sans-serif]">
            Confidential Invitation
          </h2>

          <h1 className="font-['Playfair_Display',serif] text-4xl md:text-5xl text-white font-bold leading-tight mb-8">
            GAIMS Annual Meeting <br /> 2026
          </h1>

          <p className="text-slate-300 font-['Playfair_Display',serif] italic text-xl md:text-2xl mb-10 leading-relaxed max-w-lg mx-auto">
            You are cordially invited to attend the exclusive GAIMS Annual General Meeting. 
            Join the national leadership and core delegates as we chart the future course 
            of our healthcare initiatives.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10 font-['DM_Sans',sans-serif]">
            <div className="flex items-center gap-3 text-slate-400">
              <CalendarDays className="text-[#d4af37]" size={20} />
              <div className="text-left">
                <div className="text-white font-bold">November 22, 2026</div>
                <div className="text-sm">9:00 AM - 1:00 PM</div>
              </div>
            </div>
            <div className="hidden md:block w-px h-10 bg-[#d4af37]/20" />
            <div className="flex items-center gap-3 text-slate-400">
              <MapPin className="text-[#d4af37]" size={20} />
              <div className="text-left">
                <div className="text-white font-bold">New Delhi, India</div>
                <div className="text-sm">Executive Boardroom, Main Venue</div>
              </div>
            </div>
          </div>

          <hr className="border-[#d4af37]/20 mb-8 max-w-[200px] mx-auto" />

          <p className="text-sm text-slate-500 font-['DM_Sans',sans-serif]">
            This invitation is strictly non-transferable. <br />
            Formal attire is requested. Please present this digital invite upon entry.
          </p>

          <a href="/" className="inline-block mt-12 text-[#d4af37] text-sm font-bold tracking-widest uppercase hover:text-white transition-colors border-b border-[#d4af37]/30 pb-1">
            Return to Homepage
          </a>
        </div>
      </div>
    </main>
  );
}

export default AnnualMeetingInvite;
