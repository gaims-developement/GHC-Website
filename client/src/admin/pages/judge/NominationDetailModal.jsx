import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  ExternalLink,
  Eye,
  AlertCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
  Calendar,
  Globe,
  Award,
  ShieldCheck,
  FileCheck,
  CreditCard,
  MapPin,
} from "lucide-react";

export default function NominationDetailModal({
  nomination,
  onClose,
  onDecisionSuccess,
  api,
  user,
}) {
  const [decisionNotes, setDecisionNotes] = useState("");
  const [confirmDialog, setConfirmDialog] = useState(null); // 'ACCEPT' | 'REJECT' | null
  const [processing, setProcessing] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'warning' | 'error', message: '' }

  if (!nomination) return null;

  const isDecided = nomination.status === "ACCEPTED" || nomination.status === "REJECTED";
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN" || user?.permissions?.includes?.("manage_awards") || (user && !user?.role?.includes("JUDGE"));

  const handleDecision = async (decision) => {
    setProcessing(true);
    setFeedback(null);
    try {
      const endpoint = decision === "ACCEPT"
        ? `/api/judge/nominations/${nomination.id}/accept`
        : `/api/judge/nominations/${nomination.id}/reject`;

      const response = await api.post(endpoint, { decisionNotes });
      const data = response.data;

      if (decision === "ACCEPT") {
        if (data.emailDelivered === false) {
          setFeedback({
            type: "warning",
            message: data.message || "Nominee accepted, but the acceptance email could not be delivered. The email can be retried from Email Delivery.",
          });
        } else {
          setFeedback({
            type: "success",
            message: "Nominee accepted successfully.",
          });
        }
      } else {
        setFeedback({
          type: "success",
          message: "Nominee rejected.",
        });
      }

      setConfirmDialog(null);
      if (onDecisionSuccess) {
        onDecisionSuccess(data.nomination);
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message: err.response?.data?.message || `Failed to process ${decision.toLowerCase()} decision.`,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getDocUrl = (docType, download = false) => {
    const token = localStorage.getItem("token") || localStorage.getItem("ghc_admin_token") || "";
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : "";
    return `/api/judge/nominations/${nomination.id}/documents/${docType}?download=${download ? "1" : "0"}${tokenParam}`;
  };

  const handleViewCv = () => {
    const url = getDocUrl("cv");
    setPdfPreviewUrl(url);
    setTimeout(() => {
      document.getElementById("embedded-cv-viewer")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-slate-900">
                  Nominee Profile
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-slate-200 text-slate-700">
                  {nomination.nominationId}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <MapPin className="w-3 h-3 text-[#6C4AB6]" /> AIIMS Delhi
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Submitted on {formatDate(nomination.createdAt)} • Venue: S.E.T Facility, AIIMS New Delhi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Banner */}
        {feedback && (
          <div
            className={`px-6 py-3 text-sm flex items-center gap-2 shrink-0 ${
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-b border-emerald-200"
                : feedback.type === "warning"
                ? "bg-amber-50 text-amber-800 border-b border-amber-200"
                : "bg-red-50 text-red-800 border-b border-red-200"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800">
          
          {/* Top Grid: Profile Card + Status & Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Photo & Core Details */}
            <div className="md:col-span-1 bg-slate-50 p-5 rounded-xl border border-slate-200/80 flex flex-col items-center text-center">
              <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-200 border-2 border-white shadow-md mb-4 relative flex items-center justify-center">
                {nomination.photoUrl ? (
                  <img
                    src={getDocUrl("photo")}
                    alt={nomination.fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = "none";
                      e.target.parentNode.innerText = "Photo not available";
                    }}
                  />
                ) : (
                  <div className="text-xs text-slate-400 font-medium px-2">
                    Photo not available
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 leading-tight">
                {nomination.fullName}
              </h3>
              
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
                <Award className="w-3.5 h-3.5" />
                {nomination.awardCategory}
                {nomination.ageCategory && (
                  <span className="ml-1 opacity-75">
                    ({nomination.ageCategory.replace("_", " ").toUpperCase()})
                  </span>
                )}
              </div>

              <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <MapPin className="w-3 h-3 text-[#6C4AB6]" /> S.E.T Facility, AIIMS New Delhi
              </div>

              {/* Status Badge */}
              <div className="mt-4 w-full pt-4 border-t border-slate-200/60 flex flex-col items-center gap-1">
                <span className="text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                  Current Status
                </span>
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full ${
                    nomination.status === "ACCEPTED"
                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                      : nomination.status === "REJECTED"
                      ? "bg-rose-100 text-rose-800 border border-rose-300"
                      : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}
                >
                  {nomination.status}
                </span>

                {isDecided && nomination.reviewerName && (
                  <p className="text-[11px] text-slate-600 mt-1">
                    Decision by <strong className="text-slate-800">{nomination.reviewerName}</strong>
                    {nomination.reviewedAt && (
                      <span> on {formatDate(nomination.reviewedAt)}</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Personal & Professional Details */}
            <div className="md:col-span-2 space-y-6">
              
              {/* Personal Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-3">
                  <User className="w-3.5 h-3.5" /> Personal Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm">
                  <div>
                    <span className="text-xs text-slate-600 block">Full Name</span>
                    <strong className="text-slate-900">{nomination.fullName || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 block">Date of Birth</span>
                    <span className="font-medium text-slate-800">{formatDate(nomination.dob)}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 block">Age</span>
                    <span className="font-medium text-slate-800">
                      {nomination.age ? `${nomination.age} yrs` : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 block">Sex</span>
                    <span className="font-medium text-slate-800 capitalize">{nomination.sex || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-3">
                  <Building className="w-3.5 h-3.5" /> Professional Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm">
                  <div>
                    <span className="text-xs text-slate-600 block">Designation</span>
                    <strong className="text-slate-900">{nomination.designation || "—"}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-600 block">Organisation Affiliation</span>
                    <span className="font-medium text-slate-800">{nomination.organisation || "—"}</span>
                  </div>
                  {nomination.medicalCollege && (
                    <div className="sm:col-span-2">
                      <span className="text-xs text-slate-600 block">Medical College / Hospital</span>
                      <span className="font-medium text-slate-800">{nomination.medicalCollege}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-3">
                  <Mail className="w-3.5 h-3.5" /> Contact
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-xs text-slate-600 block">Email</span>
                      <span className="font-medium text-slate-900 break-all">{nomination.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-600" />
                    <div>
                      <span className="text-xs text-slate-600 block">Mobile / WhatsApp</span>
                      <span className="font-medium text-slate-900">{nomination.mobile}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {nomination.socialLinks && nomination.socialLinks.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5 mb-3">
                    <Globe className="w-3.5 h-3.5" /> Social / Professional Links
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {nomination.socialLinks.map((link, idx) => {
                      if (!link.url) return null;
                      return (
                        <a
                          key={idx}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{link.platform || "Link"}: {link.url.replace(/^https?:\/\//, '').slice(0, 30)}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Nomination Statement / Details */}
          {nomination.nominationStatement && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                Nomination Statement / Information
              </h4>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {nomination.nominationStatement}
              </div>
            </div>
          )}

          {/* Documents Section */}
          <div className="pt-4 border-t border-slate-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" /> Submitted Documents
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* CV Document Box */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Curriculum Vitae (CV)</h5>
                    <p className="text-xs text-slate-500">Official candidate resume</p>
                  </div>
                </div>

                {nomination.cvUrl ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleViewCv}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-sm cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View CV
                    </button>
                    <a
                      href={getDocUrl("cv")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
                    </a>
                    <a
                      href={getDocUrl("cv", true)}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors border border-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No CV document uploaded</p>
                )}
              </div>

              {/* Other Supporting Documents */}
              {nomination.supportingDocuments && nomination.supportingDocuments.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">Supporting Documents</h5>
                      <p className="text-xs text-slate-500">
                        {nomination.supportingDocuments.length} document(s) attached
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {nomination.supportingDocuments.map((doc, idx) => {
                      const docName = typeof doc === "string" ? `Document ${idx + 1}` : (doc.name || `Document ${idx + 1}`);
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs py-1">
                          <span className="truncate max-w-[180px] font-medium text-slate-700">{docName}</span>
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getDocUrl(`doc_${idx}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                            >
                              View
                            </a>
                            <a
                              href={getDocUrl(`doc_${idx}`, true)}
                              download
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Payment Information (Admin CMS Only) */}
          {isAdmin && (
            <div className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5 mb-3">
                <CreditCard className="w-3.5 h-3.5" /> Payment Information (Admin CMS)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block">Payment ID</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                    {nomination.paymentId || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Payment Status</span>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    nomination.paymentStatus === 'PAYMENT_VERIFIED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : nomination.paymentStatus === 'PAYMENT_ID_SUBMITTED'
                      ? 'bg-blue-100 text-blue-800 border border-blue-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {nomination.paymentStatus || 'PAYMENT_ID_SUBMITTED'}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Payment Method</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    {nomination.paymentProvider || "CLIRNET"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Nomination Fee</span>
                  <span className="font-semibold text-slate-800 block mt-1">
                    ₹{Number(nomination.paymentAmount || 5000).toLocaleString('en-IN')}
                  </span>
                </div>
                {nomination.paymentSubmittedAt && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block">Payment Submission Timestamp</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {new Date(nomination.paymentSubmittedAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
                {nomination.paymentVerifiedAt && (
                  <div className="sm:col-span-2">
                    <span className="text-xs text-slate-500 block">Verification Timestamp</span>
                    <span className="text-xs text-slate-700 font-medium">
                      {new Date(nomination.paymentVerifiedAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Embedded PDF Viewer Modal inside CMS */}
          {pdfPreviewUrl && (
            <div id="embedded-cv-viewer" className="mt-4 p-4 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 scroll-mt-6">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <span className="font-bold text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-400" /> Embedded CV Viewer
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={pdfPreviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    Open in new tab <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => setPdfPreviewUrl(null)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="w-full h-96 sm:h-[480px] bg-slate-800 rounded-lg overflow-hidden">
                <object
                  data={pdfPreviewUrl}
                  type="application/pdf"
                  className="w-full h-full border-0"
                >
                  <iframe
                    src={pdfPreviewUrl}
                    title="Candidate CV"
                    className="w-full h-full border-0"
                  />
                </object>
              </div>
            </div>
          )}

        </div>

        {/* Modal Decision Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
          
          {/* Status info or decision buttons */}
          {isDecided ? (
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold ${
                  nomination.status === "ACCEPTED"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                    : "bg-rose-100 text-rose-800 border border-rose-300"
                }`}
              >
                {nomination.status === "ACCEPTED" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
                {nomination.status}
              </span>
              <span className="text-xs text-slate-500">
                Decision finalized by {nomination.reviewerName || "Judge"} on {formatDate(nomination.reviewedAt)}. Decision cannot be changed.
              </span>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider self-start sm:self-center">
                Judge Decision:
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setConfirmDialog("REJECT")}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border-2 border-rose-500 text-rose-600 hover:bg-rose-50 font-bold text-sm transition-all shadow-sm active:scale-95"
                >
                  REJECT NOMINEE
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDialog("ACCEPT")}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-md shadow-emerald-600/20 active:scale-95"
                >
                  ACCEPT NOMINEE
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-slate-600 hover:bg-slate-200 text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center gap-3 mb-4">
              <div
                className={`p-3 rounded-full ${
                  confirmDialog === "ACCEPT"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                }`}
              >
                {confirmDialog === "ACCEPT" ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <XCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmDialog === "ACCEPT" ? "Accept Nominee?" : "Reject Nominee?"}
                </h3>
                <p className="text-xs text-slate-500">
                  {confirmDialog === "ACCEPT"
                    ? "Are you sure you want to accept this nominee?"
                    : "Are you sure you want to reject this nominee?"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              Candidate: <strong>{nomination.fullName}</strong>
              <br />
              Award Category: <strong>{nomination.awardCategory}</strong>
              <br />
              {confirmDialog === "ACCEPT" ? (
                <span className="text-emerald-700 text-xs block mt-1">
                  ✓ An acceptance confirmation email will automatically be sent to {nomination.email}.
                </span>
              ) : (
                <span className="text-slate-500 text-xs block mt-1">
                  • No email will be sent upon rejection.
                </span>
              )}
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-600 block mb-1">
                Optional Decision Notes (internal audit):
              </label>
              <textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder="Add evaluation comments or remarks..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={processing}
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-sm font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={processing}
                onClick={() => handleDecision(confirmDialog)}
                className={`px-5 py-2 rounded-xl text-white font-bold text-sm shadow-md transition-all ${
                  confirmDialog === "ACCEPT"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                }`}
              >
                {processing
                  ? "Processing..."
                  : confirmDialog === "ACCEPT"
                  ? "Accept Nominee"
                  : "Reject Nominee"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
