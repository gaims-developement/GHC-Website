import { ArrowLeft, ArrowRight, BarChart3, Building2, Crown, Download, Globe2, Medal, Mic, Star, Users, Megaphone, Activity } from "lucide-react";

const stats = [
  ["5,000+", "Delegates"],
  ["40+", "Countries"],
  ["60+", "Partners"],
  ["3 Days", "Conference"],
];

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
  return (
    <main className="partner-page">
      <div className="partner-topbar">
        <a href="/"><ArrowLeft className="h-4 w-4" />Back to Home</a>
        <a href="/partner-login">Partner Login</a>
      </div>

      <section className="partner-hero">
        <span className="partner-badge">Exclusive Partnership Programme - 2026</span>
        <h1>Partner With<br />Global Healthcare<br /><em>Conclave 2026</em></h1>
        <p>Join 60+ leading organisations reaching 5,000 delegates across 40+ countries.</p>
        <div className="partner-cta-stack">
          <a href="mailto:partners@ghc2026.com" className="partner-primary">Apply Now <ArrowRight className="h-4 w-4" /></a>
          <a href="/templates/ghc-partnership-brochure.txt" download className="partner-secondary"><Download className="h-4 w-4" />Download Brochure</a>
        </div>
      </section>

      <section className="partner-stats-strip">
        {stats.map(([value, label]) => (
          <div key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
      </section>

      <section className="partner-section">
        <h2>Why Partner With Us</h2>
        <div className="partner-perks-grid">
          {perks.map(([Icon, title, text]) => (
            <article key={title} className="partner-perk-card">
              <span><Icon className="h-4 w-4" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-section">
        <h2>Partnership Tiers</h2>
        <div className="partner-tier-stack">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <article key={tier.name} className={`partner-tier-card ${tier.tone}`}>
                {tier.badge && <span className="tier-badge">{tier.badge}</span>}
                <span className="tier-icon"><Icon className="h-4 w-4" /></span>
                <h3>{tier.name}</h3>
                <p>{tier.price}</p>
                <ul>
                  {tier.perks.map((perk) => <li key={perk}>{perk}</li>)}
                </ul>
                <a href="mailto:partners@ghc2026.com">{tier.cta} <ArrowRight className="h-4 w-4" /></a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="partner-section">
        <h2>Trusted By</h2>
        <div className="partner-testimonials">
          {testimonials.map(([quote, name, role, initials]) => (
            <article key={name}>
              <b>"</b>
              <p>{quote}</p>
              <div>
                <span>{initials}</span>
                <div><strong>{name}</strong><small>{role}</small></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="partner-footer-cta">
        <Activity className="h-5 w-5" />
        <h2>Ready to make an impact?</h2>
        <p>Limited partnership slots available for 2026.</p>
        <a href="mailto:partners@ghc2026.com">Apply Now <ArrowRight className="h-4 w-4" /></a>
        <small>Questions? Contact us at <a href="mailto:partners@ghc2026.com">partners@ghc2026.com</a></small>
      </section>
    </main>
  );
}
