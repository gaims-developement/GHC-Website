import { ArrowRight, CalendarDays, ClipboardList, MapPin, Network, Trophy, Users } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { DelhiSkyline, SocialIcons } from "./PosterDecor";
import { INVITATION_COPY, POSTER_ASSETS, TAGLINE } from "./posterConfig";

const Tagline = ({ className }) => (
  <p className={className}>
    {TAGLINE.map((part, i) => (
      <span key={part}>
        {i > 0 && <span className="gip-bullet">•</span>}
        {part}
      </span>
    ))}
  </p>
);

export function PosterHeader({ content }) {
  return (
    <header className="gip-header">
      <div className="gip-brand">
        <img className="gip-logo" src={POSTER_ASSETS.logo} alt="GAIMS GHC — Global Healthcare Conclave" />
        <Tagline className="gip-brand-tagline" />
      </div>
      <div className="gip-facts">
        <div className="gip-fact">
          <CalendarDays className="gip-fact-icon" size={40} strokeWidth={1.4} />
          <div>
            <p className="gip-fact-strong">{content.dateLine1}</p>
            <p className="gip-fact-strong">{content.dateLine2}</p>
          </div>
        </div>
        <div className="gip-fact">
          <MapPin className="gip-fact-icon" size={40} strokeWidth={1.4} />
          <div>
            <p className="gip-fact-gold">{content.venueLine1}</p>
            <p className="gip-fact-light">{content.venueLine2}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export function VenueHero() {
  return (
    <div className="gip-hero" aria-hidden="true">
      <img className="gip-hero-photo" src={POSTER_ASSETS.venue} alt="" />
      <div className="gip-hero-glow" />
      <div className="gip-hero-fade" />
    </div>
  );
}

export function InvitationHeadline() {
  return (
    <section className="gip-headline">
      <p className="gip-cordially">YOU ARE CORDIALLY</p>
      <h1 className="gip-invited">INVITED</h1>
      <p className="gip-to-the">
        <span className="gip-rule" />
        TO THE
        <span className="gip-rule" />
      </p>
      <h2 className="gip-event-name">GAIMS GLOBAL HEALTHCARE CONCLAVE 2026</h2>
      <Tagline className="gip-headline-tagline" />
      <p className="gip-copy">{INVITATION_COPY}</p>
    </section>
  );
}

// Reserved for a name added later: intentionally contains no text at all.
export function BlankNameplate() {
  return (
    <div className="gip-nameplate" aria-hidden="true">
      <span className="gip-corner gip-corner-tl" />
      <span className="gip-corner gip-corner-tr" />
      <span className="gip-corner gip-corner-bl" />
      <span className="gip-corner gip-corner-br" />
    </div>
  );
}

const HIGHLIGHTS = [
  { icon: Users, lines: ["WORLD-CLASS", "SPEAKERS"] },
  { icon: ClipboardList, lines: ["SCIENTIFIC SESSIONS", "& WORKSHOPS"] },
  { icon: Network, lines: ["GLOBAL", "NETWORKING"] },
  { icon: Trophy, lines: ["PRESTIGIOUS", "AWARDS"] },
];

export function EventHighlights() {
  return (
    <ul className="gip-highlights">
      {HIGHLIGHTS.map(({ icon: Icon, lines }) => (
        <li key={lines.join(" ")}>
          <Icon size={44} strokeWidth={1.3} className="gip-highlight-icon" />
          <span>{lines[0]}</span>
          <span>{lines[1]}</span>
        </li>
      ))}
    </ul>
  );
}

export function RegistrationQR({ url, showButton = true }) {
  const value = String(url || "").trim();
  return (
    <div className="gip-qr-panel">
      <div className="gip-qr-tile">
        {value ? (
          <QRCodeSVG value={value} size={128} level="M" marginSize={2} bgColor="#ffffff" fgColor="#03152F" />
        ) : (
          <div className="gip-qr-placeholder" title="Set a registration URL to generate the QR code" />
        )}
      </div>
      <div className="gip-qr-text">
        <p className="gip-qr-title">CONFIRM YOUR PRESENCE</p>
        <p className="gip-qr-body">Scan the QR code to RSVP and complete your registration.</p>
        {showButton ? (
          <span className="gip-qr-cta">
            REGISTER NOW <ArrowRight size={22} strokeWidth={2} />
          </span>
        ) : (
          <p className="gip-qr-note">Or use the Register Now button below.</p>
        )}
      </div>
    </div>
  );
}

// Email variant only: the Register Now call to action (its band is a linked image in the email).
export function EmailActions() {
  return (
    <div className="gip-actions">
      <span className="gip-action gip-action-register">
        REGISTER NOW <ArrowRight size={24} strokeWidth={2.2} />
      </span>
    </div>
  );
}

export function PosterFooter({ content }) {
  return (
    <footer className="gip-footer">
      <DelhiSkyline />
      <div className="gip-footer-bar">
        <div className="gip-follow">
          <p>FOLLOW US</p>
          <SocialIcons />
        </div>
        <p className="gip-website">{content.website}</p>
        <div className="gip-gaims">
          <img src={POSTER_ASSETS.gaimsLogo} alt="GAIMS" />
          <div>
            <p className="gip-gaims-name">GAIMS</p>
            <p className="gip-gaims-full">Global Association of<br />Indian Medical Students</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
