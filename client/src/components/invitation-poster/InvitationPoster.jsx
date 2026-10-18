import { forwardRef } from "react";
import "@fontsource/cinzel/500.css";
import "@fontsource/cinzel/700.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "./invitationPoster.css";
import { DotGlobe, FlowingWaves, HaloArcs } from "./PosterDecor";
import {
  BlankNameplate,
  EmailActions,
  EventHighlights,
  InvitationHeadline,
  PosterFooter,
  PosterHeader,
  RegistrationQR,
  VenueHero,
} from "./PosterSections";
import { DEFAULT_POSTER_CONTENT } from "./posterConfig";

// Fixed 1200 x 1800 design canvas. Callers scale it for preview; exports render it at full size.
// variant="email" is the artwork for the invitation email (server/assets/email/invitation-poster.jpg):
// taller, with Register / WhatsApp buttons, and the QR panel without its own button.
const InvitationPoster = forwardRef(function InvitationPoster({ content = DEFAULT_POSTER_CONTENT, variant = "print", style }, ref) {
  const isEmail = variant === "email";
  return (
    <div ref={ref} className={`gip-poster${isEmail ? " gip-email" : ""}`} style={style}>
      <VenueHero />
      <DotGlobe />
      <HaloArcs />
      <FlowingWaves />
      <PosterHeader content={content} />
      <InvitationHeadline />
      <BlankNameplate />
      <EventHighlights />
      <PosterFooter content={content} />
      <RegistrationQR url={content.registrationUrl} showButton={!isEmail} />
      {isEmail && <EmailActions />}
      <div className="gip-vignette" aria-hidden="true" />
    </div>
  );
});

export default InvitationPoster;
