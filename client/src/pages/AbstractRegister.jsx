import { useState } from "react";
import axios from "axios";
import { ArrowLeft, ArrowRight, FileText, Microscope } from "lucide-react";
import { apiUrl } from "../config/api";

const initialForm = {
  presentingAuthor: "",
  email: "",
  phone: "",
  institution: "",
  category: "poster",
  title: "",
  authors: "",
  abstractText: "",
};

export default function AbstractRegister() {
  const [form, setForm] = useState(initialForm);
  const [pdf, setPdf] = useState(null);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submitAbstract = async (event) => {
    event.preventDefault();
    setSubmissionState({ status: "loading", message: "Submitting abstract..." });

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (pdf) data.append("pdf", pdf);

    try {
      await axios.post(apiUrl("/api/research/submit"), data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmissionState({ status: "success", message: "Research abstract submitted successfully. Our academic review team will follow up by email." });
      setForm(initialForm);
      setPdf(null);
      event.target.reset();
    } catch (error) {
      setSubmissionState({ status: "error", message: error.response?.data?.message || "Unable to submit abstract. Please check the form and try again." });
    }
  };

  return (
    <main className="abstract-page">
      <a href="/" className="abstract-back"><ArrowLeft className="h-4 w-4" /> Back to GHC</a>
      <section className="abstract-shell">
        <div className="abstract-intro">
          <div className="track-icon"><Microscope className="h-6 w-6" /></div>
          <p className="section-kicker">GHC 2026 Research</p>
          <h1>Abstract Registration</h1>
          <p>Submit your poster or oral presentation abstract for review by the GHC academic committee.</p>
          <a href="/templates/ghc-research-abstract-template.txt" download className="hero-button-secondary">Download Template <FileText className="h-4 w-4" /></a>
        </div>

        <form className="research-submit-form abstract-form" onSubmit={submitAbstract}>
          <div className="research-form-header">
            <div>
              <span className="section-kicker">Submission Flow</span>
              <h3>Research details</h3>
            </div>
          </div>
          <div className="research-form-grid">
            <label>Personal details<input name="presentingAuthor" value={form.presentingAuthor} onChange={updateForm} required placeholder="Presenting author name" /></label>
            <label>Email<input name="email" type="email" value={form.email} onChange={updateForm} required placeholder="author@example.com" /></label>
            <label>Phone<input name="phone" value={form.phone} onChange={updateForm} placeholder="+91..." /></label>
            <label>Institution<input name="institution" value={form.institution} onChange={updateForm} required placeholder="Institution / college / hospital" /></label>
            <label>Category<select name="category" value={form.category} onChange={updateForm} required><option value="poster">Poster</option><option value="oral">Oral</option></select></label>
            <label>Title<input name="title" value={form.title} onChange={updateForm} required placeholder="Research title" /></label>
            <label className="research-wide">Authors<textarea name="authors" value={form.authors} onChange={updateForm} required rows={3} placeholder="List all authors in presentation order" /></label>
            <label className="research-wide">Abstract<textarea name="abstractText" value={form.abstractText} onChange={updateForm} required rows={7} placeholder="Background, methods, results and conclusion" /></label>
            <label className="research-wide">PDF upload<input name="pdf" type="file" accept="application/pdf" onChange={(event) => setPdf(event.target.files?.[0] || null)} required /></label>
          </div>
          {submissionState.message && <p className={`research-submit-message ${submissionState.status}`}>{submissionState.message}</p>}
          <button type="submit" className="research-sticky-submit" disabled={submissionState.status === "loading"}>
            {submissionState.status === "loading" ? "Submitting..." : "Submit Abstract"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </section>
    </main>
  );
}
