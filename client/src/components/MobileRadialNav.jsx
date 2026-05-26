import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, ChevronRight, Home, Info, Mic2, MoreHorizontal, Stethoscope, Ticket } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const quickItems = [
  { label: "Schedule", to: "/#ghc-timeline", icon: CalendarDays, active: ({ hash }) => hash === "#ghc-timeline" },
  { label: "Home", to: "/", icon: Home, home: true, active: ({ pathname, hash }) => pathname === "/" && (!hash || hash === "#home") },
  { label: "Speakers", to: "/#world-class-speakers", icon: Mic2, active: ({ hash }) => hash === "#world-class-speakers" },
];

const moreItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "About", to: "/#about", icon: Info },
  { label: "Tracks", to: "/#tracks", icon: Stethoscope },
  { label: "Speakers", to: "/#world-class-speakers", icon: Mic2 },
  { label: "Workshops", to: "/#workshops-experience", icon: CalendarDays },
  { label: "Timeline", to: "/#ghc-timeline", icon: CalendarDays },
  { label: "Research", to: "/#research-hub", icon: Info },
  { label: "Register", to: "/register", icon: Ticket },
  { label: "Submit Abstract", to: "/abstract-registration", icon: Ticket },
  { label: "Contact", to: "/#contact", icon: MoreHorizontal },
];

function MobileRadialNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const handleNavigate = (item) => {
    setMoreOpen(false);
    window.setTimeout(() => {
      if (item.to === "/") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const hash = item.to.split("#")[1];
      if (hash) document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  return (
    <>
      <style>{`
        .mobile-bottom-nav,
        .mobile-more-backdrop,
        .mobile-more-sheet {
          display: none;
        }

        @media (max-width: 768px) {
          .site-navbar {
            display: none !important;
          }

          html {
            scroll-behavior: smooth;
          }

          #root > .min-h-screen {
            padding-bottom: calc(90px + env(safe-area-inset-bottom, 0px));
          }

          .mobile-bottom-nav {
            position: fixed;
            right: max(12px, env(safe-area-inset-right, 0px));
            bottom: calc(16px + env(safe-area-inset-bottom, 0px));
            left: max(12px, env(safe-area-inset-left, 0px));
            z-index: 92;
            display: grid;
            grid-template-columns: 1fr 1.14fr 1fr 1fr;
            align-items: center;
            gap: 2px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 32px;
            background: rgba(18, 6, 40, 0.86);
            padding: clamp(8px, 2.4vw, 10px) clamp(10px, 3.6vw, 14px);
            box-shadow: 0 18px 60px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(20px);
            font-family: Inter, Outfit, system-ui, sans-serif;
          }

          .mobile-bottom-nav a,
          .mobile-bottom-nav button {
            display: grid;
            min-width: 0;
            place-items: center;
            gap: 4px;
            border: 0;
            border-radius: 22px;
            background: transparent;
            color: rgba(255, 255, 255, 0.45);
            font-size: clamp(9px, 2.7vw, 10px);
            font-weight: 800;
            line-height: 1;
            transition: color 0.2s ease, transform 0.2s ease, background 0.2s ease, filter 0.2s ease;
          }

          .mobile-bottom-nav a:active,
          .mobile-bottom-nav button:active {
            transform: scale(0.94);
            filter: brightness(1.12);
          }

          .mobile-bottom-nav svg {
            width: clamp(18px, 5.2vw, 20px);
            height: clamp(18px, 5.2vw, 20px);
          }

          .mobile-bottom-nav a.active,
          .mobile-bottom-nav button.active {
            color: #ff3b8b;
          }

          .mobile-bottom-home {
            transform: translateY(-5px);
            color: #ff3b8b !important;
          }

          .mobile-bottom-home .home-icon-shell {
            display: grid;
            width: clamp(2.18rem, 10vw, 2.45rem);
            aspect-ratio: 1;
            place-items: center;
            border: 1px solid rgba(255, 59, 139, 0.52);
            border-radius: 999px;
            background: rgba(255, 59, 139, 0.1);
            box-shadow: 0 0 24px rgba(255, 59, 139, 0.22);
          }

          .mobile-more-backdrop {
            position: fixed;
            inset: 0;
            z-index: 88;
            display: block;
            border: 0;
            background: rgba(0, 0, 0, 0.48);
            backdrop-filter: blur(8px);
          }

          .mobile-more-sheet {
            position: fixed;
            right: max(12px, env(safe-area-inset-right, 0px));
            bottom: calc(92px + env(safe-area-inset-bottom, 0px));
            left: max(12px, env(safe-area-inset-left, 0px));
            z-index: 91;
            display: grid;
            gap: 0.35rem;
            max-height: min(62vh, 30rem);
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 28px;
            background: rgba(18, 6, 40, 0.92);
            padding: 0.85rem;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.46), inset 0 1px 0 rgba(255, 255, 255, 0.08);
            backdrop-filter: blur(24px);
            font-family: Inter, Outfit, system-ui, sans-serif;
          }

          .mobile-more-sheet-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.35rem 0.4rem 0.55rem;
            color: rgba(255, 255, 255, 0.62);
            font-size: 0.72rem;
            font-weight: 900;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .mobile-more-sheet a {
            display: grid;
            grid-template-columns: auto 1fr auto;
            align-items: center;
            gap: 0.78rem;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 18px;
            background: rgba(255, 255, 255, 0.055);
            color: rgba(255, 255, 255, 0.84);
            padding: 0.82rem 0.9rem;
            font-size: 0.9rem;
            font-weight: 850;
          }

          .mobile-more-sheet a svg {
            width: 18px;
            height: 18px;
            color: #ff6eb0;
          }

          @media (max-width: 360px) {
            .mobile-bottom-nav {
              grid-template-columns: 0.95fr 1.08fr 0.95fr 0.95fr;
              border-radius: 28px;
            }

            .mobile-more-sheet {
              border-radius: 24px;
              padding: 0.7rem;
            }

            .mobile-more-sheet a {
              padding: 0.74rem 0.78rem;
              font-size: 0.84rem;
            }
          }
        }
      `}</style>

      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation options"
              className="mobile-more-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              className="mobile-more-sheet"
              initial={{ opacity: 0, y: 28, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 22, scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.19, 1, 0.22, 1] }}
            >
              <div className="mobile-more-sheet-header">
                <span>Explore GHC</span>
                <span>Menu</span>
              </div>
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} to={item.to} onClick={() => handleNavigate(item)}>
                    <Icon aria-hidden="true" />
                    <span>{item.label}</span>
                    <ChevronRight aria-hidden="true" />
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="mobile-bottom-nav" aria-label="Mobile bottom navigation">
        {quickItems.map((item) => {
          const Icon = item.icon;
          const active = item.active(location);

          return (
            <Link
              key={item.label}
              to={item.to}
              className={`${active ? "active" : ""}${item.home ? " mobile-bottom-home" : ""}`}
              onClick={() => handleNavigate(item)}
            >
              {item.home ? (
                <span className="home-icon-shell"><Icon aria-hidden="true" /></span>
              ) : (
                <Icon aria-hidden="true" />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button type="button" className={moreOpen ? "active" : ""} aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>
          <MoreHorizontal aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

export default MobileRadialNav;
