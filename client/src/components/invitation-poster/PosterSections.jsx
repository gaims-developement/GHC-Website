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

// Email variant only: the two calls to action, each half is cut into its own linked image.
export function EmailActions() {
  return (
    <div className="gip-actions">
      <span className="gip-action gip-action-register">
        REGISTER NOW <ArrowRight size={24} strokeWidth={2.2} />
      </span>
      <span className="gip-action gip-action-whatsapp">
        <span className="gip-wa-mark">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path fill="#fff" d="M12 3.2a8.7 8.7 0 0 0-7.5 13.1L3.3 20.8l4.6-1.2A8.7 8.7 0 1 0 12 3.2Zm0 1.6a7.1 7.1 0 1 1-3.6 13.2l-.3-.2-2.7.7.7-2.6-.2-.3A7.1 7.1 0 0 1 12 4.8Zm-2.6 3.6c-.2 0-.5 0-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.8 2.2.9 2.6.7 3.1.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2l-.5-.3-1.7-.8c-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a5.8 5.8 0 0 1-2.9-2.5c-.2-.4.2-.4.6-1.2.1-.2 0-.3 0-.4l-.8-1.9c-.2-.5-.4-.4-.6-.4h-.5Z" />
          </svg>
        </span>
        JOIN WHATSAPP GROUP
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
