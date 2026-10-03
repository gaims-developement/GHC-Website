import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  MapPin,
  Building,
  GraduationCap,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  Ban,
  Check,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function WorkshopApplicationDetailModal({
  application,
  onClose,
  onUpdate,
  api,
  autoOpenConfirm = false,
}) {
  const [loadingAction, setLoadingAction] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [confirmStage, setConfirmStage] = useState(() => (autoOpenConfirm ? "asking" : null));
  const [confirmedResult, setConfirmedResult] = useState(null);

  if (!application) return null;

  const handleVerifyPass = async () => {
    setLoadingAction(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.post(`/api/workshops/applications/${application.id}/verify-pass`);
      setActionSuccess(res.data.message || "GHC Pass verification completed!");
      if (res.data.application) {
        onUpdate(res.data.application);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || "GHC Pass verification failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const openConfirmModal = () => {
    setActionError("");
    setConfirmStage("asking");
  };

  const handleExecuteConfirm = async () => {
    setLoadingAction(true);
    setActionError("");
    try {
      const res = await api.post(`/api/workshops/applications/${application.id}/confirm`);
      setActionSuccess(
        `Application confirmed! Workshop Registration ID: ${res.data.application.workshopRegistrationId}. ${
          res.data.emailSent ? "Confirmation email sent." : "Email queued/logged."
        }`
      );
      if (res.data.application) {
        onUpdate(res.data.application);
      }
      setConfirmedResult(res.data);
      setConfirmStage("success");
    } catch (err) {
      setActionError(err.response?.data?.error || err.response?.data?.message || "Confirmation failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleReject = async () => {
    setLoadingAction(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.post(`/api/workshops/applications/${application.id}/reject`, {
        reason: rejectReason || "Application not accepted by Workshop Committee",
      });
      setActionSuccess("Application rejected.");
      setShowRejectInput(false);
      if (res.data.application) {
        onUpdate(res.data.application);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || "Rejection failed");
    } finally {
      setLoadingAction(false);
    }
  };

  const handleResendEmail = async () => {
    setLoadingAction(true);
    setActionError("");
    setActionSuccess("");
    try {
      const res = await api.post(`/api/workshops/applications/${application.id}/resend-email`);
      setActionSuccess(res.data.message || "Confirmation email resent successfully!");
    } catch (err) {
      setActionError(err.response?.data?.error || "Failed to resend confirmation email");
    } finally {
      setLoadingAction(false);
    }
  };

  const isConfirmed = application.applicationStatus === "CONFIRMED";
  const isRejected = application.applicationStatus === "REJECTED";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-900 via-slate-800 to-indigo-950 text-white">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/20 text-white font-bold">
                {application.applicationId}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isConfirmed
                    ? "bg-emerald-500 text-white"
                    : isRejected
                    ? "bg-red-500 text-white"
                    : "bg-amber-400 text-gray-950"
                }`}
              >
                {application.applicationStatus}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1 text-white">{application.fullName}</h2>
            <p className="text-xs text-gray-300">
              Applied for: <span className="font-semibold text-white">{application.workshopTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {actionError && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{actionError}</span>
          </div>
        )}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
        )}

        <div className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {/* Workshop Registration ID Banner if Confirmed */}
          {isConfirmed && application.workshopRegistrationId && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
                  Official Workshop Registration ID
                </span>
                <span className="text-xl font-mono font-extrabold text-emerald-900 tracking-wide">
                  {application.workshopRegistrationId}
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  Confirmed on: {new Date(application.confirmedAt || application.updatedAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={handleResendEmail}
                disabled={loadingAction}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Resend Email</span>
              </button>
            </div>
          )}

          {/* GHC Registration & Verification Box */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    GHC Pass Verification Status
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                      application.ghcPassStatus === "VERIFIED"
                        ? "bg-teal-100 text-teal-800 border border-teal-200"
                        : application.ghcPassStatus === "NOT_FOUND"
                        ? "bg-orange-100 text-orange-800 border border-orange-200"
                        : "bg-gray-100 text-gray-700 border border-gray-200"
                    }`}
                  >
                    Status: {application.ghcPassStatus}
                  </span>
                  {application.ghcRegistrationId && (
                    <span className="text-xs font-mono bg-white px-2.5 py-1 rounded-md border border-gray-200 text-gray-800 font-semibold">
                      GHC Pass ID: {application.ghcRegistrationId}
                    </span>
                  )}
                </div>
                {application.ghcVerificationNotes && (
                  <p className="text-xs text-gray-600 mt-2 italic">
                    Note: {application.ghcVerificationNotes}
                  </p>
                )}
                {application.ghcVerifiedAt && (
                  <p className="text-[11px] text-gray-500 mt-1">
                    Last Verified: {new Date(application.ghcVerifiedAt).toLocaleString()}
                  </p>
                )}
              </div>

              {!isConfirmed && !isRejected && (
                <button
                  onClick={handleVerifyPass}
                  disabled={loadingAction}
                  className="px-3.5 py-2 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5 self-start shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${loadingAction ? "animate-spin" : ""}`} />
                  <span>{application.ghcPassStatus === "VERIFIED" ? "Re-verify Pass" : "Verify GHC Pass"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 1: Applicant Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Participant Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-900">{application.fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <a href={`mailto:${application.email}`} className="text-blue-600 hover:underline">
                  {application.email}
                </a>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Mobile: {application.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
                <span>WhatsApp: {application.whatsapp || application.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Building className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Institution: <strong>{application.institution}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <GraduationCap className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Designation: {application.designation} ({application.academicLevel})</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  Location: {application.city}, {application.state}, {application.country}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Workshop Details */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Workshop Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div>
                <span className="text-gray-500 block">Workshop Title</span>
                <span className="font-bold text-gray-900 text-sm">{application.workshopTitle}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Organizer / Facility</span>
                <span className="font-semibold text-gray-900">{application.workshopOrganizer || "New Delhi"}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Dates & Venue</span>
                <span className="font-semibold text-gray-900">
                  {application.workshopDuration || "November 2026"} • {application.workshopVenue || "New Delhi"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Capacity</span>
                <span className="font-semibold text-gray-900">
                  {application.workshopCapacity || 30} total seats
                </span>
              </div>
            </div>
          </div>

          {/* Rejection input box if triggered */}
          {showRejectInput && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
              <label className="text-xs font-bold text-red-900 block">
                Reason for Rejection:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete details, seat capacity full, or unverified registration"
                className="w-full text-xs p-2.5 rounded-lg border border-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                rows={2}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={loadingAction}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Application ID: <span className="font-mono font-bold text-gray-700">{application.applicationId}</span>
          </div>

          <div className="flex items-center gap-2">
            {!isConfirmed && !isRejected && (
              <>
                <button
                  type="button"
                  onClick={() => setShowRejectInput(true)}
                  disabled={loadingAction || showRejectInput}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition flex items-center gap-1.5"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={openConfirmModal}
                  disabled={loadingAction}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#173B8F] hover:bg-[#122e70] rounded-xl transition shadow-md flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm Application</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION POP-UP & CELEBRATORY GREEN TICK MODAL */}
      {confirmStage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 border border-slate-200 shadow-2xl relative animate-in zoom-in-95 duration-200">
            {confirmStage === "asking" ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#173B8F] flex items-center justify-center mx-auto border border-blue-100">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Confirm Application?
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Are you sure you want to approve and confirm this workshop delegate?
                  </p>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 text-left text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Applicant:</span>
                    <strong className="text-gray-900 truncate max-w-[200px]">{application.fullName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Workshop:</span>
                    <strong className="text-[#173B8F] truncate max-w-[200px]">{application.workshopTitle}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">GHC Pass:</span>
                    <span className="font-semibold text-gray-800">{application.ghcPassStatus}</span>
                  </div>
                  {application.ghcRegistrationId && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">Transaction ID:</span>
                      <span className="font-mono font-semibold text-gray-800">{application.ghcRegistrationId}</span>
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-gray-500 leading-relaxed text-left bg-amber-50/70 border border-amber-200/60 rounded-xl p-3">
                  This will allocate a confirmed seat, issue a permanent Workshop Registration ID, and dispatch an official confirmation email.
                </p>

                {actionError && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{actionError}</span>
                  </div>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmStage(null);
                      setActionError("");
                    }}
                    disabled={loadingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteConfirm}
                    disabled={loadingAction}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#173B8F] hover:bg-[#122e70] text-white font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingAction ? (
                      <span>Confirming...</span>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Yes, Confirm</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* GREEN TICK SUCCESS STAGE */
              <div className="text-center py-2 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                {/* Large Celebratory Green Tick */}
                <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md ring-8 ring-emerald-50 animate-in zoom-in-75 duration-300">
                  <Check className="w-12 h-12 stroke-[3]" />
                </div>

                <div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                    Application Confirmed
                  </span>
                  <h3 className="text-2xl font-black text-gray-900">
                    Seat Allocated!
                  </h3>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                    Official Workshop Registration ID
                  </p>
                  <p className="font-mono text-xl sm:text-2xl font-black text-emerald-950 tracking-wider">
                    {confirmedResult?.application?.workshopRegistrationId || application.workshopRegistrationId}
                  </p>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">
                  Application for <strong>{application.fullName}</strong> has been successfully confirmed.{" "}
                  {confirmedResult?.emailSent
                    ? "An official confirmation email with digital pass details has been dispatched."
                    : "Confirmation record and pass ID saved successfully."}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmStage(null);
                      setConfirmedResult(null);
                    }}
                    className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all duration-150 flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Done</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
