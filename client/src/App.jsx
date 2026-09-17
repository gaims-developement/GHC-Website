import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLocation, Link } from "react-router-dom";
import { setPageSeo, trackEvent } from "./utils/seo";
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
  FileText,
  Globe2,
  HeartPulse,
  Hotel,
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
const Register = lazy(() => import("./pages/Register"));
const AbstractRegister = lazy(() => import("./pages/AbstractRegister"));
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
import VisaCTA from "./components/VisaCTA";

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
const homepageSeoKeys = new Set(["home", "homepage", "default", "index"]);

const findHomepageSection = (sections, name) =>
  sections?.find((section) => String(section.section_name || "").trim().toLowerCase() === String(name).trim().toLowerCase());

const findSeoPage = (seoItems) =>
  seoItems?.find((item) => item.page_key && homepageSeoKeys.has(String(item.page_key).trim().toLowerCase()));

const parseJsonConfig = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

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
    if (label !== "Register" && label !== "Nomination" && label !== "Committees") {
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
          <span className="brand-mark">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-['Sora'] text-sm font-bold text-[#081B33]">GHC 2026</span>
            <span className="block text-[0.68rem] uppercase tracking-[0.24em] text-[#0D47A1]/70">Global Health Conclave</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks?.map(([label, id]) => (
            <a key={id} href={label === "Register" ? "/register" : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : `/#${id}`} onClick={(e) => handleNavClick(e, label, id)} className="nav-link">
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
            <a key={id} href={label === "Register" ? "/register" : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : `/#${id}`} onClick={(e) => handleNavClick(e, label, id)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#081B33]/75 hover:bg-[#4FC3F7]/10 hover:text-[#0D47A1]">
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
            className="mt-4 text-sm font-medium uppercase tracking-widest text-white"
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
              <a href="/abstract-registration" className="hero-button-secondary">Submit Abstract <FileText className="h-4 w-4" /></a>,
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

  return (
    <section id="participating-countries" className="section-shell reveal-section">
      <SectionHeading eyebrow="Global Reach" title="Participating Countries" text="Delegates, researchers, and policymakers from across the globe." />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-10">
        {countries.map((country, index) => (
          <motion.div
            key={country.name}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border border-[#0D47A1]/10 bg-white/50 backdrop-blur-sm hover:shadow-lg transition-all"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.5 }}
            whileHover={{ y: -5, scale: 1.05 }}
          >
            <img 
              src={`https://flagcdn.com/w80/${country.code}.png`} 
              alt={`${country.name} flag`} 
              className="w-16 h-auto shadow-sm rounded-sm mb-4"
              loading="lazy"
            />
            <h3 className="font-['Sora'] font-semibold text-[#081B33] text-center text-sm">{country.name}</h3>
          </motion.div>
        ))}
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
    <section id="watch-vision" className="watch-vision-section section-shell reveal-section">
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

  const featured = speakerData?.find((speaker) => speaker.featured) ?? speakerData?.[0];
  const secondarySpeakers = speakerData?.filter((speaker) => speaker.name !== featured?.name);

  return (
    <section id="world-class-speakers" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="World Class Speakers" title="Keynotes and faculty shaping global care." text="Mock data is wired through a frontend hook ready for the future speaker API." />
        <span className="api-chip">GET {endpoint}</span>
      </div>
      <div className="speaker-luxury-grid">
        {featured ? (
          <>
            <motion.article className="featured-speaker-card" whileHover={{ y: -8, scale: 1.01 }}>
              <SpeakerPhoto speaker={featured} featured />
              <div className="featured-speaker-content">
                <p className="section-kicker">Featured Keynote</p>
                <h3>{featured?.name}</h3>
                <p className="speaker-institution">{featured?.institution}</p>
                <p className="speaker-designation">{featured?.designation}</p>
                <div className="speaker-topic">
                  <Sparkles className="h-4 w-4" />
                  {featured?.topic}
                </div>
              </div>
            </motion.article>
            <div className="speaker-circle-grid">
              {secondarySpeakers?.map((speaker) => (
                <SpotlightCard key={speaker.name} className="speaker-circle-card">
                  <SpeakerPhoto speaker={speaker} />
                  <h3>{speaker.name}</h3>
                  <p>{speaker.designation}</p>
                  <span>{speaker.topic}</span>
                </SpotlightCard>
              ))}
            </div>
          </>
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
        <span className="api-chip">GET {endpoint}</span>
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
    { title: "Nomination Award", description: "Recognizing outstanding contributions and excellence in healthcare. Nominate deserving individuals for their remarkable impact.", icon: Award },
    { title: "GAIMS Position Holder Award", description: "Honoring the leadership, dedication, and service of GAIMS position holders across the country.", icon: Trophy },
  ];

  return (
    <section id="awards" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Awards & Recognition" title="Honoring Excellence." text="Celebrate the achievements of individuals and leaders making a profound impact. The award function will be held on the final day." />
      </div>
      <div className="research-action-grid">
        {awards.map((award) => {
          const Icon = award.icon;
          return (
            <motion.article key={award.title} className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
              <div className="track-icon"><Icon className="h-6 w-6" /></div>
              <h3>{award.title}</h3>
              <p>{award.description}</p>
              {award.title === "Nomination Award" && (
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
  return (
    <section id="research-hub" className="section-shell reveal-section">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Research Hub" title="Submit rigorous healthcare research for GHC 2026." />
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
          <div className="research-card-actions">
            <a href="#research-guidelines" className="hero-button-secondary">View Guidelines <FileText className="h-4 w-4" /></a>
            <a href="/templates/ghc-research-abstract-template.txt" download className="hero-button-secondary">Download Template <FileText className="h-4 w-4" /></a>
          </div>
        </motion.article>
        <motion.article className="research-gradient-card research-action-card" whileHover={{ y: -9, scale: 1.01 }}>
          <div className="track-icon"><Microscope className="h-6 w-6" /></div>
          <h3>Submit Research</h3>
          <p>Open the structured submission flow for personal details, institution, category, title, authors, abstract and PDF upload.</p>
          <a href="/abstract-registration" className="hero-button-primary research-card-submit">Submit Abstract <ArrowRight className="h-4 w-4" /></a>
        </motion.article>
      </div>
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
  const doubledItems = [...marqueeItems, ...marqueeItems];

  return (
    <section id="partner-marquee" className="partner-marquee-section reveal-section">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="partner-marquee-heading">
          <SectionHeading eyebrow="Partner Marquee" title="Academic, NGO, media and sponsor partners." />
          <PartnerCTAButton href="/partnership" variant="section">
            Become a Partner <ArrowRight className="h-3 w-3" />
          </PartnerCTAButton>
        </div>
      </div>
      <div className="partner-marquee">
        <div className="partner-marquee-track">
          {doubledItems?.map((item, index) => {
            const logoUrl = item.logo?.startsWith("/uploads") ? apiUrl(item.logo) : item.logo;
            const partnerKey = item.id ? `partner-${item.id}-${index}` : `${item.category}-${item.name}-${index}`;

            return (
              <a
                className="partner-logo"
                key={partnerKey}
                href={item.website || "#"}
                target={item.website ? "_blank" : undefined}
                rel={item.website ? "noreferrer noopener" : undefined}
              >
                <span>{item.category}</span>
                {logoUrl ? <img src={logoUrl} alt={item.name} /> : item.name}
              </a>
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
        <SectionHeading eyebrow="Partnerships" title="Our Past Organisations" text="We have successfully collaborated with the most prestigious medical organizations across India." />
        <div className="mt-8 flex flex-wrap justify-center gap-6">
          {[
            "FAIMA", "MSAI", "IMA JDN", "AFPI", "IRCF", "AEME", "GJMS", "MGT", "SMR"
          ].map(org => (
            <SpotlightCard key={org} className="glass-card p-6 flex flex-col items-center justify-center text-center w-[160px] h-[160px] rounded-2xl">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <Globe2 className="h-8 w-8 text-[#4FC3F7]" />
              </div>
              <h3 className="font-['Sora'] text-sm font-semibold text-white/90">{org}</h3>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  const tiers = [
    { name: "GAIMS Elites", early: "₹1,500", late: "₹2,500" },
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
          <h3>Late Registration</h3>
          <p>Last date for late registration: <strong>Mid November</strong></p>
          <div className="research-guideline-list mt-4">
            {tiers.map(t => (
              <span key={t.name} style={{ display: 'flex', justifyContent: 'space-between' }}>
                {t.name} <strong>{t.late}</strong>
              </span>
            ))}
          </div>
        </motion.article>
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
function App() {
  const appRef = useRef(null);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isWorkshopCmsRoute = location.pathname === "/admin/workshops";
  const isWorkshopRegisterRoute = location.pathname.startsWith("/register/workshop/");
  const isRegisterRoute = location.pathname.startsWith("/register");
  const isAbstractRoute = location.pathname.startsWith("/abstract-registration");
  const isPartnerRoute = location.pathname.startsWith("/partners") || location.pathname.startsWith("/partnership");
  const isWorkshopDetailRoute = location.pathname.startsWith("/workshops/");
  const isGooglePayTestRoute = location.pathname.startsWith("/google-pay-test");
  const isVerifyCertificateRoute = location.pathname.startsWith("/verify-certificate");
  const isDynamicFormRoute = location.pathname.startsWith("/forms/");
  const isNominationsRoute = location.pathname.startsWith("/nominations");
  const isCommitteesRoute = location.pathname.startsWith("/committees");
  const isVisaRoute = location.pathname.startsWith("/visa-application");
  const isBoardMeetingRoute = location.pathname.startsWith("/board-meeting-register");
  const isAnnualMeetingRoute = location.pathname.startsWith("/annual-meeting-invite");
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
      setPageSeo({
        title: isNominationsRoute ? "GHC Awards 2026 — Nominations" : isDynamicFormRoute ? "GHC Form" : isVerifyCertificateRoute ? "Verify Certificate" : isGooglePayTestRoute ? "Google Pay Test" : isWorkshopRegisterRoute ? "Workshop Registration" : isWorkshopCmsRoute ? "Workshop Manager" : isWorkshopDetailRoute ? "Workshop Details" : isPartnerRoute ? "Partner Portal" : isAbstractRoute ? "Abstract Registration" : isRegisterRoute ? "Register" : isAdminRoute ? "Admin" : "Global Healthcare Conclave 2026",
        description: isWorkshopDetailRoute
          ? "Workshop details for Global Healthcare Conclave 2026."
          : isPartnerRoute
          ? "Partner with Global Healthcare Conclave 2026."
          : isAbstractRoute
          ? "Submit a research abstract for Global Healthcare Conclave 2026."
          : isRegisterRoute
          ? "Register for Global Healthcare Conclave 2026 with secure ticket checkout."
          : "Global Healthcare Conclave 2026 by GAIMS: speakers, workshops, research, venue, partners and registration.",
        path: isNominationsRoute ? "/nominations" : isDynamicFormRoute ? location.pathname : isVerifyCertificateRoute ? "/verify-certificate" : isGooglePayTestRoute ? "/google-pay-test" : isWorkshopRegisterRoute ? location.pathname : isWorkshopCmsRoute ? "/admin/workshops" : isWorkshopDetailRoute ? location.pathname : isPartnerRoute ? "/partnership" : isAbstractRoute ? "/abstract-registration" : isRegisterRoute ? "/register" : isAdminRoute ? "/admin" : "/",
        schema: {
          "@context": "https://schema.org",
          "@type": "Event",
          name: "Global Healthcare Conclave 2026",
          organizer: { "@type": "Organization", name: "GAIMS" },
        },
      });
      return;
    }

    const seoPage = findSeoPage(homepageSync.seo);
    setPageSeo({
      title: seoPage?.seo_title || "Global Healthcare Conclave 2026",
      description: seoPage?.seo_description || "Global Healthcare Conclave 2026 by GAIMS: speakers, workshops, research, venue, partners and registration.",
      path: "/",
      schema: {
        "@context": "https://schema.org",
        "@type": "Event",
        name: "Global Healthcare Conclave 2026",
        organizer: { "@type": "Organization", name: "GAIMS" },
      },
    });
  }, [
    homepageSync.seo,
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
        <StatsStrip />
        <About />
        <Mosaic />
        <Tracks />
        <WorldClassSpeakers />
        <WorkshopsExperience />
        <AwardsSection />
        <GHCTimeline />
        <ResearchHub />
        <PanelDiscussionSection />
        <VenueSection />
        <PartnerMarquee />
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
