import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Award, CalendarDays, Gift, Loader2, MapPin, QrCode, ShieldCheck } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiUrl } from "../config/api";
import { GHC_FAVICON_PATH } from "../config/branding";

export const DELEGATE_TOKEN_KEY = "ghc_delegate_token";

const BENEFITS = [
  { icon: QrCode, title: "Your entry QR code", text: "Ready to show at the door." },
  { icon: Gift, title: "One free workshop", text: "Claim your seat before they fill up." },
  { icon: Award, title: "Your certificates", text: "Download them once they are issued." },
];

const OTP_LENGTH = 6;

// One real input sits invisibly over the boxes, so typing, pasting and phone autofill all just work.
function OtpBoxes({ value, onChange }) {
  const [focused, setFocused] = useState(true);
  return (
    <div className="relative">
      <div className="grid grid-cols-6 gap-2 sm:gap-2.5" aria-hidden="true">
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const active = focused && index === Math.min(value.length, OTP_LENGTH - 1);
          return (
            <span
              key={index}
              className={`grid h-14 place-items-center rounded-xl border-2 bg-white font-['Outfit'] text-2xl font-bold text-[#081B33] transition sm:h-16 ${active ? "border-[#173B8F] ring-4 ring-[#173B8F]/10" : value[index] ? "border-[#173B8F]/40" : "border-[#D9DEE8]"}`}
            >
              {value[index] || ""}
            </span>
          );
        })}
      </div>
      <input
        id="delegate-otp"
        className="absolute inset-0 h-full w-full cursor-text opacity-0"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus
        required
      />
    </div>
  );
}

export default function DelegateLogin() {
  const navigate = useNavigate();
  // The login button in the delegate email carries the ID, so nobody has to copy it across.
  const [searchParams] = useSearchParams();
  const [delegateId, setDelegateId] = useState(searchParams.get("id") || "");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (localStorage.getItem(DELEGATE_TOKEN_KEY)) navigate("/delegate-dashboard", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (wait <= 0) return undefined;
    const timer = setTimeout(() => setWait((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  const requestCode = async (event) => {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(apiUrl("/api/delegate-account/request-otp"), { delegateId });
      setSent(true);
      setOtp("");
      setNotice(data.message);
      setWait(data.resendSeconds || 60);
    } catch (err) {
      setError(err.response?.data?.message || "We could not send the login code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { data } = await axios.post(apiUrl("/api/delegate-account/verify-otp"), { delegateId, otp });
      localStorage.setItem(DELEGATE_TOKEN_KEY, data.token);
      navigate("/delegate-dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "We could not check that code. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const buttonClass = "flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#173B8F] via-[#5B3FC4] to-[#EC4899] px-6 py-3.5 font-bold text-white shadow-lg shadow-[#173B8F]/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none";

  return (
    <section className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel: the building stays clear at the top, and the text sits on the dark reflection below it. */}
      <div className="relative overflow-hidden bg-[#081B33] text-white">
        <img src="/assets/invitation/bharat-mandapam-night.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081B33] via-[#081B33]/85 to-[#173B8F]/25 lg:via-[#081B33]/70 lg:to-transparent" />
        <div className="relative flex h-full flex-col justify-end px-6 pb-8 pt-10 sm:px-12 lg:px-16 lg:pb-12 lg:pt-32">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="h-12 w-12 overflow-hidden rounded-full bg-white shadow-lg"><img src={GHC_FAVICON_PATH} alt="" className="h-full w-full object-cover" /></span>
            <span className="font-['Outfit'] text-lg font-bold">Global Healthcare Conclave 2026</span>
          </div>
          <h1 className="mt-7 max-w-lg font-['Outfit'] lg:mt-0 text-4xl font-extrabold leading-[1.08] sm:text-5xl">
            Your conclave,<br />
            <span className="bg-gradient-to-r from-[#FFB3D9] to-[#C9B6FF] bg-clip-text text-transparent">all in one place.</span>
          </h1>

          <ul className="mt-9 hidden max-w-md space-y-5 lg:block">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur"><Icon className="h-5 w-5" /></span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-sm text-white/75">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-white/90 lg:mt-10">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> 28 – 29 November 2026</span>
            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Bharat Mandapam, New Delhi</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[#F4F6FB] px-5 py-10 sm:px-10 lg:pt-28">
        <motion.div
          key={sent ? "code" : "id"}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md rounded-3xl bg-white p-7 shadow-[0_20px_60px_rgba(8,27,51,0.10)] sm:p-9"
        >
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-1.5 flex-1 rounded-full bg-[#173B8F]" />
            <span className={`h-1.5 flex-1 rounded-full ${sent ? "bg-[#173B8F]" : "bg-[#E4E8F1]"}`} />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[#173B8F]">Step {sent ? 2 : 1} of 2</p>
          <h2 className="mt-1.5 font-['Outfit'] text-3xl font-extrabold text-[#081B33]">{sent ? "Check your email" : "Delegate Login"}</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#667085]">
            {sent ? notice : "Enter your Delegate ID and we'll email you a one-time login code."}
          </p>

          {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

          {!sent ? (
            <form onSubmit={requestCode} className="mt-6">
              <label htmlFor="delegate-id" className="mb-1.5 block text-sm font-semibold text-[#344054]">Delegate ID</label>
              <input
                id="delegate-id"
                className="w-full rounded-xl border-2 border-[#D9DEE8] bg-white px-4 py-3.5 font-mono font-semibold uppercase tracking-wide text-[#081B33] placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 focus:border-[#173B8F] focus:outline-none focus:ring-4 focus:ring-[#173B8F]/10"
                value={delegateId}
                onChange={(event) => setDelegateId(event.target.value)}
                placeholder="GHC26-DEL-00000"
                autoComplete="username"
                autoFocus
                required
              />
              <p className="mt-2 text-xs text-[#667085]">This is the Registration ID on your GHC confirmation email.</p>
              <button type="submit" disabled={busy || !delegateId.trim()} className={`mt-6 ${buttonClass}`}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Login Code <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyCode} className="mt-6">
              <label htmlFor="delegate-otp" className="mb-2 block text-sm font-semibold text-[#344054]">6-digit code</label>
              <OtpBoxes value={otp} onChange={setOtp} />
              <button type="submit" disabled={busy || otp.length !== OTP_LENGTH} className={`mt-6 ${buttonClass}`}>
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : "Log In"}
              </button>
              <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                <button type="button" className="inline-flex items-center gap-1.5 text-[#667085] hover:text-[#173B8F]" onClick={() => { setSent(false); setError(""); }}>
                  <ArrowLeft className="h-4 w-4" /> Change ID
                </button>
                <button type="button" className="text-[#173B8F] disabled:text-[#98A2B3]" disabled={wait > 0 || busy} onClick={requestCode}>
                  {wait > 0 ? `Resend in ${wait}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-7 flex items-start gap-2.5 border-t border-[#EEF1F6] pt-5 text-xs leading-relaxed text-[#667085]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <p>{sent ? "No email? Check your spam folder, or write to " : "No password needed. Having trouble? Write to "}<a className="font-semibold text-[#173B8F]" href="mailto:secretary@gaims.org">secretary@gaims.org</a>.</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
