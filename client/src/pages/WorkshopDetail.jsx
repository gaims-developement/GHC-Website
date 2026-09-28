import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  BadgeCheck,
  CheckCircle2,
  Sparkles,
  Award,
  ShieldCheck,
  UserCheck,
  Building2,
  Share2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { apiUrl } from "../config/api";
import {
  categoryColors,
  formatWorkshopDate,
  getWorkshopBySlug,
  getWorkshopTimeRange,
  normalizeWorkshop,
} from "../data/workshops";

const resolveImage = (src) => {
  if (!src) return null;
  if (src.startsWith("http") || src.startsWith("data:")) return src;
  const path = src.startsWith("/") ? src : `/${src}`;
  return apiUrl(path);
};

export default function WorkshopDetail() {
  const { slug: paramSlug, id: paramId } = useParams();
  const location = useLocation();
  const rawSlug = useMemo(() => {
    const raw =
      paramSlug ||
      paramId ||
      location.pathname.replace(/^\/workshops\/?/, "").split("/")[0] ||
      "";
    try {
      return decodeURIComponent(raw).trim();
    } catch {
      return raw.trim();
    }
  }, [paramSlug, paramId, location.pathname]);

  const navigate = useNavigate();

  const passedWorkshop = useMemo(() => {
    if (location.state?.workshop) {
      return normalizeWorkshop(location.state.workshop);
    }
    return null;
  }, [location.state]);

  const [remoteWorkshop, setRemoteWorkshop] = useState(passedWorkshop);
  const [loading, setLoading] = useState(!passedWorkshop);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    let active = true;

    if (!passedWorkshop) {
      setLoading(true);
    }

    const fetchWorkshop = async () => {
      if (!rawSlug) {
        if (active) setLoading(false);
        return;
      }

      // 1. Try finding by slug/id directly from backend
      try {
        const response = await axios.get(apiUrl(`/api/workshops/${encodeURIComponent(rawSlug)}`));
        if (active && response.data?.workshop) {
          setRemoteWorkshop(normalizeWorkshop(response.data.workshop));
          if (active) setLoading(false);
          return;
        }
      } catch (err) {
        // Direct endpoint failed, fall back to list lookup
      }

      // 2. Fallback: fetch all workshops and match
      try {
        const res = await axios.get(apiUrl("/api/workshops"));
        if (!active) return;
        const list = res.data?.workshops || [];
        const found = list.find(
          (w) =>
            w.slug === rawSlug ||
            String(w.id) === String(rawSlug) ||
            (w.workshopCode && w.workshopCode.toLowerCase() === rawSlug.toLowerCase()) ||
            createWorkshopSlug(w.title) === rawSlug
        );
        if (found) {
          setRemoteWorkshop(normalizeWorkshop(found));
        } else if (!passedWorkshop) {
          setRemoteWorkshop(null);
        }
      } catch (err) {
        console.error("Failed to load workshop details:", err);
        if (active && !passedWorkshop) {
          setRemoteWorkshop(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchWorkshop();

    return () => {
      active = false;
    };
  }, [rawSlug, passedWorkshop]);

  const workshop = useMemo(
    () => remoteWorkshop || (rawSlug ? getWorkshopBySlug(rawSlug) : null),
    [remoteWorkshop, rawSlug]
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: workshop?.title || "GHC Workshop",
        text: `Join the ${workshop?.title} workshop at GHC 2026 in New Delhi!`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FBFF] py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto animate-pulse">
          <div className="h-8 bg-gray-200 rounded-full w-48 mb-8" />
          <div className="h-14 bg-gray-200 rounded-2xl w-3/4 mb-4" />
          <div className="h-6 bg-gray-200 rounded-lg w-1/2 mb-10" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-3xl" />
              <div className="h-48 bg-gray-200 rounded-3xl" />
            </div>
            <div className="h-96 bg-gray-200 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-[#F7FBFF] py-32 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white rounded-3xl p-10 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.06)]">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-blue-50 text-[#173B8F] flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="font-['Outfit'] text-2xl font-extrabold text-[#101828] mb-2">
            Workshop Not Found
          </h1>
          <p className="text-[#475467] text-sm leading-relaxed mb-6">
            The requested workshop might have been updated, removed, or has not been published yet.
          </p>
          <button
            type="button"
            onClick={() => navigate("/#workshops-experience")}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-[#173B8F] to-[#00A6A6] text-white hover:brightness-110 shadow-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Workshops
          </button>
        </div>
      </div>
    );
  }

  const speakerName = workshop.faculty || workshop.organizer || "New Delhi Faculty";
  const capacity = Number(workshop.capacity || workshop.seats?.total || 0);
  const registeredCount = Number(workshop.registeredCount || workshop.seats?.filled || 0);
  const remaining = Math.max(0, capacity - registeredCount);
  const filledPercent = capacity ? Math.min(100, Math.round((registeredCount / capacity) * 100)) : 0;
  const isFull = capacity > 0 && remaining <= 0;
  const isRegistrationOpen = workshop.isRegistrationOpen !== false;
  const canApply = isRegistrationOpen && !isFull;
  const applyHref = `/register/workshop/${workshop.id || workshop.slug || rawSlug}`;
  const displayImage = resolveImage(workshop.imageUrl || workshop.image);

  const faqsList = useMemo(() => {
    const raw = workshop.faqs || workshop.faq;
    if (Array.isArray(raw)) return raw.filter((f) => f && (f.question || f.answer));
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((f) => f && (f.question || f.answer)) : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [workshop]);

  return (
    <div className="bg-[#F7FBFF] text-[#081B33] min-h-screen pt-24 pb-28">
      {/* Top Header & Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            type="button"
            onClick={() => navigate("/#workshops-experience")}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#173B8F] hover:text-[#00A6A6] transition-colors bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Workshops
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#475467] bg-white px-3.5 py-2 rounded-full border border-gray-200 hover:bg-gray-50 transition shadow-sm"
              title="Share workshop"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? "Link Copied" : "Share"}
            </button>
            <span
              className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold ${
                !isRegistrationOpen || isFull
                  ? "bg-red-50 text-red-600 border border-red-100"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
              }`}
            >
              {!isRegistrationOpen ? "Applications Closed" : isFull ? "Seats Full" : "Applications Open"}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)] mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-[#173B8F]">
              {workshop.workshopType || workshop.category || "Clinical Skills"}
            </span>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-[#475467]">
              New Delhi
            </span>
            {workshop.certificateAvailable && (
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                <BadgeCheck className="w-3.5 h-3.5" /> Certified Workshop
              </span>
            )}
          </div>

          {/* Workshop Name */}
          <h1 className="font-['Outfit'] text-3xl sm:text-4xl md:text-5xl font-black text-[#101828] leading-tight mb-5">
            {workshop.title}
          </h1>

          {/* Key Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173B8F] flex items-center justify-center shrink-0">
                <CalendarDays className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">Date</p>
                <p className="text-xs sm:text-sm font-bold text-[#101828] truncate">{workshop.displayDate || "Nov 22-24, 2026"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173B8F] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">Location</p>
                <p className="text-xs sm:text-sm font-bold text-[#101828] truncate">{workshop.venue || "New Delhi"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173B8F] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">Capacity</p>
                <p className="text-xs sm:text-sm font-bold text-[#101828] truncate">{capacity} Seats Total</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#F8F9FC] border border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173B8F] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#00A6A6]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467]">Available</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-600 truncate">{remaining} Seats Left</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Speaker, Details, Curriculum, Venue */}
          <div className="lg:col-span-2 space-y-8">
            {/* Optional Banner Image */}
            {displayImage && (
              <div className="rounded-3xl overflow-hidden shadow-sm border border-gray-200 h-64 sm:h-80 w-full relative">
                <img
                  src={displayImage}
                  alt={workshop.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#081B33]/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-6 text-white">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Hands-on Clinical Training
                  </span>
                </div>
              </div>
            )}

            {/* 1. SPEAKER NAME & FACULTY SPOTLIGHT */}
            <section className="bg-white rounded-3xl p-7 sm:p-9 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#173B8F]" />
                <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#101828]">
                  Speaker & Faculty
                </h2>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-6 rounded-2xl bg-gradient-to-br from-[#F8F9FC] to-[#F1F5F9] border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#173B8F] to-[#00A6A6] text-white flex items-center justify-center font-bold text-2xl shadow-md shrink-0">
                  <UserCheck className="w-8 h-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#173B8F]">
                    Lead Speaker / Faculty
                  </span>
                  <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#101828] mt-0.5">
                    {speakerName}
                  </h3>
                  <p className="text-sm font-medium text-[#475467] mt-1">
                    New Delhi, India
                  </p>
                </div>
              </div>
            </section>

            {/* 2. BRIEF DETAILS ABOUT THE WORKSHOP */}
            <section className="bg-white rounded-3xl p-7 sm:p-9 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#00A6A6]" />
                <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#101828]">
                  About the Workshop
                </h2>
              </div>

              <div className="prose max-w-none text-[#475467] text-base leading-relaxed space-y-4">
                <p className="whitespace-pre-line text-lg font-medium text-[#344054]">
                  {workshop.fullDescription || workshop.description || "Comprehensive hands-on training led by experienced faculty members in New Delhi."}
                </p>

                {workshop.description && workshop.fullDescription && workshop.description !== workshop.fullDescription && (
                  <p className="whitespace-pre-line">
                    {workshop.description}
                  </p>
                )}
              </div>

              {/* Learning Outcomes if specified */}
              {workshop.learningOutcomes && workshop.learningOutcomes.length > 0 && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h3 className="font-['Outfit'] text-lg font-bold text-[#101828] mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    Key Learning Outcomes
                  </h3>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workshop.learningOutcomes.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm text-[#475467] bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Target Audience / Prerequisites if specified */}
              {workshop.whoShouldAttend && workshop.whoShouldAttend.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <h3 className="font-['Outfit'] text-base font-bold text-[#101828] mb-3">
                    Who Should Attend
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {workshop.whoShouldAttend.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 text-[#173B8F] border border-blue-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 3. LOCATION / VENUE DETAILS */}
            <section className="bg-white rounded-3xl p-7 sm:p-9 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#6C4AB6]" />
                <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#101828]">
                  Location & Venue
                </h2>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl bg-gradient-to-br from-purple-50/50 to-blue-50/50 border border-purple-100/60 mb-5">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-[#6C4AB6] flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-extrabold text-[#101828]">
                    {workshop.venue || "New Delhi"}
                  </h3>
                  <p className="text-sm font-medium text-[#475467] mt-1">
                    New Delhi, India
                  </p>
                </div>
              </div>

              <p className="text-xs text-[#667085] leading-relaxed">
                Registered delegates will receive a specialized digital entry pass and orientation instructions via email prior to the conference date.
              </p>
            </section>

            {/* 4. FREQUENTLY ASKED QUESTIONS */}
            {faqsList.length > 0 && (
              <section className="bg-white rounded-3xl p-7 sm:p-9 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)]">
                <div className="flex items-center gap-2 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00A6A6]" />
                  <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#101828]">
                    Frequently Asked Questions
                  </h2>
                </div>

                <div className="space-y-4">
                  {faqsList.map((faq, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
                      <h3 className="font-['Outfit'] font-bold text-base text-[#101828] mb-2 flex items-start gap-2.5">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-[#173B8F] text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
                          Q
                        </span>
                        <span>{faq.question}</span>
                      </h3>
                      <p className="text-sm font-medium text-[#475467] pl-8 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column: Workshop Capacity & Quick Summary Card */}
          <div className="space-y-6">
            {/* 4. WORKSHOP CAPACITY & AVAILABILITY */}
            <div className="bg-white rounded-3xl p-7 border border-gray-100 shadow-[0_8px_30px_rgba(16,24,40,0.04)] sticky top-28">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#667085]">Seat Capacity</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${canApply ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                  {canApply ? `${remaining} Seats Available` : "Seats Full"}
                </span>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex items-baseline justify-between">
                  <span className="text-3xl font-['Outfit'] font-black text-[#101828]">{remaining}</span>
                  <span className="text-xs font-semibold text-[#667085]">of {capacity} total seats</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      filledPercent >= 90 ? "bg-red-500" : filledPercent >= 70 ? "bg-amber-500" : "bg-gradient-to-r from-[#173B8F] to-[#00A6A6]"
                    }`}
                    style={{ width: `${filledPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#667085] text-right">{filledPercent}% seats allocated</p>
              </div>

              {/* Quick Details List */}
              <div className="space-y-3 pt-5 border-t border-gray-100 text-sm text-[#475467] mb-7">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#667085]">Speaker</span>
                  <span className="font-bold text-[#101828] text-right truncate max-w-[160px]">{speakerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#667085]">Location</span>
                  <span className="font-bold text-[#101828] text-right truncate max-w-[160px]">{workshop.venue || "New Delhi"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#667085]">Total Capacity</span>
                  <span className="font-bold text-[#101828]">{capacity} Delegates</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#667085]">Certification</span>
                  <span className="font-bold text-emerald-600">Official Certificate</span>
                </div>
              </div>

              {/* Apply Action in Sidebar */}
              {canApply ? (
                <Link
                  id="apply-workshop-sidebar-btn"
                  to={applyHref}
                  onClick={() => window.scrollTo(0, 0)}
                  className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-extrabold text-base bg-gradient-to-r from-[#173B8F] via-[#7C3AED] to-[#EC4899] text-white hover:brightness-110 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Apply for Workshop <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="w-full text-center py-3.5 px-4 rounded-2xl bg-gray-100 text-gray-400 font-bold text-sm">
                  Applications Closed
                </div>
              )}

              <p className="text-[11px] text-center text-[#667085] mt-3">
                Pre-registration required. First-come, first-served basis.
              </p>
            </div>
          </div>
        </div>

        {/* 5. APPLY BUTTON AT THE BOTTOM (PROMINENT CALL TO ACTION) */}
        <section className="mt-16 bg-gradient-to-r from-[#081B33] via-[#173B8F] to-[#0A2540] rounded-3xl p-8 sm:p-14 text-white text-center shadow-xl relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#00A6A6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-[#EC4899]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/10 backdrop-blur-md text-white/90 border border-white/15 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Limited Capacity • {capacity} Delegates
            </span>

            <h2 className="font-['Outfit'] text-2xl sm:text-3xl md:text-4xl font-black text-white leading-tight mb-4">
              Apply for {workshop.title}
            </h2>

            <p className="text-white/80 text-sm sm:text-base leading-relaxed mb-8">
              Join speaker <strong>{speakerName}</strong> in New Delhi for this comprehensive hands-on session. Seats are allocated on a verified registration basis.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {canApply ? (
                <Link
                  id="apply-workshop-bottom-btn"
                  to={applyHref}
                  onClick={() => window.scrollTo(0, 0)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 rounded-full font-extrabold text-base sm:text-lg bg-gradient-to-r from-[#00A6A6] via-[#173B8F] to-[#EC4899] text-white hover:brightness-110 shadow-2xl hover:scale-105 transition-all duration-300"
                >
                  Apply for Workshop
                  <ArrowRight className="w-5 h-5" />
                </Link>
              ) : (
                <span className="w-full sm:w-auto inline-flex items-center justify-center px-10 py-4 rounded-full font-bold text-base bg-white/10 text-white/50 cursor-not-allowed border border-white/10">
                  Applications Closed
                </span>
              )}

              <button
                type="button"
                onClick={() => navigate("/#workshops-experience")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Explore Other Workshops
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky Mobile Apply Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-[#101828] truncate">{workshop.title}</p>
          <p className="text-[11px] font-semibold text-emerald-600">{remaining} of {capacity} seats left</p>
        </div>
        {canApply ? (
          <Link
            id="apply-workshop-mobile-btn"
            to={applyHref}
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#173B8F] to-[#00A6A6] text-white shadow-md shrink-0"
          >
            Apply <ArrowRight className="w-4 h-4" />
          </Link>
        ) : (
          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-400">
            Closed
          </span>
        )}
      </div>
    </div>
  );
}
