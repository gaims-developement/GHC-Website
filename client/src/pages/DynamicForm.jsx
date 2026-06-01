import axios from "axios";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../config/api";

const fileTypes = new Set(["file_upload", "image_upload", "signature"]);

function DynamicForm() {
  const slug = useMemo(() => window.location.pathname.split("/").filter(Boolean)[1], []);
  const [form, setForm] = useState(null);
  const [values, setValues] = useState({});
  const [files, setFiles] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    axios.get(apiUrl(`/api/forms/public/${slug}`))
      .then((response) => setForm(response.data.form))
      .catch((requestError) => setError(requestError.response?.data?.message || "This form is not available."));
  }, [slug]);

  useEffect(() => {
    load();
  }, [load]);

  const visibleFields = (form?.fields || []).filter((field) => {
    const logic = field.conditional_logic || {};
    if (!logic.dependsOn) return true;
    const actual = values[logic.dependsOn];
    if (logic.operator === "not_equals") return actual !== logic.value;
    return actual === logic.value;
  });

  const setValue = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const payload = new FormData();
      payload.append("submissionData", JSON.stringify(values));
      Object.entries(files).forEach(([name, fileList]) => {
        Array.from(fileList || []).forEach((file) => payload.append(name, file));
      });
      const response = await axios.post(apiUrl(`/api/forms/public/${slug}/submit`), payload, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage(response.data.message || "Submitted.");
      if (form?.redirect_url) window.setTimeout(() => window.location.assign(form.redirect_url), 800);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to submit form.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    if (field.field_type === "heading") return <h2 className="font-['Sora'] text-2xl font-bold text-[#081B33]">{field.field_label}</h2>;
    if (field.field_type === "paragraph") return <p className="text-[#12385f]/70">{field.help_text || field.placeholder || field.field_label}</p>;
    if (field.field_type === "section_break") return <hr className="border-[#0D47A1]/15" />;
    if (field.field_type === "terms") return <label className="flex gap-3 rounded-2xl bg-white/70 p-4 text-sm text-[#12385f]/75"><input type="checkbox" required={Boolean(field.required)} checked={Boolean(values[field.field_name])} onChange={(event) => setValue(field.field_name, event.target.checked)} /> {field.field_label}</label>;

    const label = <span className="mb-2 block font-['Sora'] text-sm font-bold text-[#081B33]">{field.field_label}{field.required ? " *" : ""}</span>;
    if (field.field_type === "long_text") return <label>{label}<textarea className="w-full rounded-2xl border border-[#0D47A1]/15 bg-white p-3" required={Boolean(field.required)} placeholder={field.placeholder || ""} value={values[field.field_name] || ""} onChange={(event) => setValue(field.field_name, event.target.value)} /></label>;
    if (field.field_type === "dropdown") return <label>{label}<select className="w-full rounded-2xl border border-[#0D47A1]/15 bg-white p-3" required={Boolean(field.required)} value={values[field.field_name] || ""} onChange={(event) => setValue(field.field_name, event.target.value)}><option value="">Select</option>{field.options.map((option) => <option key={option.id} value={option.option_value}>{option.display_text}</option>)}</select></label>;
    if (field.field_type === "radio") return <fieldset>{label}<div className="grid gap-2">{field.options.map((option) => <label key={option.id} className="flex gap-2"><input type="radio" name={field.field_name} required={Boolean(field.required)} value={option.option_value} checked={values[field.field_name] === option.option_value} onChange={(event) => setValue(field.field_name, event.target.value)} /> {option.display_text}</label>)}</div></fieldset>;
    if (["checkbox", "multi_select"].includes(field.field_type)) return <fieldset>{label}<div className="grid gap-2">{field.options.map((option) => <label key={option.id} className="flex gap-2"><input type="checkbox" value={option.option_value} checked={(values[field.field_name] || []).includes(option.option_value)} onChange={(event) => { const current = values[field.field_name] || []; setValue(field.field_name, event.target.checked ? [...current, option.option_value] : current.filter((item) => item !== option.option_value)); }} /> {option.display_text}</label>)}</div></fieldset>;
    if (fileTypes.has(field.field_type)) return <label>{label}<input className="w-full rounded-2xl border border-[#0D47A1]/15 bg-white p-3" type="file" accept={field.field_type === "image_upload" ? "image/*" : undefined} required={Boolean(field.required)} onChange={(event) => setFiles((current) => ({ ...current, [field.field_name]: event.target.files }))} /></label>;
    const type = field.field_type === "short_text" ? "text" : field.field_type === "phone" ? "tel" : field.field_type;
    return <label>{label}<input className="w-full rounded-2xl border border-[#0D47A1]/15 bg-white p-3" type={type} required={Boolean(field.required)} placeholder={field.placeholder || ""} value={values[field.field_name] || ""} onChange={(event) => setValue(field.field_name, event.target.value)} /></label>;
  };

  return (
    <main className="min-h-screen bg-[#F7FBFF] px-4 py-10 text-[#081B33]">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0D47A1]"><ArrowLeft size={16} /> Back to GHC</a>
        <section className="rounded-[2rem] border border-[#0D47A1]/10 bg-white/85 p-6 shadow-xl shadow-[#0D47A1]/10 md:p-8">
          {form ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0D47A1]/70">{form.category}</p>
              <h1 className="mt-3 font-['Sora'] text-4xl font-bold">{form.title}</h1>
              {form.description && <p className="mt-3 text-[#12385f]/72">{form.description}</p>}
              {message ? (
                <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-emerald-800"><CheckCircle2 /> <strong>{message}</strong></div>
              ) : (
                <form className="mt-8 grid gap-5" onSubmit={submit}>
                  {visibleFields.map((field) => <div key={field.id}>{renderField(field)}</div>)}
                  {error && <div className="rounded-2xl bg-red-50 p-4 text-red-700">{error}</div>}
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0D47A1] px-6 py-3 font-bold text-white" disabled={submitting} type="submit"><Send size={18} /> {submitting ? "Submitting..." : "Submit"}</button>
                </form>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-white p-6">{error || "Loading form..."}</div>
          )}
        </section>
      </div>
    </main>
  );
}

export default DynamicForm;
