import { useEffect, useRef, useState } from "react";
import {
  Award,
  Calendar,
  Check,
  CheckCircle2,
  FileText,
  Globe,
  Image as ImageIcon,
  Mic,
  Save,
  Sparkles,
  Star,
  Upload,
  User,
  X,
} from "lucide-react";
import SpeakerPreview from "./SpeakerPreview";

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

const emptySpeaker = {
  name: "",
  designation: "",
  institution: "",
  organization: "",
  topic: "",
  bio: "",
  achievements: "",
  speakerType: "current",
  linkedinUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  instagramUrl: "",
  displayOrder: 0,
  status: "published",
  featured: false,
  keynote: false,
};

function SpeakerForm({ speaker, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => (speaker ? { ...emptySpeaker, ...speaker } : emptySpeaker));
  const [photo, setPhoto] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-save draft in localStorage for new speakers
  useEffect(() => {
    if (speaker?.id) return;
    if (!form.name && !form.topic) return;
    const timer = setTimeout(() => {
      localStorage.setItem("ghc_speaker_draft", JSON.stringify(form));
    }, 600);
    return () => clearTimeout(timer);
  }, [form, speaker]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handlePhotoSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      setPhoto(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      handlePhotoSelect(e.dataTransfer.files[0]);
    }
  };

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form, photo);
  };

  const photoPreview = photo ? URL.createObjectURL(photo) : form.photoUrl;

  return (
    <form className="speaker-form-v2-container" onSubmit={submit}>
      {/* Header */}
      <div className="speaker-form-v2-header">
        <div>
          <span className="admin-eyebrow">
            {speaker?.id ? "Update Existing Profile" : "New Speaker Enrollment"}
          </span>
          <h2>{speaker?.id ? `Edit: ${form.name || "Speaker Profile"}` : "Add New Speaker"}</h2>
          <p>
            Configure conference edition, credentials, talk topics, and public profile visibility.
          </p>
        </div>
        <button
          type="button"
          className="speaker-close-form-btn"
          onClick={onCancel}
          title="Close Form"
        >
          <X size={18} />
        </button>
      </div>

      {/* Prominent Speaker Edition Selector (Current vs Past) */}
      <div className="speaker-type-cards-grid">
        <button
          type="button"
          className={`speaker-type-selection-card ${form.speakerType === "current" ? "selected" : ""}`}
          onClick={() => setValue("speakerType", "current")}
        >
          <div className="speaker-type-icon-box">
            <Mic size={22} />
          </div>
          <div className="speaker-type-card-content">
            <strong>
              Current Speaker (GHC 2026)
              {form.speakerType === "current" && (
                <span className="speaker-type-check-badge">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </strong>
            <p>
              Features in the World-Class Speakers conclave lineup with live sessions, talk topics, and event schedule.
            </p>
          </div>
        </button>

        <button
          type="button"
          className={`speaker-type-selection-card ${form.speakerType === "past" ? "selected" : ""}`}
          onClick={() => setValue("speakerType", "past")}
        >
          <div className="speaker-type-icon-box">
            <Award size={22} />
          </div>
          <div className="speaker-type-card-content">
            <strong>
              Past Speaker (Legacy Editions)
              {form.speakerType === "past" && (
                <span className="speaker-type-check-badge">
                  <Check size={13} strokeWidth={3} />
                </span>
              )}
            </strong>
            <p>
              Honored in the historic speaker archive and homepage legacy marquee with their career milestones & achievements.
            </p>
          </div>
        </button>
      </div>

      {/* Main Grid: Left Form Panels, Right Sticky Live Preview */}
      <div className="speaker-form-layout-grid">
        <div className="speaker-form-sections-col">
          {/* Panel 1: Photo Upload Dropzone */}
          <div className="speaker-form-panel-card">
            <div className="speaker-panel-title-row">
              <ImageIcon className="speaker-panel-title-icon" size={19} />
              <h3>Speaker Photo / Headshot</h3>
            </div>

            <div
              className={`speaker-photo-dropzone-box ${isDragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="speaker-dropzone-preview-avatar">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" />
                ) : (
                  <span>{form.name ? form.name.slice(0, 2).toUpperCase() : "SP"}</span>
                )}
              </div>

              <div className="speaker-dropzone-controls">
                <p style={{ margin: "0 0 0.4rem", fontWeight: 700, color: "#1E293B", fontSize: "0.92rem" }}>
                  {photo ? photo.name : form.photoUrl ? "Current photo attached" : "Upload a professional headshot"}
                </p>
                <p style={{ margin: "0 0 0.85rem", fontSize: "0.8rem", color: "#64748B" }}>
                  PNG, JPG, or WebP. High resolution square crop recommended (min. 400x400px).
                </p>

                <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => handlePhotoSelect(e.target.files?.[0])}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    className="speaker-upload-file-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={14} />
                    {photoPreview ? "Change Photo" : "Choose Image"}
                  </button>

                  {photo && (
                    <button
                      type="button"
                      onClick={() => setPhoto(null)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#DC2626",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <X size={13} />
                      Remove selected
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Basic Credentials */}
          <div className="speaker-form-panel-card">
            <div className="speaker-panel-title-row">
              <User className="speaker-panel-title-icon" size={19} />
              <h3>Credentials & Affiliation</h3>
            </div>

            <div className="speaker-fields-grid-2">
              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Full Name <span className="req">*</span></span>
                </label>
                <div className="speaker-field-input-box">
                  <input
                    value={form.name}
                    onChange={(e) => setValue("name", e.target.value)}
                    placeholder="e.g. Dr. Mukesh Bhatia"
                    required
                  />
                </div>
              </div>

              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Designation / Role</span>
                </label>
                <div className="speaker-field-input-box">
                  <input
                    value={form.designation || ""}
                    onChange={(e) => setValue("designation", e.target.value)}
                    placeholder="e.g. Founder & Director"
                  />
                </div>
              </div>

              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Institution / Hospital / Organization</span>
                </label>
                <div className="speaker-field-input-box">
                  <input
                    value={form.institution || ""}
                    onChange={(e) => setValue("institution", e.target.value)}
                    placeholder="e.g. DBMCI / AIIMS"
                  />
                </div>
              </div>

              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Display Priority Order</span>
                  <span className="hint">Lower number = appears first</span>
                </label>
                <div className="speaker-field-input-box">
                  <input
                    type="number"
                    value={form.displayOrder ?? 0}
                    onChange={(e) => setValue("displayOrder", parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Topic & Achievements (Adapts dynamically based on Current vs Past) */}
          <div className="speaker-form-panel-card">
            <div className="speaker-panel-title-row">
              <FileText className="speaker-panel-title-icon" size={19} />
              <h3>Presentation & Achievements</h3>
            </div>

            <div className="speaker-fields-grid-2">
              <div className="speaker-field-item full-width">
                <label className="speaker-field-label">
                  <span>
                    {form.speakerType === "past" ? "Session / Keynote Topic (Historical)" : "Session Topic / Talk Title"}
                  </span>
                  {form.speakerType === "current" && <span className="hint">Displayed prominently under speaker name</span>}
                </label>
                <div className="speaker-field-input-box">
                  <input
                    value={form.topic || ""}
                    onChange={(e) => setValue("topic", e.target.value)}
                    placeholder={
                      form.speakerType === "past"
                        ? "e.g. Keynote Address on Future of Surgery (2024)"
                        : "e.g. Advances in Robot-Assisted Laparoscopic Surgery"
                    }
                  />
                </div>
              </div>

              <div className="speaker-field-item full-width">
                <label className="speaker-field-label">
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    Notable Achievements & Honors
                    {form.speakerType === "past" && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "999px",
                          background: "#ede9fe",
                          color: "#6d28d9",
                        }}
                      >
                        Featured on Website Card
                      </span>
                    )}
                  </span>
                  <span className="hint">Key career milestones, awards, or previous leadership</span>
                </label>
                <textarea
                  rows={3}
                  value={form.achievements || ""}
                  onChange={(e) => setValue("achievements", e.target.value)}
                  placeholder="e.g. Padma Shri Awardee, Former Director AIIMS New Delhi, Pioneer of Minimally Invasive Surgery in India"
                />
              </div>

              <div className="speaker-field-item full-width">
                <label className="speaker-field-label">
                  <span>Biography & Clinical Background</span>
                  <span className="hint">Detailed profile overview</span>
                </label>
                <textarea
                  rows={4}
                  value={form.bio || ""}
                  onChange={(e) => setValue("bio", e.target.value)}
                  placeholder="Provide a comprehensive summary of their clinical research, professional practice, and contributions to healthcare..."
                />
              </div>
            </div>
          </div>

          {/* Panel 4: Social & Web Presence */}
          <div className="speaker-form-panel-card">
            <div className="speaker-panel-title-row">
              <Globe className="speaker-panel-title-icon" size={19} />
              <h3>Social Profiles & Links</h3>
            </div>

            <div className="speaker-fields-grid-2">
              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>LinkedIn Profile</span>
                </label>
                <div className="speaker-field-input-box has-icon">
                  <LinkedinIcon className="field-icon" size={16} />
                  <input
                    type="url"
                    value={form.linkedinUrl || ""}
                    onChange={(e) => setValue("linkedinUrl", e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>

              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Instagram</span>
                </label>
                <div className="speaker-field-input-box has-icon">
                  <InstagramIcon className="field-icon" size={16} />
                  <input
                    type="url"
                    value={form.instagramUrl || ""}
                    onChange={(e) => setValue("instagramUrl", e.target.value)}
                    placeholder="https://instagram.com/username"
                  />
                </div>
              </div>

              <div className="speaker-field-item full-width">
                <label className="speaker-field-label">
                  <span>Website / Portfolio</span>
                </label>
                <div className="speaker-field-input-box has-icon">
                  <Globe className="field-icon" size={16} />
                  <input
                    type="url"
                    value={form.websiteUrl || ""}
                    onChange={(e) => setValue("websiteUrl", e.target.value)}
                    placeholder="https://drmukeshbhatia.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Panel 5: Publishing & Badges */}
          <div className="speaker-form-panel-card">
            <div className="speaker-panel-title-row">
              <Sparkles className="speaker-panel-title-icon" size={19} />
              <h3>Publishing & Feature Badges</h3>
            </div>

            <div className="speaker-fields-grid-2">
              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Publication Status</span>
                </label>
                <div className="speaker-field-input-box">
                  <select
                    value={form.status || "published"}
                    onChange={(e) => setValue("status", e.target.value)}
                    style={{ fontWeight: 600 }}
                  >
                    <option value="published">Published (Visible on site)</option>
                    <option value="confirmed">Confirmed (Internal)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="speaker-field-item">
                <label className="speaker-field-label">
                  <span>Highlights & Flags</span>
                </label>
                <div className="speaker-toggles-row" style={{ marginTop: "0.2rem" }}>
                  <button
                    type="button"
                    className={`speaker-toggle-chip ${form.featured ? "active" : ""}`}
                    onClick={() => setValue("featured", !form.featured)}
                  >
                    <Star size={15} style={{ fill: form.featured ? "currentColor" : "none" }} />
                    <span>Featured Speaker</span>
                  </button>

                  <button
                    type="button"
                    className={`speaker-toggle-chip ${form.keynote ? "active" : ""}`}
                    onClick={() => setValue("keynote", !form.keynote)}
                  >
                    <Award size={15} />
                    <span>Keynote Speaker</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="speaker-form-actions-bar">
            <button type="button" className="speaker-btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="speaker-btn-primary">
              <Save size={16} />
              {speaker?.id ? "Save Changes" : "Create Speaker"}
            </button>
          </div>
        </div>

        {/* Right Sticky Preview */}
        <div style={{ position: "sticky", top: "1.5rem" }}>
          <SpeakerPreview speaker={{ ...form, photoPreview }} />
        </div>
      </div>
    </form>
  );
}

export default SpeakerForm;
