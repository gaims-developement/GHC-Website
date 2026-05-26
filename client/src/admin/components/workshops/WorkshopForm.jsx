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
    <form className="speaker-form workshop-form" onSubmit={submit}>
      <div className="speaker-form-fields">
        <p className="admin-eyebrow">{workshop?.id ? "Edit workshop" : "Add workshop"}</p>
        <label>Image<input type="file" accept="image/*" onChange={(event) => setImage(event.target.files?.[0] || null)} /></label>
        <div className="speaker-form-grid">
          <label>Title<input value={form.title} onChange={(event) => setValue("title", event.target.value)} required /></label>
          <label>Slug<input value={form.slug || createWorkshopSlug(form.title)} onChange={(event) => setValue("slug", event.target.value)} /></label>
          <label>Faculty<input value={form.faculty || ""} onChange={(event) => setValue("faculty", event.target.value)} /></label>
          <label>Workshop type<input value={form.workshopType || ""} onChange={(event) => setValue("workshopType", event.target.value)} /></label>
          <label>Capacity<input type="number" min="0" value={form.capacity || 0} onChange={(event) => setValue("capacity", event.target.value)} /></label>
          <label>Registered count<input type="number" min="0" value={form.registeredCount || 0} onChange={(event) => setValue("registeredCount", event.target.value)} /></label>
          <label>Duration<input value={form.duration || ""} onChange={(event) => setValue("duration", event.target.value)} /></label>
          <label>Venue<input value={form.venue || ""} onChange={(event) => setValue("venue", event.target.value)} /></label>
          <label>Date<input type="datetime-local" value={form.date || ""} onChange={(event) => setValue("date", event.target.value)} /></label>
          <label>Price<input type="number" min="0" step="0.01" value={form.price || 0} onChange={(event) => setValue("price", event.target.value)} /></label>
          <label>Display order<input type="number" value={form.displayOrder || 0} onChange={(event) => setValue("displayOrder", event.target.value)} /></label>
          <label>Status<select value={form.status || "draft"} onChange={(event) => setValue("status", event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
        </div>
        <label>Description<textarea value={form.description || ""} onChange={(event) => setValue("description", event.target.value)} rows={4} /></label>
        <label>Requirements<textarea value={form.requirements || ""} onChange={(event) => setValue("requirements", event.target.value)} rows={3} /></label>
        <label>Learning outcomes<textarea value={form.learningOutcomes || ""} onChange={(event) => setValue("learningOutcomes", event.target.value)} rows={3} placeholder="One outcome per line" /></label>
        <label>Who should attend<textarea value={form.whoShouldAttend || ""} onChange={(event) => setValue("whoShouldAttend", event.target.value)} rows={3} /></label>
        <label>Prerequisites<textarea value={form.prerequisites || ""} onChange={(event) => setValue("prerequisites", event.target.value)} rows={3} /></label>
        <label>FAQs JSON<textarea value={form.faq || ""} onChange={(event) => setValue("faq", event.target.value)} rows={3} placeholder='[{"question":"...","answer":"..."}]' /></label>
        <div className="speaker-toggle-row">
          <label><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => setValue("featured", event.target.checked)} /> Featured</label>
        </div>
        <div className="speaker-form-actions">
          <button type="submit">Save Workshop</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <WorkshopPreview workshop={{ ...form, imagePreview }} />
    </form>
  );
}

export default WorkshopForm;
