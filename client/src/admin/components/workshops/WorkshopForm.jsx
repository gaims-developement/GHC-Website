import { useEffect, useState } from "react";
import WorkshopPreview from "./WorkshopPreview";
import { createWorkshopSlug } from "../../../data/workshops";

const emptyWorkshop = {
  title: "",
  slug: "",
  faculty: "",
  description: "",
  workshopType: "",
  capacity: 0,
  registeredCount: 0,
  duration: "",
  venue: "",
  date: "",
  price: 0,
  requirements: "",
  learningOutcomes: "",
  whoShouldAttend: "",
  prerequisites: "",
  faq: "",
  featured: false,
  displayOrder: 0,
  status: "draft",
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

function WorkshopForm({ onCancel, onSubmit, workshop }) {
  const [form, setForm] = useState(() => (workshop ? { ...emptyWorkshop, ...workshop, date: toDateInput(workshop.date) } : emptyWorkshop));
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!form.title && !form.workshopType) return;
    const timer = setTimeout(() => {
      localStorage.setItem("ghc_workshop_draft", JSON.stringify(form));
    }, 600);
    return () => clearTimeout(timer);
  }, [form]);

  const setValue = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    if (key === "title" && (!current.slug || current.slug === createWorkshopSlug(current.title))) {
      next.slug = createWorkshopSlug(value);
    }
    return next;
  });

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form, image);
  };

  const imagePreview = image ? URL.createObjectURL(image) : form.imageUrl;

  return (
    <form className="speaker-form" onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
      <div className="speaker-form-fields" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <div>
          <p className="admin-eyebrow">{workshop?.id ? "Edit workshop" : "Add workshop"}</p>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: '600' }}>Workshop Details</h2>
        </div>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Basic Information</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Workshop Name / Title<input value={form.title} onChange={(event) => setValue("title", event.target.value)} required style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Workshop ID<input value={form.workshopCode || ""} onChange={(event) => setValue("workshopCode", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Faculty<input value={form.faculty || ""} onChange={(event) => setValue("faculty", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Workshop Type
              <select value={form.workshopType || ""} onChange={(event) => setValue("workshopType", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                <option value="">Select Type</option>
                <option value="Hands-on">Hands-on</option>
                <option value="Lecture">Lecture</option>
                <option value="Simulation">Simulation</option>
                <option value="Seminar">Seminar</option>
                <option value="Interactive">Interactive</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500', gridColumn: '1 / -1' }}>Workshop Image<input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} style={{ padding: '0.5rem', border: '1px dashed #cbd5e1', borderRadius: '4px', backgroundColor: '#fff', cursor: 'pointer' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500', gridColumn: '1 / -1' }}>Description<textarea value={form.description || ""} onChange={(event) => setValue("description", event.target.value)} rows={4} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Logistics</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Venue<input value={form.venue || ""} onChange={(event) => setValue("venue", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Date<input type="datetime-local" value={form.date || ""} onChange={(event) => setValue("date", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Duration<input value={form.duration || ""} onChange={(event) => setValue("duration", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Capacity<input type="number" min="0" value={form.capacity || 0} onChange={(event) => setValue("capacity", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Curriculum & Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Learning outcomes<textarea value={form.learningOutcomes || ""} onChange={(event) => setValue("learningOutcomes", event.target.value)} rows={3} placeholder="One outcome per line" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Who should attend<textarea value={form.whoShouldAttend || ""} onChange={(event) => setValue("whoShouldAttend", event.target.value)} rows={2} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>FAQs JSON<textarea value={form.faq || ""} onChange={(event) => setValue("faq", event.target.value)} rows={2} placeholder='[{"question":"...","answer":"..."}]' style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical', fontFamily: 'monospace' }} /></label>
          </div>
        </section>
        
        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Settings</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Display order<input type="number" value={form.displayOrder || 0} onChange={(event) => setValue("displayOrder", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Status
              <select value={form.status || "draft"} onChange={(event) => setValue("status", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="closed">Closed</option>
              </select>
            </label>
          </div>
        </section>

        <div className="speaker-form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" className="admin-primary-button" style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Save Workshop</button>
          <button type="button" className="admin-secondary-button" onClick={onCancel} style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}>Cancel</button>
        </div>
      </div>
      <WorkshopPreview workshop={{ ...form, imagePreview }} />
    </form>
  );
}

export default WorkshopForm;
