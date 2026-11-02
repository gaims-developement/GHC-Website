import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MapPin, Coffee, Hotel, ExternalLink, Phone, Check, ShoppingBag, Smartphone, Sparkles, GraduationCap, BedDouble, Building2, Gem, ChevronDown, X } from "lucide-react";
import { apiUrl } from "../config/api";
// A copy of the starting content, so the page is never blank if the server is down or not updated yet.
import venueGuideFallback from "../data/venueGuideFallback.json";

gsap.registerPlugin(ScrollTrigger);

const VENUE_OPTIONS = ["bharat", "safdarjung"];
// Phones and tablets have only the toggle bar, so a stay list is always open there.
const TOGGLES_ONLY_QUERY = "(max-width: 1023px)";

// shortcut: tiers match stay groups by heading, so a renamed CMS group lands in Guesthouses & Hotels until added here.
const FALLBACK_TIER = "hotels";
const STAY_TIERS = [
  { key: "student", short: "Student", title: "Student Friendly", hint: "Dorms, pods and budget rooms", icon: GraduationCap, groups: ["Student stays under ₹1,000", "More low-cost stays"] },
  { key: "midrange", short: "Mid-Range", title: "Mid-Range", hint: "Private rooms near the venue and in central Delhi", icon: BedDouble, groups: ["Mid-range near the venue", "Mid-range in central Delhi"] },
  { key: "hotels", short: "Hotels", title: "Guesthouses & Hotels", hint: "Guesthouses, family stays and business hotels", icon: Building2, groups: ["Guesthouses and family stays", "Business and private hotels"] },
  { key: "premium", short: "Premium", title: "Premium", hint: "Luxury hotels for larger budgets", icon: Gem, groups: ["Premium hotels"] },
];

const VENUE_CARDS = {
  bharat: {
    label: "Bharat Mandapam",
    title: "Bharat Mandapam",
    text: "Join us in the heart of India's capital for Day 1 of Global Healthcare Conclave 2026.",
    mapsLabel: "Open Bharat Mandapam in Google Maps",
    mapsLink: "https://maps.google.com/?q=Bharat+Mandapam,+New+Delhi",
    image: "/assets/places/Bharat%20Mandapam.jpg",
  },
  safdarjung: {
    label: "VMMC & Safdarjung",
    title: "VMMC & Safdarjung Hospital",
    text: "Day 2 workshops are planned around VMMC and Safdarjung Hospital, subject to final confirmation.",
    mapsLabel: "Open VMMC & Safdarjung in Google Maps",
    mapsLink: "https://www.google.com/maps/search/?api=1&query=VMMC+Safdarjung+Hospital+New+Delhi",
    image: "/assets/places/VMMC.png",
  },
};

function VenueToggle({ selected, onSelect, className = "mb-8" }) {
  return (
    <div className={`venue-reveal flex flex-wrap gap-2 ${className}`} role="group" aria-label="Choose a venue">
      {VENUE_OPTIONS.map((key) => (
        <button
          key={key}
          type="button"
          aria-pressed={key === selected}
          onClick={() => onSelect(key)}
          className={`px-6 py-3 rounded-full text-sm font-bold transition-colors ${key === selected ? "bg-[#0D47A1] text-white" : "bg-white text-[#0D47A1] border border-[#0D47A1]/20 hover:border-[#0D47A1]"}`}
        >
          {VENUE_CARDS[key].label}
        </button>
      ))}
    </div>
  );
}

const stayCardClass = "bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)]";
const cardClass = `venue-reveal ${stayCardClass}`;
const linkClass = "inline-flex items-center gap-1.5 text-xs font-bold text-[#0D47A1] hover:text-[#1565C0] hover:underline";

const isActive = (item) => item.status !== "inactive";

// Keeps categories in the order they first appear, so CMS ordering decides the page order.
const groupByCategory = (rows) => {
  const groups = new Map();
  rows.forEach((row) => {
    const category = row.category || "More options";
    groups.set(category, [...(groups.get(category) || []), row]);
  });
  return [...groups.entries()].map(([title, items]) => ({ title, items }));
};

