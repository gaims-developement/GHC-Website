import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Award, CalendarDays, CheckCircle2, ChevronRight, Circle, Clock3, Download, Gift, Home, LayoutDashboard, Loader2, LogOut, MapPin, QrCode, Sparkles, Users, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import { apiUrl, getImageUrl } from "../config/api";
import { GHC_FAVICON_PATH } from "../config/branding";
import { formatWorkshopDate, getWorkshopTimeRange } from "../data/workshops";
import { DELEGATE_TOKEN_KEY } from "./DelegateLogin";

const CONFETTI_COLORS = ["#EC4899", "#8B5CF6", "#FAC775", "#5DCAA5", "#85B7EB"];

const readSeen = (key) => {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
};

const writeSeen = (key) => {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Private browsing: the popup may simply show again next time.
  }
};

function Modal({ onClose, children, label }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#081B33]/60 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function CongratulationsPopup({ onClose }) {
  const reduceMotion = useReducedMotion();
  const pieces = useMemo(() => Array.from({ length: 26 }, (_, index) => ({
    left: `${(index * 37) % 100}%`,
    delay: (index % 9) * 0.22,
    duration: 2.6 + (index % 5) * 0.4,
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    round: index % 3 === 0,
  })), []);

  return (
    <Modal onClose={onClose} label="You can claim a free workshop">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#EC4899] via-[#8B5CF6] to-[#173B8F] px-7 pb-16 pt-10 text-center text-white">
        {!reduceMotion && pieces.map((piece, index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            className={`absolute -top-3 h-2.5 w-2 ${piece.round ? "rounded-full" : "rounded-sm"}`}
            style={{ left: piece.left, background: piece.color }}
            animate={{ y: [0, 300], rotate: [0, 360], opacity: [1, 1, 0] }}
            transition={{ duration: piece.duration, delay: piece.delay, repeat: Infinity, ease: "linear" }}
          />
        ))}
        <button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 transition hover:bg-white/25">
          <X className="h-5 w-5" />
        </button>
        <p className="relative font-['Inter'] text-xs font-bold uppercase tracking-[0.25em] text-white/80">Delegate Benefit</p>
        <h2 className="relative mt-3 font-['Outfit'] text-4xl font-extrabold leading-tight">Congratulations!</h2>
      </div>
      <motion.div
        className="absolute left-1/2 top-[132px] grid h-20 w-20 -translate-x-1/2 place-items-center rounded-full bg-white text-[#EC4899] shadow-xl"
        animate={reduceMotion ? undefined : { rotate: [0, -8, 8, -5, 5, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.6 }}
      >
        <Gift className="h-10 w-10" />
      </motion.div>
      <div className="px-7 pb-7 pt-14 text-center">
        <p className="font-['Outfit'] text-2xl font-bold text-[#081B33]">You can claim a free workshop</p>
        <p className="mt-2 text-sm leading-relaxed text-[#667085]">Apply for one limited-seat workshop below. You can choose only one, and it cannot be changed. The open-for-all workshop is already included for you.</p>
        <button type="button" autoFocus onClick={onClose} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#173B8F] px-6 py-3.5 font-bold text-white shadow-lg shadow-pink-500/25 transition hover:brightness-110">
          <Sparkles className="h-4 w-4" /> Choose My Workshop
        </button>
      </div>
    </Modal>
  );
}

function WorkshopFacts({ workshop }) {
  return (
    <ul className="mt-3 space-y-1.5 text-sm text-[#475467]">
      {/* The date's day part only: the time inside it depends on the server's time zone, the CMS start and end times do not. */}
      <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-[#173B8F]" />{workshop.date ? new Date(`${String(workshop.date).slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : formatWorkshopDate(workshop.date)}</li>
      {(workshop.startTime || workshop.duration) && (
        <li className="flex items-center gap-2"><Clock3 className="h-4 w-4 shrink-0 text-[#173B8F]" />{[workshop.startTime && getWorkshopTimeRange(workshop), workshop.duration].filter(Boolean).join(" · ")}</li>
      )}
      {workshop.venue && <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#173B8F]" />{workshop.venue}</li>}
    </ul>
  );
}

function WorkshopsPanel({ request, storageKey, onClaimed }) {
  const [state, setState] = useState({ loading: true, workshops: [], claimedWorkshop: null });
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [choice, setChoice] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await request({ url: "/api/delegate-account/workshops" });
      setState({ loading: false, workshops: data.workshops || [], claimedWorkshop: data.claimedWorkshop });
      onClaimed(data.claimedWorkshop);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Could not load the workshops. Please refresh the page.");
      setState((current) => ({ ...current, loading: false }));
      return null;
    }
  }, [request, onClaimed]);

  useEffect(() => {
    load().then((data) => {
      // Waits until there is something to choose, so the popup is never followed by an empty list.
      if (data && !data.claimedWorkshop && data.workshops?.some((workshop) => !workshop.isOpenToAll) && !readSeen(storageKey)) {
        writeSeen(storageKey);
        setShowPopup(true);
      }
    });
  }, [load, storageKey]);

  const confirmClaim = async () => {
    setClaiming(true);
    setError("");
    try {
      await request({ method: "post", url: `/api/delegate-account/workshops/${choice.id}/claim` });
    } catch (err) {
      setError(err.response?.data?.message || "That did not work. Please try again.");
    } finally {
      setChoice(null);
      setClaiming(false);
      await load();
    }
  };

  const { loading, workshops, claimedWorkshop } = state;
  const openToAll = workshops.filter((workshop) => workshop.isOpenToAll);
  const limited = workshops.filter((workshop) => !workshop.isOpenToAll);
  if (loading) return <p className="py-10 text-center text-[#667085]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></p>;

  return (
    <div>
      <AnimatePresence>{showPopup && <CongratulationsPopup onClose={() => setShowPopup(false)} />}</AnimatePresence>
      <AnimatePresence>
        {choice && (
          <Modal onClose={() => !claiming && setChoice(null)} label="Confirm your workshop">
            <div className="p-7">
              <h2 className="font-['Outfit'] text-2xl font-bold text-[#081B33]">Claim this workshop?</h2>
              <p className="mt-2 font-semibold text-[#173B8F]">{choice.title}</p>
              <p className="mt-3 text-sm leading-relaxed text-[#667085]">You can choose only one limited-seat workshop, and you cannot change it after this.</p>
              <div className="mt-6 flex gap-3">
                <button type="button" disabled={claiming} onClick={() => setChoice(null)} className="flex-1 rounded-full border border-gray-300 px-4 py-3 font-bold text-[#344054] disabled:opacity-60">Go Back</button>
                <button type="button" autoFocus disabled={claiming} onClick={confirmClaim} className="flex flex-1 items-center justify-center rounded-full bg-[#173B8F] px-4 py-3 font-bold text-white disabled:opacity-60">
                  {claiming ? <Loader2 className="h-5 w-5 animate-spin" /> : "Yes, Claim It"}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

      {openToAll.map((workshop) => (
        <div key={workshop.id} className="mb-5 flex flex-col gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          {workshop.imageUrl && <img src={getImageUrl(workshop.imageUrl)} alt={`${workshop.title} poster`} className="block h-auto w-full shrink-0 rounded-xl sm:w-64" />}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Open for all delegates</p>
            <h3 className="mt-1.5 font-['Outfit'] text-xl font-bold text-[#081B33]">{workshop.title}</h3>
            <WorkshopFacts workshop={workshop} />
          </div>
        </div>
      ))}

      {claimedWorkshop ? (
        <div className="flex flex-col gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center">
          {claimedWorkshop.imageUrl && <img src={getImageUrl(claimedWorkshop.imageUrl)} alt={`${claimedWorkshop.title} poster`} className="block h-auto w-full shrink-0 rounded-xl sm:w-64" />}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Your free workshop is confirmed</p>
            <h3 className="mt-1.5 font-['Outfit'] text-xl font-bold text-[#081B33]">{claimedWorkshop.title}</h3>
            <WorkshopFacts workshop={claimedWorkshop} />
          </div>
        </div>
      ) : limited.length > 0 ? (
        <>
          <p className="flex items-center gap-2 font-semibold text-[#081B33]"><Gift className="h-5 w-5 text-[#EC4899]" /> Claim your free workshop</p>
          <p className="mb-4 mt-1 text-sm text-[#667085]">These have limited seats. You can choose only one, and it cannot be changed.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {limited.map((workshop) => {
              const blocked = workshop.isEnabled === false ? "Coming Soon" : workshop.isRegistrationOpen === false ? "Closed" : workshop.availableSeats <= 0 ? "Full" : "";
              return (
                <article key={workshop.id} className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
                  {workshop.imageUrl && <img src={getImageUrl(workshop.imageUrl)} alt={`${workshop.title} poster`} className="block h-auto w-full" />}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-['Outfit'] text-lg font-bold text-[#081B33]">{workshop.title}</h3>
                    <WorkshopFacts workshop={workshop} />
                    <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-700"><Users className="h-4 w-4" />{workshop.availableSeats} of {workshop.capacity} seats left</p>
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        disabled={Boolean(blocked)}
                        onClick={() => setChoice(workshop)}
                        className="w-full rounded-full bg-[#173B8F] px-4 py-2.5 font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        {blocked || "Claim This Workshop"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      ) : !openToAll.length && (
        <p className="py-10 text-center text-[#667085]">The workshops will be listed here soon. Please check back.</p>
      )}
    </div>
  );
}

function CertificatesPanel({ request }) {
  const [state, setState] = useState({ loading: true, certificates: [], error: "" });
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    request({ url: "/api/delegate-account/certificates" })
      .then(({ data }) => setState({ loading: false, certificates: data.certificates || [], error: "" }))
      .catch((err) => setState({ loading: false, certificates: [], error: err.response?.data?.message || "Could not load your certificates." }));
  }, [request]);

  const download = async (certificate) => {
    setDownloading(certificate.id);
    try {
      const { data } = await request({ url: `/api/delegate-account/certificates/${certificate.id}/pdf`, responseType: "blob" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${certificate.certificateId || "GHC-certificate"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setState((current) => ({ ...current, error: "Could not download that certificate. Please try again." }));
    } finally {
      setDownloading(null);
    }
  };

  if (state.loading) return <p className="py-10 text-center text-[#667085]"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></p>;
  return (
    <div>
      {state.error && <p role="alert" className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{state.error}</p>}
      {!state.certificates.length && !state.error && <p className="py-10 text-center text-[#667085]">Your certificates will appear here once they are issued.</p>}
      <ul className="space-y-3">
        {state.certificates.map((certificate) => (
          <li key={certificate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 p-4">
            <div className="min-w-0">
              <p className="font-bold text-[#081B33]">{certificate.name}</p>
              <p className="text-xs text-[#667085]">{certificate.certificateId}</p>
            </div>
            <button type="button" disabled={downloading === certificate.id} onClick={() => download(certificate)} className="inline-flex items-center gap-2 rounded-full bg-[#173B8F] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
              {downloading === certificate.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", title: "Overview", icon: LayoutDashboard },
  { id: "qr", label: "My QR Code", title: "My QR Code", icon: QrCode },
  { id: "certificates", label: "Certificates", title: "Certificates", icon: Award },
  { id: "workshops", label: "Workshops", title: "Workshops", icon: Gift },
];

const EVENT_START = new Date("2026-11-28T00:00:00+05:30");

const daysToGo = () => Math.ceil((EVENT_START.getTime() - Date.now()) / 86400000);

const cardClass = "rounded-2xl border border-[#E4E8F1] bg-white shadow-[0_1px_3px_rgba(8,27,51,0.05)]";

function StatTile({ icon: Icon, tone, label, value, detail, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`${cardClass} group flex w-full flex-col p-5 text-left transition hover:-translate-y-0.5 hover:border-[#173B8F]/40 hover:shadow-md`}>
      <span className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[#667085]">{label}</span>
        <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `${tone}18`, color: tone }}><Icon className="h-5 w-5" /></span>
      </span>
      <span className="mt-3 line-clamp-2 font-['Outfit'] text-2xl font-bold leading-tight text-[#081B33]">{value}</span>
      <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#667085] group-hover:text-[#173B8F]">{detail} <ChevronRight className="h-3.5 w-3.5" /></span>
    </button>
  );
}

function Overview({ me, summary, goTo }) {
  const { claimedWorkshop, workshopCount, includedTitles, certificateCount } = summary;
  const days = daysToGo();
  const steps = [
    ...includedTitles.map((title) => ({ done: true, title: "Open-for-all workshop included", text: title, tab: "workshops" })),
    {
      done: Boolean(claimedWorkshop),
      title: claimedWorkshop ? "Free workshop claimed" : "Claim your free workshop",
      text: claimedWorkshop ? claimedWorkshop.title : workshopCount ? "Limited seats. You can choose only one." : "Workshops will be listed here soon.",
      tab: "workshops",
    },
    { done: false, title: "Keep your QR code ready", text: "Show it at the entry with a valid government-issued photo ID.", tab: "qr" },
    { done: certificateCount > 0, title: "Download your certificates", text: certificateCount > 0 ? `${certificateCount} ready to download.` : "They will appear here once they are issued.", tab: "certificates" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile icon={QrCode} tone="#173B8F" label="Entry Pass" value="Ready" detail="View QR code" onClick={() => goTo("qr")} />
        <StatTile
          icon={Gift}
          tone="#EC4899"
          label="Free Workshop"
          value={claimedWorkshop ? "Claimed" : workshopCount ? "1 to claim" : workshopCount === 0 ? "Coming soon" : "—"}
          detail={claimedWorkshop ? "View your workshop" : workshopCount ? "Claim it now" : "Open workshops"}
          onClick={() => goTo("workshops")}
        />
        <StatTile
          icon={Award}
          tone="#0E9F6E"
          label="Certificates"
          value={certificateCount === null ? "—" : `${certificateCount} issued`}
          detail="Open certificates"
          onClick={() => goTo("certificates")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <section className={`${cardClass} p-6`}>
          <h2 className="font-['Outfit'] text-lg font-bold text-[#081B33]">Your checklist</h2>
          <ul className="mt-3 divide-y divide-[#EEF1F6]">
            {steps.map((step) => (
              <li key={`${step.title}-${step.text}`}>
                <button type="button" onClick={() => goTo(step.tab)} className="flex w-full items-center gap-3 py-3.5 text-left">
                  {step.done ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : <Circle className="h-6 w-6 shrink-0 text-[#C5CCDA]" />}
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-[#081B33]">{step.title}</span>
                    <span className="block text-sm text-[#667085]">{step.text}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#98A2B3]" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          <section className="rounded-2xl bg-gradient-to-br from-[#081B33] via-[#173B8F] to-[#8B5CF6] p-6 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Global Healthcare Conclave</p>
            {days > 0 && <p className="mt-2 font-['Outfit'] text-4xl font-extrabold">{days} <span className="text-lg font-semibold text-white/80">day{days === 1 ? "" : "s"} to go</span></p>}
            <ul className="mt-3 space-y-1.5 text-sm text-white/90">
              <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> 28 – 29 November 2026</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> Bharat Mandapam, New Delhi</li>
            </ul>
          </section>

          <section className={`${cardClass} flex items-center gap-4 p-5`}>
            <QRCodeSVG value={me.checkinToken} size={76} level="M" marginSize={0} bgColor="#ffffff" fgColor="#0b1220" className="shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-[#081B33]">Delegate ID</p>
              <p className="truncate font-mono text-sm text-[#667085]">{me.registrationId}</p>
              <button type="button" onClick={() => goTo("qr")} className="mt-1 text-sm font-bold text-[#173B8F]">Show full size</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function DelegateDashboard() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [claimedWorkshop, setClaimedWorkshop] = useState(null);
  const [workshopCount, setWorkshopCount] = useState(null);
  const [includedTitles, setIncludedTitles] = useState([]);
  const [certificateCount, setCertificateCount] = useState(null);

  const logout = useCallback(() => {
    localStorage.removeItem(DELEGATE_TOKEN_KEY);
    navigate("/delegate-login", { replace: true });
  }, [navigate]);

  const request = useCallback(async (config) => {
    try {
      return await axios({ ...config, url: apiUrl(config.url), headers: { Authorization: `Bearer ${localStorage.getItem(DELEGATE_TOKEN_KEY)}` } });
    } catch (err) {
      if (err.response?.status === 401) logout();
      throw err;
    }
  }, [logout]);

  useEffect(() => {
    if (!localStorage.getItem(DELEGATE_TOKEN_KEY)) {
      navigate("/delegate-login", { replace: true });
      return;
    }
    request({ url: "/api/delegate-account/me" })
      .then(({ data }) => setMe(data))
      .catch((err) => setError(err.response?.data?.message || "We could not reach the server just now. You are still logged in, so please try again in a moment."));
    // A failed count just leaves its tile showing a dash; the panels report their own errors.
    request({ url: "/api/delegate-account/workshops" })
      .then(({ data }) => {
        setClaimedWorkshop(data.claimedWorkshop);
        const workshops = data.workshops || [];
        setWorkshopCount(workshops.filter((workshop) => !workshop.isOpenToAll).length);
        setIncludedTitles(workshops.filter((workshop) => workshop.isOpenToAll).map((workshop) => workshop.title));
      })
      .catch(() => {});
    request({ url: "/api/delegate-account/certificates" })
      .then(({ data }) => setCertificateCount((data.certificates || []).length))
      .catch(() => {});
  }, [navigate, request]);

  const goTo = (id) => {
    setTab(id);
    window.scrollTo(0, 0);
  };

  if (error) {
    return (
      <section className="min-h-screen bg-[#F4F6FB] px-4 pt-32 text-center" role="alert">
        <p className="font-semibold text-red-700">{error}</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-5 rounded-full bg-[#173B8F] px-6 py-3 font-bold text-white">Try Again</button>
      </section>
    );
  }
  if (!me) return <section className="grid min-h-screen place-items-center bg-[#F4F6FB]"><Loader2 className="h-8 w-8 animate-spin text-[#173B8F]" /></section>;

  const current = TABS.find((item) => item.id === tab);
  const workshopBadge = !claimedWorkshop && workshopCount > 0;

  return (
    <div className="min-h-screen bg-[#F4F6FB] lg:pl-64">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[#081B33] text-white lg:flex">
        <a href="/" className="flex items-center gap-3 px-5 py-5" aria-label="Global Healthcare Conclave home">
          <span className="h-10 w-10 overflow-hidden rounded-full bg-white"><img src={GHC_FAVICON_PATH} alt="" className="h-full w-full object-cover" /></span>
          <span>
            <span className="block font-['Outfit'] font-extrabold leading-tight">GHC 2026</span>
            <span className="block text-[0.65rem] font-semibold tracking-wider text-white/60">DELEGATE DASHBOARD</span>
          </span>
        </a>
        <nav aria-label="Dashboard" className="flex-1 space-y-1 px-3 pt-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              aria-current={tab === id ? "page" : undefined}
              onClick={() => goTo(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${tab === id ? "bg-white text-[#081B33]" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1 text-left">{label}</span>
              {id === "workshops" && workshopBadge && <span className="rounded-full bg-[#EC4899] px-2 py-0.5 text-[0.65rem] font-bold text-white">FREE</span>}
            </button>
          ))}
        </nav>
        <div className="space-y-1 border-t border-white/10 p-3">
          <div className="px-3.5 py-2">
            <p className="truncate text-sm font-bold">{me.fullName}</p>
            <p className="truncate font-mono text-xs text-white/60">{me.registrationId}</p>
          </div>
          <a href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"><Home className="h-5 w-5" /> Back to Website</a>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white"><LogOut className="h-5 w-5" /> Log Out</button>
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[#E4E8F1] bg-white px-4 py-3.5 sm:px-8">
        <div className="min-w-0">
          <h1 className="font-['Outfit'] text-xl font-bold text-[#081B33] sm:text-2xl">{current.title}</h1>
          <p className="truncate text-sm text-[#667085]">{tab === "overview" ? `Welcome, ${me.fullName}` : `${me.fullName} · ${me.registrationId}`}</p>
        </div>
        <button type="button" onClick={logout} aria-label="Log Out" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#E4E8F1] text-[#475467] lg:hidden"><LogOut className="h-4 w-4" /></button>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-8 lg:pb-10">
        {tab === "overview" && <Overview me={me} summary={{ claimedWorkshop, workshopCount, includedTitles, certificateCount }} goTo={goTo} />}
        {tab === "qr" && (
          <div className={`${cardClass} grid items-center gap-8 p-6 sm:p-8 md:grid-cols-[auto_1fr]`}>
            <div className="mx-auto rounded-2xl border border-gray-200 bg-white p-4">
              <QRCodeSVG value={me.checkinToken} size={240} level="M" marginSize={1} bgColor="#ffffff" fgColor="#0b1220" title={`Entry QR code for ${me.fullName}`} />
            </div>
            <div>
              <p className="font-['Outfit'] text-2xl font-bold text-[#081B33]">{me.fullName}</p>
              <p className="font-mono text-sm text-[#667085]">{me.registrationId}</p>
              <ul className="mt-5 space-y-3 text-sm text-[#475467]">
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> Show this QR code at the entry.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> Carry a valid government-issued photo ID with you.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> This code is personal, so please do not share it.</li>
              </ul>
            </div>
          </div>
        )}
        {tab === "certificates" && <div className={`${cardClass} p-6 sm:p-8`}><CertificatesPanel request={request} /></div>}
        {tab === "workshops" && <div className={`${cardClass} p-6 sm:p-8`}><WorkshopsPanel request={request} storageKey={`ghc_workshop_popup_v2_${me.registrationId}`} onClaimed={setClaimedWorkshop} /></div>}
      </main>

      <nav aria-label="Dashboard" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#E4E8F1] bg-white pb-[env(safe-area-inset-bottom,0px)] lg:hidden">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => goTo(id)} className={`relative flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold ${tab === id ? "text-[#173B8F]" : "text-[#667085]"}`}>
            <Icon className="h-5 w-5" />
            {id === "qr" ? "QR Code" : label}
            {id === "workshops" && workshopBadge && <span aria-hidden="true" className="absolute right-[calc(50%-16px)] top-2 h-2 w-2 rounded-full bg-[#EC4899]" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
