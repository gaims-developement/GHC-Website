import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useLocation } from "react-router-dom";
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
  Bookmark,
  Settings,
  Users,
  Wrench,
  X,
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AdminApp = lazy(() => import("./admin/AdminApp"));
const Register = lazy(() => import("./pages/Register"));
const AbstractRegister = lazy(() => import("./pages/AbstractRegister"));
const PartnershipPortal = lazy(() => import("./pages/PartnershipPortal"));
const WorkshopDetail = lazy(() => import("./pages/WorkshopDetail"));
const WorkshopRegister = lazy(() => import("./pages/WorkshopRegister"));
const GooglePayTest = lazy(() => import("./pages/GooglePayTest"));
const VerifyCertificate = lazy(() => import("./pages/VerifyCertificate"));
const DynamicForm = lazy(() => import("./pages/DynamicForm"));

const navLinks = [
  ["Home", "home"],
  ["About", "about"],
  ["Tracks", "tracks"],
  ["Speakers", "world-class-speakers"],
  ["Workshops", "workshops-experience"],
  ["Timeline", "ghc-timeline"],
  ["Research", "research-hub"],
  ["Register", "registration-cta"],
  ["Contact", "contact"],
];

const impactCards = [
  { title: "Global Reach", text: "Policy • Research • Innovation", icon: Globe2 },
  { title: "Clinical Excellence", text: "Workshops • Skills • Practice", icon: Stethoscope },
  { title: "Research Ecosystem", text: "Abstracts • Posters • Publications", icon: Microscope },
  { title: "Collaboration", text: "Students • Experts • Institutions", icon: Users },
];

const tracks = [
  { title: "Digital Health & AI", icon: BrainCircuit, text: "Clinical intelligence, connected care, diagnostics and responsible automation." },
  { title: "Global Health Policy", icon: Globe2, text: "Health diplomacy, equity frameworks and resilient cross-border systems." },
  { title: "Public Health", icon: Users, text: "Population health, epidemiology, prevention and scalable community outcomes." },
  { title: "Mental Health", icon: HeartPulse, text: "Integrated wellbeing, accessible care models and student health leadership." },
  { title: "Women's Health", icon: Dna, text: "Maternal care, reproductive equity, lifespan health and inclusive research." },
  { title: "Climate Health", icon: Leaf, text: "Planetary health risks, climate-ready hospitals and sustainable systems." },
  { title: "Research", icon: Microscope, text: "Translational science, student inquiry, publication pathways and evidence exchange." },
  { title: "Leadership", icon: ShieldCheck, text: "Healthcare governance, ethics, institutional strategy and future skills." },
];

const apiEndpoints = {
  speakers: "/api/speakers",
  workshops: "/api/workshops",
};

const mockSpeakers = [
  {
    featured: true,
    photo: "keynote-am",
    initials: "AM",
    name: "Dr. Aarya Menon",
    institution: "Global Health Systems Institute",
    designation: "Director, International Health Policy",
    topic: "Reimagining Healthcare Beyond Borders",
  },
  { photo: "ks", initials: "KS", name: "Prof. Kabir Shah", institution: "MedTech AI Lab", designation: "Chair, Clinical Intelligence", topic: "AI Safety in Patient Care" },
  { photo: "lr", initials: "LR", name: "Dr. Leena Rao", institution: "National Public Health Forum", designation: "Epidemiologist", topic: "Population Health at Scale" },
  { photo: "ok", initials: "OK", name: "Dr. Omar Khalid", institution: "Planetary Health Council", designation: "Climate Health Lead", topic: "Resilient Hospitals" },
  { photo: "ms", initials: "MS", name: "Dr. Mira Sen", institution: "Women's Care Collaborative", designation: "Maternal Health Specialist", topic: "Equity Across the Lifespan" },
  { photo: "ec", initials: "EC", name: "Prof. Ethan Cole", institution: "Translational Research Network", designation: "Research Strategy Advisor", topic: "From Abstract to Impact" },
];

const mockWorkshops = [
  { title: "Airway Management", capacity: 40, faculty: "Dept. of Anaesthesiology", remaining: 9, duration: "3 hrs" },
  { title: "CPR & COLS", capacity: 60, faculty: "Emergency Response Faculty", remaining: 14, duration: "2.5 hrs" },
  { title: "AI in Healthcare", capacity: 50, faculty: "Digital Health Lab", remaining: 11, duration: "2 hrs" },
  { title: "Research Methodology", capacity: 45, faculty: "Clinical Research Cell", remaining: 7, duration: "3 hrs" },
  { title: "Emergency Medicine", capacity: 36, faculty: "Emergency Medicine Unit", remaining: 5, duration: "4 hrs" },
  { title: "Suturing Skills", capacity: 30, faculty: "Surgical Skills Studio", remaining: 6, duration: "2 hrs" },
];

