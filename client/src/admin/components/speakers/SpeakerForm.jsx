import { useEffect, useState } from "react";
import SpeakerPreview from "./SpeakerPreview";

const emptySpeaker = {
  name: "",
  designation: "",
  institution: "",
  organization: "",
  specialization: "",
  country: "",
  city: "",
  bio: "",
  topic: "",
  achievements: "",
  travelStatus: "",
  accommodationStatus: "",
  specialRequirements: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  instagramUrl: "",
  featured: false,
  keynote: false,
  displayOrder: 0,
  status: "draft",
};

function SpeakerForm({ speaker, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => (speaker ? { ...emptySpeaker, ...speaker } : emptySpeaker));
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    if (!form.name && !form.topic) return;
    const timer = setTimeout(() => {
      localStorage.setItem("ghc_speaker_draft", JSON.stringify(form));
    }, 600);
    return () => clearTimeout(timer);
  }, [form]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form, photo);
  };

  const photoPreview = photo ? URL.createObjectURL(photo) : form.photoUrl;

  return (
    <form className="speaker-form" onSubmit={submit}>
      <div className="speaker-form-fields">
        <p className="admin-eyebrow">{speaker?.id ? "Edit speaker" : "Add speaker"}</p>
        <label>Photo upload<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>
        <div className="speaker-form-grid">
          <label>Name<input value={form.name} onChange={(event) => setValue("name", event.target.value)} required /></label>
          <label>Designation<input value={form.designation || ""} onChange={(event) => setValue("designation", event.target.value)} /></label>
          <label>Institution<input value={form.institution || ""} onChange={(event) => setValue("institution", event.target.value)} /></label>
          <label>Specialization<input value={form.specialization || ""} onChange={(event) => setValue("specialization", event.target.value)} /></label>
          <label>Country<input value={form.country || ""} onChange={(event) => setValue("country", event.target.value)} /></label>
          <label>City<input value={form.city || ""} onChange={(event) => setValue("city", event.target.value)} /></label>
          <label>Email<input value={form.email || ""} onChange={(event) => setValue("email", event.target.value)} /></label>
          <label>Phone<input value={form.phone || ""} onChange={(event) => setValue("phone", event.target.value)} /></label>
          <label>Topic<input value={form.topic || ""} onChange={(event) => setValue("topic", event.target.value)} /></label>
          <label>LinkedIn<input value={form.linkedinUrl || ""} onChange={(event) => setValue("linkedinUrl", event.target.value)} /></label>
          <label>Twitter/X<input value={form.twitterUrl || ""} onChange={(event) => setValue("twitterUrl", event.target.value)} /></label>
          <label>Website<input value={form.websiteUrl || ""} onChange={(event) => setValue("websiteUrl", event.target.value)} /></label>
          <label>Instagram<input value={form.instagramUrl || ""} onChange={(event) => setValue("instagramUrl", event.target.value)} /></label>
          <label>Display order<input type="number" value={form.displayOrder || 0} onChange={(event) => setValue("displayOrder", event.target.value)} /></label>
          <label>Travel Status<input value={form.travelStatus || ""} onChange={(event) => setValue("travelStatus", event.target.value)} /></label>
          <label>Accommodation Status<input value={form.accommodationStatus || ""} onChange={(event) => setValue("accommodationStatus", event.target.value)} /></label>
          <label>Status<select value={form.status || "draft"} onChange={(event) => setValue("status", event.target.value)}><option value="draft">Draft</option><option value="confirmed">Confirmed</option><option value="published">Published</option><option value="cancelled">Cancelled</option></select></label>
        </div>
        <label>Bio<textarea value={form.bio || ""} onChange={(event) => setValue("bio", event.target.value)} rows={4} /></label>
        <label>Achievements<textarea value={form.achievements || ""} onChange={(event) => setValue("achievements", event.target.value)} rows={3} /></label>
        <label>Special Requirements<textarea value={form.specialRequirements || ""} onChange={(event) => setValue("specialRequirements", event.target.value)} rows={3} /></label>
        <div className="speaker-toggle-row">
          <label><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => setValue("featured", event.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={Boolean(form.keynote)} onChange={(event) => setValue("keynote", event.target.checked)} /> Keynote</label>
        </div>
        <div className="speaker-form-actions">
          <button type="submit">Save Speaker</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <SpeakerPreview speaker={{ ...form, photoPreview }} />
    </form>
  );
}

export default SpeakerForm;
