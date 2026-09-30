import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLocation, Link } from "react-router-dom";
import { buildEventSchema, findSeoEntry, mergeSeoEntry, setPageSeo } from "./utils/seo";
import { apiUrl } from "./config/api";
import { GHC_FAVICON_PATH, GHC_LOGO_PATH } from "./config/branding";
import MobileRadialNav from "./components/MobileRadialNav";
import GlobeCanvas from "./components/GlobeCanvas";
import { createWorkshopSlug } from "./data/workshops";
import "./premium.css";
import "./home-redesign.css";
import {
  Activity,
  ArrowLeft,
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
  User,
  Users,
  Ticket,
  Wrench,
  X,
  Coffee,
  Users2,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AdminApp = lazy(() => import("./admin/AdminApp"));
const Spline = lazy(() => import("@splinetool/react-spline"));
const Venue = lazy(() => import("./pages/Venue"));
const AbstractRegister = lazy(() => import("./pages/AbstractRegister"));
const AbstractRevision = lazy(() => import("./pages/AbstractRevision"));
const AbstractParticipationConfirm = lazy(() => import("./pages/AbstractParticipationConfirm"));
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
const Schedule = lazy(() => import("./pages/Schedule"));

import { navLinks } from "./config/nav";
import { getVideoEmbedInfo } from "./utils/videoEmbed";

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

const heroTitle = "Global Healthcare Conclave 2026";
const defaultHeroDescription = "Reimagining Healthcare Beyond Borders through policy, research, clinical excellence and responsible innovation.";
const defaultHeroButtonText = "Register Now";
const registrationUrl = "https://mc.clirnet.com/mastercast/connect/D0921-Conclave-1";
const defaultHeroLink = registrationUrl;

function RegistrationRedirect() {
  useEffect(() => {
    window.location.replace(registrationUrl);
  }, []);

  return (
    <div className="min-h-screen grid place-items-center bg-white px-6 text-center text-[#081B33]">
      <div>
        <p className="font-bold mb-3">Redirecting to registration...</p>
        <a href={registrationUrl} className="text-[#173B8F] font-semibold underline">
          Open registration
        </a>
      </div>
    </div>
  );
}
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
  const location = useLocation();

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
    <header className="site-navbar fixed left-0 right-0 top-4 z-50 px-4 sm:px-6 transition-all duration-300">
      <nav className="mx-auto flex max-w-[1400px] items-center justify-between pl-4 pr-3 py-2 sm:pl-5 sm:pr-3 bg-white/95 backdrop-blur-md rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.08)] border border-white/60">
        <a href="/" className="flex items-center gap-3" aria-label="Global Healthcare Conclave home">
          <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-white">
            <img src={GHC_FAVICON_PATH} alt="GHC Logo" className="h-full w-full object-cover" />
          </span>
          <div className="flex flex-col">
            <span className="block font-['Outfit'] text-[1.1rem] leading-tight font-extrabold text-[#081B33]">GHC 2026</span>
            <span className="block font-['Inter'] text-[0.55rem] font-bold text-[#081B33]/50 tracking-wider">GLOBAL HEALTHCARE CONCLAVE</span>
          </div>
        </a>

        <div className="hidden items-center justify-center flex-1 gap-7 lg:flex ml-8">
          {navLinks?.map(([label, id]) => {
            const isActive = location.pathname === "/" && (location.hash === "" || location.hash === "#home") && id === "home";
            return (
              <a 
                key={id} 
                href={label === "Register" ? registrationUrl : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : label === "Venue" ? "/venue" : label === "About" ? "/about" : `/#${id}`}
                target={label === "Register" ? "_blank" : undefined}
                rel={label === "Register" ? "noopener noreferrer" : undefined}
                onClick={(e) => handleNavClick(e, label, id)} 
                className={`relative py-2 font-['Inter'] text-[0.85rem] font-bold transition-colors ${isActive ? 'text-[#173B8F]' : 'text-[#081B33] hover:text-[#173B8F]'}`}
              >
                {label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-[#173B8F] rounded-t-full"></span>
                )}
              </a>
            );
          })}
        </div>

        <a href={registrationUrl} target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center gap-2 rounded-full bg-[#173B8F] px-6 py-2.5 font-['Inter'] text-sm font-bold text-white shadow-md shadow-[#173B8F]/20 transition hover:-translate-y-0.5 hover:shadow-lg">
          Register Now <ArrowRight className="h-4 w-4" />
        </a>

        <button className="grid h-10 w-10 place-items-center rounded-full border border-[#081B33]/15 text-[#081B33] lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mobile-menu mx-auto mt-3 max-w-7xl p-3 bg-white rounded-2xl shadow-xl lg:hidden">
          {navLinks?.map(([label, id]) => (
            <a key={id} href={label === "Register" ? registrationUrl : label === "Nomination" ? "/nominations" : label === "Committees" ? "/committees" : label === "Venue" ? "/venue" : label === "About" ? "/about" : `/#${id}`} target={label === "Register" ? "_blank" : undefined} rel={label === "Register" ? "noopener noreferrer" : undefined} onClick={(e) => handleNavClick(e, label, id)} className="block rounded-xl px-4 py-3 text-sm font-semibold text-[#081B33]/80 hover:bg-[#173B8F]/5 hover:text-[#173B8F]">
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

function SectionHeading({ eyebrow, title, text, dark }) {
  return (
    <div className="section-heading mb-12">
      <p className={`font-['Inter'] font-bold tracking-widest uppercase text-xs md:text-sm mb-3 ${dark ? 'text-[#4fc3f7]' : 'text-[#173B8F]'}`}>{eyebrow}</p>
      <h2 className={`font-['Outfit'] text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight ${dark ? 'text-white' : 'text-[#101828]'}`}>{title}</h2>
      {text && <p className={`font-['Inter'] text-lg md:text-xl max-w-3xl leading-relaxed ${dark ? 'text-gray-300' : 'text-[#475467]'}`}>{text}</p>}
    </div>
  );
}

function PartnerCTAButton({ href, variant = "hero", className = "", style = {}, children }) {
  const baseClass = variant === "hero" ? "hero-button-secondary" : "partner-marquee-cta";

  return (
    <a
      href={href}
      style={style}
      className={`${baseClass} partner-cta-button partner-cta-button--${variant} ${className}`}
    >
      <span className="partner-cta-button__content" style={style}>{children}</span>
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
      className="section-heading track-animated-heading mb-12"
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
        className="text-[#173B8F] font-['Inter'] font-bold tracking-widest uppercase text-xs md:text-sm mb-3"
        variants={{
          hidden: { opacity: 0, y: 14 },
          visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
        }}
      >
        Highlights
      </motion.p>
      <h2 className="text-[#101828] font-['Outfit'] text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight" aria-label={title}>
        {words.map((word, index) => (
          <span className="track-heading-word-mask inline-block overflow-hidden" key={`${word}-${index}`} aria-hidden="true">
            <motion.span
              className="inline-block mr-[0.25em]"
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
        className="text-[#475467] font-['Inter'] text-lg md:text-xl max-w-3xl leading-relaxed mt-4"
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
  const [collaboratingOrg, setCollaboratingOrg] = useState("");

  useEffect(() => {
    axios.get(apiUrl("/api/settings/public"))
      .then(res => {
        if (res.data?.registration?.abstractSubmissionOpen !== undefined) {
          setAbstractOpen(res.data.registration.abstractSubmissionOpen);
        }
        if (res.data?.conference?.collaboratingOrg !== undefined) {
          setCollaboratingOrg(res.data.conference.collaboratingOrg || "");
        }
      })
      .catch(err => console.error("Failed to load public settings:", err));
  }, []);

  const activeCollaboratingOrg = banner?.collaborating_org || collaboratingOrg;
  const orgList = (activeCollaboratingOrg || "")
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const getOrgLogo = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes("aiims")) return "/assets/logos/aiimsstudentassociation.jpg";
    if (lower.includes("gaims")) return "/assets/logos/gaims.png";
    if (lower.includes("faima")) return "/assets/logos/faima.jpg";
    if (lower.includes("afpi")) return "/assets/logos/afpi.png";
    if (lower.includes("ircf")) return "/assets/logos/ircf.jpg";
    if (lower.includes("aeme")) return "/assets/logos/aeme.jpg";
    if (lower.includes("gjms")) return "/assets/logos/GJMS logo.png";
    if (lower.includes("smr")) return "/assets/logos/SMR.jpeg";
    return null;
  };

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
    <section id="home" className="reveal-section hero-bg-responsive">
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
      {/* Old backgrounds removed for new image */}

      <div className="hero-mobile-shell mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-12 pt-36 sm:pt-40 md:px-8 lg:grid-cols-2 lg:pt-36">
        <div className="relative z-10">
          {/* Dual Brand Logos: GHC 2026 & GAIMS */}
          <motion.div
            className="flex flex-wrap items-center gap-3 sm:gap-4 mb-6"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay, duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center">
              <img
                src={GHC_LOGO_PATH}
                alt="GHC Logo"
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
              />
            </div>

            <div className="hidden sm:block h-10 w-px bg-gray-300/80" />

            <div className="inline-flex items-center">
              <img
                src="/assets/logos/gaims.png"
                alt="GAIMS Logo"
                className="h-20 w-20 sm:h-24 sm:w-24 object-contain"
              />
            </div>
          </motion.div>

          <motion.div className="hero-pill mb-4 bg-white/90 border border-gray-300 shadow-sm" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: finalDelay, duration: 0.7, ease: "easeOut" }}>
            <MapPin className="h-4 w-4 text-[#F43F8A]" />
            <span className="text-[#101828] font-bold text-xs tracking-wider">New Delhi · November 22-24, 2026</span>
          </motion.div>
          <motion.h1
            className="mt-4 font-['Outfit'] text-5xl font-extrabold leading-[1.1] sm:text-6xl lg:text-7xl text-[#101828]"
            aria-label={heroTitle}
            layoutId={introActive ? undefined : "ghc-hero-title"}
            initial={introActive ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay + 0.08, duration: 0.76, ease: [0.16, 1, 0.3, 1] }}
          >
            {heroTitle.split(" ")?.map((word, index) => {
              const isPinkPurple = word === 'Healthcare' || word === 'Global';
              return (
                <span className="word-mask inline-block" key={`${word}-${index}`} aria-hidden="true" style={{ marginRight: '0.25em' }}>
                  <motion.span custom={index} variants={wordReveal} initial="hidden" animate="visible"
                    style={{
                      color: isPinkPurple ? 'transparent' : '#101828',
                      backgroundImage: isPinkPurple ? 'linear-gradient(135deg, #173B8F 0%, #7C3AED 50%, #EC4899 100%)' : 'none',
                      WebkitBackgroundClip: isPinkPurple ? 'text' : 'none',
                      backgroundClip: isPinkPurple ? 'text' : 'none'
                    }}
                  >
                    {word}
                  </motion.span>
                </span>
              );
            })}
          </motion.h1>
          {orgList.length > 0 && (
            <motion.div
              className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-bold uppercase tracking-wide text-[#101828]"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: finalDelay + 0.25, duration: 0.75 }}
            >
              <span className="text-[#101828] whitespace-nowrap">In collaboration with</span>
              <div className="inline-flex flex-wrap items-center gap-2 sm:gap-2.5">
                {orgList.map((org, index) => {
                  const logo = getOrgLogo(org);
                  return (
                    <div
                      key={`${org}-${index}`}
                      className="inline-flex items-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200 px-3 sm:px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap shrink-0"
                    >
                      {logo && (
                        <img
                          src={logo}
                          alt={org}
                          className="h-5 sm:h-6 w-5 sm:w-6 rounded-full object-cover shrink-0"
                        />
                      )}
                      <span className="text-[#101828] font-bold text-xs sm:text-sm">
                        {org}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
          <motion.p className="mt-6 max-w-2xl text-lg sm:text-xl leading-8 text-[#334155] font-semibold" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: finalDelay + 0.42, duration: 0.75 }}>
            {heroDescription}
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { delayChildren: finalDelay + 0.62, staggerChildren: 0.09 } } }}>
            {[
              <a href={heroLink} target={heroLink === registrationUrl ? "_blank" : undefined} rel={heroLink === registrationUrl ? "noopener noreferrer" : undefined} className="hero-button-primary bg-gradient-to-r from-[#EC4899] via-[#8B5CF6] to-[#173B8F] text-white border-none rounded-full px-7 py-3.5 font-bold shadow-lg shadow-pink-500/25 transition hover:brightness-110 flex items-center gap-2">{heroButtonText} <ArrowRight className="h-4 w-4" /></a>,
              <PartnerCTAButton href="#partner-marquee" variant="hero" className="bg-white hover:bg-gray-100 border border-gray-300 shadow-sm rounded-full px-6 py-3 font-bold transition flex items-center gap-2" style={{ color: "#000000" }}><span style={{ color: "#000000" }} className="text-black font-bold">Become Partner</span> <BadgeCheck className="h-4 w-4 text-[#8B5CF6]" /></PartnerCTAButton>,
              <a href="#watch-vision" className="hero-button-secondary bg-white hover:bg-gray-100 border border-gray-300 shadow-sm rounded-full px-6 py-3 font-bold transition flex items-center gap-2" style={{ color: "#000000" }} onClick={scrollToTrailer}><span style={{ color: "#000000" }} className="text-black font-bold">Watch Trailer</span> <Play className="h-4 w-4 text-[#EC4899]" /></a>,
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
            className="mt-6 flex flex-col items-start gap-3 bg-white/90 p-4 rounded-2xl border border-gray-200/90 shadow-md backdrop-blur-md"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: finalDelay + 0.8, duration: 0.62 }}
          >
            <div className="flex items-center gap-2 text-sm font-bold font-['DM_Sans']">
              <span className="relative flex h-3 w-3">
                {abstractOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400"></span>}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${abstractOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <span className={abstractOpen ? 'text-emerald-700 font-bold' : 'text-red-600 font-bold'}>
                {abstractOpen ? 'Calls are currently open' : 'Calls are currently closed'}
              </span>
            </div>
            <a href="/abstract-registration" className="hero-button-secondary border flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition bg-white hover:bg-gray-100 border-gray-300 shadow-sm" style={{ color: "#000000" }}>
              <span style={{ color: "#000000" }} className="text-black font-bold">Submit Abstract</span> <FileText className="h-4 w-4 text-black" />
            </a>
          </motion.div>
        </div>

        {/* Spline globe removed for background image */}
      </div>

      {/* Squiggle divider removed */}
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
    <section id="participating-countries" className="w-full bg-[#F8F9FC]">
      <div className="section-shell reveal-section relative" style={{ paddingBottom: '4rem', paddingTop: '6rem' }}>

      <SectionHeading eyebrow="Global Reach" title="Participating Countries" text="Delegates, researchers, and policymakers from across the globe." />
      
      <div className="partner-marquee mt-14 relative z-10">
        <div className="partner-marquee-track">
          {doubledCountries.map((country, index) => (
            <div
              key={`${country.code}-${index}`}
              className="group relative flex flex-col items-center justify-center p-8 rounded-[2rem] bg-white border border-gray-100 shadow-[0_8px_24px_rgba(16,24,40,0.04)] hover:shadow-[0_12px_32px_rgba(16,24,40,0.08)] transition-all duration-500 overflow-hidden hover:border-[#173B8F]/20 hover:-translate-y-2 w-[220px] shrink-0"
            >
              {/* Subtle gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#173B8F]/5 to-[#00A6A6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
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
  const videoInfo = hasVideo ? getVideoEmbedInfo(trailer.videoUrl) : null;

  return (
    <section id="watch-vision" className="w-full bg-white border-t border-gray-100">
      <div className="section-shell reveal-section py-24">
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
          ) : hasVideo && videoInfo ? (
            <div className="vision-video-frame rounded-[2rem] overflow-hidden shadow-[0_12px_40px_rgba(16,24,40,0.1)] border border-gray-100 relative bg-[#101828]">
              {videoInfo.type === "direct" ? (
                <video
                  src={videoInfo.embedUrl}
                  poster={trailer.thumbnailUrl || undefined}
                  controls
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : (
                <iframe
                  src={videoInfo.embedUrl}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>
          ) : (
            <div className="vision-video-frame vision-video-fallback">
              <Play className="h-9 w-9" />
              <span>{error || "The Global Health Conclave trailer will be available soon."}</span>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
function StatsStrip() {
  return (
    <section id="statistics" className="feature-section impact-strip reveal-section bg-[#F8F9FC] py-20 border-y border-gray-100" aria-label="GHC impact areas">
      <div className="impact-scroll flex gap-6 px-6 overflow-x-auto pb-8 snap-x">
        {impactCards.map((card, index) => (
          <motion.div
            key={card.title}
            className="impact-card bg-white rounded-3xl p-8 min-w-[280px] md:min-w-[320px] flex-shrink-0 snap-center shadow-[0_8px_24px_rgba(16,24,40,0.04)] border border-gray-100 flex flex-col gap-4"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.62, delay: index * 0.08 }}
            viewport={{ once: true, amount: 0.35 }}
          >
            <div className="impact-icon w-14 h-14 rounded-2xl bg-[#173B8F]/10 text-[#173B8F] flex items-center justify-center mb-2">
              <card.icon className="h-7 w-7" />
            </div>
            <h3 className="font-['Outfit'] font-extrabold text-[#101828] text-2xl">{card.title}</h3>
            <p className="font-['Inter'] text-[#475467] font-medium leading-relaxed">{card.text}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="w-full bg-white">
      <div className="section-shell relative overflow-hidden reveal-section py-24">
        <div className="asym-grid items-center gap-12 md:gap-16 mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <SectionHeading eyebrow="About GHC" title="A healthcare forum designed for global coordination." />
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className="group relative">
            <div className="relative p-10 md:p-12 shadow-[0_12px_40px_rgba(16,24,40,0.06)] bg-white border border-gray-100 rounded-[2.5rem]">
              <p className="font-['Inter'] text-xl leading-relaxed text-[#475467] font-medium">
                Global Healthcare Conclave is the flagship global health initiative of GAIMS, bringing together healthcare professionals, researchers, students and innovators to build practical answers for tomorrow's health systems.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {["Clinical excellence", "Research exchange", "Policy leadership"]?.map((item) => (
                  <div key={item} className="flex items-center gap-2 rounded-full border border-gray-200 bg-[#F8F9FC] px-5 py-3 font-['Inter'] text-sm font-bold text-[#101828] shadow-sm transition hover:bg-white hover:border-[#173B8F]/30 hover:text-[#173B8F] hover:shadow-md">
                    <Check className="h-4 w-4 text-[#00A6A6]" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Mosaic() {
  return (
    <section className="section-shell reveal-section bg-[#F8F9FC] py-24 border-y border-gray-100">
      <div className="mosaic-grid max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mosaic-tile tile-large bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(16,24,40,0.06)] border border-gray-100 p-8 md:p-12 flex flex-col justify-center">
          <SectionHeading eyebrow="Conference Mosaic" title="One summit. Many connected rooms of healthcare leadership." text="The GHC experience moves from keynote strategy to workshops, research corridors, simulation labs and partner dialogue." />
        </div>
        {["Global policy forum", "Clinical innovation lab", "Research poster walk", "Student leadership circle"]?.map((item, index) => (
          <motion.div key={item} className="mosaic-tile bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(16,24,40,0.04)] border border-gray-100 p-8 flex flex-col justify-between" whileHover={{ y: -8, scale: 1.02, borderColor: '#173B8F33' }}>
            <span className="text-[#00A6A6] font-['Outfit'] font-bold text-2xl mb-6 inline-block">0{index + 1}</span>
            <h3 className="text-[#101828] font-['Outfit'] font-extrabold text-2xl leading-tight">{item}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Tracks() {
  const [headingComplete, setHeadingComplete] = useState(false);

  return (
    <section id="tracks" className="track-pin-section bg-white py-24">
      <div className="track-sticky-shell">
        <div className="section-shell track-heading-shell max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedTrackHeading onComplete={() => setHeadingComplete(true)} />
        </div>
        <motion.div
          className={headingComplete ? "track-viewport cards-unlocked mt-12 pl-4 sm:pl-6 max-w-7xl mx-auto" : "track-viewport mt-12 pl-4 sm:pl-6 max-w-7xl mx-auto"}
          initial="hidden"
          animate={headingComplete ? "visible" : "hidden"}
          variants={{
            hidden: { opacity: 0, y: 36 },
            visible: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          <motion.div
            className="track-wrapper flex gap-6 overflow-x-auto pb-12 pr-6 snap-x"
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
                  className="bg-[#F8F9FC] rounded-[2rem] border border-gray-100 shadow-sm p-8 min-w-[320px] md:min-w-[400px] flex-shrink-0 snap-center relative overflow-hidden"
                  variants={{
                    hidden: { opacity: 0, y: 44, filter: "blur(10px)" },
                    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.76, ease: [0.22, 1, 0.36, 1] } },
                  }}
                  whileHover={{ y: -10, scale: 1.02, backgroundColor: '#FFFFFF', boxShadow: '0 20px 40px -10px rgba(16,24,40,0.1)' }}
                >
                  <div className="absolute -top-4 -right-4 text-[#00A6A6]/10 font-['Outfit'] font-extrabold text-[8rem] leading-none select-none z-0">0{index + 1}</div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm text-[#173B8F] flex items-center justify-center mb-6"><Icon className="h-7 w-7" /></div>
                    <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#101828] mb-3">{track.title}</h3>
                    <p className="text-[#475467] font-medium leading-relaxed">{track.text}</p>
                  </div>
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
  const [imgError, setImgError] = useState(false);
  const photoUrl = speaker?.photoUrl?.startsWith("/uploads") ? apiUrl(speaker.photoUrl) : speaker?.photoUrl;

  return (
    <div className={featured ? "speaker-photo speaker-photo-featured" : "speaker-photo"} data-photo={speaker.photo}>
      {photoUrl && !imgError ? (
        <img
          loading="lazy"
          src={photoUrl}
          alt={speaker.name || "Speaker"}
          onError={() => setImgError(true)}
        />
      ) : (
        <span>{speaker.initials || speaker.name?.slice(0, 2).toUpperCase()}</span>
      )}
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
    <section id="world-class-speakers" className="section-shell reveal-section bg-white py-24">
      <div className="mb-14 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="World Class Speakers" title="Keynotes and faculty shaping global care." />
      </div>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
        {speakerData?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {speakerData.map((speaker) => (
              <SpotlightCard key={speaker.name} className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] p-8 flex flex-col items-center text-center">
                <SpeakerPhoto speaker={speaker} />
                <h3 className="mt-6 font-['Outfit'] text-xl font-extrabold text-[#101828]">{speaker.name}</h3>
                <p className="mt-2 text-sm font-bold text-[#173B8F] uppercase tracking-wider">{speaker.designation}</p>
                <p className="mt-5 text-sm text-[#475467] leading-relaxed border-t border-gray-100 pt-5 w-full font-medium">
                  {speaker.topic || speaker.institution || "Speaker Topic"}
                </p>
              </SpotlightCard>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-3xl w-full p-12 text-center shadow-sm col-span-full">
            <h3 className="text-xl font-['Outfit'] font-bold text-[#475467]">Speakers will be announced soon.</h3>
          </div>
        )}
      </div>

      <div className="mt-24 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading eyebrow="Legacy" title="Past Speakers" text="Distinguished faculty and visionaries from our previous editions." />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[
            {
              name: "Dr Mukesh Bhatia",
              designation: "Founder, DBMCI",
              achievements: "Pioneer in PG Medical Entrance education. Mentored millions of medical students.",
              photoUrl: "/assets/Speakers/mukeshBhatia.jpeg",
            },
            {
              name: "Dr Randeep Guleria",
              designation: "Former Director, AIIMS New Delhi",
              achievements: "Padma Shri Awardee. Lead architect of India's COVID-19 pandemic response.",
              photoUrl: "/assets/Speakers/RandeepGuleria.jpeg",
            },
            {
              name: "Dr Minu Bajpai",
              designation: "Executive Director, NBE",
              achievements: "Renowned Paediatric Surgeon and academician. Former Head of Department at AIIMS.",
              photoUrl: "/assets/Speakers/MinuBhajpai.jpeg",
            },
            {
              name: "Dr Rakesh Garg",
              designation: "Additional Professor, AIIMS New Delhi",
              achievements: "Expert in Anesthesiology, Pain Medicine and Critical Care. Over 200+ publications.",
              photoUrl: "/assets/Speakers/RakeshGarg.jpeg",
            },
            {
              name: "Dr Tanmay Motiwala",
              designation: "Paediatric Surgeon & Influencer",
              achievements: "Inspiring voice in the medical community with focus on surgical education.",
              photoUrl: "/assets/Speakers/TanmayMotiwala.jpeg",
            },
            {
              name: "Lt Gen Dr DP Vats",
              designation: "Former Director, AFMC Pune",
              achievements: "Rajya Sabha MP. Param Vishisht Seva Medal (PVSM) awardee. Eminent Ophthalmologist.",
              photoUrl: "/assets/Speakers/LtGenDrDPVats.jpeg",
            },
            {
              name: "Dr Yogendra Malik",
              designation: "Former Advisor to CM, Haryana",
              achievements: "Eminent medical educationist and health policy maker.",
              photoUrl: "/assets/Speakers/YogendraMalik.jpeg",
            }
          ].map(speaker => (
            <SpotlightCard key={speaker.name} className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)] p-8 flex flex-col items-center text-center opacity-90">
              <SpeakerPhoto speaker={{ ...speaker, initials: speaker.name.split(" ").slice(1, 3).map(n => n[0]).join("") }} />
              <h3 className="mt-6 font-['Outfit'] text-xl font-extrabold text-[#101828]">{speaker.name}</h3>
              <p className="mt-2 text-sm font-bold text-[#173B8F] uppercase tracking-wider">{speaker.designation}</p>
              <p className="mt-5 text-sm text-[#475467] leading-relaxed border-t border-gray-100 pt-5 w-full font-medium">
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
  const scrollRef = useRef(null);

  useEffect(() => {
    axios.get(apiUrl("/api/workshops")).then((response) => {
      const workshops = response.data.workshops || [];
      if (workshops.length) {
        setWorkshopData(workshops.filter(w => w.status === 'published' || !w.status).map((workshop) => ({
          ...workshop,
          slug: workshop.slug || createWorkshopSlug(workshop.title),
          remaining: Math.max(Number(workshop.availableSeats ?? (workshop.capacity - (workshop.registeredCount || 0))), 0),
          isRegistrationOpen: workshop.isRegistrationOpen !== false && workshop.is_registration_open !== false,
          certificateAvailable: Boolean(workshop.certificateAvailable ?? workshop.certificate_available ?? true),
          organizer: workshop.organizer || workshop.faculty || "New Delhi",
          venue: workshop.venue || "New Delhi",
          displayDate: workshop.duration ? `${workshop.duration}, Nov 2026` : formatWorkshopDate(workshop.date),
        })));
      }
    }).catch(() => setWorkshopData(mockWorkshops));
  }, []);

  const scrollWorkshops = (direction) => {
    const container = scrollRef.current;
    if (!container) return;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({ left: direction * scrollAmount, behavior: "smooth" });
  };

  return (
    <section id="workshops-experience" className="section-shell reveal-section bg-[#F8F9FC] py-24 border-y border-gray-100 overflow-hidden">
      <div className="mb-10 max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeading
          eyebrow="Workshops Experience"
          title="Premium clinical and research skill rooms."
          text="Each workshop is structured around capacity, faculty depth and delegate readiness in New Delhi."
        />
      </div>

      {/* Slider Container with Navigation Buttons Inside */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 group/slider">
        {/* Left Arrow Button Inside Slider */}
        <button
          type="button"
          aria-label="Previous workshops"
          onClick={() => scrollWorkshops(-1)}
          className="absolute -left-2 sm:left-1 md:left-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-gray-200 text-[#173B8F] shadow-[0_8px_30px_rgba(16,24,40,0.16)] hover:bg-[#173B8F] hover:text-white hover:border-[#173B8F] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>

        {/* Right Arrow Button Inside Slider */}
        <button
          type="button"
          aria-label="Next workshops"
          onClick={() => scrollWorkshops(1)}
          className="absolute -right-2 sm:right-1 md:right-2 top-1/2 -translate-y-1/2 z-20 w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/95 backdrop-blur-md border border-gray-200 text-[#173B8F] shadow-[0_8px_30px_rgba(16,24,40,0.16)] hover:bg-[#173B8F] hover:text-white hover:border-[#173B8F] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
        >
          <ArrowRight className="h-6 w-6" />
        </button>

        {/* Slider Track */}
        <div
          ref={scrollRef}
          className="flex flex-nowrap gap-7 overflow-x-auto pb-10 pt-2 px-2 sm:px-4 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
        {workshopData?.map((workshop) => {
          const slug = workshop.slug || createWorkshopSlug(workshop.title);
          const isClosed = !workshop.isRegistrationOpen || workshop.remaining <= 0;
          const speakerName = workshop.faculty || workshop.organizer || "New Delhi Faculty";

          return (
            <motion.article
              key={workshop.title || workshop.id}
              className="w-[360px] sm:w-[410px] md:w-[450px] flex-shrink-0 snap-start bg-white rounded-[2.25rem] shadow-[0_8px_30px_rgba(16,24,40,0.04)] border border-gray-100 p-8 flex flex-col justify-between hover:border-[#173B8F]/30 hover:shadow-[0_20px_40px_-10px_rgba(16,24,40,0.08)] transition-all duration-300 relative overflow-hidden group"
              whileHover={{ y: -6 }}
            >
              {/* Card Header & Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-[#173B8F] truncate max-w-[220px]">
                    {workshop.workshopType || workshop.category || "Clinical Skills"}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${isClosed ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {isClosed ? 'Applications Closed' : 'Open'}
                  </span>
                </div>

                {/* Workshop Name */}
                <h3 className="font-['Outfit'] text-2xl sm:text-[1.65rem] font-black text-[#101828] group-hover:text-[#173B8F] transition-colors line-clamp-2 min-h-[4.25rem] leading-snug">
                  {workshop.title}
                </h3>

                {/* Speaker Name */}
                <div className="flex items-center gap-2 mt-2 text-sm sm:text-base text-[#173B8F] font-bold min-h-[1.75rem]">
                  <User className="h-4 w-4 shrink-0 text-[#00A6A6]" />
                  <span className="truncate">Speaker: {speakerName}</span>
                </div>

                {/* Brief Details */}
                <p className="text-[#475467] font-medium text-sm sm:text-[15px] mt-3.5 leading-relaxed line-clamp-3 min-h-[4.75rem]">
                  {workshop.description || "Hands-on clinical session with world-class faculty in New Delhi."}
                </p>
              </div>

              {/* Info & Details Button pinned to bottom */}
              <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col justify-between">
                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm text-[#475467] font-medium mb-6 bg-gray-50/80 p-4 rounded-2xl border border-gray-100 min-h-[6rem]">
                  <span className="flex items-center gap-2 min-w-0" title={workshop.displayDate}>
                    <CalendarDays className="h-4 w-4 text-[#00A6A6] shrink-0" />
                    <span className="truncate">{workshop.displayDate}</span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0" title={`${workshop.remaining} of ${workshop.capacity} seats left`}>
                    <Users className="h-4 w-4 text-[#00A6A6] shrink-0" />
                    <span className="truncate">{workshop.remaining} / {workshop.capacity} seats</span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0" title={workshop.venue}>
                    <MapPin className="h-4 w-4 text-[#00A6A6] shrink-0" />
                    <span className="truncate">{workshop.venue}</span>
                  </span>
                  <span className="flex items-center gap-2 min-w-0">
                    <BadgeCheck className="h-4 w-4 text-[#00A6A6] shrink-0" />
                    <span className="truncate">{workshop.certificateAvailable ? 'Certificate: Yes' : 'No Certificate'}</span>
                  </span>
                </div>

                {/* ONLY Details Button */}
                <Link
                  to={`/workshops/${slug}`}
                  state={{ workshop }}
                  onClick={() => window.scrollTo(0, 0)}
                  className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl font-bold text-sm sm:text-base bg-gradient-to-r from-[#173B8F] to-[#00A6A6] text-white hover:brightness-110 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  Details
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.article>
          );
        })}
        </div>
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
    <section id="awards" className="w-full bg-[#fafafa] border-t border-gray-100">
      <div className="section-shell reveal-section py-24">
        <div className="mb-14 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-[#e244b7] text-sm font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#e244b7] rounded-full"></span>
              GAIMS HEALTHCARE ACHIEVER AWARDS
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-['Outfit'] font-extrabold text-[#101828] leading-tight">
              Honoring Excellence.
            </h2>
            <p className="font-['Inter'] text-lg text-[#475467] max-w-2xl mt-3 leading-relaxed">
              Celebrate the achievements of individuals and leaders making a profound impact. The award function will be held on the final day.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {awards.map((award) => {
            const Icon = award.icon;
            return (
              <motion.article 
                key={award.title} 
                className="bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)] hover:shadow-[0_16px_40px_rgba(108,74,182,0.12)] hover:border-[#6C4AB6]/30 p-8 sm:p-10 flex flex-col transition-all duration-300 relative group overflow-hidden" 
                whileHover={{ y: -6 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6C4AB6]/10 to-[#e244b7]/10 border border-[#6C4AB6]/20 text-[#6C4AB6] group-hover:text-[#e244b7] flex items-center justify-center mb-6 transition-colors">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-['Outfit'] text-2xl font-bold text-[#101828] group-hover:text-[#6C4AB6] transition-colors mb-4">
                  {award.title}
                </h3>
                <p className="text-[#475467] font-medium leading-relaxed mb-8 flex-1 text-base sm:text-lg">
                  {award.description}
                </p>
                {award.title === "GAIMS Healthcare Achiever Awards" && (
                  <div className="mt-auto pt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                    <Link 
                      to="/nominations" 
                      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white px-8 py-3.5 rounded-full font-bold text-sm hover:opacity-95 hover:shadow-lg hover:shadow-[#e244b7]/30 transition-all shadow-md"
                    >
                      Submit Nomination <ArrowRight className="h-4 w-4" />
                    </Link>
                    <span className="text-xs font-semibold text-[#e244b7] uppercase tracking-wider bg-[#e244b7]/10 border border-[#e244b7]/20 px-3 py-1 rounded-full">
                      Nominations Open
                    </span>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
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
      href: `/schedule?day=${day.key}`,
      content: <ConferenceDayTimeline activities={dayActivities[day.key] || []} onEdit={(index) => editActivity(day.key, index)} onDelete={(index) => deleteActivity(day.key, index)} isAdmin={isAdmin} />,
    })),
  ];

  return (
    <section id="ghc-timeline" className="schedule-section section-shell reveal-section bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="schedule-heading">
          <div>
            <h2 className="text-[#101828]">Schedule</h2>
            <p className="text-[#475467]">Global Healthcare Conclave 2026</p>
          </div>
          <div className="schedule-heading-actions">
            <span>New Delhi</span>
            {isAdmin && (
              <button type="button" aria-label="Open schedule admin" onClick={() => setAdminOpen(true)}>
                <Settings className="h-4 w-4" />
              </button>
            )}
            <a href="/schedule" className="bg-[#e244b7] text-white px-5 py-2.5 rounded-full font-bold text-sm hover:bg-[#c9369e] transition-colors ml-4 shadow-sm inline-flex items-center gap-2">See full schedule <ArrowRight className="w-4 h-4" /></a>
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
      </div>
    </section>
  );
}

function SchedulePhaseCard({ phase, open, onToggle }) {
  const contentRef = useRef(null);
  const Icon = phase.icon;

  const headerContent = (
    <>
      <span className="schedule-phase-title-wrap">
        <span className="schedule-phase-icon"><Icon className="h-5 w-5" /></span>
        <span className="schedule-phase-title">
          <strong>{phase.title}</strong>
          <small>{phase.subtitle}</small>
          <span className={`schedule-status ${phase.statusType}`}>{phase.status}</span>
        </span>
      </span>
      <span className="schedule-phase-meta">
        {phase.href && (
          <span className="schedule-phase-detail-link">
            View schedule <ArrowRight className="h-3.5 w-3.5" />
          </span>
        )}
        {phase.href ? (
          <ArrowRight className="schedule-chevron h-5 w-5" />
        ) : (
          <ChevronRight className="schedule-chevron h-5 w-5" />
        )}
      </span>
    </>
  );

  const header = phase.href ? (
    <Link to={phase.href} className="schedule-phase-header" aria-label={`Open ${phase.title} full schedule`}>
      {headerContent}
    </Link>
  ) : (
    <button type="button" className="schedule-phase-header" onClick={onToggle} aria-expanded={open}>
      {headerContent}
    </button>
  );

  return (
    <motion.article className={`schedule-phase-card${open ? " open" : ""}`} whileTap={{ scale: 0.995 }}>
      {header}
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
    ["Click on Submit Abstract", "Start the submission process from the abstract submission section."],
    ["Fill details in the form", "Enter all the required information about you and your research."],
    ["Upload abstract", "Attach your abstract as a PDF."],
    ["Submit abstract", "Submit your form and await the review."],
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
  if (!activities.length) return <p className="schedule-empty">Schedule will be revealed soon.</p>;

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
    <section id="research-hub" className="w-full bg-white border-b border-gray-100">
      <div className="section-shell reveal-section py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
        <div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <SectionHeading eyebrow="Call for Abstract" title="Submit your research and present it to a global audience at GHC" />
          <div className="flex flex-wrap gap-3">
            <a href="/abstract-registration" className="inline-flex items-center gap-2 bg-[#173B8F] text-white px-6 py-3 rounded-full font-bold text-sm hover:-translate-y-1 transition-transform shadow-md">Submit Abstract <ArrowRight className="h-4 w-4" /></a>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.article id="research-guidelines" className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgba(16,24,40,0.06)] border border-gray-100 p-10 flex flex-col hover:border-[#173B8F]/30 hover:shadow-[0_12px_40px_rgba(16,24,40,0.1)] transition-all cursor-pointer group" whileHover={{ y: -6 }} onClick={() => setGuidelinesOpen(true)}>
            <div className="w-16 h-16 rounded-2xl bg-[#F8F9FC] border border-gray-100 text-[#00A6A6] flex items-center justify-center mb-6"><ClipboardCheck className="h-8 w-8" /></div>
            <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#101828] mb-4">Research Submission Guidelines</h3>
            <div className="flex flex-col gap-3 text-[#475467] font-medium mb-8 flex-1">
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#173B8F]" /> Poster submission rules</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#173B8F]" /> Oral presentation rules</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#173B8F]" /> Abstract requirements</span>
              <span className="flex items-center gap-2"><Check className="h-4 w-4 text-[#173B8F]" /> Ethics & Formats</span>
            </div>
            <div className="mt-auto pt-6 border-t border-gray-100">
              <button className="flex items-center gap-2 text-[#173B8F] font-bold group-hover:text-[#0D47A1]">View Guidelines <FileText className="h-4 w-4" /></button>
            </div>
          </motion.article>

          <motion.article className="bg-[#101828] rounded-[2rem] shadow-[0_8px_30px_rgba(16,24,40,0.1)] border border-gray-800 p-10 flex flex-col hover:-translate-y-1 transition-transform relative overflow-hidden" whileHover={{ y: -6 }}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#173B8F] rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
            <div className="relative z-10 w-16 h-16 rounded-2xl bg-[#173B8F]/20 border border-[#173B8F]/30 text-white flex items-center justify-center mb-6"><Microscope className="h-8 w-8" /></div>
            <h3 className="relative z-10 font-['Outfit'] text-2xl font-extrabold text-white mb-4">Submit Research</h3>
            <p className="relative z-10 text-gray-300 font-medium leading-relaxed mb-8 flex-1">Open the structured submission flow for personal details, institution, category, title, authors, abstract and PDF upload.</p>
            <div className="relative z-10 mt-auto pt-6 border-t border-gray-800">
              <a href="/abstract-registration" className="inline-flex items-center gap-2 bg-white text-[#101828] px-8 py-3.5 rounded-full font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm">Submit Abstract <ArrowRight className="h-4 w-4" /></a>
            </div>
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
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/10 mb-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-[#349e81]/20 text-[#349e81] flex items-center justify-center shrink-0">
                              <Microscope className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg text-white truncate">Research Abstract</h3>
                              <p className="text-[11px] text-white/50 font-medium truncate">Original Research Studies</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#349e81]/20 text-emerald-300 border border-[#349e81]/30 whitespace-nowrap shrink-0">
                            10 Sections
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {[
                            { num: "01", title: "TITLE" },
                            { num: "02", title: "AUTHOR & CO-AUTHOR DETAILS" },
                            { num: "03", title: "INTRODUCTION" },
                            { num: "04", title: "AIMS & OBJECTIVES" },
                            { num: "05", title: "METHODOLOGY" },
                            { num: "06", title: "RESULTS" },
                            { num: "07", title: "CONCLUSION" },
                            { num: "08", title: "KEYWORDS" },
                            { num: "09", title: "References", optional: true },
                            { num: "10", title: "Tables", optional: true },
                          ].map((item) => (
                            <div key={item.num} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors ${item.optional ? "bg-white/[0.02] border border-dashed border-white/10" : "bg-white/[0.04] border border-white/5"}`}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-white/10 text-white/90 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {item.num}
                                </span>
                                <span className="font-semibold text-white/90 tracking-tight text-[11px] sm:text-xs">
                                  {item.title}
                                </span>
                              </div>
                              {item.optional ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0 ml-2">
                                  Optional
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                  Required
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-white/10 mb-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                              <Stethoscope className="w-4 h-4" />
                            </span>
                            <div className="min-w-0">
                              <h3 className="font-bold text-lg text-white truncate">Case Abstract</h3>
                              <p className="text-[11px] text-white/50 font-medium truncate">Clinical Case Reports & Series</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 whitespace-nowrap shrink-0">
                            4 Sections
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs">
                          {[
                            { num: "01", title: "TITLE" },
                            { num: "02", title: "INTRODUCTION" },
                            { num: "03", title: "AUTHOR & CO-AUTHOR DETAILS" },
                            { num: "04", title: "CASE DESCRIPTION" },
                          ].map((item) => (
                            <div key={item.num} className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/5">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-md bg-white/10 text-white/90 font-bold text-[10px] flex items-center justify-center shrink-0">
                                  {item.num}
                                </span>
                                <span className="font-semibold text-white/90 tracking-tight text-[11px] sm:text-xs">
                                  {item.title}
                                </span>
                              </div>
                              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                Required
                              </span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 rounded-xl bg-white/[0.04] border border-white/10 p-3.5 space-y-2">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-blue-300">
                            <Info className="w-3.5 h-3.5 shrink-0" />
                            <span>Case Description Breakdown:</span>
                          </div>
                          <p className="text-[11px] text-white/70 leading-relaxed">
                            Must be presented together under the single <strong>CASE DESCRIPTION</strong> heading and include:
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 pt-1">
                            {["History", "Examination", "Investigations", "Diagnosis", "Treatment", "Follow-up"].map((part) => (
                              <div key={part} className="flex items-center gap-1.5 text-[11px] text-white/90 font-medium bg-white/[0.05] px-2.5 py-1.5 rounded-lg border border-white/10 whitespace-nowrap">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                <span>{part}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
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
      </div>
      </div>
    </section>
  );
}

function PanelDiscussionSection() {
  const panels = [
    {
      title: "HPV and Cervical Cancer",
      icon: HeartPulse,
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=800&auto=format&fit=crop",
      badge: "Oncology & Prevention",
      description: "Discussing prevention, early detection, and the latest treatment protocols.",
      tags: ["Prevention", "Screening", "Oncology"],
    },
    {
      title: "Stem Cell",
      icon: Dna,
      image: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?q=80&w=800&auto=format&fit=crop",
      badge: "Regenerative Medicine",
      description: "Exploring regenerative medicine and ethical frontiers in stem cell research.",
      tags: ["Regenerative Medicine", "Cellular Biology"],
    },
    {
      title: "Medical Education",
      icon: ClipboardCheck,
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?q=80&w=800&auto=format&fit=crop",
      badge: "Curriculum & Training",
      description: "Navigating the evolving landscape for medical students.",
      tags: ["Undergraduate (UG)", "Postgraduate (PG)", "FMGs"],
    },
    {
      title: "AI in Healthcare",
      icon: BrainCircuit,
      image: "https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=800&auto=format&fit=crop",
      badge: "Digital Health",
      description: "Leveraging artificial intelligence for clinical decision support and automation.",
      tags: ["Clinical AI", "Automation", "Diagnostics"],
    },
  ];

  return (
    <section id="panel-discussion" className="section-shell reveal-section bg-white py-24 border-y border-gray-100">
      <div className="mb-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading eyebrow="Expert Forums" title="Panel Discussions." text="Engage with thought leaders on critical healthcare topics and future directions." dark={false} />
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <motion.article
              key={panel.title}
              className="bg-[#F8F9FC] rounded-[2rem] border border-gray-100 shadow-sm p-6 flex flex-col justify-between h-full group hover:-translate-y-2 hover:shadow-lg hover:border-[#173B8F]/20 transition-all duration-300"
              whileHover={{ y: -6 }}
            >
              <div>
                {/* Panel Image Container */}
                <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 bg-gray-100">
                  <img
                    src={panel.image}
                    alt={panel.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081B33]/70 via-transparent to-transparent" />
                  
                  {/* Floating Icon */}
                  <div className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-[#173B8F] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Badge */}
                  <div className="absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-wider text-white bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                    {panel.badge}
                  </div>
                </div>

                <h3 className="font-['Outfit'] text-xl font-bold text-[#101828] mb-2 min-h-[3.25rem] line-clamp-2 leading-snug">
                  {panel.title}
                </h3>
                <p className="text-[#475467] font-medium text-sm leading-relaxed mb-4 min-h-[3.75rem] line-clamp-3">
                  {panel.description}
                </p>
              </div>

              {/* Tag Pills */}
              <div className="mt-auto pt-4 border-t border-gray-200/80 flex flex-wrap gap-1.5">
                {panel.tags?.map((tag, idx) => {
                  const isMedical = panel.title === "Medical Education";
                  const colors = isMedical
                    ? idx === 0
                      ? "text-[#173B8F] bg-[#173B8F]/10"
                      : idx === 1
                      ? "text-[#00A6A6] bg-[#00A6A6]/10"
                      : "text-[#f43f5e] bg-[#f43f5e]/10"
                    : "text-[#173B8F] bg-blue-50/80";
                  return (
                    <span
                      key={tag}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${colors}`}
                    >
                      {tag}
                    </span>
                  );
                })}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

const defaultHospitalityCafes = [
  { _id: "hc1", name: "SDA Market Cafes", description: "Right opposite IIT Delhi, a bustling hub of vibrant cafes, student hangouts, and budget eats.", address: "Opposite IIT Delhi, New Delhi", googleMapsLink: "https://maps.google.com/?q=SDA+Market+New+Delhi" },
  { _id: "hc2", name: "Green Park Market", description: "Quiet and aesthetic coffee shops offering high-speed Wi-Fi and relaxed work atmosphere.", address: "Green Park Main, New Delhi", googleMapsLink: "https://maps.google.com/?q=Green+Park+Market+New+Delhi" },
  { _id: "hc3", name: "Satya Niketan", description: "South Campus hotspot famous for student-friendly pricing, hearty meals, and vibrant youth culture.", address: "South Campus, New Delhi", googleMapsLink: "https://maps.google.com/?q=Satya+Niketan+New+Delhi" },
];

const defaultHospitalityStays = [
  { _id: "hs1", name: "Central Delhi Accommodations", description: "Premium accommodations in central Delhi within convenient reach of the conclave sessions.", address: "Connaught Place, New Delhi", googleMapsLink: "https://maps.google.com/?q=Connaught+Place+New+Delhi" },
  { _id: "hs2", name: "Green Park Hostels", description: "Clean, modern, and affordable student backpacker stays within 5 minutes of the Yellow Line metro.", address: "Green Park Main, New Delhi", googleMapsLink: "https://maps.google.com/?q=Green+Park+New+Delhi" },
  { _id: "hs3", name: "South Extension Guest Houses", description: "Comfortable boutique accommodations offering great value and fast auto-rickshaw access in New Delhi.", address: "South Extension Part 1, New Delhi", googleMapsLink: "https://maps.google.com/?q=South+Extension+New+Delhi" },
];

function VenueSection() {
  const [cafes, setCafes] = useState([]);
  const [stays, setStays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHospitality = async () => {
      try {
        const [cafesRes, staysRes] = await Promise.all([
          axios.get(apiUrl("/api/cafes")).catch(() => ({ data: { cafes: [] } })),
          axios.get(apiUrl("/api/stays")).catch(() => ({ data: { stays: [] } })),
        ]);
        const activeCafes = cafesRes.data.cafes?.filter(c => c.status !== "inactive") || [];
        const activeStays = staysRes.data.stays?.filter(s => s.status !== "inactive") || [];
        setCafes(activeCafes);
        setStays(activeStays);
      } catch (err) {
        console.error("Error fetching hospitality data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHospitality();
  }, []);

  const displayCafes = cafes.length > 0 ? cafes : defaultHospitalityCafes;
  const displayStays = stays.length > 0 ? stays : defaultHospitalityStays;

  const officialVenueInfo = [
    { icon: MapPin, title: "Official Venue", text: "New Delhi" },
    { icon: Hotel, title: "Accommodations", text: "Curated delegate stays and hotels across New Delhi" },
    { icon: Plane, title: "Transit Access", text: "New Delhi transit connectivity & metro access" },
    { icon: BadgeCheck, title: "Delegate Desk", text: "On-site registration, badge issuance, and workshop routing" },
  ];

  return (
    <section id="venue" className="section-shell reveal-section">
      <div className="venue-grid">
        <div className="venue-visual">
          <div className="venue-media">
            <span>New Delhi</span>
          </div>
          <div className="map-placeholder">
            <a 
              href="https://maps.google.com/?q=New+Delhi" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 hover:text-blue-400 transition-colors"
            >
              <MapPin className="h-7 w-7 text-[#4FC3F7]" />
              <span>View New Delhi on Google Maps</span>
            </a>
          </div>
        </div>
        <div className="venue-content">
          <SectionHeading 
            eyebrow="Venue" 
            title="New Delhi" 
            text="Join us in New Delhi for the flagship Global Healthcare Conclave 2026. The capital city hosts our academic keynotes, clinical workshops, research showcases, and delegate networking sessions." 
          />
          <div className="venue-info-grid">
            {officialVenueInfo.map((item) => {
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

      <div className="mt-24 mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading 
          eyebrow="Hospitality" 
          title="Recommended Cafes & Accommodations" 
          text="Curated student-friendly spots and delegate stays for your time in New Delhi." 
        />
        
        <div className="grid md:grid-cols-2 gap-12 mt-12">
          <div>
            <h3 className="text-2xl font-bold font-['Sora'] mb-6 flex items-center gap-3">
              <Coffee className="text-[#4FC3F7]" /> Student-Friendly Cafes
            </h3>
            <div className="grid gap-6">
              {displayCafes.map((cafe) => (
                <motion.article key={cafe._id || cafe.id} className="research-gradient-card research-action-card h-full flex flex-col justify-between" whileHover={{ y: -5, scale: 1.02 }}>
                  <div>
                    <h4 className="text-xl font-bold mb-2 font-['Sora'] text-white">{cafe.name}</h4>
                    <p className="text-sm opacity-80 mb-6 leading-relaxed">{cafe.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#4FC3F7]" /> {cafe.address}</span>
                    {cafe.googleMapsLink && (
                      <a href={cafe.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-[#4FC3F7] text-sm font-bold hover:text-white flex items-center gap-1.5 transition-colors">
                        Map <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="text-2xl font-bold font-['Sora'] mb-6 flex items-center gap-3">
              <Hotel className="text-[#4FC3F7]" /> Accommodations
            </h3>
            <div className="grid gap-6">
              {displayStays.map((stay) => (
                <motion.article key={stay._id || stay.id} className="research-gradient-card research-action-card h-full flex flex-col justify-between" whileHover={{ y: -5, scale: 1.02 }}>
                  <div>
                    <h4 className="text-xl font-bold mb-2 font-['Sora'] text-white">{stay.name}</h4>
                    <p className="text-sm opacity-80 mb-6 leading-relaxed">{stay.description}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider opacity-60 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#4FC3F7]" /> {stay.address}</span>
                    {stay.googleMapsLink && (
                      <a href={stay.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-[#4FC3F7] text-sm font-bold hover:text-white flex items-center gap-1.5 transition-colors">
                        Map <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PartnerMarquee({ partners = [] }) {
  const marqueeItems = Array.isArray(partners)
    ? partners.map((partner) => ({
        id: partner.id,
        category: partner.tier || partner.tierName || "Partner",
        name: partner.name || partner.companyName,
        type: "logo",
        logo: partner.logo || partner.logoUrl,
        website: partner.website,
      })).filter((partner) => partner.name)
    : [];

  const groupedItems = marqueeItems.reduce((acc, item) => {
    const cat = item.category || "Sponsor";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <section id="sponsors" className="reveal-section py-24 bg-[#F8F9FC] border-y border-gray-100">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <div className="text-center mb-20 relative flex flex-col items-center">
          <div className="relative inline-block">
            <h2 className="text-3xl md:text-[2.5rem] font-extrabold text-[#101828] font-['Outfit'] leading-tight z-10 relative">
              Event Sponsors
            </h2>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -left-6 top-1/2 -translate-y-1/2">
              <path d="M7 0L13.0622 10.5H0.937822L7 0Z" fill="#00A6A6" transform="rotate(-25 7 7)"/>
            </svg>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-8 -top-4 opacity-80">
              <path d="M12 0L24 24H0L12 0Z" fill="#173B8F" transform="rotate(15 12 12)"/>
            </svg>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute -right-2 top-2 opacity-90">
              <path d="M6 0L12 10H0L6 0Z" fill="#475467" transform="rotate(-15 6 6)"/>
            </svg>
          </div>
        </div>

        {marqueeItems.length > 0 ? (
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-32 mt-16">
            {marqueeItems.map((item, index) => {
            const logoUrl = item.logo?.startsWith("/uploads") ? apiUrl(item.logo) : item.logo;
            const partnerKey = item.id ? `partner-${item.id}-${index}` : `${item.category}-${item.name}-${index}`;
            
            const content = (
              <>
                <span className="flex h-28 w-44 items-center justify-center md:h-32 md:w-56">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain filter grayscale transition-all duration-300 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="text-center text-3xl font-black text-[#101828] font-['Outfit'] tracking-tighter md:text-4xl">{item.name}</span>
                  )}
                </span>
                <span className="text-sm md:text-base font-bold text-[#475467] uppercase tracking-widest">{item.name}</span>
              </>
            );

            return item.website ? (
              <a
                key={partnerKey}
                href={item.website}
                target="_blank"
                rel="noreferrer"
                className="flex flex-col items-center justify-center transition-transform hover:scale-105 gap-6 group cursor-pointer"
              >
                {content}
              </a>
            ) : (
              <div key={partnerKey} className="flex flex-col items-center justify-center transition-transform hover:scale-105 gap-6">
                {content}
              </div>
            );
            })}
          </div>
        ) : (
          <div className="mt-14 mx-auto max-w-2xl rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-10 text-center shadow-[0_8px_24px_rgba(16,24,40,0.04)]">
            <p className="font-['Outfit'] text-lg font-extrabold text-[#101828]">Sponsors will appear here soon</p>
            <p className="mt-2 text-sm font-medium text-[#667085]">Add active sponsors in the Admin CMS to publish them on the homepage.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function PastOrganisations() {
  const orgs = [
    { name: "FAIMA", logo: "/assets/logos/faima.jpg" },
    { name: "AFPI", logo: "/assets/logos/afpi.png" },
    { name: "IRCF", logo: "/assets/logos/ircf.jpg" },
    { name: "AEME", logo: "/assets/logos/aeme.jpg" },
    { name: "GJMS", logo: "/assets/logos/GJMS logo.png" },
    { name: "SMR", logo: "/assets/logos/SMR.jpeg" }
  ];

  // Repeat items for a smooth, gapless infinite loop
  const repeatedOrgs = [...orgs, ...orgs, ...orgs, ...orgs];

  return (
    <section id="past-organisations" className="w-full bg-[#F8F9FC] py-24 border-t border-gray-100 overflow-hidden">
      <div className="section-shell reveal-section relative">
        <SectionHeading
          eyebrow="Partnerships"
          title="Our Past Collaborating Organisations"
          text="Esteemed national and international bodies that have joined hands with GHC."
          dark={false}
        />
        
        <div className="partner-marquee mt-14 relative z-10">
          <div className="partner-marquee-track" style={{ animationDuration: '60s', gap: '2rem' }}>
            {repeatedOrgs.map((org, index) => (
              <div
                key={`${org.name}-${index}`}
                className="group relative flex flex-col items-center justify-center p-8 sm:p-10 rounded-[2.5rem] bg-white border border-gray-100 shadow-[0_8px_24px_rgba(16,24,40,0.04)] hover:shadow-[0_16px_36px_rgba(16,24,40,0.1)] transition-all duration-500 overflow-hidden hover:border-[#173B8F]/20 hover:-translate-y-2 w-[280px] sm:w-[320px] min-h-[300px] shrink-0"
              >
                {/* Subtle gradient background on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#173B8F]/5 to-[#00A6A6]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10 w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center p-4 mb-6 group-hover:shadow-md transition-all duration-500 group-hover:scale-105 overflow-hidden">
                  {org.logo ? (
                    <img 
                      src={org.logo} 
                      alt={org.name} 
                      className="w-full h-full object-contain transition-transform duration-700 ease-out group-hover:scale-105" 
                      loading="lazy"
                    />
                  ) : (
                    <Globe2 className="h-14 w-14 text-[#00A6A6]" />
                  )}
                </div>
                
                <h3 className="font-['Outfit'] font-extrabold text-[#081B33] text-center text-xl sm:text-2xl relative z-10 group-hover:text-[#173B8F] transition-colors duration-300 tracking-tight">
                  {org.name}
                </h3>
                
                <span className="text-[11px] uppercase font-bold tracking-widest text-[#64748B] mt-1 relative z-10">
                  Collaborating Partner
                </span>
                
                {/* Animated underline */}
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 h-1.5 w-0 bg-gradient-to-r from-[#173B8F] to-[#00A6A6] rounded-full group-hover:w-16 transition-all duration-500 ease-out opacity-0 group-hover:opacity-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const EARLY_BIRD_DEADLINE = new Date("2026-10-05T23:59:59+05:30").getTime();

function PricingSection() {
  const [earlyBirdManualOff, setEarlyBirdManualOff] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = EARLY_BIRD_DEADLINE - Date.now();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isExpired: false,
    };
  });

  useEffect(() => {
    axios
      .get(apiUrl("/api/settings/public"))
      .then((res) => {
        if (res.data?.registration?.earlyBirdManualOff !== undefined) {
          setEarlyBirdManualOff(Boolean(res.data.registration.earlyBirdManualOff));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = EARLY_BIRD_DEADLINE - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / (1000 * 60)) % 60),
          seconds: Math.floor((diff / 1000) % 60),
          isExpired: false,
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isEarlyBirdActive = !earlyBirdManualOff && !timeLeft.isExpired;

  return (
    <section id="pricing" className="section-shell reveal-section bg-white py-16 sm:py-20 lg:py-24">
      <div className="mb-9 sm:mb-11 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Registration Fees"
          title="Conference Passes."
          text="Secure your delegate pass for the Global Healthcare Conclave 2026."
        />
      </div>

      <div className="max-w-xl lg:max-w-5xl mx-auto px-4 sm:px-6">
        <motion.article
          className="bg-[#101828] rounded-[2rem] sm:rounded-[2.2rem] shadow-[0_20px_60px_rgba(16,24,40,0.35)] border border-gray-800 p-6 sm:p-8 lg:p-8 flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)] lg:gap-x-8 relative overflow-hidden"
          whileHover={{ y: -4 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle ambient lighting glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00A6A6] rounded-full blur-[100px] opacity-20 -mr-24 -mt-24 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#173B8F] rounded-full blur-[100px] opacity-20 -ml-24 -mb-24 pointer-events-none" />

          {/* Top header row */}
          <div className="relative z-10 flex flex-col items-center text-center gap-3 mb-5 lg:col-start-1 lg:row-start-1 lg:items-start lg:text-left">
            <div className="w-12 h-12 rounded-2xl bg-[#00A6A6]/20 border border-[#00A6A6]/30 text-[#00E5E5] flex items-center justify-center">
              <Ticket className="h-6 w-6" />
            </div>
            {isEarlyBirdActive ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-[#00A6A6]/20 text-[#00E5E5] border border-[#00A6A6]/30 shadow-[0_0_15px_rgba(0,166,166,0.25)]">
                <Sparkles className="h-3.5 w-3.5" /> Early Bird Registration
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase bg-white/10 text-gray-300 border border-white/10">
                <Clock3 className="h-3.5 w-3.5" /> Regular Registration
              </span>
            )}
          </div>

          {/* Card Title & Subtitle */}
          <h3 className="relative z-10 font-['Outfit'] text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-2 text-center lg:col-start-1 lg:row-start-2 lg:text-left">
            Registration
          </h3>
          <p className="relative z-10 text-gray-300 font-medium leading-relaxed mb-6 text-sm sm:text-base text-center lg:col-start-1 lg:row-start-3 lg:text-left">
            {isEarlyBirdActive
              ? "Avail special early bird delegate rates before regular registration opens."
              : "Standard delegate registration passes for the Global Healthcare Conclave 2026."}
          </p>

          {/* Pricing items */}
          <div className="relative z-10 flex flex-col gap-3 mb-6 lg:col-start-1 lg:row-start-4 lg:mb-0">
            {/* GAIMS Elite Member */}
            <div className="flex flex-col items-start justify-between gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#00A6A6]/40 transition-colors">
              <div>
                <span className="text-white font-['Outfit'] text-base font-bold block">
                  GAIMS Elite member
                </span>
                <span className="text-xs text-gray-400 font-medium">Verified GAIMS Members</span>
              </div>
              <div className="flex items-baseline gap-2">
                {isEarlyBirdActive ? (
                  <>
                    <span className="text-gray-400 font-semibold line-through text-lg">2500</span>
                    <span className="text-gray-500 font-light text-2xl">/</span>
                    <span className="text-[#00E5E5] font-['Outfit'] text-3xl font-extrabold tracking-tight">
                      1500
                    </span>
                  </>
                ) : (
                  <span className="text-white font-['Outfit'] text-3xl font-extrabold tracking-tight">
                    ₹2,500
                  </span>
                )}
              </div>
            </div>

            {/* Non-Elite */}
            <div className="flex flex-col items-start justify-between gap-2 p-4 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-[#00A6A6]/40 transition-colors">
              <div>
                <span className="text-white font-['Outfit'] text-base font-bold block">
                  Non Elite member
                </span>
                <span className="text-xs text-gray-400 font-medium">Standard / Non-Member Delegates</span>
              </div>
              <div className="flex items-baseline gap-2">
                {isEarlyBirdActive ? (
                  <>
                    <span className="text-gray-400 font-semibold line-through text-lg">3000</span>
                    <span className="text-gray-500 font-light text-2xl">/</span>
                    <span className="text-[#00E5E5] font-['Outfit'] text-3xl font-extrabold tracking-tight">
                      2000
                    </span>
                  </>
                ) : (
                  <span className="text-white font-['Outfit'] text-3xl font-extrabold tracking-tight">
                    ₹3,000
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Countdown timer / status box */}
          <div className="relative z-10 mb-6 lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:self-center lg:mb-0 lg:border-l lg:border-white/10 lg:pl-8">
            {isEarlyBirdActive ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-[#00A6A6]/30 text-center relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest font-bold text-[#00E5E5] mb-3">
                  <Clock3 className="h-4 w-4 animate-pulse" />
                  <span>Early Bird Ends In</span>
                </div>
                <div className="grid grid-cols-4 gap-2 max-w-xs mx-auto">
                  <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <div className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-white">
                      {String(timeLeft.days).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                      Days
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <div className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-white">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                      Hours
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <div className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-white">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 mt-1">
                      Mins
                    </div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
                    <div className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#00E5E5]">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </div>
                    <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#00E5E5]/80 mt-1">
                      Secs
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400 mt-3 font-medium">
                  Ends on 5th October 2026 at 11:59 PM IST
                </p>
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-center">
                <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold text-gray-200">
                  <Check className="h-4 w-4 text-[#00A6A6]" />
                  <span>Regular Registration Is Now Open</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5 font-medium">
                  Early bird period has closed. Passes are now available at regular rates.
                </p>
              </div>
            )}
          </div>

          {/* Register Now Button */}
          <div className="relative z-10 lg:col-start-2 lg:row-start-5 lg:border-l lg:border-white/10 lg:pl-8">
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-[#00A6A6] to-[#173B8F] hover:from-[#00b8b8] hover:to-[#1e48ad] px-8 py-3.5 font-['Inter'] text-base font-extrabold text-white shadow-[0_8px_25px_rgba(0,166,166,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(0,166,166,0.5)] active:translate-y-0"
            >
              Register Now <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </motion.article>
      </div>

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
        <p className="text-sm text-[#475467] font-medium">Not a GAIMS member yet?</p>
        <a
          href="https://portal.gaims.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full bg-[#173B8F] px-6 py-2.5 font-['Inter'] text-xs font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 hover:bg-[#0D47A1]"
        >
          Join GAIMS - ₹999 only <ArrowRight className="h-3.5 w-3.5" />
        </a>
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
  "abstract-confirmation": {
    title: "Confirm Abstract Participation - Global Healthcare Conclave 2026",
    description: "Confirm your accepted abstract presentation participation for the Global Healthcare Conclave 2026 research program.",
    keywords: "abstract confirmation, GHC 2026 abstract, research presentation confirmation",
    path: "/abstract/confirm",
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
    description: "Venue, transport and travel guide for the Global Healthcare Conclave 2026 in New Delhi — including local attractions and metro directions.",
    keywords: "GHC 2026 venue, New Delhi, conclave location, travel guide New Delhi, metro directions",
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
  "abstract-confirmation": ["abstract-confirmation"],
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
  const isWorkshopRegisterRoute = location.pathname.startsWith("/register/workshop") || (location.pathname.startsWith("/workshops/") && location.pathname.endsWith("/apply"));
  const isRegisterRoute = location.pathname.startsWith("/register");
  const isAbstractRoute = location.pathname.startsWith("/abstract-registration");
  const isAbstractRevisionRoute = location.pathname.startsWith("/abstract/revise") || location.pathname.startsWith("/abstract-revision");
  const isAbstractParticipationRoute = location.pathname.startsWith("/abstract/confirm");
  const isPartnerRoute = location.pathname.startsWith("/partners") || location.pathname.startsWith("/partnership");
  const isWorkshopDetailRoute = location.pathname.startsWith("/workshops/") && location.pathname !== "/workshops/" && !location.pathname.endsWith("/apply");
  const isGooglePayTestRoute = location.pathname.startsWith("/google-pay-test");
  const isVerifyCertificateRoute = location.pathname.startsWith("/verify-certificate");
  const isDynamicFormRoute = location.pathname.startsWith("/forms/");
  const isNominationsRoute = location.pathname.startsWith("/nominations");
  const isCommitteesRoute = location.pathname.startsWith("/committees");
  const isVisaRoute = location.pathname.startsWith("/visa-application") || location.pathname === "/visa" || location.pathname === "/visa/";
  const isVenueRoute = location.pathname.startsWith("/venue");
  const isAboutRoute = location.pathname.startsWith("/about");
  const isBoardMeetingRoute = location.pathname.startsWith("/board-meeting-register");
  const isAnnualMeetingRoute = location.pathname.startsWith("/annual-meeting-invite");
  const isQRAttendanceRoute = location.pathname.startsWith("/qr-attendance");
  const isScheduleRoute = location.pathname.startsWith("/schedule");
  const isJudgeRoute = location.pathname.startsWith("/judge");
  const [installPrompt, setInstallPrompt] = useState(null);
  const [homepageSync, setHomepageSync] = useState({ banners: [], homepage: [], mediaPartners: [], notifications: [], seo: [] });
  const [partners, setPartners] = useState([]);

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else if (location.pathname === "/workshops" || location.pathname === "/workshops/") {
      const el = document.getElementById("workshops-experience");
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (
      isAdminRoute ||
      isRegisterRoute ||
      isAbstractRoute ||
      isAbstractRevisionRoute ||
      isAbstractParticipationRoute ||
      isPartnerRoute ||
      isWorkshopDetailRoute ||
      isWorkshopRegisterRoute ||
      isGooglePayTestRoute ||
      isVerifyCertificateRoute ||
      isDynamicFormRoute ||
      isNominationsRoute ||
      isJudgeRoute
    ) {
      return undefined;
    }

    let active = true;

    const fetchHomepageCms = async () => {
      try {
        const [syncResponse, partnersResponse] = await Promise.all([
          axios.get(apiUrl(publicMarketingSyncEndpoint)).catch(() => ({ data: {} })),
          axios.get(apiUrl("/api/partners")).catch(() => ({ data: { partners: [] } })),
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
        const seenSponsors = new Set();
        const cmsSponsors = (partnersResponse.data?.partners || [])
          .map((partner) => ({
            id: `partner-${partner.id}`,
            sourceId: partner.id,
            name: partner.name,
            logo: partner.logo,
            website: partner.website,
            tier: partner.tier || "Partner",
            displayOrder: Number(partner.displayOrder || 0),
          }))
          .filter((partner) => {
            const key = `${String(partner.name || "").trim().toLowerCase()}|${String(partner.website || "").trim().toLowerCase()}`;
            if (!key.trim() || seenSponsors.has(key)) return false;
            seenSponsors.add(key);
            return true;
          })
          .sort((a, b) => (Number(a.displayOrder || 999) - Number(b.displayOrder || 999)) || String(a.name).localeCompare(String(b.name)));
        setPartners(cmsSponsors);
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
    isAbstractRevisionRoute,
    isAbstractParticipationRoute,
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
    } else if (isAbstractParticipationRoute) {
      key = "abstract-confirmation";
      defaults = routeSeoDefaults["abstract-confirmation"];
      path = "/abstract/confirm";
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
    const isRedesign = location.pathname === '/' || location.pathname === '/about' || location.pathname.startsWith('/abstract') || location.pathname.startsWith('/nominations') || location.pathname.startsWith('/visa-application') || location.pathname.startsWith('/visa');
    if (isRedesign) {
      document.body.classList.add('redesign-active');
      document.documentElement.classList.add('redesign-active');
    } else {
      document.body.classList.remove('redesign-active');
      document.documentElement.classList.remove('redesign-active');
    }
    return () => {
      document.body.classList.remove('redesign-active');
      document.documentElement.classList.remove('redesign-active');
    };
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isAdminRoute || isJudgeRoute || isRegisterRoute || isAbstractRoute || isAbstractRevisionRoute || isAbstractParticipationRoute || isPartnerRoute || isWorkshopDetailRoute || isWorkshopRegisterRoute || isGooglePayTestRoute || isVerifyCertificateRoute || isDynamicFormRoute || isNominationsRoute || isVisaRoute) {
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
  }, [isAbstractRoute, isAbstractRevisionRoute, isAbstractParticipationRoute, isAdminRoute, isDynamicFormRoute, isGooglePayTestRoute, isPartnerRoute, isRegisterRoute, isVerifyCertificateRoute, isWorkshopDetailRoute, isWorkshopRegisterRoute]);

  let routeContent;

  if (isWorkshopCmsRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading GHC CMS...</div>}><AdminApp initialPage="workshops" /></Suspense>;
  } else if (isVerifyCertificateRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading verification...</div>}><VerifyCertificate /></Suspense>;
  } else if (isDynamicFormRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading form...</div>}><DynamicForm /></Suspense>;
  } else if (isGooglePayTestRoute) {
    routeContent = <Suspense fallback={<div className="admin-loading">Loading Google Pay...</div>}><GooglePayTest /></Suspense>;
  } else if (isAdminRoute || isJudgeRoute) {
    const initialPage = isJudgeRoute
      ? (location.pathname.startsWith("/judge/nominations") ? "award-nominations" : "dashboard")
      : undefined;
    routeContent = <Suspense fallback={<div className="admin-loading">Loading GHC CMS...</div>}><AdminApp initialPage={initialPage} /></Suspense>;
  } else if (isWorkshopRegisterRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading workshop registration...</div>}><WorkshopRegister /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isRegisterRoute) {
    routeContent = (
      <>
        <RegistrationRedirect />
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
      <div ref={appRef} className="min-h-screen overflow-hidden bg-white text-[#081B33]">
        <Navbar />
        <main className="bg-white">
          <Suspense fallback={<div className="admin-loading">Loading abstract revision...</div>}><AbstractRevision /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isAbstractParticipationRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-white text-[#081B33]">
        <Navbar />
        <main className="bg-white">
          <Suspense fallback={<div className="admin-loading">Loading confirmation...</div>}><AbstractParticipationConfirm /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
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
      <div ref={appRef} className="min-h-screen overflow-hidden bg-white text-[#081B33]">
        <Navbar />
        <main className="bg-white">
          <Suspense fallback={<div className="admin-loading">Loading nominations...</div>}><Nominations /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
    );
  } else if (isVisaRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-white text-[#081B33]">
        <Navbar />
        <main className="bg-white">
          <Suspense fallback={<div className="admin-loading">Loading visa application...</div>}><VisaApplication /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
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
  } else if (isScheduleRoute) {
    routeContent = (
      <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading schedule...</div>}><Schedule /></Suspense>
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
      <div ref={appRef} className="min-h-screen overflow-x-hidden bg-[#F7FBFF] text-[#081B33]">
        <Navbar />
        <main>
          <Suspense fallback={<div className="admin-loading">Loading workshop...</div>}><WorkshopDetail /></Suspense>
        </main>
        <Footer />
        <MobileRadialNav />
      </div>
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