const defaultScheduleActivities = {
  day1: [
    { time: "09:00", title: "Opening Keynote", speaker_name: "Dr. Aisha Malik", speaker_designation: "WHO Director", category: "Keynote" },
    { time: "10:30", title: "Global Health Policy Panel", speaker_name: "Prof. Daniel Mehta", speaker_designation: "Health Systems Chair", category: "Panel" },
    { time: "12:00", title: "Networking Break", speaker_name: "GHC Hospitality Team", speaker_designation: "Delegate Lounge", category: "Break" },
    { time: "14:00", title: "Clinical Skills Workshop", speaker_name: "Dr. Naina Kapoor", speaker_designation: "Simulation Lead", category: "Workshop" },
  ],
  day2: [
    { time: "09:30", title: "Research Poster Walk", speaker_name: "Academic Review Board", speaker_designation: "GHC Research Hub", category: "Workshop" },
    { time: "11:00", title: "AI in Healthcare Forum", speaker_name: "Dr. Kenji Sato", speaker_designation: "Digital Health Advisor", category: "Panel" },
    { time: "16:00", title: "Awards Review", speaker_name: "Research Jury", speaker_designation: "Scientific Committee", category: "Networking" },
  ],
  day3: [
    { time: "09:30", title: "Public Health Roundtable", speaker_name: "Dr. Mira Shah", speaker_designation: "Policy Fellow", category: "Panel" },
    { time: "12:30", title: "Delegate Networking", speaker_name: "GHC Community Team", speaker_designation: "Partner Lounge", category: "Networking" },
    { time: "15:00", title: "Closing Plenary", speaker_name: "GAIMS Leadership", speaker_designation: "Conclave Secretariat", category: "Keynote" },
  ],
};

const scheduleDays = [
  { key: "day1", title: "Conference Day 1", status: "Dates will be announced soon", subtitle: "Opening · Keynotes · Panels" },
  { key: "day2", title: "Conference Day 2", status: "Dates will be announced soon", subtitle: "Research · Workshops · Awards" },
  { key: "day3", title: "Conference Day 3", status: "Dates will be announced soon", subtitle: "Roundtables · Networking · Closing" },
];

const partnerGroups = {
  Academic: ["GAIMS", "Health Policy School", "Clinical Skills Academy", "Global Research Forum"],
  NGO: ["CareAccess", "Public Health Action", "Wellbeing Trust", "Planetary Health Alliance"],
  Media: ["HealthWire", "MedJournal", "Science Daily Forum", "Global Care News"],
  Sponsors: ["BioBridge", "MedTech Forum", "CareNet", "HealthX"],
};

