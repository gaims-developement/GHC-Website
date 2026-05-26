import { useEffect, useState } from "react";
import ResearchPreview from "./ResearchPreview";

const emptySubmission = {
  title: "",
  authors: "",
  presentingAuthor: "",
  institution: "",
  email: "",
  phone: "",
  category: "poster",
  track: "",
  keywords: "",
  abstractText: "",
  status: "draft",
  awardNomination: false,
};

function ResearchForm({ onCancel, onSubmit, submission }) {
  const [form, setForm] = useState(() => (submission ? { ...emptySubmission, ...submission } : emptySubmission));
  const [pdf, setPdf] = useState(null);

  useEffect(() => {
    if (!form.title && !form.abstractText) return;
    const timer = setTimeout(() => {
      localStorage.setItem("ghc_research_draft", JSON.stringify(form));
    }, 600);
    return () => clearTimeout(timer);
  }, [form]);

  const setValue = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form, pdf);
  };

  return (
    <form className="speaker-form workshop-form research-form" onSubmit={submit}>
      <div className="speaker-form-fields">
        <p className="admin-eyebrow">{submission?.id ? "Edit submission" : "Add submission"}</p>
        <label>PDF upload<input type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} /></label>
        <div className="speaker-form-grid">
          <label>Title<input value={form.title} onChange={(event) => setValue("title", event.target.value)} required /></label>
          <label>Authors<input value={form.authors || ""} onChange={(event) => setValue("authors", event.target.value)} /></label>
          <label>Presenting author<input value={form.presentingAuthor || ""} onChange={(event) => setValue("presentingAuthor", event.target.value)} /></label>
          <label>Institution<input value={form.institution || ""} onChange={(event) => setValue("institution", event.target.value)} /></label>
          <label>Email<input type="email" value={form.email || ""} onChange={(event) => setValue("email", event.target.value)} /></label>
          <label>Phone<input value={form.phone || ""} onChange={(event) => setValue("phone", event.target.value)} /></label>
          <label>Track<input value={form.track || ""} onChange={(event) => setValue("track", event.target.value)} /></label>
          <label>Keywords<input value={form.keywords || ""} onChange={(event) => setValue("keywords", event.target.value)} /></label>
          <label>Category<select value={form.category || "poster"} onChange={(event) => setValue("category", event.target.value)}><option value="poster">Poster</option><option value="oral">Oral</option></select></label>
          <label>Status<select value={form.status || "draft"} onChange={(event) => setValue("status", event.target.value)}><option value="draft">Draft</option><option value="submitted">Submitted</option><option value="under_review">Under review</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label>
        </div>
        <label>Abstract text<textarea value={form.abstractText || ""} onChange={(event) => setValue("abstractText", event.target.value)} rows={6} /></label>
        <div className="speaker-toggle-row">
          <label><input type="checkbox" checked={Boolean(form.awardNomination)} onChange={(event) => setValue("awardNomination", event.target.checked)} /> Award nominee</label>
        </div>
        <div className="speaker-form-actions">
          <button type="submit">Save Research</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      <ResearchPreview submission={form} />
    </form>
  );
}

export default ResearchForm;
