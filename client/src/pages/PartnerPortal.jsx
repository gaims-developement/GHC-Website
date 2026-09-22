import { ArrowLeft, ArrowRight, BarChart3, Building2, Crown, Download, Globe2, Medal, Mic, Star, Users, Megaphone, Activity } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { apiUrl } from "../config/api";
import PartnershipReveal from "../components/PartnershipReveal";

const perks = [
  [Globe2, "Global Reach", "Access 5,000+ delegates from 40+ countries live and hybrid."],
  [Mic, "Speaking Slots", "Keynote and panel opportunities with a captive expert audience."],
  [Building2, "Brand Visibility", "Logo on stage, app, website, badges, and all event collateral."],
  [Users, "Networking", "Exclusive VIP dinners and pre-event networking with key delegates."],
  [BarChart3, "Delegate Data", "Post-event analytics report with full delegate engagement insights."],
  [Megaphone, "Media Coverage", "Press features, social amplification and post-event highlight reel."],
];

const tiers = [
  {
    name: "Platinum",
    price: "Custom Pricing",
    icon: Crown,
    tone: "platinum",
    badge: "Most Exclusive",
    cta: "Apply for Platinum",
    perks: [
      "Headline sponsor - all materials & stage backdrop",
      "30-min keynote speaking slot",
      "10 delegate passes included",
      "VIP lounge & private networking access",
      "Full post-event delegate data report",
      "Featured in press releases & media kit",
    ],
  },
  {
    name: "Gold",
    price: "From $15,000",
    icon: Star,
    tone: "gold",
    cta: "Apply for Gold",
    perks: [
      "Co-branded session sponsorship",
      "Exhibition booth (6 x 6m)",
      "6 delegate passes included",
      "Logo on website, app & programme",
      "3 social media spotlight posts",
    ],
  },
  {
    name: "Silver",
    price: "From $7,500",
    icon: Medal,
    tone: "silver",
    cta: "Apply for Silver",
    perks: [
      "Brand visibility in event programme",
      "Exhibition table (3 x 3m)",
      "3 delegate passes included",
      "Logo on event website",
    ],
  },
];

const testimonials = [
  ["Partnering with GHC gave us unparalleled access to decision-makers we couldn't reach anywhere else.", "Sarah Mitchell", "Chief Strategy Officer - MedBridge Global", "SM"],
  ["The ROI was immediate. Three signed contracts before the conference even ended.", "Dr. Rajan Mehta", "CEO - HealthVentures Asia", "RM"],
  ["Best-organised healthcare conference in the region. Our brand presence was exceptional.", "Lena Strauss", "Head of Partnerships - EuroMed Institute", "LS"],
];

