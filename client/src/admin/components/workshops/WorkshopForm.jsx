import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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

const parseInitialFaqs = (faqData) => {
  if (!faqData) return [];
  if (Array.isArray(faqData)) return faqData;
  if (typeof faqData === "string") {
    try {
      const parsed = JSON.parse(faqData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
};

function WorkshopForm({ onCancel, onSubmit, workshop }) {
  const [form, setForm] = useState(() => (workshop ? { ...emptyWorkshop, ...workshop, date: toDateInput(workshop.date) } : emptyWorkshop));
  const [faqs, setFaqs] = useState(() => parseInitialFaqs(workshop?.faq || workshop?.faqs));
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!form.title && !form.workshopType) return;
    const timer = setTimeout(() => {
      localStorage.setItem("ghc_workshop_draft", JSON.stringify({ ...form, faq: JSON.stringify(faqs) }));
    }, 600);
    return () => clearTimeout(timer);
  }, [form, faqs]);

  const setValue = (key, value) => setForm((current) => {
    const next = { ...current, [key]: value };
    if (key === "title" && (!current.slug || current.slug === createWorkshopSlug(current.title))) {
      next.slug = createWorkshopSlug(value);
    }
    return next;
  });

  const addFaq = () => {
    setFaqs((current) => [...current, { question: "", answer: "" }]);
  };

  const updateFaq = (index, field, value) => {
    setFaqs((current) => {
      const next = [...current];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const removeFaq = (index) => {
    setFaqs((current) => current.filter((_, i) => i !== index));
  };

  const submit = (event) => {
    event.preventDefault();
    const cleanFaqs = faqs
      .map((f) => ({ question: (f.question || "").trim(), answer: (f.answer || "").trim() }))
      .filter((f) => f.question || f.answer);

    onSubmit({ ...form, faq: JSON.stringify(cleanFaqs) }, image);
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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Speaker / Faculty Name<input value={form.faculty || ""} onChange={(event) => setValue("faculty", event.target.value)} placeholder="e.g. Dr. Jane Doe" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
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
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500', gridColumn: '1 / -1' }}>Brief Details / Description<textarea value={form.description || ""} onChange={(event) => setValue("description", event.target.value)} rows={4} placeholder="Brief summary and overview of the workshop..." style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Logistics</h3>
          <div className="speaker-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Location / Venue<input value={form.venue || ""} onChange={(event) => setValue("venue", event.target.value)} placeholder="e.g. New Delhi" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Date<input type="datetime-local" value={form.date || ""} onChange={(event) => setValue("date", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Duration<input value={form.duration || ""} onChange={(event) => setValue("duration", event.target.value)} placeholder="e.g. 22nd & 23rd Nov" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Workshop Capacity (Total Seats)<input type="number" min="0" value={form.capacity || 0} onChange={(event) => setValue("capacity", event.target.value)} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#334155' }}>Curriculum & Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Learning outcomes<textarea value={form.learningOutcomes || ""} onChange={(event) => setValue("learningOutcomes", event.target.value)} rows={3} placeholder="One outcome per line" style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Who should attend<textarea value={form.whoShouldAttend || ""} onChange={(event) => setValue("whoShouldAttend", event.target.value)} rows={2} style={{ padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', resize: 'vertical' }} /></label>
          </div>
        </section>

        <section className="form-section" style={{ backgroundColor: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0, color: '#334155' }}>Frequently Asked Questions (FAQs)</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>Add common delegate questions and detailed answers for this workshop.</p>
            </div>
            <button
              type="button"
              onClick={addFaq}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.875rem',
                backgroundColor: '#173B8F',
                color: '#fff',
                fontSize: '0.875rem',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Plus size={16} /> Add FAQ
            </button>
          </div>

          {faqs.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed #cbd5e1', borderRadius: '6px', backgroundColor: '#fff', color: '#64748b', fontSize: '0.875rem' }}>
              No FAQs added yet. Click <strong>"Add FAQ"</strong> above to add question and answer fields.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {faqs.map((faqItem, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: '#fff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: '700', color: '#173B8F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      FAQ #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFaq(index)}
                      title="Remove FAQ"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        color: '#ef4444',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>

                  {/* Question Field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#334155' }}>
                      Question <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={faqItem.question || ""}
                      onChange={(e) => updateFaq(index, "question", e.target.value)}
                      placeholder="e.g. Are surgical instruments provided at the workshop?"
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                      }}
                    />
                  </div>

                  {/* Answer Field */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#334155' }}>
                      Answer <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={faqItem.answer || ""}
                      onChange={(e) => updateFaq(index, "answer", e.target.value)}
                      placeholder="e.g. Yes, all required clinical simulators and instruments will be provided in New Delhi."
                      style={{
                        padding: '0.5rem 0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        resize: 'vertical',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
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
