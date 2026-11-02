import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AlertTriangle, BadgeCheck, CheckCircle2, FileCheck2, Loader2, Lock, ShieldCheck, UploadCloud } from "lucide-react";
import { apiUrl } from "../config/api";

const MAX_FILE_MB = 8;
const inputClass = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#101828] placeholder-gray-400 shadow-xs transition-all focus:border-[#6C4AB6] focus:outline-none focus:ring-2 focus:ring-[#6C4AB6]/20";
const labelClass = "mb-1.5 block text-sm font-semibold text-[#344054]";

export default function DelegateIdForm() {
  const token = useMemo(() => window.location.pathname.match(/\/delegate-id\/([^/?#]+)/)?.[1] || "", []);
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [form, setForm] = useState({ nameOnId: "", idType: "college_id", idNumber: "", phone: "", consent: false });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState("");
  const hasSubmission = Boolean(state.data?.submission);

  useEffect(() => {
    if (!hasSubmission) return undefined;
    let url = "";
    let cancelled = false;
    axios.get(apiUrl(`/api/delegates/id-form/${token}/document`), { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setIdImageUrl(url);
      })
      .catch(() => {}); // The type and last 4 digits still show which ID this is.
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [hasSubmission, token]);

  useEffect(() => {
    if (!token) {
      setState({ loading: false, error: "This link is not valid. Please use the link from your email.", data: null });
      return;
    }
    axios.get(apiUrl(`/api/delegates/id-form/${token}`))
      .then((res) => {
        setState({ loading: false, error: "", data: res.data });
        setForm((current) => ({ ...current, nameOnId: res.data.submission?.nameOnId || res.data.fullName || "", phone: res.data.phone || "" }));
      })
      .catch((err) => setState({ loading: false, error: err.response?.data?.message || "This link could not be opened. Please try again.", data: null }));
  }, [token]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const chooseFile = (event) => {
    const chosen = event.target.files?.[0] || null;
    if (chosen && chosen.size > MAX_FILE_MB * 1024 * 1024) {
      setSubmitError(`Please choose a file smaller than ${MAX_FILE_MB} MB.`);
      setFile(null);
      event.target.value = "";
      return;
    }
    setSubmitError("");
    setFile(chosen);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!file) {
      setSubmitError("Please upload a copy of your College ID.");
      return;
    }
    setSubmitting(true);
    setSubmitError("");
    const body = new FormData();
    Object.entries(form).forEach(([key, value]) => body.append(key, String(value)));
    body.append("idImage", file);
    try {
      await axios.post(apiUrl(`/api/delegates/id-form/${token}`), body);
      setDone(true);
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Your ID could not be submitted. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const { loading, error, data } = state;
  const submission = data?.submission;
  const needsCollegeId = submission && submission.idType !== "college_id";
  const locked = submission && !data.canUpload;
  const showMessage = loading || error || done || locked;
  const currentId = submission && (
    <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 text-left">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">The ID you uploaded</span>
      <p className="mt-1 font-semibold text-slate-900">{submission.idTypeLabel} ending {submission.numberLast4}</p>
      <p className="text-sm text-[#475467]">Name on ID: {submission.nameOnId}</p>
      {idImageUrl && <img src={idImageUrl} alt={`Your uploaded ${submission.idTypeLabel}`} className="mt-3 max-h-80 w-full rounded-xl border border-gray-200 bg-white object-contain" />}
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-['Outfit'] text-[#101828]" style={{ background: "#ffffff", color: "#101828" }}>
      <div className="h-24 md:h-28" />

      {showMessage ? (
        <section className="mx-auto flex min-h-[55vh] max-w-lg items-center justify-center px-6 py-12 text-center">
          <div className="w-full rounded-3xl border border-gray-200 bg-white p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
            {loading && (
              <>
                <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#6C4AB6]" />
                <h1 className="mt-5 text-2xl font-extrabold">Opening Your Form</h1>
                <p className="mt-2 text-sm text-[#475467]">Please wait while we securely load your details.</p>
              </>
            )}
            {error && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-600"><AlertTriangle className="h-11 w-11" /></div>
                <h1 className="mt-6 text-3xl font-extrabold">Link Not Valid</h1>
                <p className="mt-3 text-sm leading-6 text-[#475467]">{error}</p>
              </>
            )}
            {!loading && !error && (
              <>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 className="h-12 w-12" /></div>
                <h1 className="mt-6 text-3xl font-extrabold">{done ? "College ID Received" : submission?.status === "verified" ? "Your ID Is Verified" : "Your ID Is Submitted"}</h1>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-[#475467]">
                  {done ? "Thank you. Our team will review it. You can open this link at any time to view it." : "This ID can no longer be changed. If something is wrong, please contact secretary@gaims.org."} Please carry a valid government-issued photo ID to the venue.
                </p>
                {!done && <div className="mt-6">{currentId}</div>}
              </>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="mx-auto max-w-5xl px-6 pb-10 pt-6 text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#e244b7]/25 bg-[#e244b7]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#e244b7]">
                <BadgeCheck className="h-4 w-4" /> GHC 2026 Delegates
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#6C4AB6]/25 bg-[#6C4AB6]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#6C4AB6]">
                <Lock className="h-3.5 w-3.5" /> Secure College ID Submission
              </div>
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Submit Your <span className="bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] bg-clip-text text-transparent">College ID</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#475467] sm:text-lg">
              Upload your College ID here for pre-event verification. For physical verification at the venue, please carry a valid government-issued photo ID.
            </p>
          </section>

          <section className="mx-auto max-w-3xl px-4 pb-24">
            <form onSubmit={submit} className="rounded-3xl border border-gray-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] sm:p-8">
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Delegate</span>
                  <p className="mt-1 font-semibold text-slate-900">{data.fullName}</p>
                </div>
                <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Registration ID</span>
                  <p className="mt-1 font-semibold text-slate-900">{data.registrationId}</p>
                </div>
              </div>

              {submission?.status === "rejected" && (
                <div role="alert" className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-800">
                  <strong>Please submit your ID again.</strong> {submission.rejectionReason}
                </div>
              )}
              {submission && <div className="mb-6">{currentId}</div>}
              {submission?.status !== "rejected" && submission && (
                <div className="mb-6 rounded-2xl border border-[#6C4AB6]/20 bg-[#6C4AB6]/5 p-4 text-sm leading-6 text-[#4b3389]">
                  {needsCollegeId
                    ? "Please upload your College ID below. It will replace your earlier submission."
                    : "Your College ID is already with us, so you do not need to do anything. Upload again only if this one is wrong."}
                  {" "}<strong>You can re-upload only once.</strong> After that, your ID can be viewed but not changed.
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>Name exactly as on your ID <span className="text-rose-500">*</span></span>
                  <input className={inputClass} value={form.nameOnId} onChange={update("nameOnId")} maxLength={150} required autoComplete="name" />
                </label>
                <label className="block">
                  <span className={labelClass}>Phone number <span className="text-rose-500">*</span></span>
                  <input className={inputClass} type="tel" value={form.phone} onChange={update("phone")} required autoComplete="tel" placeholder="e.g. +91 98765 43210" />
                </label>
                <label className="block sm:col-span-2">
                  <span className={labelClass}>College ID number <span className="text-rose-500">*</span></span>
                  <input className={inputClass} value={form.idNumber} onChange={update("idNumber")} maxLength={30} required autoComplete="off" />
                </label>
              </div>

              <div className="mt-6">
                <span className={labelClass}>Photo or PDF of your College ID <span className="text-rose-500">*</span></span>
                <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-[#6C4AB6]/30 bg-[#6C4AB6]/[0.03] px-6 py-8 text-center transition-colors hover:border-[#6C4AB6]/60 focus-within:border-[#6C4AB6] focus-within:ring-2 focus-within:ring-[#6C4AB6]/20">
                  <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={chooseFile} />
                  {file ? <FileCheck2 className="h-8 w-8 text-emerald-600" /> : <UploadCloud className="h-8 w-8 text-[#6C4AB6]" />}
                  <span className="mt-3 max-w-full break-words font-bold text-[#101828]">{file ? file.name : "Choose a file"}</span>
                  <span className="mt-1 text-xs leading-5 text-[#667085]">
                    {file ? "Tap to choose a different file" : `JPG, PNG, WEBP or PDF, up to ${MAX_FILE_MB} MB. For a PDF, your ID must be on the first page.`}
                  </span>
                </label>
                <p className="mt-2 text-xs leading-5 text-[#667085]">Make sure your photo, name and number are clear.</p>
              </div>

              <label className="mt-6 flex items-start gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-4 text-sm leading-6 text-[#475467]">
                <input className="mt-1 h-5 w-5 shrink-0 accent-[#6C4AB6]" type="checkbox" checked={form.consent} onChange={(e) => setForm((current) => ({ ...current, consent: e.target.checked }))} required />
                <span>I consent to GAIMS storing these details to verify me at the conclave and sharing my name, phone, email, ID type, ID number and a copy of my ID with the venue to confirm my participation.</span>
              </label>

              {submitError && <p role="alert" className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{submitError}</p>}

              <button type="submit" disabled={submitting} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-[#e244b7]/25 transition-all hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <><ShieldCheck className="h-4 w-4" /> Submit My College ID</>}
              </button>
              <p className="mt-3 text-center text-xs text-[#667085]">Your ID is stored privately and access to it is logged.</p>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
