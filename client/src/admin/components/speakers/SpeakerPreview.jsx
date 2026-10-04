import { useState } from "react";
import { Award, Globe, Mic, Sparkles, Star } from "lucide-react";
import { getImageUrl } from "../../../config/api";

const LinkedinIcon = ({ size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const TwitterIcon = ({ size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const InstagramIcon = ({ size = 16, className, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

function initials(name = "") {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SP"
  );
}

function SpeakerPreview({ speaker }) {
  const previewUrl = speaker.photoPreview || speaker.photoUrl;
  const [imgError, setImgError] = useState(false);

  return (
    <aside
      className="speaker-preview"
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1px solid #E2E8F0",
        padding: "1.5rem",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <p className="admin-eyebrow" style={{ margin: 0 }}>
          Live Preview
        </p>
        <span
          style={{
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "2px 8px",
            borderRadius: "999px",
            background: speaker.speakerType === "past" ? "#ede9fe" : "#e0f2fe",
            color: speaker.speakerType === "past" ? "#6d28d9" : "#0369a1",
            textTransform: "uppercase",
            letterSpacing: "0.03em",
          }}
        >
          {speaker.speakerType === "past" ? "Legacy Edition" : "GHC 2026"}
        </span>
      </div>

      <div
        className="speaker-preview-photo"
        style={{
          width: "100%",
          height: "12rem",
          borderRadius: "14px",
          overflow: "hidden",
          background: "linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "1.25rem",
          position: "relative",
          border: "1px solid #E2E8F0",
        }}
      >
        {previewUrl && !imgError ? (
          <img
            src={getImageUrl(previewUrl)}
            alt=""
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span
            style={{
              fontSize: "2.5rem",
              fontWeight: 800,
              color: "#94A3B8",
              fontFamily: "var(--ghc-font-display)",
            }}
          >
            {initials(speaker.name)}
          </span>
        )}

        {speaker.featured && (
          <span
            style={{
              position: "absolute",
              top: "0.6rem",
              right: "0.6rem",
              background: "rgba(15, 23, 42, 0.8)",
              color: "#FBBF24",
              backdropFilter: "blur(4px)",
              padding: "3px 8px",
              borderRadius: "999px",
              fontSize: "0.72rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "3px",
            }}
          >
            <Star size={11} fill="#FBBF24" />
            Featured
          </span>
        )}
      </div>

      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0F172A", margin: "0 0 0.2rem" }}>
        {speaker.name || "Speaker Name"}
      </h3>
      <p style={{ fontSize: "0.85rem", color: "#64748B", margin: "0 0 0.15rem", fontWeight: 500 }}>
        {speaker.designation || "Designation"}
      </p>
      <strong style={{ fontSize: "0.83rem", color: "#334155", fontWeight: 600 }}>
        {speaker.institution || "Institution / Hospital"}
      </strong>

      <div
        className="speaker-preview-topic"
        style={{
          marginTop: "1rem",
          padding: "0.85rem",
          borderRadius: "12px",
          background: speaker.speakerType === "past" ? "#F5F3FF" : "#F0F9FF",
          border: `1px solid ${speaker.speakerType === "past" ? "#DDD6FE" : "#BAE6FD"}`,
          color: speaker.speakerType === "past" ? "#5B21B6" : "#0369A1",
          fontSize: "0.85rem",
          fontWeight: 600,
          lineHeight: 1.45,
        }}
      >
        <div style={{ fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 800, opacity: 0.8, marginBottom: "2px" }}>
          {speaker.speakerType === "past" ? "Legacy Milestones / Topic" : "Keynote / Talk Topic"}
        </div>
        {speaker.speakerType === "past"
          ? speaker.achievements || speaker.topic || "Add notable achievements to showcase on card"
          : speaker.topic || "Presentation title will appear here"}
      </div>

      {/* Social links row */}
      {(speaker.linkedinUrl || speaker.instagramUrl || speaker.websiteUrl || speaker.twitterUrl) && (
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem" }}>
          {speaker.linkedinUrl && (
            <span style={{ color: "#0A66C2" }} title="LinkedIn">
              <LinkedinIcon size={16} />
            </span>
          )}
          {speaker.instagramUrl && (
            <span style={{ color: "#E4405F" }} title="Instagram">
              <InstagramIcon size={16} />
            </span>
          )}
          {speaker.websiteUrl && (
            <span style={{ color: "#64748B" }} title="Website">
              <Globe size={16} />
            </span>
          )}
          {speaker.twitterUrl && (
            <span style={{ color: "#1DA1F2" }} title="Twitter / X">
              <TwitterIcon size={16} />
            </span>
          )}
        </div>
      )}

      <div className="speaker-preview-flags" style={{ marginTop: "1.1rem", display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        {speaker.keynote && (
          <span style={{ background: "#FEF3C7", color: "#92400E", padding: "2px 8px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 700 }}>
            Keynote
          </span>
        )}
        <span
          style={{
            background: speaker.status === "published" ? "#DCFCE7" : "#F1F5F9",
            color: speaker.status === "published" ? "#166534" : "#475569",
            padding: "2px 8px",
            borderRadius: "999px",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "capitalize",
          }}
        >
          {speaker.status || "draft"}
        </span>
      </div>
    </aside>
  );
}

export default SpeakerPreview;