function MapLink({ href, label }) {
  if (!href) return null;
  if (label) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <MapPin className="h-3.5 w-3.5" /> {label}
      </a>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`${linkClass} max-sm:w-full max-sm:justify-center max-sm:rounded-full max-sm:bg-[#0D47A1] max-sm:text-white max-sm:px-2 max-sm:py-2 max-sm:whitespace-nowrap`}>
      <MapPin className="h-3.5 w-3.5" />
      <span className="sm:hidden">Google Maps</span>
      <span className="hidden sm:inline">View on Google Maps</span>
    </a>
  );
}

function SectionHeading({ eyebrow, title, text }) {
  return (
    <div className="venue-reveal mb-12">
      <p className="font-['Inter'] font-bold tracking-widest uppercase text-xs md:text-sm mb-3 text-[#173B8F]">{eyebrow}</p>
      <h2 className="font-['Outfit'] text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight text-[#101828]">{title}</h2>
      {text && <p className="font-['Inter'] text-lg md:text-xl max-w-3xl leading-relaxed text-[#475467]">{text}</p>}
    </div>
  );
}

export default function Venue() {
  const [cafes, setCafes] = useState([]);
  const [stays, setStays] = useState([]);
  const [guide, setGuide] = useState([]);
  const [venueKey, setVenueKey] = useState(VENUE_OPTIONS[0]);
  const [ready, setReady] = useState(false);
  const [openTier, setOpenTier] = useState(() => (window.matchMedia(TOGGLES_ONLY_QUERY).matches ? STAY_TIERS[0].key : null));
  const pageRef = useRef(null);
  const routesRef = useRef(null);
  const staysPanelRef = useRef(null);
  const staysPanelOpen = useRef(false);
  const scrollToStays = useRef(false);
  const hasToggled = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    let mounted = true;
    const load = (path, key) => axios.get(apiUrl(path))
      .then((response) => (response.data?.[key] || []).filter(isActive))
      .catch((error) => {
        console.error(`Error loading ${key}:`, error);
        return null;
      });
    Promise.all([load("/api/cafes", "cafes"), load("/api/stays", "stays"), load("/api/venue-guide", "guideItems")])
      .then(([cafeRows, stayRows, guideRows]) => {
        if (!mounted) return;
        const useFallback = !guideRows?.length;
        setCafes(useFallback ? venueGuideFallback.cafes : cafeRows || []);
        setStays(useFallback ? venueGuideFallback.stays : stayRows || []);
        setGuide(useFallback ? venueGuideFallback.guideItems : guideRows);
        setReady(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const motionPreference = gsap.matchMedia(pageRef.current);
    motionPreference.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(".venue-reveal", { autoAlpha: 0, y: 28 });
      ScrollTrigger.batch(".venue-reveal", {
        once: true,
        start: "top 92%",
        onEnter: (elements) => gsap.to(elements, {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: { amount: 0.25 },
          ease: "power3.out",
          clearProps: "transform,opacity,visibility",
        }),
      });
      const checks = gsap.utils.toArray(".venue-check");
      const countLabel = pageRef.current.querySelector(".venue-count");
      if (checks.length && countLabel) {
        const tickTime = 0.12 * checks.length;
        const counter = { value: 0 };
        countLabel.textContent = "0";
        gsap.set(checks, { autoAlpha: 0, x: 28 });
        gsap.set(".venue-check-icon", { scale: 0 });
        gsap.timeline({ scrollTrigger: { trigger: ".venue-checklist", start: "top 80%", once: true } })
          .to(checks, { autoAlpha: 1, x: 0, duration: 0.4, stagger: 0.12, ease: "power2.out", clearProps: "transform,opacity,visibility" }, 0)
          .to(".venue-check-icon", { scale: 1, duration: 0.35, stagger: 0.12, ease: "back.out(3)", clearProps: "transform" }, 0.15)
          .fromTo(".venue-ring", { attr: { "stroke-dashoffset": 100 } }, { attr: { "stroke-dashoffset": 0 }, duration: tickTime, ease: "none" }, 0.15)
          .to(counter, { value: checks.length, duration: tickTime, ease: "none", snap: { value: 1 }, onUpdate: () => { countLabel.textContent = counter.value; } }, 0.15);
      }
      gsap.fromTo(".venue-parallax", { yPercent: -7, scale: 1.16 }, {
        yPercent: 7,
        scale: 1.16,
        ease: "none",
        scrollTrigger: { trigger: ".venue-parallax", start: "top bottom", end: "bottom top", scrub: true },
      });
    });
    return () => motionPreference.revert();
  }, [ready]);

  useEffect(() => {
    const panel = staysPanelRef.current;
    if (!openTier || !panel) {
      staysPanelOpen.current = false;
      if (ready) ScrollTrigger.refresh();
      return undefined;
    }
    const firstOpen = !staysPanelOpen.current;
    staysPanelOpen.current = true;
    const animation = gsap.matchMedia(panel);
    animation.add("(prefers-reduced-motion: reduce)", () => ScrollTrigger.refresh());
    // The site wrapper clips overflow, so CSS sticky cannot work here.
    animation.add(TOGGLES_ONLY_QUERY, () => {
      ScrollTrigger.create({ trigger: ".venue-stays-bar", start: "top 8px", endTrigger: panel, end: "bottom 80px", pin: true, pinSpacing: false });
    });
    animation.add("(prefers-reduced-motion: no-preference)", () => {
      // Sections below move when this opens, so their scroll triggers need re-measuring afterwards.
      const timeline = gsap.timeline({ onComplete: () => ScrollTrigger.refresh() });
      if (firstOpen) {
        timeline.fromTo(panel, { height: 0, autoAlpha: 0, overflow: "hidden" }, { height: "auto", autoAlpha: 1, duration: 0.45, ease: "power3.out", clearProps: "height,opacity,visibility,overflow" });
      }
      timeline.fromTo(".venue-stay-item", { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity,visibility" }, firstOpen ? 0.12 : 0);
    });
    if (scrollToStays.current) {
      scrollToStays.current = false;
      requestAnimationFrame(() => {
        const { top } = panel.getBoundingClientRect();
        if (top < 0) window.scrollTo(0, window.scrollY + top - 8);
      });
    }
    return () => animation.revert();
  }, [openTier, ready]);

  useEffect(() => {
    const query = window.matchMedia(TOGGLES_ONLY_QUERY);
    const keepListOpen = () => {
      if (query.matches) setOpenTier((current) => current || STAY_TIERS[0].key);
    };
    query.addEventListener("change", keepListOpen);
    return () => query.removeEventListener("change", keepListOpen);
  }, []);

  const pressTier = (key, button) => {
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate) gsap.fromTo(button, { scale: 0.96 }, { scale: 1, duration: 0.35, ease: "back.out(3)", clearProps: "transform" });
    if (key !== openTier) {
      setOpenTier(key);
      return;
    }
    if (!animate) {
      setOpenTier(null);
      return;
    }
    gsap.to(staysPanelRef.current, { height: 0, autoAlpha: 0, overflow: "hidden", duration: 0.35, ease: "power2.inOut", onComplete: () => setOpenTier(null) });
  };

  const switchTier = (key) => {
    scrollToStays.current = true;
    setOpenTier(key);
  };

  const selectVenue = (key) => {
    hasToggled.current = true;
    setVenueKey(key);
  };

  useEffect(() => {
    if (!hasToggled.current || !pageRef.current) return undefined;
    const animation = gsap.matchMedia(pageRef.current);
    animation.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo([...pageRef.current.querySelectorAll(".venue-swap"), ...(routesRef.current?.children || [])], { autoAlpha: 0, x: 24 }, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.05, ease: "power2.out", clearProps: "transform,opacity,visibility" });
    });
    return () => animation.revert();
  }, [venueKey]);

  const section = (name) => guide.filter((item) => item.section === name);
  const venueCard = VENUE_CARDS[venueKey];
  const venueInfo = section(`${venueKey}_info`)[0];
  const venueRoutes = section(`${venueKey}_route`);
  const places = section("place");
  const placePicks = section("place_pick");
  const markets = section("market");
  const checklist = section("checklist");
  const apps = section("app");
  const areas = section("area");
  const stayHeadings = section("stay_group");
  const stayGroups = [
    ...stayHeadings.map((group) => ({ ...group, items: stays.filter((stay) => stay.category === group.title) })),
    { title: "More options", items: stays.filter((stay) => !stayHeadings.some((group) => group.title === stay.category)) },
  ].filter((group) => group.items.length > 0);
  const tierKeyFor = (group) => STAY_TIERS.find((tier) => tier.groups.includes(group.title))?.key || FALLBACK_TIER;
  const stayTiers = STAY_TIERS.map((tier) => {
    const groups = stayGroups.filter((group) => tierKeyFor(group) === tier.key);
    return { ...tier, groups, count: groups.reduce((total, group) => total + group.items.length, 0) };
  }).filter((tier) => tier.count > 0);
  const selectedTier = stayTiers.find((tier) => tier.key === openTier);

  return (
    <div ref={pageRef} className="bg-[#F7FBFF] pt-24 pb-16">
      {/* Hero */}
      <section className="section-shell pt-10">
        <SectionHeading
          eyebrow="GHC 2026 Destinations"
          title="Experience Delhi."
          text="Join us at the heart of India's medical and cultural capital. Navigate your way through world-class venues, rich heritage, and vibrant student-friendly hubs."
        />

        <div className="venue-reveal relative h-[40vh] min-h-[300px] rounded-3xl overflow-hidden mt-8 shadow-sm border border-gray-200">
          <img src="https://images.unsplash.com/photo-1587474260584-136574528ed5?q=80&w=2070&auto=format&fit=crop" alt="Delhi Heritage" className="venue-parallax absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081B33]/80 via-transparent to-transparent"></div>
          <div className="absolute bottom-6 left-6 text-white">
            <h3 className="font-['Outfit'] text-2xl font-extrabold">New Delhi, India</h3>
            <p className="text-white/80">28–29 November 2026</p>
          </div>
        </div>
      </section>

      {/* Official Venue */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Official Venue"
          title="Where innovation meets healthcare."
        />
        <VenueToggle selected={venueKey} onSelect={selectVenue} className="mb-6" />
        <motion.article className="venue-reveal bg-white rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] overflow-hidden grid lg:grid-cols-2" whileHover={{ y: -4 }}>
          <div className="venue-swap h-64 sm:h-80 lg:h-auto lg:min-h-[420px] overflow-hidden relative bg-[#E5EEF9]">
            <img src={venueCard.image} alt={`${venueCard.title}, New Delhi, a venue of Global Healthcare Conclave 2026`} className="absolute inset-0 w-full h-full object-cover" />
          </div>
          <div className="venue-swap p-8 sm:p-10 flex flex-col justify-center">
            <h3 className="text-2xl sm:text-3xl font-extrabold font-['Outfit'] text-[#101828] mb-3">{venueCard.title}</h3>
            <p className="text-[#475467] mb-6 text-base leading-relaxed">{venueCard.text}</p>
            <dl className="divide-y divide-gray-100 border-y border-gray-100 mb-6">
              <div className={`py-4 flex gap-5 ${venueKey === "bharat" ? "" : "opacity-60"}`}>
                <dt className="w-16 shrink-0 font-['Outfit'] font-bold text-[#0D47A1]">28 Nov</dt>
                <dd className="text-sm text-[#475467] leading-relaxed"><span className="block font-bold text-[#101828]">Day 1: Bharat Mandapam</span>Pragati Maidan, New Delhi</dd>
              </div>
              <div className={`py-4 flex gap-5 ${venueKey === "safdarjung" ? "" : "opacity-60"}`}>
                <dt className="w-16 shrink-0 font-['Outfit'] font-bold text-[#0D47A1]">29 Nov</dt>
                <dd className="text-sm text-[#475467] leading-relaxed"><span className="block font-bold text-[#101828]">Day 2: Workshops</span>VMMC and Safdarjung Hospital area, subject to final confirmation</dd>
              </div>
            </dl>
            <a href={venueCard.mapsLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#0D47A1] font-semibold hover:underline"><MapPin className="h-4 w-4 text-[#4FC3F7]" /> {venueCard.mapsLabel}</a>
          </div>
        </motion.article>
      </section>

      {/* Routes to each venue */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Getting Around"
          title="How to Reach the Venue"
          text="Suggested metro routes from Delhi's airport terminals and main railway stations."
        />

        <VenueToggle selected={venueKey} onSelect={selectVenue} />

        {venueInfo && (
          <>
            <p className="venue-reveal font-['Outfit'] text-xl font-bold text-[#101828] mb-6">{venueInfo.subtitle}</p>
            <div ref={routesRef} className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
              {venueRoutes.map((route) => (
                <div key={route.id} className={`${cardClass} p-3 sm:p-5 flex flex-col sm:flex-row items-start gap-2 sm:gap-4`}>
                  <span className="shrink-0 sm:w-28 text-center bg-[#081B33] text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide rounded-lg px-2 py-1.5 sm:py-2">{route.title}</span>
                  <p className="text-xs sm:text-sm text-[#344054] leading-relaxed">{route.detail}</p>
                </div>
              ))}
            </div>
            <div className="venue-reveal flex flex-wrap items-center justify-between gap-3 mb-8">
              <p className="text-sm text-[#475467] leading-relaxed max-w-3xl">{venueInfo.detail}</p>
              <MapLink href={venueInfo.link} label="Open location" />
            </div>
            <div className="venue-reveal w-full h-[400px] bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
              <iframe
                key={venueInfo.title}
                src={`https://www.google.com/maps?q=${encodeURIComponent(`${venueInfo.title}, New Delhi`)}&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map of ${venueInfo.title}`}
              ></iframe>
            </div>
          </>
        )}
      </section>

      {/* Exploring, food and markets */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Unwind in Delhi"
          title="Explore & Recharge"
          text="Sights, markets and food to fit around the conclave, not in place of scheduled sessions. Confirm opening hours before you leave."
        />

        {places.length > 0 && (
          <>
            <h3 className="venue-reveal text-xl font-bold font-['Outfit'] text-[#101828] mb-6 mt-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-[#e244b7]" /> Fun Places to Visit</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-14">
              {places.map((place) => (
                <motion.a key={place.id} href={place.link || undefined} target="_blank" rel="noopener noreferrer" className="venue-reveal group relative rounded-2xl overflow-hidden aspect-[4/5] bg-[#0D47A1] shadow-sm block" whileHover={{ y: -5 }}>
                  {place.imageUrl && <img src={place.imageUrl} alt={place.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#081B33] via-[#081B33]/20 to-transparent p-3 sm:p-5 flex flex-col justify-end text-white">
                    <h4 className="font-['Outfit'] font-bold text-sm sm:text-lg leading-tight mb-1">{place.title}</h4>
                    {place.detail && <p className="hidden sm:block text-xs text-white/80">{place.detail}</p>}
                    {place.subtitle && <p className="text-[10px] sm:text-xs text-[#8fd6f6] font-semibold mt-1">{place.subtitle}</p>}
                  </div>
                </motion.a>
              ))}
            </div>
          </>
        )}

        {placePicks.length > 0 && (
          <>
            <h3 className="venue-reveal text-xl font-bold font-['Outfit'] text-[#101828] mb-6 flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#e244b7]" /> President’s Recommendations</h3>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-14">
              {placePicks.map((pick) => (
                <div key={pick.id} className={`${cardClass} p-4 sm:p-6`}>
                  <h4 className="font-['Outfit'] text-sm sm:text-base font-bold text-[#101828] mb-2">{pick.title}</h4>
                  <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">{pick.detail}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {markets.length > 0 && (
          <>
            <h3 className="venue-reveal text-xl font-bold font-['Outfit'] text-[#101828] mb-6 flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-[#e244b7]" /> Shopping & Souvenirs</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-14">
              {markets.map((market) => (
                <div key={market.id} className={`${cardClass} p-4 sm:p-6 flex flex-col justify-between`}>
                  <div>
                    <h4 className="font-['Outfit'] text-sm sm:text-base font-bold text-[#101828] mb-2">{market.title}</h4>
                    <p className="text-xs sm:text-sm text-[#475467] leading-relaxed mb-1">{market.subtitle}</p>
                    {market.detail && <p className="text-xs font-semibold text-[#b54708] mb-3">{market.detail}</p>}
                  </div>
                  <div className="pt-3"><MapLink href={market.link} /></div>
                </div>
              ))}
            </div>
          </>
        )}

        {groupByCategory(cafes).map((group) => (
          <div key={group.title} className="mb-14 last:mb-0">
            <h3 className="venue-reveal text-xl font-bold font-['Outfit'] text-[#101828] mb-6 flex items-center gap-2"><Coffee className="h-5 w-5 text-[#e244b7]" /> {group.title}</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {group.items.map((cafe) => (
                <div key={cafe.id} className={`${cardClass} p-4 sm:p-6 flex flex-col justify-between`}>
                  <div>
                    <h4 className="text-sm sm:text-lg font-bold font-['Outfit'] text-[#101828] mb-1">{cafe.name}</h4>
                    {cafe.address && <p className="text-[10px] sm:text-xs text-[#0D47A1] font-semibold uppercase tracking-wide mb-2">{cafe.address}</p>}
                    {cafe.price && <p className="text-sm sm:text-base font-['Outfit'] font-bold text-[#101828] mb-2">{cafe.price} <span className="block sm:inline text-[10px] sm:text-xs font-normal text-[#475467]">per person</span></p>}
                    {cafe.description && <p className="text-xs sm:text-sm text-[#475467] leading-relaxed mb-3">{cafe.description}</p>}
                  </div>
                  <div className="pt-2"><MapLink href={cafe.googleMapsLink} /></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* Hotels Near Venue */}
      <section className="section-shell mt-24">
        <SectionHeading
          eyebrow="Accommodation"
          title="Delegate Stays"
          text="Independent options for every budget, listed for the 28–29 November conclave. Suggested arrival is 27 November and departure 30 November. Distances are approximate, and rates are estimates, not live quotes."
        />

        {areas.length > 0 && (
          <div className="mb-12">
            <h3 className="venue-reveal font-['Outfit'] text-2xl font-bold text-[#101828] mb-2">Where should I stay?</h3>
            <p className="venue-reveal text-sm text-[#475467] leading-relaxed max-w-3xl mb-6">Choose your area around both conference venues, not only on the headline price.</p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {areas.map((area) => (
                <div key={area.id} className={`${cardClass} p-4 sm:p-6`}>
                  <h4 className="font-['Outfit'] font-bold text-[#101828] mb-1">{area.title}</h4>
                  <p className="text-xs sm:text-sm font-semibold text-[#0D47A1] mb-1">{area.subtitle}</p>
                  <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">{area.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {section("stay_note").length > 0 && (
          <div className="venue-reveal rounded-3xl border border-[#0D47A1]/15 bg-white p-6 md:p-8 mb-12 space-y-4">
            {section("stay_note").map((note) => (
              <div key={note.id}>
                <p className="font-['Outfit'] font-bold text-[#101828] mb-1">{note.title}</p>
                <p className="text-sm text-[#475467] leading-relaxed">{note.detail}</p>
              </div>
            ))}
          </div>
        )}

        <div className="hidden lg:grid grid-cols-4 gap-5">
          {stayTiers.map((tier) => {
            const Icon = tier.icon;
            const selected = tier.key === openTier;
            return (
              <button
                key={tier.key}
                type="button"
                aria-expanded={selected}
                aria-controls="venue-stays-panel"
                onClick={(event) => pressTier(tier.key, event.currentTarget)}
                className={`venue-reveal group text-left rounded-3xl border p-5 sm:p-7 flex flex-col transition-colors ${selected ? "bg-gradient-to-br from-[#081B33] to-[#0D47A1] border-transparent shadow-[0_16px_40px_rgba(13,71,161,0.3)]" : "bg-white border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)] hover:border-[#0D47A1]/40"}`}
              >
                <span className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 ${selected ? "bg-white/15 text-white" : "bg-[#0D47A1]/10 text-[#0D47A1]"}`}>
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                </span>
                <span className={`font-['Outfit'] text-base sm:text-xl font-bold mb-1 ${selected ? "text-white" : "text-[#101828]"}`}>{tier.title}</span>
                <span className={`text-xs sm:text-sm leading-relaxed mb-4 flex-1 ${selected ? "text-white/75" : "text-[#475467]"}`}>{tier.hint}</span>
                <span className={`flex items-center justify-between text-xs sm:text-sm font-bold ${selected ? "text-[#8fd6f6]" : "text-[#0D47A1]"}`}>
                  {tier.count} {tier.count === 1 ? "stay" : "stays"}
                  <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${selected ? "rotate-180" : ""}`} />
                </span>
              </button>
            );
          })}
        </div>

        {selectedTier && (
          <div ref={staysPanelRef} id="venue-stays-panel" role="region" aria-label={`${selectedTier.title} stays`} className="lg:mt-8">
            <div className="venue-stays-bar lg:hidden relative z-20 mb-6 grid grid-cols-4 gap-1 rounded-2xl bg-white/95 backdrop-blur p-1 border border-gray-200 shadow-[0_8px_24px_rgba(16,24,40,0.12)]" role="group" aria-label="Switch stay type">
              {stayTiers.map((tier) => (
                <button
                  key={tier.key}
                  type="button"
                  aria-pressed={tier.key === openTier}
                  onClick={() => switchTier(tier.key)}
                  className={`rounded-xl px-0.5 py-2.5 text-[11px] sm:text-sm font-bold whitespace-nowrap transition-colors ${tier.key === openTier ? "bg-[#0D47A1] text-white" : "text-[#0D47A1]"}`}
                >
                  {tier.short}
                </button>
              ))}
            </div>
            <div className="venue-stay-item flex items-center justify-between gap-4 mb-8">
              <h3 className="font-['Outfit'] text-2xl md:text-3xl font-extrabold text-[#101828]">{selectedTier.title}</h3>
              <button type="button" onClick={(event) => pressTier(selectedTier.key, event.currentTarget)} className="hidden lg:inline-flex items-center gap-1.5 shrink-0 text-sm font-bold text-[#475467] hover:text-[#101828]">
                <X className="h-4 w-4" /> Close
              </button>
            </div>
            <div className="space-y-12">
              {selectedTier.groups.map((group) => (
                <div key={group.title}>
                  <div className="venue-stay-item mb-6">
                    <h3 className="font-['Outfit'] text-2xl font-bold text-[#101828] mb-2">{group.title}</h3>
                    {group.detail && <p className="text-sm text-[#475467] leading-relaxed max-w-3xl">{group.detail}</p>}
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                    {group.items.map((hotel) => (
                      <div key={hotel.id} className={`venue-stay-item ${stayCardClass} p-4 sm:p-8 flex flex-col justify-between`}>
                        <div>
                          <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="hidden sm:flex w-10 h-10 rounded-full bg-[#0D47A1]/5 items-center justify-center text-[#0D47A1]">
                              <Hotel className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-bold text-[#0D47A1] bg-[#0D47A1]/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
                              {group.subtitle || "Stay"}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-lg font-bold font-['Outfit'] text-[#101828] mb-1">{hotel.name}</h4>
                          {hotel.address && (
                            <p className="text-[10px] sm:text-xs text-[#0D47A1] mb-3 font-semibold uppercase tracking-wide flex items-start gap-1 min-w-0 break-words">
                              <MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {hotel.address}
                            </p>
                          )}
                          {hotel.price && <p className="text-sm sm:text-base font-['Outfit'] font-bold text-[#101828] mb-3">{hotel.price}</p>}
                          {hotel.description && <p className="text-xs sm:text-sm text-[#475467] leading-relaxed mb-4">{hotel.description}</p>}
                        </div>
                        {(hotel.googleMapsLink || hotel.bookingLink) && (
                          <div className="border-t border-gray-100 pt-4 mt-2 flex flex-wrap gap-x-5 gap-y-2">
                            <MapLink href={hotel.googleMapsLink} />
                            {hotel.bookingLink && (
                              <a href={hotel.bookingLink} target="_blank" rel="noopener noreferrer" className={linkClass}>
                                <ExternalLink className="h-3.5 w-3.5" /> Compare and book
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section("stay_help").map((help) => (
          <div key={help.id} className="venue-reveal rounded-3xl border border-[#0D47A1]/15 bg-white p-6 md:p-8 mt-14">
            <p className="font-['Outfit'] font-bold text-[#101828] mb-2">{help.title}</p>
            <p className="text-sm text-[#475467] leading-relaxed">{help.detail}</p>
            {help.subtitle && (
              <a href={help.link || undefined} className={`${linkClass} mt-3 text-sm`}>
                <Phone className="h-3.5 w-3.5" /> {help.subtitle}
              </a>
            )}
          </div>
        ))}
      </section>

      {/* Before you travel */}
      {(checklist.length > 0 || apps.length > 0) && (
        <section className="section-shell mt-24">
          <div className="relative overflow-hidden -mx-6 sm:mx-0 rounded-3xl sm:rounded-[2rem] bg-gradient-to-br from-[#081B33] via-[#0B2F6B] to-[#0D47A1] px-4 py-7 sm:p-10 lg:p-14">
            <div className="hidden lg:block absolute -right-24 -top-24 w-80 h-80 rounded-full bg-[#4FC3F7]/10" aria-hidden="true" />
            <div className="absolute -left-20 -bottom-28 w-72 h-72 rounded-full bg-white/5" aria-hidden="true" />

            <div className="relative grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-6 sm:gap-10 lg:gap-14">
              <div className="venue-reveal flex lg:block items-center justify-between gap-4 px-1 sm:px-0">
                <div className="min-w-0">
                  <p className="font-['Inter'] font-bold tracking-widest uppercase text-[11px] md:text-sm mb-2 lg:mb-3 text-[#8fd6f6]">Before You Travel</p>
                  <h2 className="font-['Outfit'] text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 lg:mb-4 leading-tight text-white">Keep It Simple</h2>
                  <p className="text-sm lg:text-base text-white/70 leading-relaxed lg:mb-8">Ten quick checks, and you are ready for Delhi.</p>
                </div>
                {checklist.length > 0 && (
                  <div className="flex items-center gap-5 shrink-0">
                    <div className="relative w-20 h-20 lg:w-28 lg:h-28 shrink-0">
                      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="9" />
                        <circle className="venue-ring" cx="60" cy="60" r="52" fill="none" stroke="#4ADE80" strokeWidth="9" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset="0" />
                      </svg>
                      <span className="venue-count absolute inset-0 flex items-center justify-center font-['Outfit'] text-2xl lg:text-3xl font-extrabold text-white">{checklist.length}</span>
                    </div>
                    <p className="hidden lg:block text-sm font-semibold text-white/80 leading-snug">The 60-second<br />checklist</p>
                  </div>
                )}
              </div>

              <ul className="venue-checklist grid grid-cols-2 gap-2 sm:gap-3">
                {checklist.map((item) => (
                  <li key={item.id} className="venue-check flex flex-col sm:flex-row items-start gap-2 sm:gap-3 rounded-2xl bg-white/[0.07] border border-white/10 p-3 sm:p-4 text-xs sm:text-sm text-white/90 leading-relaxed">
                    <span className="venue-check-icon mt-0.5 w-6 h-6 shrink-0 rounded-full bg-[#4ADE80] text-[#081B33] flex items-center justify-center">
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </span>
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>

            {apps.length > 0 && (
              <div className="relative mt-10 lg:mt-14 pt-8 border-t border-white/10">
                <h3 className="venue-reveal font-['Outfit'] text-xl font-bold text-white mb-5 flex items-center gap-2"><Smartphone className="h-5 w-5 text-[#8fd6f6]" /> Useful apps and numbers</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
                  {apps.map((app) => {
                    const isNumber = /^\d+$/.test(app.title);
                    const content = (
                      <>
                        <p className={`font-['Outfit'] font-bold mb-1 ${isNumber ? "text-3xl text-[#FCA5A5]" : "text-white"}`}>{app.title}</p>
                        <p className="text-xs text-white/70 leading-relaxed">{app.detail}</p>
                      </>
                    );
                    const tileClass = `venue-reveal block rounded-2xl p-3 sm:p-5 border transition-colors ${isNumber ? "bg-[#EF4444]/10 border-[#FCA5A5]/30 hover:bg-[#EF4444]/20 col-span-2 lg:col-span-1" : "bg-white/[0.07] border-white/10"}`;
                    return isNumber
                      ? <a key={app.id} href={`tel:${app.title}`} className={tileClass}>{content}</a>
                      : <div key={app.id} className={tileClass}>{content}</div>;
                  })}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}