const heroTitle = "Global Healthcare Conclave 2026";

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

  return (
    <header className="site-navbar fixed left-0 right-0 top-0 z-50 px-4 pt-4 sm:px-6">
      <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-5">
        <a href="#home" className="flex items-center gap-3" aria-label="Global Healthcare Conclave home">
          <span className="brand-mark">
            <Stethoscope className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-['Sora'] text-sm font-bold text-[#081B33]">GHC 2026</span>
            <span className="block text-[0.68rem] uppercase tracking-[0.24em] text-[#0D47A1]/70">GAIMS Global Summit</span>
          </span>
        </a>

        <div className="hidden items-center gap-1 lg:flex">
          {navLinks?.map(([label, id]) => (
            <a key={id} href={label === "Register" ? "/register" : `#${id}`} className="nav-link">
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
            <a key={id} href={label === "Register" ? "/register" : `#${id}`} onClick={() => setOpen(false)} className="block rounded-2xl px-4 py-3 text-sm font-semibold text-[#081B33]/75 hover:bg-[#4FC3F7]/10 hover:text-[#0D47A1]">
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

function AnimatedTrackHeading({ onComplete }) {
  const title = "Focused tracks for the future of care.";
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
        Conference Tracks
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

function Hero() {
  const scrollToTrailer = (event) => {
    event.preventDefault();
    document.getElementById("watch-vision")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section id="home" className="hero-section reveal-section">
      <ParticleField />
      <div className="blob blob-one parallax-layer" data-speed="-18" />
      <div className="blob blob-two parallax-layer" data-speed="14" />

      <div className="hero-mobile-shell mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-10 pt-32 md:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:pt-24">
        <div className="relative z-10">
          <motion.div className="hero-pill" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <MapPin className="h-4 w-4 text-[#ff3b8b]" />
            New Delhi · Dates will be announced soon
          </motion.div>
          <h1 className="kinetic-title mt-7 font-['Sora'] text-5xl font-bold leading-[0.96] text-[#081B33] sm:text-6xl lg:text-7xl" aria-label={heroTitle}>
            {heroTitle.split(" ")?.map((word, index) => (
              <span className="word-mask" key={`${word}-${index}`} aria-hidden="true">
                <motion.span custom={index} variants={wordReveal} initial="hidden" animate="visible">
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p className="mt-6 max-w-2xl text-xl leading-8 text-[#12385f]/78" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.62, duration: 0.75 }}>
            Reimagining Healthcare Beyond Borders through policy, research, clinical excellence and responsible innovation.
          </motion.p>
          <motion.div className="mt-8 flex flex-wrap gap-3" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.78, duration: 0.75 }}>
            <a href="/register" className="hero-button-primary">Register Now <ArrowRight className="h-4 w-4" /></a>
            <a href="/abstract-registration" className="hero-button-secondary">Submit Abstract <FileText className="h-4 w-4" /></a>
            <PartnerCTAButton href="#partner-marquee" variant="hero">Become Partner <BadgeCheck className="h-4 w-4" /></PartnerCTAButton>
            <a href="#watch-vision" className="hero-button-secondary" onClick={scrollToTrailer}>Watch Trailer <Play className="h-4 w-4" /></a>
          </motion.div>
        </div>

        <motion.div className="parallax-visual hero-panel" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
          <GlobeCanvas className="hero-globe" />
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
    <section id="about" className="section-shell reveal-section">
      <div className="asym-grid">
        <SectionHeading eyebrow="About GHC" title="A healthcare forum designed for global coordination." />
        <div className="glass-card p-6 md:p-8">
          <p className="text-lg leading-8 text-[#12385f]/76">
            Global Healthcare Conclave is the flagship global health initiative of GAIMS, bringing together healthcare professionals, researchers, students and innovators to build practical answers for tomorrow's health systems.
          </p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {["Clinical excellence", "Research exchange", "Policy leadership"]?.map((item) => (
              <div key={item} className="mini-proof"><Check className="h-4 w-4" />{item}</div>
            ))}
          </div>
        </div>
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

function VenueSection() {
  const info = [
    { icon: MapPin, title: "Location", text: "GAIMS Convention Centre, Ahmedabad" },
    { icon: Plane, title: "Travel", text: "Airport transfer guidance and city arrival desk" },
    { icon: Hotel, title: "Accommodation", text: "Curated delegate hotel blocks near the venue" },
    { icon: BadgeCheck, title: "Delegate Info", text: "On-site help desk, badges, meals and workshop routing" },
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

function PartnerMarquee() {
  const marqueeItems = [
    ...Object.entries(partnerGroups).flatMap(([category, names]) => names.map((name) => ({ category, name, type: "logo" }))),
  ];
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
          {doubledItems?.map((item, index) => (
            <div className="partner-logo" key={`${item.category}-${item.name}-${index}`}>
              <span>{item.category}</span>
              {item.name}
            </div>
          ))}
        </div>
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

function Footer() {
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
            {navLinks?.slice(1)?.map(([label, id]) => <a key={id} href={`#${id}`}>{label}</a>)}
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
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    setPageSeo({
      title: isDynamicFormRoute ? "GHC Form" : isVerifyCertificateRoute ? "Verify Certificate" : isGooglePayTestRoute ? "Google Pay Test" : isWorkshopRegisterRoute ? "Workshop Registration" : isWorkshopCmsRoute ? "Workshop Manager" : isWorkshopDetailRoute ? "Workshop Details" : isPartnerRoute ? "Partner Portal" : isAbstractRoute ? "Abstract Registration" : isRegisterRoute ? "Register" : isAdminRoute ? "Admin" : "Global Healthcare Conclave 2026",
      description: isWorkshopDetailRoute
        ? "Workshop details for Global Healthcare Conclave 2026."
        : isPartnerRoute
        ? "Partner with Global Healthcare Conclave 2026."
        : isAbstractRoute
        ? "Submit a research abstract for Global Healthcare Conclave 2026."
        : isRegisterRoute
        ? "Register for Global Healthcare Conclave 2026 with secure ticket checkout."
        : "Global Healthcare Conclave 2026 by GAIMS: speakers, workshops, research, venue, partners and registration.",
      path: isDynamicFormRoute ? location.pathname : isVerifyCertificateRoute ? "/verify-certificate" : isGooglePayTestRoute ? "/google-pay-test" : isWorkshopRegisterRoute ? location.pathname : isWorkshopCmsRoute ? "/admin/workshops" : isWorkshopDetailRoute ? location.pathname : isPartnerRoute ? "/partnership" : isAbstractRoute ? "/abstract-registration" : isRegisterRoute ? "/register" : isAdminRoute ? "/admin" : "/",
      schema: {
        "@context": "https://schema.org",
        "@type": "Event",
        name: "Global Healthcare Conclave 2026",
        organizer: { "@type": "Organization", name: "GAIMS" },
      },
    });
  }, [isAbstractRoute, isAdminRoute, isWorkshopCmsRoute, isDynamicFormRoute, isGooglePayTestRoute, isPartnerRoute, isRegisterRoute, isVerifyCertificateRoute, isWorkshopDetailRoute, isWorkshopRegisterRoute, location.pathname]);

  useEffect(() => {
    const handler = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (isAdminRoute || isRegisterRoute || isAbstractRoute || isPartnerRoute || isWorkshopDetailRoute || isWorkshopRegisterRoute || isGooglePayTestRoute || isVerifyCertificateRoute || isDynamicFormRoute) {
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
    routeContent = (
    <div ref={appRef} className="min-h-screen overflow-hidden bg-[#F7FBFF] text-[#081B33]">
      <Navbar />
      <main>
        <Hero />
        <WatchVision />
        <StatsStrip />
        <About />
        <Mosaic />
        <Tracks />
        <WorldClassSpeakers />
        <WorkshopsExperience />
        <GHCTimeline />
        <ResearchHub />
        <VenueSection />
        <PartnerMarquee />
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
