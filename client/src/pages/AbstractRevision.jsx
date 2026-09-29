import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  ExternalLink,
  FileText,
  Lock,
  MessageSquareText,
  RefreshCw,
  UploadCloud,
} from "lucide-react";
import { apiUrl, getImageUrl } from "../config/api";

const categories = [
  { value: "poster", label: "Poster" },
  { value: "oral", label: "Oral" },
  { value: "research_paper", label: "Research Paper" },
  { value: "case_report", label: "Case Report" },
];

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#6C4AB6]";

export default function AbstractRevision() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = decodeURIComponent(location.pathname.split("/").filter(Boolean).pop() || "");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [abstractInfo, setAbstractInfo] = useState(null);
  const [form, setForm] = useState({ title: "", abstractText: "", category: "poster" });
  const [pdfFile, setPdfFile] = useState(null);
  const [declarationFile, setDeclarationFile] = useState(null);

  useEffect(() => {
    document.body.classList.add("abstract-revision-active");
    document.documentElement.classList.add("abstract-revision-active");
    return () => {
      document.body.classList.remove("abstract-revision-active");
      document.documentElement.classList.remove("abstract-revision-active");
    };
  }, []);

  useEffect(() => {
    let active = true;
    const fetchAbstract = async () => {
      try {
        const response = await axios.get(apiUrl(`/api/research/revision/${token}`));
        if (!active) return;
        const submission = response.data.submission;
        setAbstractInfo(submission);
        setForm({
          title: submission.title || "",
          abstractText: submission.abstractText || "",
          category: submission.category || "poster",
        });
      } catch (err) {
        if (!active) return;
        setError({
          title: err.response?.data?.code === "expired" ? "Expired Link" : err.response?.data?.code === "used" ? "Link Already Used" : "Invalid Link",
          message: err.response?.data?.message || "Invalid revision link.",
          contactEmail: err.response?.data?.contactEmail,
        });
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchAbstract();
    return () => {
      active = false;
    };
  }, [token]);

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (error && abstractInfo) setError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!pdfFile) {
      setError({ title: "Missing File", message: "Please upload the revised abstract PDF." });
      return;
    }

    setSubmitting(true);
    setError(null);
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("abstractText", form.abstractText);
    formData.append("category", form.category);
    formData.append("pdf", pdfFile);
    if (declarationFile) formData.append("declaration", declarationFile);

    try {
      await axios.post(apiUrl(`/api/research/revision/${token}`), formData);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError({
        title: "Submission Failed",
        message: err.response?.data?.message || "Something went wrong. Please try again later.",
        contactEmail: err.response?.data?.contactEmail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const Shell = ({ children }) => (
    <main className="abstract-revision-page min-h-screen bg-white font-['Outfit'] text-[#101828]" style={{ background: "#ffffff", color: "#101828" }}>
      <div className="h-24 md:h-28" />
      <div className="mx-auto max-w-5xl px-6">
        <button onClick={() => navigate("/")} className="inline-flex items-center gap-2 text-sm font-medium text-[#475467] transition-colors hover:text-[#101828]">
          <ArrowLeft className="h-4 w-4 text-[#6C4AB6]" /> Back to Home
        </button>
      </div>
      {children}
    </main>
  );

  if (loading) {
    return (
      <Shell>
        <section className="mx-auto flex min-h-[55vh] max-w-md items-center justify-center px-6 text-center">
          <div>
            <RefreshCw className="mx-auto h-10 w-10 animate-spin text-[#6C4AB6]" />
            <h1 className="mt-5 text-2xl font-extrabold">Validating Revision Link</h1>
            <p className="mt-2 text-sm text-[#475467]">Please wait while we securely load your abstract.</p>
          </div>
        </section>
      </Shell>
    );
  }

  if (success) {
    return (
      <Shell>
        <section className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold">Revision Submitted Successfully</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#475467]">
              Your revised abstract has been received and returned to the Scientific Committee review workflow.
            </p>
            <button onClick={() => navigate("/")} className="mt-8 rounded-full bg-[#101828] px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-900/20 transition-colors hover:bg-slate-800">
              Return to Conclave Homepage
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  if (error && !abstractInfo) {
    return (
      <Shell>
        <section className="mx-auto max-w-lg px-6 py-16 text-center">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            <div className="mx-auto flex h-18 w-18 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AlertTriangle className="h-11 w-11" />
            </div>
            <h1 className="mt-6 text-3xl font-extrabold">{error.title}</h1>
            <p className="mt-3 text-sm leading-6 text-[#475467]">{error.message}</p>
            {error.contactEmail && (
              <a className="mt-4 inline-flex font-bold text-[#6C4AB6]" href={`mailto:${error.contactEmail}`}>
                {error.contactEmail}
              </a>
            )}
            <button onClick={() => navigate("/")} className="mt-8 rounded-full bg-[#101828] px-8 py-3.5 text-sm font-bold text-white">
              Return to Home
            </button>
          </div>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mx-auto max-w-5xl px-6 py-10 text-center">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e244b7]/25 bg-[#e244b7]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#e244b7]">
            <BadgeCheck className="h-4 w-4" /> GHC Scientific Committee
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#6C4AB6]/25 bg-[#6C4AB6]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
            <Lock className="h-3.5 w-3.5" /> Secure Revision Portal
          </div>
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Revise Your <span className="bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] bg-clip-text text-transparent">Abstract</span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#475467] sm:text-lg">
          Review the committee feedback, update the supported abstract fields, and upload your revised PDF for evaluation.
        </p>
      </section>

      <section className="mx-auto max-w-4xl px-4 pb-24">
        <div className="mb-8 overflow-hidden rounded-full bg-gray-100">
          <div className="h-2 w-2/3 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]" />
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-8">
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Applicant</span>
              <p className="mt-1 font-semibold text-slate-900">{abstractInfo?.applicantName}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Version</span>
              <p className="mt-1 font-semibold text-slate-900">Version {abstractInfo?.currentVersion || 1}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</span>
              <p className="mt-1 font-semibold text-slate-900">{categories.find((item) => item.value === form.category)?.label || form.category}</p>
            </div>
          </div>

          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <MessageSquareText className="mt-0.5 h-5 w-5 shrink-0 text-[#e244b7]" />
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-amber-950">Reviewer Comments / Required Revisions</h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-amber-950">
                  {abstractInfo?.revisionComments || "No additional comments were provided."}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <p className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#e244b7]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e244b7]" />
                Revised Submission
              </p>
              <h2 className="text-2xl font-extrabold text-[#101828] sm:text-3xl">Update Abstract Details</h2>
              <p className="mt-2 text-sm text-[#475467]">Only fields already supported by the abstract system are shown here.</p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error.message}</span>
              </div>
            )}

            <label className="block text-sm font-semibold text-[#344054]">
              Abstract Title
              <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} className={inputClass} required />
            </label>

            <label className="block text-sm font-semibold text-[#344054]">
              Category
              <select value={form.category} onChange={(event) => updateForm("category", event.target.value)} className={inputClass}>
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#344054]">
              Abstract Text
              <textarea value={form.abstractText} onChange={(event) => updateForm("abstractText", event.target.value)} className={`${inputClass} min-h-40 resize-y leading-6`} />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="group relative block rounded-2xl border-2 border-dashed border-gray-300 bg-white p-7 text-center shadow-sm transition-all hover:border-[#6C4AB6]">
                <input type="file" accept=".pdf,application/pdf" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(event) => setPdfFile(event.target.files?.[0] || null)} />
                <FileText className="mx-auto mb-4 h-10 w-10 text-gray-400 transition-colors group-hover:text-[#6C4AB6]" />
                <p className="font-semibold text-[#101828]">{pdfFile ? pdfFile.name : "Upload Revised PDF"}</p>
                <p className="mt-1 text-xs text-gray-500">Maximum size 10MB</p>
                <span className="mt-3 inline-block text-sm font-semibold text-[#6C4AB6]">{pdfFile ? "Replace File" : "Click or drag & drop"}</span>
              </label>

              <label className="group relative block rounded-2xl border-2 border-dashed border-gray-300 bg-white p-7 text-center shadow-sm transition-all hover:border-[#6C4AB6]">
                <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" onChange={(event) => setDeclarationFile(event.target.files?.[0] || null)} />
                <UploadCloud className="mx-auto mb-4 h-10 w-10 text-gray-400 transition-colors group-hover:text-[#6C4AB6]" />
                <p className="font-semibold text-[#101828]">{declarationFile ? declarationFile.name : "Declaration Form"}</p>
                <p className="mt-1 text-xs text-gray-500">Optional if unchanged</p>
                <span className="mt-3 inline-block text-sm font-semibold text-[#6C4AB6]">{declarationFile ? "Replace File" : "Upload if needed"}</span>
              </label>
            </div>

            {abstractInfo?.pdfUrl && (
              <a href={getImageUrl(abstractInfo.pdfUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-[#6C4AB6]">
                <ExternalLink className="h-4 w-4" /> View current submitted abstract
              </a>
            )}

            <div className="border-t border-gray-100 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] px-8 py-4 text-base font-extrabold text-white shadow-md shadow-[#e244b7]/25 transition-all hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Submitting Revision...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5" /> Submit Revised Abstract
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1 text-center text-[11px] text-slate-400">
                <Lock className="h-3 w-3" /> Your secure revision token will be invalidated after a successful submission.
              </p>
            </div>
          </form>
        </div>
      </section>
    </Shell>
  );
}
