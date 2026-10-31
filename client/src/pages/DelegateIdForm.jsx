import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { apiUrl } from "../config/api";

const MAX_FILE_MB = 8;
const inputClass = "w-full rounded-xl border border-gray-300 px-4 py-3 text-base text-[#101828] focus:border-[#6C4AB6] focus:outline-none";

export default function DelegateIdForm() {
  const token = useMemo(() => window.location.pathname.match(/\/delegate-id\/([^/?#]+)/)?.[1] || "", []);
  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [form, setForm] = useState({ nameOnId: "", idType: "", idNumber: "", phone: "", consent: false });
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);

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
  const isAadhaar = form.idType === "aadhaar_masked";

  const chooseFile = (event) => {
    const chosen = event.target.files?.[0] || null;
    if (chosen && chosen.size > MAX_FILE_MB * 1024 * 1024) {
      setSubmitError(`Please choose a photo smaller than ${MAX_FILE_MB} MB.`);
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
      setSubmitError("Please upload a photo of your ID.");
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
  const showMessage = loading || error || done || submission?.status === "verified";

  return (
    <div className="min-h-screen bg-[#F4F1FB] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">
        {showMessage ? (
          <div className="text-center">
            {loading && <Loader2 className="w-10 h-10 mx-auto mb-4 text-[#6C4AB6] animate-spin" />}
            {error && (
              <>
                <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h1 className="text-2xl font-extrabold text-[#101828] mb-2">Link not valid</h1>
                <p className="text-gray-600">{error}</p>
              </>
            )}
            {!loading && !error && (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-500" />
                <h1 className="text-2xl font-extrabold text-[#101828] mb-2">{done ? "Thank you, your ID has been received" : "Your ID is verified"}</h1>
                <p className="text-gray-600">{done ? "Our team will review it. Please carry the same ID with you to the conclave." : "No further action is needed. Please carry the same ID with you to the conclave."}</p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="flex items-center gap-2 text-[#6C4AB6] font-bold text-sm mb-2"><ShieldCheck className="w-5 h-5" /> Secure ID submission</div>
            <h1 className="text-2xl font-extrabold text-[#101828] mb-1">Submit Your Photo ID</h1>
            <p className="text-gray-600 mb-5">{data.fullName} · {data.registrationId}. Global Healthcare Conclave 2026, Bharat Mandapam, New Delhi.</p>

            {submission?.status === "rejected" && (
              <div role="alert" className="rounded-xl bg-red-50 border border-red-200 text-red-800 p-3 mb-4 text-sm">
                <strong>Please submit your ID again.</strong> {submission.rejectionReason}
              </div>
            )}
            {submission?.status === "pending" && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-800 p-3 mb-4 text-sm">
                We have your {submission.idTypeLabel} ending {submission.numberLast4}. Submit again only if you need to replace it.
              </div>
            )}

            <div className="grid gap-4">
              <label className="block">
                <span className="block font-semibold text-[#101828] mb-1">Name exactly as on your ID</span>
                <input className={inputClass} value={form.nameOnId} onChange={update("nameOnId")} maxLength={150} required autoComplete="name" />
              </label>
              <label className="block">
                <span className="block font-semibold text-[#101828] mb-1">Phone number</span>
                <input className={inputClass} type="tel" value={form.phone} onChange={update("phone")} required autoComplete="tel" placeholder="+91 98765 43210" />
              </label>
              <label className="block">
                <span className="block font-semibold text-[#101828] mb-1">ID type</span>
                <select className={inputClass} value={form.idType} onChange={update("idType")} required>
                  <option value="">Choose your ID</option>
                  {data.idTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
                <span className="block text-sm text-gray-500 mt-1">International delegates should use their passport.</span>
              </label>
              <label className="block">
                <span className="block font-semibold text-[#101828] mb-1">{isAadhaar ? "Last 4 digits of your Aadhaar" : "ID number"}</span>
                <input className={inputClass} value={form.idNumber} onChange={update("idNumber")} maxLength={isAadhaar ? 14 : 20} inputMode={isAadhaar ? "numeric" : "text"} required autoComplete="off" />
              </label>
              {isAadhaar && (
                <p className="rounded-xl bg-amber-50 border border-amber-200 text-amber-900 p-3 text-sm">
                  Please upload a <strong>masked Aadhaar</strong> that shows only the last 4 digits. You can download one from the UIDAI website. Do not upload an unmasked Aadhaar.
                </p>
              )}
              <label className="block">
                <span className="block font-semibold text-[#101828] mb-1">Photo of your ID</span>
                <input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} required />
                <span className="block text-sm text-gray-500 mt-1">JPG, PNG or WEBP, up to {MAX_FILE_MB} MB. Make sure your photo, name and number are clear.</span>
              </label>
              <label className="flex items-start gap-3 text-sm text-gray-700">
                <input className="mt-1 w-5 h-5 shrink-0" type="checkbox" checked={form.consent} onChange={(e) => setForm((current) => ({ ...current, consent: e.target.checked }))} required />
                <span>I consent to GAIMS storing these details to verify me at the conclave and sharing my name, phone, email, ID type and ID number with the venue to confirm my participation.</span>
              </label>
            </div>

            {submitError && <p role="alert" className="text-red-700 font-semibold mt-4">{submitError}</p>}
            <button type="submit" disabled={submitting} className="w-full mt-5 rounded-xl bg-[#6C4AB6] text-white font-bold py-3.5 disabled:opacity-60">
              {submitting ? "Submitting…" : "Submit My ID"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
