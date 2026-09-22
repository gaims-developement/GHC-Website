import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLocation, Link } from "react-router-dom";
import { buildEventSchema, findSeoEntry, mergeSeoEntry, setPageSeo } from "./utils/seo";
import { apiUrl } from "./config/api";
import MobileRadialNav from "./components/MobileRadialNav";
import GlobeCanvas from "./components/GlobeCanvas";
import { createWorkshopSlug } from "./data/workshops";
import "./premium.css";
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  BrainCircuit,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Dna,
  Download,
  FileText,
  Globe2,
  HeartPulse,
  Hotel,
  Info,
  Leaf,
  Mail,
  MapPin,
  Menu,
  Microscope,
  Plane,
  Play,
  Share2,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Book,
  Bookmark,
  Settings,
  Trophy,
  Users,
  Ticket,
  Wrench,
  X,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AdminApp = lazy(() => import("./admin/AdminApp"));
const Spline = lazy(() => import("@splinetool/react-spline"));
const Venue = lazy(() => import("./pages/Venue"));
const Register = lazy(() => import("./pages/Register"));
const AbstractRegister = lazy(() => import("./pages/AbstractRegister"));
const AbstractRevision = lazy(() => import("./pages/AbstractRevision"));
const PartnershipPortal = lazy(() => import("./pages/PartnershipPortal"));
const WorkshopDetail = lazy(() => import("./pages/WorkshopDetail"));
const WorkshopRegister = lazy(() => import("./pages/WorkshopRegister"));
const GooglePayTest = lazy(() => import("./pages/GooglePayTest"));
import Footer from "./components/Footer";
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const DynamicForm = lazy(() => import("./pages/DynamicForm"));
const Nominations = lazy(() => import("./pages/Nominations"));
const BoardMeetingRegister = lazy(() => import("./pages/BoardMeetingRegister"));
const AnnualMeetingInvite = lazy(() => import("./pages/AnnualMeetingInvite"));
const Committees = lazy(() => import("./pages/Committees"));
const VisaApplication = lazy(() => import("./pages/VisaApplication"));
const AboutGHC = lazy(() => import("./pages/AboutGHC"));
import VisaCTA from "./components/VisaCTA";
const QRAttendance = lazy(() => import("./pages/QRAttendance"));

import { navLinks } from "./config/nav";

const impactCards = [
  { title: "Global Reach", text: "Policy • Research • Innovation", icon: Globe2 },
  { title: "Clinical Excellence", text: "Workshops • Skills • Practice", icon: Stethoscope },
  { title: "Research Ecosystem", text: "Abstracts • Posters • Publications", icon: Microscope },
  { title: "Collaboration", text: "Students • Experts • Institutions", icon: Users },
];

const tracks = [
  { title: "Panel Discussions", icon: Users, text: "Engage with thought leaders on critical healthcare topics and future directions." },
  { title: "Awards", icon: Trophy, text: "Honoring excellence and outstanding contributions in global healthcare." },
  { title: "Networking", icon: Globe2, text: "Connect with professionals, researchers, and students from around the world." },
  { title: "Keynote Sessions", icon: Sparkles, text: "Inspiring talks from renowned experts shaping the future of medicine." },
  { title: "CMEs", icon: Book, text: "Continuing Medical Education sessions to upgrade clinical knowledge." },
  { title: "Workshops", icon: Wrench, text: "Hands-on training and skill-building in specialized medical fields." },
];

const apiEndpoints = {
  speakers: "/api/speakers",
  workshops: "/api/workshops",
};

const publicMarketingSyncEndpoint = "/api/marketing/public/marketing-sync";

const mockSpeakers = [];

const mockWorkshops = [];


const defaultScheduleActivities = {
  day1: [],
  day2: [],
  day3: [],
};

const scheduleDays = [
  { key: "day1", title: "Conference Day 1", status: "November 22, 2026", subtitle: "Opening · Keynotes · Panels" },
  { key: "day2", title: "Conference Day 2", status: "November 23, 2026", subtitle: "Research · Workshops · Awards" },
  { key: "day3", title: "Conference Day 3", status: "November 24, 2026", subtitle: "Roundtables · Networking · Closing" },
];

const partnerGroups = {
  Sponsors: ["AAPI"],
  "Digital Partner": ["Clirnet"],
  "Medical Education": ["Uworld"],
};

const heroTitle = "Global Healthcare Conclave 2026";
const defaultHeroDescription = "Reimagining Healthcare Beyond Borders through policy, research, clinical excellence and responsible innovation.";
const defaultHeroButtonText = "Register Now";
const defaultHeroLink = "/register";
// If the globe model still appears small inside the fixed container, move the
// camera closer or scale the model up in the source Spline scene.
const splineGlobeScene = import.meta.env.VITE_SPLINE_GLOBE_SCENE || "https://prod.spline.design/hBZIW8l6bSsFsHvV/scene.splinecode";
const splineGlobeZoom = Number(import.meta.env.VITE_SPLINE_GLOBE_ZOOM || 6);

const wordReveal = {
  hidden: { y: "110%", clipPath: "inset(0 0 100% 0)" },
  visible: (index) => ({
    y: "0%",
    clipPath: "inset(0 0 0% 0)",
    transition: {
      delay: 0.1 + index * 0.085,
      duration: 0.85,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

function useMockResource(endpoint, mockData) {
  const [data] = useState(mockData);
  return { data, endpoint, status: "mock" };
}

function Navbar() {
  const [open, setOpen] = useState(false);

  const handleNavClick = (e, label, id) => {
    if (label !== "Register" && label !== "Nomination" && label !== "Committees" && label !== "Venue" && label !== "About") {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState({}, '', `/#${id}`);
      }
    }
    setOpen(false);
  };

  return (
    <header className="site-navbar fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <a href="/" className="flex items-center gap-3" aria-label="Global Healthcare Conclave home">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/20">
            <img src="/assets/logos/ghclogo.jpeg" alt="GHC Logo" className="h-full w-full object-cover" />
          </span>
          <span>
            <span className="block font-['Sora'] text-sm font-bold text-[#081B33]">GHC 2026</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks?.map(([label, id]) => (
            <a key={id} href={label === "Register" ? "/register" : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : label === "Venue" ? "/venue" : label === "About" ? "/about" : `/#${id}`} onClick={(e) => handleNavClick(e, label, id)} className="nav-link whitespace-nowrap">
              {label}
            </a>
          ))}
        </div>

        <a href="/register" className="hidden rounded-full bg-[#F5B942] px-5 py-2.5 font-['Sora'] text-sm font-bold text-[#081B33] shadow-lg shadow-amber-400/20 transition hover:-translate-y-0.5 hover:bg-white lg:inline-flex">
          Register
        </a>

        <button className="grid h-10 w-10 place-items-center rounded-full border border-[#0D47A1]/15 text-[#081B33] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mobile-menu mx-auto mt-3 max-w-7xl p-3 lg:hidden">
          {navLinks?.map(([label, id]) => (
            <a key={id} href={label === "Register" ? "/register" : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : label === "Venue" ? "/venue" : label === "About" ? "/about" : `/#${id}`} onClick={(e) => handleNavClick(e, label, id)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#081B33]/75 hover:bg-[#4FC3F7]/10 hover:text-[#0D47A1]">
              {label}
            </a>
          ))}
        </motion.div>
      )}
    </header>
  );
}

function ParticleField() {
  return (
    <div className="particle-field" aria-hidden="true">
      {Array.from({ length: 48 })?.map((_, index) => (
        <span key={index} style={{ "--i": index }} />
      ))}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="section-heading">
      <p className="section-kicker">{eyebrow}</p>
      <h2 className="section-title">{title}</h2>
      {text && <p className="section-copy">{text}</p>}
    </div>
  );
}

function PartnerCTAButton({ href, variant = "hero", children }) {
  const baseClass = variant === "hero" ? "hero-button-secondary" : "partner-marquee-cta";

  return (
    <a
      href={href}
      className={`${baseClass} partner-cta-button partner-cta-button--${variant}`}
    >
      <span className="partner-cta-button__content">{children}</span>
    </a>
  );
}

function SplineGlobe({ className = "" }) {
  const [failed, setFailed] = useState(false);
  const wrapperRef = useRef(null);
  const spinFrameRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return undefined;

    const hideSplineBadge = () => {
      wrapper.querySelectorAll("a, div, span").forEach((node) => {
        const label = `${node.textContent || ""} ${node.getAttribute("aria-label") || ""} ${node.getAttribute("title") || ""}`;
        const href = node.getAttribute("href") || "";
        if (/built\s+with\s+spline|spline\.design/i.test(`${label} ${href}`)) {
          node.style.display = "none";
          node.style.opacity = "0";
          node.style.pointerEvents = "none";
        }
      });
    };

    hideSplineBadge();
    const observer = new MutationObserver(hideSplineBadge);
    observer.observe(wrapper, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (spinFrameRef.current) cancelAnimationFrame(spinFrameRef.current);
  }, []);

  const startGlobeSpin = (spline) => {
    const objects = spline?.getAllObjects?.() || [];
    const spinTarget =
      objects.find((object) => /globe|earth|sphere|world/i.test(object.name || "") && object.rotation) ||
      objects.find((object) => object.rotation && /mesh|group|object/i.test(object.type || "")) ||
      objects.find((object) => object.rotation);

    if (!spinTarget?.rotation) return;

    const tick = () => {
      spinTarget.rotation.y += 0.0014;
      spline?.requestRender?.();
      spinFrameRef.current = requestAnimationFrame(tick);
    };

    if (spinFrameRef.current) cancelAnimationFrame(spinFrameRef.current);
    spinFrameRef.current = requestAnimationFrame(tick);
  };

  return (
    <div ref={wrapperRef} className={`spline-globe ${className}`}>
      {failed ? (
        <GlobeCanvas className="spline-globe-fallback" />
      ) : (
        <Suspense fallback={<div className="spline-globe-loader" />}>
          <Spline
            scene={splineGlobeScene}
            renderOnDemand={false}
            style={{ overflow: "visible" }}
            onLoad={(spline) => {
              spline?.setZoom?.(splineGlobeZoom);
              const camera = spline?._scene?.activeCamera || spline?._camera;
              if (camera?.zoom) {
                camera.zoom = Math.max(camera.zoom, splineGlobeZoom);
                camera.updateProjectionMatrix?.();
              }
              spline?.requestRender?.();
              spline?.setBackgroundColor?.("rgba(0,0,0,0)");
              spline?._renderer?.pipeline?.setWatermark?.(null);
              spline?.controls?.deactivate?.();
              spline?.eventManager?.deactivate?.();
              startGlobeSpin(spline);
            }}
            onError={() => setFailed(true)}
          />
        </Suspense>
      )}
    </div>
  );
}