export default function PartnerPortal() {
  const shouldReduceMotion = useReducedMotion();
  const itemReveal = {
    hidden: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 42, filter: "blur(8px)" },
    visible: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" },
  };
  const revealTransition = { duration: shouldReduceMotion ? 0.1 : 1.02, ease: [0.22, 1, 0.36, 1] };

  const [live, setLive] = useState({ tiers: [], sponsors: [] });

  useEffect(() => {
    let active = true;
    axios
      .get(apiUrl("/api/sponsorship/public"))
      .then((response) => {
        if (!active) return;
        setLive({
          tiers: response.data?.tiers || [],
          sponsors: response.data?.sponsors || [],
        });
      })
      .catch(() => {
        /* keep the static fallbacks below */
      });
    return () => {
      active = false;
    };
  }, []);

  const toneCycle = ["platinum", "gold", "silver"];
  const tierIcons = [Crown, Star, Medal];
  const staticTierByKey = Object.fromEntries(tiers.map((tier) => [tier.name.toLowerCase(), tier]));
  const displayTiers = live.tiers.length
    ? live.tiers.map((tier, index) => {
        const staticTier = staticTierByKey[String(tier.name).toLowerCase()];
        return {
          name: tier.name,
          price: staticTier?.price || (index === 0 ? "Custom Pricing" : "Let's discuss"),
          icon: staticTier?.icon || tierIcons[index % tierIcons.length],
          tone: staticTier?.tone || toneCycle[index % toneCycle.length],
          badge: staticTier?.badge || (index === 0 ? "Most Exclusive" : undefined),
          cta: staticTier?.cta || `Apply for ${tier.name}`,
          perks: staticTier?.perks || (tier.description ? [tier.description.split(/[.;]\s*/).filter(Boolean).join("; ")] : ["Customised partnership package tailored to your goals."]),
        };
      })
    : tiers;

  return (
    <PartnershipReveal>
    <main className="partner-page">
      <div className="partner-topbar">
        <a href="/"><ArrowLeft className="h-4 w-4" />Back to Home</a>
        <a href="/partner-login">Partner Login</a>
      </div>

      <motion.section className="partner-hero" initial="hidden" animate="visible" variants={itemReveal} transition={revealTransition}>
        <span className="partner-badge">Exclusive Partnership Programme - 2026</span>
        <h1>Partner With<br />Global Healthcare<br /><em>Conclave 2026</em></h1>
        <p>Join 60+ leading organisations reaching 5,000 delegates across 40+ countries.</p>
        <div className="partner-cta-stack">
          <a href="mailto:partners@ghc2026.com" className="partner-primary">Apply Now <ArrowRight className="h-4 w-4" /></a>
          <a href="/templates/ghc-partnership-brochure.txt" download className="partner-secondary"><Download className="h-4 w-4" />Download Brochure</a>
        </div>
      </motion.section>



      <section className="partner-section">
        <h2>Why Partner With Us</h2>
        <motion.div className="partner-perks-grid" initial="hidden" animate="visible" transition={{ staggerChildren: shouldReduceMotion ? 0 : 0.1, delayChildren: shouldReduceMotion ? 0 : 0.36 }}>
          {perks.map(([Icon, title, text]) => (
            <motion.article key={title} className="partner-perk-card" variants={itemReveal} transition={revealTransition}>
              <span><Icon className="h-4 w-4" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

<section className="partner-section">
        <h2>Partnership Tiers</h2>
        <motion.div className="partner-tier-stack" initial="hidden" animate="visible" transition={{ staggerChildren: shouldReduceMotion ? 0 : 0.12, delayChildren: shouldReduceMotion ? 0 : 0.48 }}>
          {displayTiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <motion.article key={tier.name} className={`partner-tier-card ${tier.tone}`} variants={itemReveal} transition={revealTransition}>
                {tier.badge && <span className="tier-badge">{tier.badge}</span>}
                <span className="tier-icon"><Icon className="h-4 w-4" /></span>
                <h3>{tier.name}</h3>
                <p>{tier.price}</p>
                <ul>
                  {tier.perks.map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
                <a href="mailto:partners@ghc2026.com">{tier.cta} <ArrowRight className="h-4 w-4" /></a>
              </motion.article>
            );
          })}
        </motion.div>
      </section>

      {live.sponsors.length > 0 && (
        <section className="partner-section">
          <h2>Our Sponsors &amp; Partners</h2>
          <motion.div className="partner-sponsor-grid" initial="hidden" animate="visible" transition={{ staggerChildren: shouldReduceMotion ? 0 : 0.06, delayChildren: shouldReduceMotion ? 0 : 0.52 }}>
            {live.sponsors.map((sponsor) => {
              const logoUrl = sponsor.logoUrl?.startsWith("/uploads") ? apiUrl(sponsor.logoUrl) : sponsor.logoUrl;
              return (
                <motion.a
                  key={sponsor.id}
                  className="partner-sponsor-card"
                  href={sponsor.website || undefined}
                  target={sponsor.website ? "_blank" : undefined}
                  rel="noreferrer"
                  variants={itemReveal}
                  transition={revealTransition}
                >
                  <span className="partner-sponsor-logo">
                    {logoUrl ? <img src={logoUrl} alt={sponsor.companyName} loading="lazy" /> : sponsor.companyName.slice(0, 2).toUpperCase()}
                  </span>
                  <strong>{sponsor.companyName}</strong>
                  <small>{sponsor.tierName || "Partner"}</small>
                </motion.a>
              );
            })}
          </motion.div>
        </section>
      )}

      <section className="partner-section">
        <h2>Trusted By</h2>
        <motion.div className="partner-testimonials" initial="hidden" animate="visible" transition={{ staggerChildren: shouldReduceMotion ? 0 : 0.1, delayChildren: shouldReduceMotion ? 0 : 0.58 }}>
          {testimonials.map(([quote, name, role, initials]) => (
            <motion.article key={name} variants={itemReveal} transition={revealTransition}>
              <b>"</b>
              <p>{quote}</p>
              <div>
                <span>{initials}</span>
                <div><strong>{name}</strong><small>{role}</small></div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </section>

      <section className="partner-footer-cta">
        <Activity className="h-5 w-5" />
        <h2>Ready to make an impact?</h2>
        <p>Limited partnership slots available for 2026.</p>
        <a href="mailto:partners@ghc2026.com">Apply Now <ArrowRight className="h-4 w-4" /></a>
        <small>Questions? Contact us at <a href="mailto:partners@ghc2026.com">partners@ghc2026.com</a></small>
      </section>
    </main>
    </PartnershipReveal>
  );
}
