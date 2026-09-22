import { useEffect, useState } from "react";
import SpeakerPreview from "./SpeakerPreview";

const emptySpeaker = {
  name: "",
  designation: "",
  institution: "",
  organization: "",
  topic: "",
  bio: "",
  achievements: "",
  linkedinUrl: "",
  twitterUrl: "",
  websiteUrl: "",
  instagramUrl: "",
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
    <form className="speaker-form" onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
      <div className="speaker-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
          <p className="admin-eyebrow">{speaker?.id ? "Edit speaker" : "Add speaker"}</p>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>Speaker Details</h2>
        </div>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Basic Information</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Name<input value={form.name} onChange={(event) => setValue("name", event.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Designation<input value={form.designation || ""} onChange={(event) => setValue("designation", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Institution<input value={form.institution || ""} onChange={(event) => setValue("institution", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Topic<input value={form.topic || ""} onChange={(event) => setValue("topic", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500', gridColumn: '1 / -1' }}>Photo upload<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} style={{ padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Social Profiles</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>LinkedIn URL<input type="url" value={form.linkedinUrl || ""} onChange={(event) => setValue("linkedinUrl", event.target.value)} placeholder="https://linkedin.com/in/..." style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Twitter/X URL<input type="url" value={form.twitterUrl || ""} onChange={(event) => setValue("twitterUrl", event.target.value)} placeholder="https://twitter.com/..." style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Website URL<input type="url" value={form.websiteUrl || ""} onChange={(event) => setValue("websiteUrl", event.target.value)} placeholder="https://..." style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Instagram URL<input type="url" value={form.instagramUrl || ""} onChange={(event) => setValue("instagramUrl", event.target.value)} placeholder="https://instagram.com/..." style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Details & Settings</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Display order<input type="number" value={form.displayOrder || 0} onChange={(event) => setValue("displayOrder", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Status
              <select value={form.status || "draft"} onChange={(event) => setValue("status", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                <option value="draft">Draft</option>
                <option value="confirmed">Confirmed</option>
                <option value="published">Published</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </label>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Bio<textarea value={form.bio || ""} onChange={(event) => setValue("bio", event.target.value)} rows={4} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Achievements<textarea value={form.achievements || ""} onChange={(event) => setValue("achievements", event.target.value)} rows={3} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
          </div>
        </section>

        <div className="speaker-form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="admin-primary-button" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Save Speaker</button>
          <button type="button" className="admin-secondary-button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Cancel</button>
        </div>
      </div>
      <SpeakerPreview speaker={{ ...form, photoPreview }} />
    </form>
  );
}

export default SpeakerForm;