function AnimatedTrackHeading({ onComplete }) {
  const title = "Key highlights of the conclave.";
  const words = title.split(" ");

  return (
    <motion.div
      className="section-heading track-animated-heading"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.55 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08 } },
      }}
      onAnimationComplete={() => onComplete?.()}
    >
      <motion.p
        className="section-kicker"
        variants={{
          hidden: { opacity: 0, y: 14 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
        }}
      >
        Highlights
      </motion.p>
      <h2 className="section-title" aria-label={title}>
        {words.map((word, index) => (
          <span className="track-heading-word-mask" key={`${word}-${index}`} aria-hidden="true">
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 42, rotateX: 18 },
                visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </h2>
      <motion.p
        className="section-copy"
        variants={{
          hidden: { opacity: 0, y: 18 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut", delay: 0.16 } },
        }}
      >
        Built for clinicians, researchers, students, policy thinkers and health technology leaders.
      </motion.p>
    </motion.div>
  );
}

function Hero({ banner }) {
  const heroDescription = banner?.subtitle || defaultHeroDescription;
  const heroButtonText = banner?.button_text || defaultHeroButtonText;
  const heroLink = banner?.button_link || defaultHeroLink;
  const [introActive, setIntroActive] = useState(false);
  const [abstractOpen, setAbstractOpen] = useState(true);

  useEffect(() => {
    axios.get(apiUrl("/api/settings/public"))
      .then(res => {
        if (res.data?.registration?.abstractSubmissionOpen !== undefined) {
          setAbstractOpen(res.data.registration.abstractSubmissionOpen);
        }
      })
      .catch(err => console.error("Failed to load public settings:", err));
  }, []);

  useEffect(() => {
    if (!introActive) return undefined;

    window.sessionStorage.setItem("ghcHeroIntroSeen", "true");
    const timer = window.setTimeout(() => setIntroActive(false), 2500);

    return () => window.clearTimeout(timer);
  }, [introActive]);

  const scrollToTrailer = (event) => {
    event.preventDefault();
    document.getElementById("watch-vision")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const finalDelay = introActive ? 2.12 : 0;
  const panelDelay = introActive ? 2.18 : 0;

  return (
    <section id="home" className="hero-section reveal-section">
      <AnimatePresence>
        {introActive && (
          <motion.div
            className="hero-intro"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.58, ease: [0.16, 1, 0.3, 1] } }}
          >
            <motion.div
              className="hero-intro-globe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] } }}
            >
              <SplineGlobe />
            </motion.div>
            <motion.h1
              className="hero-intro-title"
              layoutId="ghc-hero-title"
              initial={{ opacity: 0, y: 28, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{
                opacity: 0,
                x: "-19vw",
                y: "-4vh",
                scale: 0.74,
                filter: "blur(2px)",
                transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] },
              }}
            >
              GLOBAL HEALTHCARE
              <span>CONCLAVE</span>
              <span>2026</span>
            </motion.h1>
          </motion.div>
        )}
      </AnimatePresence>
      <ParticleField />
      <div className="blob blob-one parallax-layer" data-speed="-18" />
      <div className="blob blob-two parallax-layer" data-speed="14" />

      <div className="hero-mobile-shell mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-10 pt-32 md:px-8 lg:grid-cols-2 lg:pt-24">
        <div className="relative z-10">
          <motion.div className="flex gap-4 mb-6" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: finalDelay, duration: 0.7, ease: "easeOut" }}>
            <img src="/assets/logos/ghclogo.jpeg" alt="GHC Logo" className="h-16 md:h-20 w-auto rounded-xl shadow-lg bg-white p-1 object-contain" />
            <img src="/assets/logos/gaims.png" alt="GAIMS Logo" className="h-16 md:h-20 w-auto rounded-xl shadow-lg bg-white p-1 object-contain" />
            <img src="/assets/logos/aiimsstudentassociation.jpg" alt="AIIMS Student Association Logo" className="h-16 md:h-20 w-auto rounded-xl shadow-lg bg-white p-1 object-contain" />
          </motion.div>
          <motion.div className="hero-pill" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: finalDelay, duration: 0.7, ease: "easeOut" }}>
            <MapPin className="h-4 w-4 text-[#ff3b8b]" />
            New Delhi · November 22-24, 2026
          </motion.div>
          <motion.h1
            className="kinetic-title mt-7 font-['Sora'] text-5xl font-bold leading-[0.96] text-[#081B33] sm:text-6xl lg:text-7xl"
            aria-label={heroTitle}
            layoutId={introActive ? undefined : "ghc-hero-title"}
            initial={introActive ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay + 0.08, duration: 0.76, ease: [0.16, 1, 0.3, 1] }}
          >
            {heroTitle.split(" ")?.map((word, index) => (
              <span className="word-mask" key={`${word}-${index}`} aria-hidden="true">
                <motion.span custom={index} variants={wordReveal} initial="hidden" animate="visible">
                  {word}
                </motion.span>
              </span>
            ))}
          </motion.h1>
          <motion.div
            className="mt-4 text-base md:text-lg lg:text-xl font-bold uppercase tracking-widest text-white drop-shadow-md"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay + 0.25, duration: 0.75 }}
          >
            In collaboration with <span className="text-[#ff3b8b]">AIIMS Student Association</span>
          </motion.div>
          <motion.p className="mt-6 max-w-2xl text-xl leading-8 text-[#12385f]/78" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: finalDelay + 0.42, duration: 0.75 }}>
            {heroDescription}
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { delayChildren: finalDelay + 0.62, staggerChildren: 0.09 } } }}>
            {[
              <a href={heroLink} className="hero-button-primary">{heroButtonText} <ArrowRight className="h-4 w-4" /></a>,
              <PartnerCTAButton href="#partner-marquee" variant="hero">Become Partner <BadgeCheck className="h-4 w-4" /></PartnerCTAButton>,
              <a href="#watch-vision" className="hero-button-secondary" onClick={scrollToTrailer}>Watch Trailer <Play className="h-4 w-4" /></a>,
            ].map((button, index) => (
              <motion.span
                className="hero-action-item"
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 18, scale: 0.98 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {button}
              </motion.span>
            ))}
          </motion.div>

          <motion.div 
            className="mt-6 flex flex-col items-start gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/10"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay + 0.8, duration: 0.62 }}
          >
            <div className="flex items-center gap-2 text-sm font-semibold font-['DM_Sans']">
              <span className="relative flex h-3 w-3">
                {abstractOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${abstractOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <span className={abstractOpen ? 'text-emerald-400' : 'text-red-400'}>
                {abstractOpen ? 'Calls are currently open' : 'Calls are currently closed'}
              </span>
            </div>
            <a href="/abstract-registration" className={`hero-button-secondary border ${abstractOpen ? 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/10' : 'border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 opacity-80'}`}>
              Submit Abstract <FileText className="h-4 w-4" />
            </a>
          </motion.div>
        </div>

        <motion.div
          className="hero-globe-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: panelDelay, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <SplineGlobe className="hero-globe" />
        </motion.div>
      </div>

      <div className="hero-squiggle-divider" aria-hidden="true">
        <div className="hero-squiggle-glow" />
        <svg viewBox="0 0 1440 220" preserveAspectRatio="none" role="presentation">
          <defs>
            <linearGradient id="heroSquiggleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff1b78" />
              <stop offset="34%" stopColor="#ff8069" />
              <stop offset="54%" stopColor="#ffe08a" />
              <stop offset="74%" stopColor="#ff4d86" />
              <stop offset="100%" stopColor="#ba0fab" />
            </linearGradient>
          </defs>
          <path
            d="M0,120 C110,78 225,178 355,138 C500,94 610,198 755,150 C930,94 1035,180 1185,130 C1305,88 1388,158 1440,118 L1440,220 L0,220 Z"
            fill="url(#heroSquiggleGradient)"
          />
        </svg>
      </div>
    </section>
  );
}

