import { ArrowLeft, CheckCircle2, Send, ShieldAlert } from "lucide-react";
import { useState } from "react";

function BoardMeetingRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    boardPosition: "",
    institution: "",
    country: "",
    city: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const setValue = (key, value) => setForm(cur => ({ ...cur, [key]: value }));

  const submit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0f] px-4 py-10 text-white font-['Syne',sans-serif]">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
        .form-input {
          width: 100%;
          padding: 14px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04);
          color: #fff;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
        }
        .form-input:focus {
          border-color: rgba(255,61,127,0.5);
          background: rgba(255,61,127,0.05);
        }
        .form-label {
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: rgba(255,255,255,0.7);
          font-family: 'DM Sans', sans-serif;
        }
      `}</style>
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16} /> Back to GHC
        </a>
        
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-10 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ff3b8b]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4ca1ff]/10 blur-[80px] rounded-full pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-widest mb-6">
              <ShieldAlert size={14} /> Restricted Access
            </div>
            
            <h1 className="font-['Sora'] text-4xl md:text-5xl font-bold mb-4">GAIMS Board Meeting</h1>
            <p className="text-slate-400 text-lg mb-8">
              Registration for the exclusive GAIMS National Board Meeting. 
              This form is strictly for authorized board members and delegates.
            </p>

            {submitted ? (
              <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center mt-8">
                <CheckCircle2 size={48} className="text-emerald-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-emerald-400 mb-2">Registration Received</h2>
                <p className="text-slate-300">
                  Your registration for the GAIMS Board Meeting has been recorded. 
                  You will receive further details and the agenda via email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <label className="form-label md:col-span-2">
                  Full Name
                  <input required className="form-input" value={form.fullName} onChange={e => setValue("fullName", e.target.value)} placeholder="Dr. Jane Doe" />
                </label>
                <label className="form-label">
                  Email Address
                  <input required type="email" className="form-input" value={form.email} onChange={e => setValue("email", e.target.value)} placeholder="jane@hospital.com" />
                </label>
                <label className="form-label">
                  Phone Number
                  <input required type="tel" className="form-input" value={form.phone} onChange={e => setValue("phone", e.target.value)} placeholder="+91 98765 43210" />
                </label>
                <label className="form-label">
                  GAIMS Board Position
                  <input required className="form-input" value={form.boardPosition} onChange={e => setValue("boardPosition", e.target.value)} placeholder="e.g. National Secretary" />
                </label>
                <label className="form-label">
                  Institution / Affiliation
                  <input required className="form-input" value={form.institution} onChange={e => setValue("institution", e.target.value)} placeholder="AIIMS New Delhi" />
                </label>
                <label className="form-label">
                  City
                  <input required className="form-input" value={form.city} onChange={e => setValue("city", e.target.value)} placeholder="Mumbai" />
                </label>
                <label className="form-label">
                  Country
                  <input required className="form-input" value={form.country} onChange={e => setValue("country", e.target.value)} placeholder="India" />
                </label>

                <div className="md:col-span-2 pt-4">
                  <button 
                    disabled={submitting}
                    className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] px-8 py-4 font-bold text-white shadow-[0_8px_30px_rgba(255,61,127,0.3)] transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100" 
                    type="submit"
                  >
                    <Send size={18} /> {submitting ? "Processing..." : "Submit Registration"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

export default BoardMeetingRegister;