function ParticipatingCountries() {
  const countries = [
    { name: "India", code: "in" },
    { name: "Georgia", code: "ge" },
    { name: "Mauritius", code: "mu" },
    { name: "Nepal", code: "np" },
    { name: "Moldova", code: "md" },
    { name: "Egypt", code: "eg" },
    { name: "Nigeria", code: "ng" },
    { name: "Uzbekistan", code: "uz" },
    { name: "United States", code: "us" },
    { name: "United Kingdom", code: "gb" },
  ];

  const doubledCountries = [...countries, ...countries];

  return (
    <section id="participating-countries" className="section-shell reveal-section relative overflow-hidden" style={{ paddingBottom: '4rem' }}>
      {/* Decorative background blobs */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-blue-100/50 rounded-full mix-blend-multiply filter blur-[60px] opacity-60 pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-cyan-100/50 rounded-full mix-blend-multiply filter blur-[60px] opacity-60 pointer-events-none" />
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-100/50 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 pointer-events-none" />

      <SectionHeading eyebrow="Global Reach" title="Participating Countries" text="Delegates, researchers, and policymakers from across the globe." />
      
      <div className="partner-marquee mt-14 relative z-10">
        <div className="partner-marquee-track">
          {doubledCountries.map((country, index) => (
            <div
              key={`${country.code}-${index}`}
              className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(13,71,161,0.12)] transition-all duration-500 overflow-hidden hover:border-[#0D47A1]/20 hover:-translate-y-2 w-[220px] shrink-0"
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#0D47A1]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 w-24 h-24 rounded-full border-[4px] border-white shadow-sm mb-6 overflow-hidden group-hover:shadow-md transition-all duration-500 group-hover:scale-110 ring-4 ring-transparent group-hover:ring-[#0D47A1]/5">
                <img 
                  src={`https://flagcdn.com/w160/${country.code}.png`} 
                  alt={`${country.name} flag`} 
                  className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-700 ease-out"
                  loading="lazy"
                />
              </div>
              
              <h3 className="font-['Sora'] font-bold text-[#081B33] text-center text-[15px] relative z-10 group-hover:text-[#0D47A1] transition-colors duration-300">
                {country.name}
              </h3>
              
              {/* Animated underline */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 h-1 w-0 bg-gradient-to-r from-[#0D47A1] to-[#00BCD4] rounded-full group-hover:w-10 transition-all duration-500 ease-out opacity-0 group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WatchVision() {
  const [trailer, setTrailer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    axios
      .get(apiUrl("/api/trailer"))
      .then((response) => {
        if (active) setTrailer(response.data.trailer || null);
      })
      .catch(() => {
        if (active) setError("Trailer is being prepared. Please check back soon.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const title = trailer?.title || "Watch the Vision";
  const description = trailer?.description || "Discover the vision behind Global Health Conclave and our mission to advance healthcare beyond boundaries.";
  const hasVideo = Boolean(trailer?.videoUrl);

  return (
    <section id="watch-vision" className="watch-vision-section section-shell reveal-section" style={{ paddingTop: '4rem' }}>
      <SectionHeading eyebrow="Featured Video" title={title} text={description} />

      <motion.div
        className="vision-video-card"
        initial={{ opacity: 0, y: 34 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.72, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.25 }}
      >
        {loading ? (
          <div className="vision-video-frame vision-video-fallback">Loading trailer...</div>
        ) : hasVideo ? (
          <div className="vision-video-frame">
            <video src={trailer.videoUrl} poster={trailer.thumbnailUrl || undefined} controls preload="metadata" />
          </div>
        ) : (
          <div className="vision-video-frame vision-video-fallback">
            <Play className="h-9 w-9" />
            <span>{error || "The Global Health Conclave trailer will be available soon."}</span>
          </div>
        )}
      </motion.div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section id="statistics" className="feature-section impact-strip reveal-section" aria-label="GHC impact areas">
      <div className="impact-scroll">
        {impactCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="impact-card"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, delay: index * 0.08 }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="impact-icon">
              <card.icon className="h-5 w-5" />
            </div>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="section-shell relative overflow-hidden reveal-section">
      <div className="absolute top-1/2 -right-32 -z-10 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-gradient-to-br from-[#E91E63]/20 to-[#4FC3F7]/20 blur-[120px]" aria-hidden="true" />
      
      <div className="asym-grid items-center gap-12 md:gap-16">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <SectionHeading eyebrow="About GHC" title="A healthcare forum designed for global coordination." />
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="group relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#E91E63] to-[#4FC3F7] opacity-20 blur transition duration-1000 group-hover:opacity-40" />
          <div className="glass-card relative p-8 md:p-10 shadow-2xl backdrop-blur-xl bg-[#081b33]/80 border border-white/10 rounded-2xl">
            <p className="font-['Inter'] text-lg leading-relaxed text-slate-200">
              Global Healthcare Conclave is the flagship global health initiative of GAIMS, bringing together healthcare professionals, researchers, students and innovators to build practical answers for tomorrow's health systems.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {["Clinical excellence", "Research exchange", "Policy leadership"]?.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-full border border-[#4FC3F7]/30 bg-[#4FC3F7]/10 px-4 py-2 font-['Sora'] text-sm font-semibold text-[#4FC3F7] transition hover:bg-[#4FC3F7]/20 hover:scale-105">
                  <Check className="h-4 w-4" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Mosaic() {
  return (
    <section className="section-shell reveal-section">
      <div className="mosaic-grid">
        <div className="mosaic-tile tile-large">
          <SectionHeading eyebrow="Conference Mosaic" title="One summit. Many connected rooms of healthcare leadership." text="The GHC experience moves from keynote strategy to workshops, research corridors, simulation labs and partner dialogue." />
        </div>
        {["Global policy forum", "Clinical innovation lab", "Research poster walk", "Student leadership circle"]?.map((item, index) => (
          <motion.div key={item} className="mosaic-tile" whileHover={{ y: -8, scale: 1.01 }}>
            <span>0{index + 1}</span>
            <h3>{item}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Tracks() {
  const [headingComplete, setHeadingComplete] = useState(false);

  return (
    <section id="tracks" className="track-pin-section">
      <div className="track-sticky-shell">
        <div className="section-shell track-heading-shell">
          <AnimatedTrackHeading onComplete={() => setHeadingComplete(true)} />
        </div>
        <motion.div
          className={headingComplete ? "track-viewport cards-unlocked" : "track-viewport"}
          initial="hidden"
          animate={headingComplete ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 36 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.div
            className="track-wrapper"
            initial="hidden"
            animate={headingComplete ? "visible" : "hidden"}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12, delayChildren: 0.14 } },
            }}
          >
            {tracks?.map((track, index) => {
              const Icon = track.icon;
              return (
                <motion.article
                  key={track.title}
                  className="track-card horizontal-track-card"
                  variants={{
                    hidden: { opacity: 0, y: 44, filter: "blur(10px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  whileHover={{ y: -10, rotateX: 4, rotateY: -4, scale: 1.02 }}
                >
                  <div className="track-card-index">0{index + 1}</div>
                  <div className="track-icon"><Icon className="h-6 w-6" /></div>
                  <h3>{track.title}</h3>
                  <p>{track.text}</p>
                </motion.article>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function SpeakerPhoto({ speaker, featured = false }) {
  if (!speaker) return null;
  const photoUrl = speaker?.photoUrl?.startsWith("/uploads") ? apiUrl(speaker.photoUrl) : speaker?.photoUrl;

  return (
    <div className={featured ? "speaker-photo speaker-photo-featured" : "speaker-photo"} data-photo={speaker.photo}>
      {photoUrl ? <img loading="lazy" src={photoUrl} alt="" /> : <span>{speaker.initials || speaker.name?.slice(0, 2).toUpperCase()}</span>}
    </div>
  );
}

function SpotlightCard({ children, className = "" }) {
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });

  return (
    <motion.article
      className={`spotlight-card ${className}`}
      style={{ "--spotlight-x": `${spotlight.x}%`, "--spotlight-y": `${spotlight.y}%` }}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setSpotlight({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
      whileHover={{ y: -10, scale: 1.02 }}
    >
      {children}
    </motion.article>
  );
}

function WorldClassSpeakers() {
  const { endpoint } = useMockResource(apiEndpoints.speakers, mockSpeakers);
  const [speakerData, setSpeakerData] = useState(mockSpeakers);

  useEffect(() => {
    axios.get(apiUrl("/api/speakers")).then((response) => {
      const speakers = response.data.speakers || [];
      if (speakers.length) {
        setSpeakerData(speakers.map((speaker) => ({
          ...speaker,
          initials: speaker.name?.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(),
        })));
      }
    }).catch(() => {});
  }, []);

  return (
    <section id="world-class-speakers" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="World Class Speakers" title="Keynotes and faculty shaping global care." />
      </div>
      <div className="w-full">
        {speakerData?.length > 0 ? (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {speakerData.map((speaker) => (
              <SpotlightCard key={speaker.name} className="glass-card p-6 flex flex-col items-center text-center">
                <SpeakerPhoto speaker={speaker} />
                <h3 className="mt-5 font-['Sora'] text-lg font-semibold text-white/90">{speaker.name}</h3>
                <p className="mt-1 text-sm font-medium text-[#4FC3F7]">{speaker.designation}</p>
                <p className="mt-4 text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-4 w-full">
                  {speaker.topic || speaker.institution || "Speaker Topic"}
                </p>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <div className="glass-card w-full p-10 text-center opacity-60 col-span-full">
            <h3 className="text-xl font-['Sora'] text-white">Speakers will be announced soon.</h3>
          </div>
        )}
      </div>

      <div className="mt-20">
        <SectionHeading eyebrow="Legacy" title="Past Speakers" text="Distinguished faculty and visionaries from our previous editions." />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[
            {
              name: "Dr Mukesh Bhatia",
              designation: "Founder, DBMCI",
              achievements: "Pioneer in PG Medical Entrance education. Mentored millions of medical students."
            },
            {
              name: "Dr Randeep Guleria",
              designation: "Former Director, AIIMS New Delhi",
              achievements: "Padma Shri Awardee. Lead architect of India's COVID-19 pandemic response."
            },
            {
              name: "Dr Minu Bajpai",
              designation: "Executive Director, NBE",
              achievements: "Renowned Paediatric Surgeon and academician. Former Head of Department at AIIMS."
            },
            {
              name: "Dr Rakesh Garg",
              designation: "Additional Professor, AIIMS New Delhi",
              achievements: "Expert in Anesthesiology, Pain Medicine and Critical Care. Over 200+ publications."
            },
            {
              name: "Dr Tanmay Motiwala",
              designation: "Paediatric Surgeon & Influencer",
              achievements: "Inspiring voice in the medical community with focus on surgical education."
            },
            {
              name: "Lt Gen Dr DP Vats",
              designation: "Former Director, AFMC Pune",
              achievements: "Rajya Sabha MP. Param Vishisht Seva Medal (PVSM) awardee. Eminent Ophthalmologist."
            },
            {
              name: "Dr Yogendra Malik",
              designation: "Former Advisor to CM, Haryana",
              achievements: "Eminent medical educationist and health policy maker."
            }
          ].map(speaker => (
            <SpotlightCard key={speaker.name} className="glass-card p-6 flex flex-col items-center text-center">
              <SpeakerPhoto speaker={{ ...speaker, initials: speaker.name.split(" ").slice(1, 3).map(n => n[0]).join("") }} />
              <h3 className="mt-5 font-['Sora'] text-lg font-semibold text-white/90">{speaker.name}</h3>
              <p className="mt-1 text-sm font-medium text-[#4FC3F7]">{speaker.designation}</p>
              <p className="mt-4 text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-4 w-full">
                {speaker.achievements}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkshopsExperience() {
  const { endpoint } = useMockResource(apiEndpoints.workshops, mockWorkshops);
  const [workshopData, setWorkshopData] = useState(mockWorkshops);

  useEffect(() => {
    axios.get(apiUrl("/api/workshops")).then((response) => {
      const workshops = response.data.workshops || [];
      if (workshops.length) {
        setWorkshopData(workshops.map((workshop) => ({
          ...workshop,
          slug: workshop.slug || createWorkshopSlug(workshop.title),
          remaining: Math.max(Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0), 0),
        })));
      }
    }).catch(() => setWorkshopData(mockWorkshops));
  }, []);

  return (
    <section id="workshops-experience" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <SectionHeading eyebrow="Workshops Experience" title="Premium clinical and research skill rooms." text="Each workshop is structured around capacity, faculty depth and delegate readiness." />
          <p className="workshop-swipe-hint">Swipe left to see all the workshops.</p>
        </div>
      </div>
      <div className="workshop-slider">
        {workshopData?.map((workshop) => {
          const slug = workshop.slug || createWorkshopSlug(workshop.title);
          return (
          <motion.article key={workshop.title} className="workshop-card" whileHover={{ y: -10, scale: 1.015 }}>
            <div className="workshop-card-image">
              {workshop.imageUrl ? <img loading="lazy" src={workshop.imageUrl.startsWith("/uploads") ? apiUrl(workshop.imageUrl) : workshop.imageUrl} alt="" /> : <ClipboardCheck className="h-10 w-10" />}
            </div>
            <div className="workshop-icon"><ClipboardCheck className="h-6 w-6" /></div>
            <h3>{workshop.title}</h3>
            <p>{workshop.faculty}</p>
            {workshop.description && <p>{workshop.description}</p>}
            <div className="workshop-meta">
              <span><Users className="h-4 w-4" />{workshop.capacity} capacity</span>
              <span><Clock3 className="h-4 w-4" />{workshop.duration}</span>
              <span><BadgeCheck className="h-4 w-4" />{workshop.remaining} seats left</span>
              {workshop.venue && <span><MapPin className="h-4 w-4" />{workshop.venue}</span>}
            </div>
            <div className="workshop-mobile-cta">
              <a href={`/workshops/${slug}`} className="ticket-button">View Details</a>
              <button type="button" aria-label={`Share ${workshop.title}`}><Share2 className="h-5 w-5" />Share</button>
              <button type="button" aria-label={`Save ${workshop.title}`}><Bookmark className="h-5 w-5" />Save</button>
            </div>
          </motion.article>
        );})}
      </div>
    </section>
  );
}

function AwardsSection() {
  const awards = [
    { title: "GAIMS Healthcare Achiever Awards", description: "Recognizing outstanding contributions and excellence in healthcare. Nominate deserving individuals for their remarkable impact.", icon: Award },
    { title: "GAIMS Position Holder Award", description: "Honoring the leadership, dedication, and service of GAIMS position holders across the country.", icon: Trophy },
  ];

  return (
    <section id="awards" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="GAIMS Healthcare Achiever Awards" title="Honoring Excellence." text="Celebrate the achievements of individuals and leaders making a profound impact. The award function will be held on the final day." />
      </div>
      <div className="research-action-grid">
        {awards.map((award) => {
          const Icon = award.icon;
          return (
            <motion.article key={award.title} className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
              <div className="track-icon"><Icon className="h-6 w-6" /></div>
              <h3>{award.title}</h3>
              <p>{award.description}</p>
              {award.title === "GAIMS Healthcare Achiever Awards" && (
                <div className="research-card-actions">
                  <Link to="/nominations" className="hero-button-primary">
                    Submit Nomination <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function GHCTimeline() {
  const [openCards, setOpenCards] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [editingDay, setEditingDay] = useState("day1");
  const [editingIndex, setEditingIndex] = useState(null);
  const [activityForm, setActivityForm] = useState({ time: "09:00", title: "", speaker_name: "", speaker_designation: "", category: "Keynote" });
  const [dayActivities, setDayActivities] = useState(defaultScheduleActivities);

  useEffect(() => {
    setIsAdmin(["true", "1", "yes"].includes(String(localStorage.getItem("isAdmin") || localStorage.getItem("ghc_is_admin")).toLowerCase()));
    const next = { ...defaultScheduleActivities };
    scheduleDays.forEach((day) => {
      const stored = localStorage.getItem(`ghc_schedule_${day.key}`);
      if (stored) {
        try {
          next[day.key] = JSON.parse(stored);
        } catch {
          next[day.key] = defaultScheduleActivities[day.key] || [];
        }
      }
    });
    setDayActivities(next);
  }, []);

  const saveDay = (dayKey, activities) => {
    setDayActivities((current) => ({ ...current, [dayKey]: activities }));
    localStorage.setItem(`ghc_schedule_${dayKey}`, JSON.stringify(activities));
  };

  const resetActivityForm = () => {
    setActivityForm({ time: "09:00", title: "", speaker_name: "", speaker_designation: "", category: "Keynote" });
    setEditingIndex(null);
  };

  const submitActivity = (event) => {
    event.preventDefault();
    const activities = [...(dayActivities[editingDay] || [])];
    if (editingIndex === null) activities.push(activityForm);
    else activities[editingIndex] = activityForm;
    saveDay(editingDay, activities);
    resetActivityForm();
  };

  const editActivity = (dayKey, index) => {
    setEditingDay(dayKey);
    setEditingIndex(index);
    setActivityForm(dayActivities[dayKey][index]);
    setAdminOpen(true);
  };

  const deleteActivity = (dayKey, index) => {
    saveDay(dayKey, (dayActivities[dayKey] || []).filter((_, itemIndex) => itemIndex !== index));
    resetActivityForm();
  };

  const phases = [
    {
      key: "registration",
      title: "Registration Open",
      subtitle: "Announcing soon",
      status: "Announcing Soon",
      statusType: "soon",
      icon: CalendarDays,
      content: <RegistrationOpenContent />,
    },
    {
      key: "abstract",
      title: "Abstract Submission",
      subtitle: "How to submit",
      status: "Announcing Soon",
      statusType: "soon",
      icon: FileText,
      content: <AbstractSubmissionContent />,
    },
    {
      key: "workshop-registration",
      title: "Workshop Registration",
      subtitle: "How to register",
      status: "Announcing Soon",
      statusType: "soon",
      icon: Wrench,
      content: <WorkshopRegistrationContent />,
    },
    ...scheduleDays.map((day) => ({
      key: day.key,
      title: day.title,
      subtitle: day.subtitle,
      status: day.status,
      statusType: day.status.toLowerCase().includes("announced") ? "soon" : "confirmed",
      icon: CalendarDays,
      content: <ConferenceDayTimeline activities={dayActivities[day.key] || []} onEdit={(index) => editActivity(day.key, index)} onDelete={(index) => deleteActivity(day.key, index)} isAdmin={isAdmin} />,
    })),
  ];

  return (
    <section id="ghc-timeline" className="schedule-section section-shell reveal-section">
      <div className="schedule-heading">
        <div>
          <h2>Schedule</h2>
          <p>Global Healthcare Conclave 2026</p>
        </div>
        <div className="schedule-heading-actions">
          <span>New Delhi</span>
          {isAdmin && (
            <button type="button" aria-label="Open schedule admin" onClick={() => setAdminOpen(true)}>
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="schedule-card-stack">
        {phases.map((phase) => (
          <SchedulePhaseCard
            key={phase.key}
            phase={phase}
            open={Boolean(openCards[phase.key])}
            onToggle={() => setOpenCards((current) => ({ ...current, [phase.key]: !current[phase.key] }))}
          />
        ))}
      </div>
      {adminOpen && (
        <ScheduleAdminPanel
          activityForm={activityForm}
          dayActivities={dayActivities}
          editingDay={editingDay}
          editingIndex={editingIndex}
          onChangeForm={setActivityForm}
          onClose={() => setAdminOpen(false)}
          onDelete={deleteActivity}
          onEdit={editActivity}
          onReset={resetActivityForm}
          onSetDay={setEditingDay}
          onSubmit={submitActivity}
        />
      )}
    </section>
  );
}

function SchedulePhaseCard({ phase, open, onToggle }) {
  const contentRef = useRef(null);
  const Icon = phase.icon;

  return (
    <motion.article className={`schedule-phase-card${open ? " open" : ""}`} whileTap={{ scale: 0.995 }}>
      <button type="button" className="schedule-phase-header" onClick={onToggle} aria-expanded={open}>
        <span className="schedule-phase-title-wrap">
          <span className="schedule-phase-icon"><Icon className="h-5 w-5" /></span>
          <span>
            <strong>{phase.title}</strong>
            <small>{phase.subtitle}</small>
          </span>
        </span>
        <span className="schedule-phase-meta">
          <span className={`schedule-status ${phase.statusType}`}>{phase.status}</span>
          <ChevronRight className="schedule-chevron h-5 w-5" />
        </span>
      </button>
      <div className="schedule-expand" style={{ maxHeight: open ? `${contentRef.current?.scrollHeight || 0}px` : 0 }}>
        <div ref={contentRef} className="schedule-expanded-inner">
          {phase.content}
        </div>
      </div>
    </motion.article>
  );
}

function RegistrationOpenContent() {
  return (
    <div className="schedule-message">
      <p>Registration dates will be announced soon. Enable notifications to be the first to know.</p>
      <button type="button" className="schedule-ghost-button"><Bell className="h-4 w-4" />Notify Me</button>
    </div>
  );
}

function AbstractSubmissionContent() {
  const steps = [
    ["Create your account on the portal", "Set up your GHC profile before starting a submission."],
    ["Choose your submission category", "Select poster or oral presentation based on your research format."],
    ["Upload abstract", "Attach a PDF abstract, max 300 words."],
    ["Peer review process", "Academic review usually takes 7-10 days."],
    ["Acceptance notification via email", "Selected authors receive next steps in their inbox."],
  ];

  return (
    <div className="schedule-flow">
      {steps.map(([title, description], index) => (
        <div className="schedule-flow-row" key={title}>
          <div className="schedule-flow-marker">
            <span>{index + 1}</span>
            {index < steps.length - 1 && <i />}
          </div>
          <div>
            <h4>{title}</h4>
            <p>{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkshopRegistrationContent() {
  const steps = [
    ["Workshop schedule announced", "Available workshops, seats and faculty details will be published once dates are finalized."],
    ["Choose your preferred workshop", "Review the topic, facilitator, duration, requirements and seat availability."],
    ["Register or sign in", "Use your delegate profile so the workshop can be linked to your GHC pass."],
    ["Select session and confirm seat", "Pick the available AM or PM session and review any workshop-specific prerequisites."],
    ["Complete payment and receive confirmation", "Pay securely and receive your workshop confirmation email with access details."],
  ];

  return (
    <div className="workshop-registration-flowchart">
      <p className="workshop-flow-intro">Workshop registration will open after the programme is announced. The flow below shows how delegates will reserve seats.</p>
      <div className="schedule-flow">
        {steps.map(([title, description], index) => (
          <div className="schedule-flow-row" key={title}>
            <div className="schedule-flow-marker">
              <span>{index + 1}</span>
              {index < steps.length - 1 && <i />}
            </div>
            <div>
              <h4>{title}</h4>
              <p>{description}</p>
              {index === 3 && <span className="session-tabs"><b>AM</b><b>PM</b></span>}
              {index === 4 && <span className="payment-icons"><CreditCard /><BadgeCheck /><ShieldCheck /></span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ConferenceDayTimeline({ activities, isAdmin, onEdit, onDelete }) {
  if (!activities.length) return <p className="schedule-empty">Activities will be added soon.</p>;

  return (
    <div className="conference-activity-list">
      {activities.map((activity, index) => (
        <div className={`conference-activity category-${activity.category.toLowerCase()}`} key={`${activity.time}-${activity.title}-${index}`}>
          <time>{formatScheduleTime(activity.time)}</time>
          <h4>{activity.title}</h4>
          <p>{activity.speaker_name} · {activity.speaker_designation}</p>
          <span>{activity.category}</span>
          {isAdmin && (
            <div className="activity-admin-actions">
              <button type="button" onClick={() => onEdit(index)}>Edit</button>
              <button type="button" onClick={() => onDelete(index)}>Delete</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ScheduleAdminPanel({ activityForm, dayActivities, editingDay, editingIndex, onChangeForm, onClose, onDelete, onEdit, onReset, onSetDay, onSubmit }) {
  const update = (event) => {
    const { name, value } = event.target;
    onChangeForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <div className="schedule-admin-overlay">
      <div className="schedule-admin-panel">
        <div className="schedule-admin-header">
          <div>
            <span className="section-kicker">Admin Schedule</span>
            <h3>{editingIndex === null ? "Add activity" : "Edit activity"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close schedule admin"><X className="h-5 w-5" /></button>
        </div>
        <form className="schedule-admin-form" onSubmit={onSubmit}>
          <label>Conference day<select value={editingDay} onChange={(event) => { onSetDay(event.target.value); onReset(); }}><option value="day1">Day 1</option><option value="day2">Day 2</option><option value="day3">Day 3</option></select></label>
          <label>Time<input type="time" name="time" value={activityForm.time} onChange={update} required /></label>
          <label>Title<input name="title" value={activityForm.title} onChange={update} required /></label>
          <label>Speaker name<input name="speaker_name" value={activityForm.speaker_name} onChange={update} required /></label>
          <label>Speaker designation<input name="speaker_designation" value={activityForm.speaker_designation} onChange={update} required /></label>
          <label>Category<select name="category" value={activityForm.category} onChange={update}><option>Keynote</option><option>Panel</option><option>Workshop</option><option>Break</option><option>Networking</option></select></label>
          <div className="schedule-admin-buttons">
            <button type="submit">{editingIndex === null ? "Add Activity" : "Save Activity"}</button>
            <button type="button" onClick={onReset}>Clear</button>
          </div>
        </form>
        <div className="schedule-admin-list">
          {(dayActivities[editingDay] || []).map((activity, index) => (
            <div key={`${activity.time}-${activity.title}`}>
              <span>{formatScheduleTime(activity.time)} · {activity.title}</span>
              <div>
                <button type="button" onClick={() => onEdit(editingDay, index)}>Edit</button>
                <button type="button" onClick={() => onDelete(editingDay, index)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const formatScheduleTime = (time) => {
  const [hours = "0", minutes = "00"] = String(time).split(":");
  const hour = Number(hours);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, "0")}:${minutes} ${suffix}`;
};

function ResearchHub() {
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  return (
    <section id="research-hub" className="section-shell reveal-section relative">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Call for Abstract" title="Submit your research and present it to a global audience at GHC" />
        <div className="flex flex-wrap gap-3">
          <a href="/abstract-registration" className="hero-button-primary">Submit Abstract <ArrowRight className="h-4 w-4" /></a>
        </div>
      </div>
      <div className="research-action-grid">
        <motion.article id="research-guidelines" className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
          <div className="track-icon"><ClipboardCheck className="h-6 w-6" /></div>
          <h3>Research Submission Guidelines</h3>
          <div className="research-guideline-list">
            <span>Poster submission rules</span>
            <span>Oral presentation rules</span>
            <span>Abstract requirements</span>
            <span>Ethics</span>
            <span>Formats</span>
          </div>
          <div className="research-card-actions mt-4">
            <button onClick={() => setGuidelinesOpen(true)} className="hero-button-secondary">View Guidelines <FileText className="h-4 w-4" /></button>
          </div>
          <div className="card-hover-border"></div>
        </motion.article>
        <motion.article className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
          <div className="track-icon"><Microscope className="h-6 w-6" /></div>
          <h3>Submit Research</h3>
          <p>Open the structured submission flow for personal details, institution, category, title, authors, abstract and PDF upload.</p>
          <a href="/abstract-registration" className="hero-button-primary research-card-submit">Submit Abstract <ArrowRight className="h-4 w-4" /></a>
        </motion.article>
      </div>

      <AnimatePresence>
        {guidelinesOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-left">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setGuidelinesOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d2a4a] border border-white/10 rounded-3xl shadow-2xl flex flex-col z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex-none p-6 md:p-8 border-b border-white/10 relative">
                <h2 className="text-2xl md:text-3xl font-bold text-white pr-10 font-['Sora']">Research Submission Guidelines</h2>
                <button
                  onClick={() => setGuidelinesOpen(false)}
                  className="absolute top-1/2 -translate-y-1/2 right-6 z-20 w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-[#081B33] shadow-sm transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div data-lenis-prevent="true" className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-6 md:p-8 space-y-6 text-white/80 leading-relaxed text-sm md:text-base w-full font-['DM_Sans']">
                <div className="bg-[#ff3d7f]/10 border border-[#ff3d7f]/20 rounded-2xl p-6">
                  <p className="font-bold text-[#ff3d7f] text-lg mb-2 flex items-center gap-2"><Info className="w-5 h-5"/> Important Note</p>
                  <p>Last date for Submission: <strong>30th October , 2026.</strong></p>
                  <ul className="list-disc list-inside mt-4 space-y-2">
                    <li>The file must be in <strong>PDF or DOCX</strong> format and not more than <strong>10 MB</strong> in size.</li>
                    <li>All data entered must be accurate and verified.</li>
                    <li>Abstracts may include tables and references.</li>
                    <li>Word Limit: <strong>350–400 words</strong>.</li>
                    <li>No AI-generated content. Plagiarism up to 10% allowed. (We will use a standardized tool to screen).</li>
                    <li>If you are the presenting author, you can submit <strong>only one poster</strong> for presentation. You cannot be the presenting author on more than one submission. You may still be a co-author on other submissions — but you can present only one.</li>
                    <li>Cash prize and Certificate of presentation will <strong>only be given to presenting author</strong>.</li>
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-xl text-white mb-4 border-b border-white/10 pb-2">Research Abstract Format</h3>
                    <ul className="space-y-1 opacity-80">
                      <li>1. TITLE</li>
                      <li>2. AUTHOR & CO-AUTHOR DETAILS</li>
                      <li>3. INTRODUCTION</li>
                      <li>4. AIMS & OBJECTIVES</li>
                      <li>5. METHODOLOGY</li>
                      <li>6. RESULTS</li>
                      <li>7. CONCLUSION</li>
                      <li>8. KEYWORDS</li>
                      <li>9. References (Optional)</li>
                      <li>10. Tables (Optional)</li>
                    </ul>
                  </div>
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                    <h3 className="font-bold text-xl text-white mb-4 border-b border-white/10 pb-2">Case Abstract Format</h3>
                    <ul className="space-y-1 opacity-80">
                      <li>1. TITLE</li>
                      <li>2. INTRODUCTION</li>
                      <li>3. AUTHOR & CO-AUTHOR DETAILS</li>
                      <li>4. CASE DESCRIPTION</li>
                    </ul>
                    <p className="mt-4 text-xs opacity-60 italic">Note: The Case Description should include History, Examination, Investigations, Diagnosis, Treatment, and Follow-up presented together under the single CASE DESCRIPTION heading.</p>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div>
                    <h3 className="font-bold text-blue-400 text-lg mb-2">Declaration Form</h3>
                    <p className="text-sm">Please download, sign, and submit the declaration form along with your abstract.</p>
                  </div>
                  <a href="/assets/forms/GHC%20Poster%20Presenter%20Declaration%20Form%201.docx" download className="inline-flex items-center gap-2 whitespace-nowrap px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors">
                    <Download className="w-4 h-4" /> Download Form
                  </a>
                </div>

                <div className="bg-[#ff3d7f]/10 border border-[#ff3d7f]/20 rounded-2xl p-6 mt-6">
                  <h3 className="font-bold text-[#ff3d7f] text-lg mb-4">For Queries, Contact:</h3>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <span className="font-bold text-white w-32">Email:</span>
                      <a href="mailto:ghcscientific@gmail.com" className="hover:text-[#ff3d7f] transition-colors">ghcscientific@gmail.com</a>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-bold text-white w-32">Girik Subbudhi:</span>
                      <a href="tel:+918169011833" className="hover:text-[#ff3d7f] transition-colors">+91 8169011833</a>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-bold text-white w-32">Guarav Jayadev:</span>
                      <a href="tel:+917022408203" className="hover:text-[#ff3d7f] transition-colors">+91 7022408203</a>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="font-bold text-white w-32">Prakhar Bhajpai:</span>
                      <a href="tel:+919758523839" className="hover:text-[#ff3d7f] transition-colors">+91 97585 23839</a>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function PanelDiscussionSection() {
  const panels = [
    { title: "HPV and Cervical Cancer", icon: HeartPulse, description: "Discussing prevention, early detection, and the latest treatment protocols." },
    { title: "Stem Cell", icon: Dna, description: "Exploring regenerative medicine and ethical frontiers in stem cell research." },
    { title: "Medical Education", icon: ClipboardCheck, description: "Navigating the evolving landscape for medical students." },
    { title: "AI in Healthcare", icon: BrainCircuit, description: "Leveraging artificial intelligence for clinical decision support and automation." },
  ];

  return (
    <section id="panel-discussion" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Expert Forums" title="Panel Discussions." text="Engage with thought leaders on critical healthcare topics and future directions." />
      </div>
      <div className="research-action-grid">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <motion.article key={panel.title} className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
              <div className="track-icon"><Icon className="h-6 w-6" /></div>
              <h3>{panel.title}</h3>
              <p>{panel.description}</p>
              {panel.title === "Medical Education" && (
                <div className="research-guideline-list mt-4">
                  <span>Undergraduate (UG)</span>
                  <span>Postgraduate (PG)</span>
                  <span>Foreign Medical Graduates (FMG)</span>
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

function VenueSection() {
  const info = [
    { icon: MapPin, title: "Location", text: "Tentative Le meridian new delhi, tentative AIIMS Delhi" },
    { icon: Plane, title: "Travel", text: "Airport transfer guidance and city arrival desk" },
    { icon: Hotel, title: "Accommodation", text: "Curated delegate hotel blocks near the venue" },
    { icon: BadgeCheck, title: "Delegate Info", text: "On-site help desk, badges, lunch and workshop routing" },
  ];

  return (
    <section id="venue" className="section-shell reveal-section">
      <div className="venue-grid">
        <div className="venue-visual">
          <div className="venue-media">
            <span>GHC Venue Experience</span>
          </div>
          <div className="map-placeholder">
            <MapPin className="h-7 w-7" />
            Embedded map placeholder
          </div>
        </div>
        <div className="venue-content">
          <SectionHeading eyebrow="Venue" title="Designed for a seamless delegate journey." text="A premium campus-style conference environment with guided movement between keynotes, workshops, research showcases and partner rooms." />
          <div className="venue-info-grid">
            {info?.map((item) => {
              const Icon = item.icon;
              return (
                <div className="venue-info-card" key={item.title}>
                  <Icon className="h-5 w-5" />
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerMarquee({ partners = [] }) {
  const hasPartnerApiData = Array.isArray(partners) && partners.length > 0;
  const marqueeItems = hasPartnerApiData
    ? partners.map((partner) => ({
        id: partner.id,
        category: partner.tier || "Partner",
        name: partner.name,
        type: "logo",
        logo: partner.logo,
        website: partner.website,
      }))
    : Object.entries(partnerGroups).flatMap(([category, names]) => names.map((name) => ({ category, name, type: "logo" })));

  return (
    <section id="sponsors" className="partner-marquee-section reveal-section py-16">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading eyebrow="Sponsors" title="Our Sponsors" text="Academic, NGO, media and sponsor partners." />
          <PartnerCTAButton href="/partnership" variant="section">
            Become a Partner <ArrowRight className="h-3 w-3" />
          </PartnerCTAButton>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {marqueeItems?.map((item, index) => {
            const logoUrl = item.logo?.startsWith("/uploads") ? apiUrl(item.logo) : item.logo;
            const partnerKey = item.id ? `partner-${item.id}-${index}` : `${item.category}-${item.name}-${index}`;

            return (
              <div
                className="group relative flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_15px_30px_-5px_rgba(79,195,247,0.3)] hover:-translate-y-2 transition-all duration-400 overflow-hidden cursor-default"
                key={partnerKey}
                style={{ minHeight: "180px" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D47A1]/5 to-[#4FC3F7]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 mb-5 text-[11px] font-bold uppercase tracking-widest text-[#0D47A1] bg-[#0D47A1]/10 px-3 py-1 rounded-full">{item.category}</span>
                {logoUrl ? <img src={logoUrl} alt={item.name} className="relative z-10 max-h-16 w-auto object-contain group-hover:scale-110 transition-transform duration-500 ease-out" /> : <div className="relative z-10 text-center font-['Sora'] font-bold text-lg md:text-xl text-[#081B33] px-2">{item.name}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PastOrganisations() {
  return (
    <section id="past-organisations" className="section-shell reveal-section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading eyebrow="Partnerships" title="Our Past Collaborating Organisations" />
        <div className="mt-8 flex flex-nowrap justify-center gap-6 overflow-x-auto">
          {[
            { name: "FAIMA", logo: "/assets/logos/faima.jpg" },
            { name: "AFPI", logo: "/assets/logos/afpi.png" },
            { name: "IRCF", logo: "/assets/logos/ircf.jpg" },
            { name: "AEME", logo: "/assets/logos/aeme.jpg" },
            { name: "GJMS", logo: "/assets/logos/GJMS logo.png" },
            { name: "SMR", logo: null }
          ].map(org => (
            <SpotlightCard key={org.name} className="glass-card p-6 flex flex-col items-center justify-center text-center w-[140px] h-[140px] shrink-0 rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4 overflow-hidden">
                {org.logo ? (
                  <img src={org.logo} alt={org.name} className="w-full h-full object-contain bg-white p-1" />
                ) : (
                  <Globe2 className="h-8 w-8 text-[#4FC3F7]" />
                )}
              </div>
              <h3 className="font-['Sora'] text-sm font-semibold text-white/90">{org.name}</h3>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const tiers = [
    { name: "GAIMS Elite Member", early: "₹1,500", late: "₹2,500" },
    { name: "Non-Member", early: "₹2,000", late: "₹3,000" },
  ];

  return (
    <section id="pricing" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Registration Fees" title="Conference Passes." text="Secure your delegate pass for the Global Healthcare Conclave 2026." />
      </div>
      
      <div className="research-action-grid">
        <motion.article className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
          <div className="track-icon"><Ticket className="h-6 w-6" /></div>
          <h3>Early Bird Registration</h3>
          <p>Last date for early registration: <strong>October 5th</strong></p>
          <div className="research-guideline-list mt-4">
            {tiers.map(t => (
              <span key={t.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                {t.name} <strong>{t.early}</strong>
              </span>
            ))}
          </div>
        </motion.article>

        <motion.article className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
          <div className="track-icon"><Clock3 className="h-6 w-6" /></div>
          <h3>Registration</h3>
          <p>Last date for registration: <strong>Mid November</strong></p>
          <div className="research-guideline-list mt-4">
            {tiers.map(t => (
              <span key={t.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                {t.name} <strong>{t.late}</strong>
              </span>
            ))}
          </div>
        </motion.article>
      </div>
      
      <div className="mt-10 flex justify-center">
        <a href="https://portal.gaims.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0D47A1] px-8 py-4 font-['Sora'] text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition-transform hover:-translate-y-1 hover:bg-[#081B33]">
          Join GAIMS - ₹999 only <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </section>
  );
}

function RegistrationCTA() {
  return (
    <section id="registration-cta" className="section-shell reveal-section">
      <div className="registration-cta">
        <div>
          <p className="section-kicker">Registration</p>
          <h2>Become a Delegate</h2>
          <p>Join healthcare leaders, researchers, students and innovators for the flagship GAIMS global health summit.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="/register" className="hero-button-primary">Register Now <ArrowRight className="h-4 w-4" /></a>
            <a href="/abstract-registration" className="hero-button-secondary">Submit Abstract <FileText className="h-4 w-4" /></a>
            <PartnerCTAButton href="#partner-marquee" variant="hero">Become Partner <Award className="h-4 w-4" /></PartnerCTAButton>
          </div>
        </div>
        <div className="cta-floating-cards">
          {["Delegate Pass", "Research Track", "Partner Circle"]?.map((item, index) => (
            <motion.div key={item} className="cta-float-card" animate={{ y: [0, -10, 0] }} transition={{ duration: 4 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}>
              <span>0{index + 1}</span>
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const routeSeoDefaults = {
  home: {
    title: "Global Healthcare Conclave 2026",
    description: "Global Healthcare Conclave 2026 (GHC 2026) by GAIMS in New Delhi — healthcare leadership, research, hands-on workshops, world-class speakers and delegate registration.",
    keywords: "Global Healthcare Conclave 2026, GHC 2026, GAIMS conference, healthcare conference New Delhi, medical conference India, research abstracts, healthcare workshops",
    path: "/",
    event: true,
  },
  register: {
    title: "Register — Global Healthcare Conclave 2026",
    description: "Register and pay securely for the Global Healthcare Conclave 2026. Delegate passes, research track and workshops with online ticket checkout.",
    keywords: "GHC 2026 registration, Global Healthcare Conclave register, delegate pass, conference ticket, healthcare conclave New Delhi",
    path: "/register",
    event: true,
  },
  "abstract-registration": {
    title: "Submit an Abstract — Global Healthcare Conclave 2026",
    description: "Submit a research abstract for presentation at the Global Healthcare Conclave 2026 and join the GHC research ecosystem.",
    keywords: "abstract submission, research abstract, GHC 2026 research, poster presentation, healthcare research conference",
    path: "/abstract-registration",
    event: true,
  },
  "abstract-revision": {
    title: "Revise Abstract — Global Healthcare Conclave 2026",
    description: "Review and update your submitted abstract for the Global Healthcare Conclave 2026 research program.",
    keywords: "abstract revision, GHC 2026 abstract, research update, poster revision",
    path: "/abstract-revision",
    event: true,
  },
  nominations: {
    title: "GHC Awards Nominations — Global Healthcare Conclave 2026",
    description: "Nominate outstanding healthcare professionals, educators, researchers and leaders for the GHC Awards 2026.",
    keywords: "GHC awards, healthcare achiever award, medical leadership award, nominations, GAIMS awards",
    path: "/nominations",
    event: true,
  },
  committees: {
    title: "Committees — Global Healthcare Conclave 2026",
    description: "Meet the organizing committees behind the Global Healthcare Conclave 2026 by GAIMS.",
    keywords: "GHC committees, organizing committee, GAIMS, conclave team, advisory board",
    path: "/committees",
    event: true,
  },
  venue: {
    title: "Venue & Travel — Global Healthcare Conclave 2026",
    description: "Venue, transport and travel guide for the Global Healthcare Conclave 2026 at AIIMS, New Delhi — including local attractions and metro directions.",
    keywords: "GHC 2026 venue, AIIMS New Delhi, conclave location, travel guide New Delhi, metro directions",
    path: "/venue",
    event: true,
  },
  about: {
    title: "About — Global Healthcare Conclave 2026",
    description: "About the Global Healthcare Conclave 2026 — GAIMS' flagship global healthcare summit in New Delhi, built for clinicians, researchers, students and policy leaders.",
    keywords: "about GHC 2026, Global Healthcare Conclave, GAIMS, healthcare summit, mission",
    path: "/about",
    event: true,
  },
  "visa-application": {
    title: "Visa Application — Global Healthcare Conclave 2026",
    description: "Apply for a visa invitation letter for international delegates attending the Global Healthcare Conclave 2026 in India.",
    keywords: "GHC 2026 visa, visa invitation letter, international delegates, travel to India",
    path: "/visa-application",
    event: true,
  },
  "board-meeting-register": {
    title: "Board Meeting Registration — Global Healthcare Conclave 2026",
    description: "Register for the GAIMS board meeting hosted during the Global Healthcare Conclave 2026.",
    keywords: "GAIMS board meeting, board registration, GHC 2026 board",
    path: "/board-meeting-register",
    event: true,
  },
  "annual-meeting-invite": {
    title: "Annual Meeting Invite — Global Healthcare Conclave 2026",
    description: "Join the GAIMS annual meeting at the Global Healthcare Conclave 2026 in New Delhi, India.",
    keywords: "GAIMS annual meeting, GHC 2026 annual meeting, New Delhi invite",
    path: "/annual-meeting-invite",
    event: true,
  },
  partnership: {
    title: "Partnership — Global Healthcare Conclave 2026",
    description: "Partner with the Global Healthcare Conclave 2026 and reach a global healthcare audience of clinicians, researchers, students and institutions.",
    keywords: "GHC 2026 partnership, sponsor healthcare conference, media partner, exhibitor, GAIMS partners",
    path: "/partnership",
    event: true,
  },
  "verify-certificate": {
    title: "Verify Certificate — Global Healthcare Conclave 2026",
    description: "Verify the authenticity of a Global Healthcare Conclave participant certificate using its unique code.",
    keywords: "GHC certificate verification, verify certificate, GHC 2026 certificate",
    path: "/verify-certificate",
    noindex: true,
  },
  "workshop-detail": {
    title: "Workshop — Global Healthcare Conclave 2026",
    description: "Explore workshop details — faculty, capacity, outcomes and registration for the Global Healthcare Conclave 2026.",
    keywords: "GHC 2026 workshops, medical skills workshop, clinical workshop New Delhi",
    path: "/workshops/",
    event: true,
  },
  "workshop-registration": {
    title: "Workshop Registration — Global Healthcare Conclave 2026",
    description: "Register for a specialized workshop at the Global Healthcare Conclave 2026.",
    keywords: "workshop registration, GHC 2026 workshop booking, skills training",
    path: "/register/workshop/",
    event: true,
  },
  "dynamic-form": {
    title: "GHC Form — Global Healthcare Conclave 2026",
    description: "GHC 2026 form.",
    path: "/forms/",
    noindex: true,
  },
  "google-pay-test": {
    title: "Test Payment — Global Healthcare Conclave 2026",
    description: "Test payment flow for GHC 2026.",
    path: "/google-pay-test",
    noindex: true,
  },
  admin: {
    title: "Admin — Global Healthcare Conclave 2026",
    description: "Global Healthcare Conclave 2026 admin workspace.",
    path: "/admin",
    noindex: true,
  },
};

const routeSeoPageKeys = {
  register: ["register", "registration", "checkout"],
  "abstract-registration": ["abstract", "abstract-registration", "submit-abstract", "research"],
  "abstract-revision": ["abstract-revision"],
  nominations: ["nominations", "awards", "nomination"],
  committees: ["committees", "committee"],
  venue: ["venue", "location", "travel"],
  about: ["about", "about-ghc"],
  "visa-application": ["visa", "visa-application"],
  "board-meeting-register": ["board-meeting", "board-meeting-register"],
  "annual-meeting-invite": ["annual-meeting", "annual-meeting-invite"],
  partnership: ["partnership", "partner", "sponsorship"],
  "verify-certificate": ["verify-certificate", "certificate"],
  "workshop-detail": ["workshop", "workshop-detail", "workshops"],
  "workshop-registration": ["workshop-registration", "workshop-register"],
  "dynamic-form": ["form", "dynamic-form"],
  "google-pay-test": ["google-pay-test"],
  admin: ["admin", "cms", "dashboard"],
};

const homeSeoSynonyms = ["home", "homepage", "default", "index"];

function App() {
  const appRef = useRef(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isWorkshopCmsRoute = location.pathname === "/admin/workshops";
  const isWorkshopRegisterRoute = location.pathname.startsWith("/register/workshop/");
  const isRegisterRoute = location.pathname.startsWith("/register");
  const isAbstractRoute = location.pathname.startsWith("/abstract-registration");
  const isAbstractRevisionRoute = location.pathname.startsWith("/abstract-revision");
  const isPartnerRoute = location.pathname.startsWith("/partners") || location.pathname.startsWith("/partnership");
  const isWorkshopDetailRoute = location.pathname.startsWith("/workshops/");
  const isGooglePayTestRoute = location.pathname.startsWith("/google-pay-test");
  const isVerifyCertificateRoute = location.pathname.startsWith("/verify-certificate");
  const isDynamicFormRoute = location.pathname.startsWith("/forms/");
  const isNominationsRoute = location.pathname.startsWith("/nominations");
  const isCommitteesRoute = location.pathname.startsWith("/committees");
  const isVisaRoute = location.pathname.startsWith("/visa-application");
  const isVenueRoute = location.pathname.startsWith("/venue");
  const isAboutRoute = location.pathname.startsWith("/about");
  const isBoardMeetingRoute = location.pathname.startsWith("/board-meeting-register");
  const isAnnualMeetingRoute = location.pathname.startsWith("/annual-meeting-invite");
  const isQRAttendanceRoute = location.pathname.startsWith("/qr-attendance");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [homepageSync, setHomepageSync] = useState({ banners: [], homepage: [], mediaPartners: [], notifications: [], seo: [] });
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    if (
      isAdminRoute ||
      isRegisterRoute ||
      isAbstractRoute ||
      isPartnerRoute ||
      isWorkshopDetailRoute ||
      isWorkshopRegisterRoute ||
      isGooglePayTestRoute ||
      isVerifyCertificateRoute ||
      isDynamicFormRoute ||
      isNominationsRoute
    ) {
      return undefined;
    }

    let active = true;

    const fetchHomepageCms = async () => {
      try {
        const [syncResponse, partnersResponse] = await Promise.all([
          axios.get(apiUrl(publicMarketingSyncEndpoint)),
          axios.get(apiUrl("/api/partners")),
        ]);

        if (!active) return;

        const syncData = syncResponse.data || {};
        setHomepageSync({
          banners: syncData.banners || [],
          homepage: syncData.homepage || [],
          mediaPartners: syncData.mediaPartners || [],
          notifications: syncData.notifications || [],
          seo: syncData.seo || [],
        });
        setPartners(partnersResponse.data?.partners || []);
      } catch (error) {
        console.warn("Failed to load homepage CMS data", error);
      }
    };

    fetchHomepageCms();

    return () => {
      active = false;
    };
  }, [
    isAbstractRoute,
    isAdminRoute,
    isDynamicFormRoute,
    isGooglePayTestRoute,
    isPartnerRoute,
    isRegisterRoute,
    isVerifyCertificateRoute,
    isWorkshopCmsRoute,
    isWorkshopDetailRoute,
    isWorkshopRegisterRoute,
  ]);

  useEffect(() => {
    let key = "home";
    let defaults = routeSeoDefaults.home;
    let path = "/";

    if (isAdminRoute || isWorkshopCmsRoute) {
      key = "admin";
      defaults = routeSeoDefaults.admin;
      path = isWorkshopCmsRoute ? "/admin/workshops" : location.pathname;
    } else if (isWorkshopRegisterRoute) {
      key = "workshop-registration";
      defaults = routeSeoDefaults["workshop-registration"];
      path = location.pathname;
    } else if (isRegisterRoute) {
      key = "register";
      defaults = routeSeoDefaults.register;
      path = "/register";
    } else if (isAbstractRevisionRoute) {
      key = "abstract-revision";
      defaults = routeSeoDefaults["abstract-revision"];
      path = "/abstract-revision";
    } else if (isAbstractRoute) {
      key = "abstract-registration";
      defaults = routeSeoDefaults["abstract-registration"];
      path = "/abstract-registration";
    } else if (isNominationsRoute) {
      key = "nominations";
      defaults = routeSeoDefaults.nominations;
      path = "/nominations";
    } else if (isBoardMeetingRoute) {
      key = "board-meeting-register";
      defaults = routeSeoDefaults["board-meeting-register"];
      path = "/board-meeting-register";
    } else if (isAnnualMeetingRoute) {
      key = "annual-meeting-invite";
      defaults = routeSeoDefaults["annual-meeting-invite"];
      path = "/annual-meeting-invite";
    } else if (isVisaRoute) {
      key = "visa-application";
      defaults = routeSeoDefaults["visa-application"];
      path = "/visa-application";
    } else if (isCommitteesRoute) {
      key = "committees";
      defaults = routeSeoDefaults.committees;
      path = "/committees";
    } else if (isVenueRoute) {
      key = "venue";
      defaults = routeSeoDefaults.venue;
      path = "/venue";
    } else if (isAboutRoute) {
      key = "about";
      defaults = routeSeoDefaults.about;
      path = "/about";
    } else if (isPartnerRoute) {
      key = "partnership";
      defaults = routeSeoDefaults.partnership;
      path = "/partnership";
    } else if (isVerifyCertificateRoute) {
      key = "verify-certificate";
      defaults = routeSeoDefaults["verify-certificate"];
      path = "/verify-certificate";
    } else if (isDynamicFormRoute) {
      key = "dynamic-form";
      defaults = routeSeoDefaults["dynamic-form"];
      path = location.pathname;
    } else if (isGooglePayTestRoute) {
      key = "google-pay-test";
      defaults = routeSeoDefaults["google-pay-test"];
      path = "/google-pay-test";
    } else if (isWorkshopDetailRoute) {
      key = "workshop-detail";
      defaults = routeSeoDefaults["workshop-detail"];
      path = location.pathname;
    }

    const cmsEntry = homepageSync.seo?.length
      ? findSeoEntry(homepageSync.seo, key, key === "home" ? homeSeoSynonyms : routeSeoPageKeys[key])
      : null;

    const merged = mergeSeoEntry(cmsEntry, defaults);
    const schemas = defaults.event ? [buildEventSchema({ path })] : [];
    setPageSeo({
      title: merged.title,
      description: merged.description,
      keywords: merged.keywords,
      image: merged.image,
      path,
      canonical: merged.canonical,
      schema: merged.schema,
      schemas,
      noindex: Boolean(defaults.noindex),
    });
  }, [
    homepageSync.seo,
    isAbstractRoute,
    isAbstractRevisionRoute,
    isAdminRoute,
    isAnnualMeetingRoute,
    isBoardMeetingRoute,
    isCommitteesRoute,
    isDynamicFormRoute,
    isGooglePayTestRoute,
    isNominationsRoute,
    isPartnerRoute,
    isRegisterRoute,
    isVenueRoute,
    isVerifyCertificateRoute,
    isVisaRoute,
    isAboutRoute,
    isWorkshopCmsRoute,
    isWorkshopDetailRoute,
    isWorkshopRegisterRoute,
    location.pathname,
  ]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isAdminRoute || isRegisterRoute || isAbstractRoute || isPartnerRoute || isWorkshopDetailRoute || isWorkshopRegisterRoute || isGooglePayTestRoute || isVerifyCertificateRoute || isDynamicFormRoute || isNominationsRoute) {
      return undefined;
    }

    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      ScrollTrigger.update();
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    const mm = gsap.matchMedia();

    mm.add("(min-width: 768px)", () => {
      const revealTweens = gsap.utils.toArray(".reveal-section").map((section) => gsap.fromTo(section, { opacity: 0, y: 44 }, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: section, start: "top 82%" },
      }));

      const cardTweens = gsap.utils.toArray(".impact-card, .workshop-card, .speaker-circle-card, .timeline-item, .research-gradient-card, .venue-info-card, .partner-logo, .cta-float-card, .mosaic-tile").map((card, index) => gsap.fromTo(card, { opacity: 0, y: 28, rotateX: 3 }, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.75,
        delay: (index % 4) * 0.035,
        ease: "power3.out",
        scrollTrigger: { trigger: card, start: "top 88%" },
      }));

      const parallaxVisual = gsap.to(".parallax-visual", {
        yPercent: -7,
        ease: "none",
        scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true },
      });

      const layerTweens = gsap.utils.toArray(".parallax-layer").map((layer) => {
        const speed = Number(layer.dataset.speed || 10);
        return gsap.to(layer, {
          y: speed,
          ease: "none",
          scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: 1.1 },
        });
      });

      return () => [...revealTweens, ...cardTweens, parallaxVisual, ...layerTweens].forEach((tween) => tween.kill());
    });

    mm.add("(min-width: 1024px)", () => {
      const wrapper = document.querySelector(".track-wrapper");
      const section = document.querySelector(".track-pin-section");
      const viewport = document.querySelector(".track-viewport");

      if (!wrapper || !section || !viewport) {
        return undefined;
      }

      const getDistance = () => Math.max(0, wrapper.scrollWidth - viewport.clientWidth + 64);

      const tween = gsap.to(wrapper, {
        x: () => -getDistance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${getDistance() + window.innerHeight * 0.65}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      return () => tween.kill();
    });

    ScrollTrigger.refresh();

    return () => {
      cancelAnimationFrame(rafId);
      mm.revert();
      lenis.destroy();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [isAbstractRoute, isAdminRoute, isDynamicFormRoute, isGooglePayTestRoute, isPartnerRoute, isRegisterRoute, isVerifyCertificateRoute, isWorkshopDetailRoute, isWorkshopRegisterRoute]);

  let routeContent;

  if (isWorkshopCmsRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading GHC CMS...</div>}><AdminApp initialPage="workshops" /></Suspense>;
  } else if (isVerifyCertificateRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading verification...</div>}><VerifyCertificate /></Suspense>;
  } else if (isDynamicFormRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading form...</div>}><DynamicForm /></Suspense>;
  } else if (isGooglePayTestRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading Google Pay...</div>}><GooglePayTest /></Suspense>;
  } else if (isAdminRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading GHC CMS...</div>}><AdminApp /></Suspense>;
  } else if (isWorkshopRegisterRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading workshop registration...</div>}><WorkshopRegister /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isRegisterRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading checkout...</div>}><Register /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isAbstractRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading abstract registration...</div>}><AbstractRegister /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isAbstractRevisionRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading abstract revision...</div>}><AbstractRevision /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isBoardMeetingRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading...</div>}><BoardMeetingRegister /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isAnnualMeetingRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading...</div>}><AnnualMeetingInvite /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isNominationsRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading nominations...</div>}><Nominations /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isVisaRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading visa application...</div>}><VisaApplication /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isCommitteesRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#081B33] text-white">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading text-white">Loading committees...</div>}><Committees /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isVenueRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading venue details...</div>}><Venue /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isAboutRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading About GHC...</div>}><AboutGHC /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isQRAttendanceRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading QR Attendance...</div>}><QRAttendance /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isPartnerRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading partner portal...</div>}><PartnershipPortal /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else if (isWorkshopDetailRoute) {
    routeContent = (
      <>
        <Suspense fallback={<div className="admin-loading">Loading workshop...</div>}><WorkshopDetail /></Suspense>
        <MobileRadialNav />
      </>
    );
  } else {
    const activeHeroBanner = homepageSync.banners?.find((banner) => banner?.is_active !== false) || homepageSync.banners?.[0] || null;

    routeContent = (
    <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
      <Navbar />
      <main>
        <Hero banner={activeHeroBanner} />
        <ParticipatingCountries />
        <WatchVision />
        <WorldClassSpeakers />
        <WorkshopsExperience />
        <ResearchHub />
        <GHCTimeline />
        <PanelDiscussionSection />
        <AwardsSection />
        <PartnerMarquee partners={partners} />
        <PastOrganisations />
        <PricingSection />
        <VisaCTA />
        <RegistrationCTA />
      </main>
      <Footer />
      <MobileRadialNav />
      {installPrompt && (
        <button
          className="pwa-install-button"
          onClick={() => {
            installPrompt.prompt();
            setInstallPrompt(null);
          }}
        >
          Install GHC
        </button>
      )}
    </div>
    );
  }

  return (
    <>
      {routeContent}
    </>
  );
}

export default App;
