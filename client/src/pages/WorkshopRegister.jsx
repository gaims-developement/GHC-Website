import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock3,
  MapPin,
  Building,
  User,
  Sparkles,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Check,
  BadgeCheck,
} from "lucide-react";
import { apiUrl } from "../config/api";

const ACADEMIC_LEVELS = [
  { id: "UG", label: "Undergraduate (UG)" },
  { id: "PG", label: "Postgraduate (PG)" },
  { id: "Intern", label: "Medical Intern" },
  { id: "Resident", label: "Resident / Junior Resident" },
  { id: "Doctor", label: "Practicing Doctor / Specialist" },
  { id: "Faculty", label: "Faculty / Professor" },
  { id: "Other", label: "Other Healthcare Professional" },
];

const LOCAL_STORAGE_KEY = "ghc_saved_workshop_profile";

export default function WorkshopRegister() {
  const { id, slug } = useParams();
  const location = useLocation();
  const workshopIdentifier = useMemo(() => {
    if (id) return id;
    if (slug) return slug;
    const regMatch = location.pathname.match(/\/register\/workshop\/([^/?#]+)/);
    if (regMatch) return regMatch[1];
    const wsMatch = location.pathname.match(/\/workshops\/([^/?#]+)\/apply/);
    if (wsMatch) return wsMatch[1];
    return null;
  }, [id, slug, location.pathname]);
  const navigate = useNavigate();

  const [workshop, setWorkshop] = useState(null);
  const [loadingWorkshop, setLoadingWorkshop] = useState(true);

  // Saved Local Profile state
  const [savedProfile, setSavedProfile] = useState(null);
  const [hasPromptedLocal, setHasPromptedLocal] = useState(false);
  const [localClearedNotice, setLocalClearedNotice] = useState(false);

  // Form State
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    whatsapp: "",
    sameAsMobile: true,
    country: "India",
    state: "",
    city: "",
    institution: "",
    designation: "",
    academicLevel: "Resident",
    ghcRegistrationId: "",
  });

  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successModalData, setSuccessModalData] = useState(null);

  // 1. Fetch workshop details from backend
  useEffect(() => {
    window.scrollTo(0, 0);
    let active = true;
    setLoadingWorkshop(true);

    const loadWorkshop = async () => {
      if (!workshopIdentifier) {
        try {
          const res = await axios.get(apiUrl("/api/workshops"));
          if (!active) return;
          const list = (res.data.workshops || []).filter((w) => w.status === "published" || !w.status);
          if (list.length > 0) {
            setWorkshop(list[0]);
          }
        } catch (err) {
          console.error("Failed to load default workshop:", err);
        } finally {
          if (active) setLoadingWorkshop(false);
        }
        return;
      }

      // Try fetching specific workshop by identifier
      try {
        const res = await axios.get(apiUrl(`/api/workshops/${encodeURIComponent(workshopIdentifier)}`));
        if (active && res.data?.workshop) {
          setWorkshop(res.data.workshop);
          if (active) setLoadingWorkshop(false);
          return;
        }
      } catch (err) {
        // Direct endpoint failed, try fallback
      }

      // Fallback: fetch all workshops and find by id/slug
      try {
        const res = await axios.get(apiUrl("/api/workshops"));
        if (!active) return;
        const found = (res.data?.workshops || []).find(
          (w) => String(w.id) === String(workshopIdentifier) || w.slug === workshopIdentifier
        );
        if (found) setWorkshop(found);
      } catch (err) {
        console.error("Failed to load workshop fallback:", err);
      } finally {
        if (active) setLoadingWorkshop(false);
      }
    };

    loadWorkshop();

    return () => {
      active = false;
    };
  }, [workshopIdentifier]);

  // 2. Detect Local Browser Profile
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          setSavedProfile(parsed);
          setHasPromptedLocal(true);
        }
      }
    } catch {
      // ignore JSON parse errors
    }
  }, []);

  // 3. Load Countries from centralized location API
  useEffect(() => {
    axios
      .get(apiUrl("/api/locations/countries"))
      .then((res) => {
        const list = res.data.countries || res.data || [];
        setCountries(list);
        const india = list.find((c) => (c.name || "").toLowerCase() === "india");
        if (india) setSelectedCountryId(india.id);
      })
      .catch(() => {});
  }, []);

  // 4. Load States when Country changes
  useEffect(() => {
    if (!selectedCountryId) return;
    axios
      .get(apiUrl(`/api/locations/states/${selectedCountryId}`))
      .then((res) => {
        setStates(res.data.states || res.data || []);
      })
      .catch(() => {
        setStates([]);
      });
  }, [selectedCountryId]);

  const handleUseSavedDetails = () => {
    if (!savedProfile) return;
    setForm((prev) => ({
      ...prev,
      fullName: savedProfile.fullName || prev.fullName,
      email: savedProfile.email || prev.email,
      mobile: savedProfile.mobile || prev.mobile,
      whatsapp: savedProfile.whatsapp || savedProfile.mobile || prev.whatsapp,
      sameAsMobile: (savedProfile.whatsapp || savedProfile.mobile) === savedProfile.mobile,
      country: savedProfile.country || prev.country,
      state: savedProfile.state || prev.state,
      city: savedProfile.city || prev.city,
      institution: savedProfile.institution || prev.institution,
      designation: savedProfile.designation || prev.designation,
      academicLevel: savedProfile.academicLevel || prev.academicLevel,
    }));
    setHasPromptedLocal(false);
  };

  const handleEnterManually = () => {
    setHasPromptedLocal(false);
  };

  const handleClearSavedProfile = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSavedProfile(null);
      setHasPromptedLocal(false);
      setLocalClearedNotice(true);
      setTimeout(() => setLocalClearedNotice(false), 4000);
    } catch {
      // ignore
    }
  };

  const updateField = (field, val) => {
    setForm((prev) => {
      const next = { ...prev, [field]: val };
      if (field === "mobile" && prev.sameAsMobile) {
        next.whatsapp = val;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (!workshop) {
      setSubmitError("Workshop information could not be verified.");
      return;
    }

    // Basic frontend validations
    if (!form.fullName.trim() || !form.email.trim() || !form.mobile.trim()) {
      setSubmitError("Please fill in your full name, email and mobile number.");
      return;
    }

    if (!form.institution.trim() || !form.designation.trim()) {
      setSubmitError("Please enter your institution and designation.");
      return;
    }

    if (!form.country.trim() || !form.state.trim() || !form.city.trim()) {
      setSubmitError("Please provide your country, state, and city.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        workshopId: workshop.id,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        mobile: form.mobile.trim(),
        whatsapp: (form.sameAsMobile ? form.mobile : form.whatsapp || form.mobile).trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        institution: form.institution.trim(),
        designation: form.designation.trim(),
        academicLevel: form.academicLevel,
        ghcRegistrationId: form.ghcRegistrationId.trim() || null,
      };

      const res = await axios.post(apiUrl(`/api/workshops/${workshop.id}/apply`), payload);

      if (res.data && res.data.success) {
        // Save reusable personal details locally (NEVER store sensitive data)
        const profileToSave = {
          fullName: payload.fullName,
          email: payload.email,
          mobile: payload.mobile,
          whatsapp: payload.whatsapp,
          country: payload.country,
          state: payload.state,
          city: payload.city,
          institution: payload.institution,
          designation: payload.designation,
          academicLevel: payload.academicLevel,
        };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(profileToSave));
          setSavedProfile(profileToSave);
        } catch {
          // ignore
        }

        setSuccessModalData(res.data.application);
      } else {
        setSubmitError(res.data?.message || "Failed to submit application. Please try again.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Network error. Failed to submit application.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isClosed = workshop && (workshop.status === "closed" || workshop.isRegistrationOpen === false);
  const remainingSeats = workshop ? Math.max(0, Number(workshop.capacity || 0) - Number(workshop.registeredCount || 0)) : 0;
  const isFull = workshop && Number(workshop.capacity || 0) > 0 && remainingSeats === 0;

  if (loadingWorkshop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <div className="w-5 h-5 border-2 border-[#173B8F] border-t-transparent rounded-full animate-spin" />
          <span>Loading workshop details...</span>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-slate-200 text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Workshop Not Found</h2>
          <p className="text-sm text-slate-600 mb-6">
            The requested workshop could not be located or may not be accepting applications.
          </p>
          <button
            onClick={() => navigate("/#workshops-experience")}
            className="w-full py-3 px-4 bg-[#173B8F] text-white rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Explore Available Workshops
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FC] font-['Outfit'] text-slate-900 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/#workshops-experience"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#173B8F] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#173B8F]" /> Back to All Workshops
          </Link>
        </div>

        {/* Workshop Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#173B8F]/5 to-[#e244b7]/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#173B8F]/10 text-[#173B8F]">
              {workshop.workshopType || "Clinical Skills Workshop"}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              Certificates Provided
            </span>
            {isClosed ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                Applications Closed
              </span>
            ) : isFull ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Capacity Reached
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Applications Open
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#101828] mb-2 leading-tight">
            {workshop.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 mb-6 max-w-2xl leading-relaxed">
            {workshop.fullDescription || workshop.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-[#173B8F] shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Venue</span>
                <strong>{workshop.venue || "New Delhi"}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Clock3 className="w-4 h-4 text-[#173B8F] shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Dates</span>
                <strong>{workshop.duration || "22nd & 23rd September"}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-700">
              <Building className="w-4 h-4 text-[#173B8F] shrink-0" />
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold uppercase">Organizer</span>
                <strong>{workshop.organizer || "New Delhi"}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* RETURNING PARTICIPANT: Local Saved Profile Prompt (Requirement 6) */}
        {hasPromptedLocal && savedProfile && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-indigo-200/80 rounded-3xl p-6 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 mb-1">
                  Welcome back! We found your saved details.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mb-4">
                  Saved profile for <strong>{savedProfile.fullName}</strong> ({savedProfile.email}). Would you like to autofill this application?
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleUseSavedDetails}
                    className="px-5 py-2.5 rounded-full bg-[#173B8F] text-white text-xs sm:text-sm font-bold shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Use Saved Details
                  </button>
                  <button
                    type="button"
                    onClick={handleEnterManually}
                    className="px-5 py-2.5 rounded-full bg-white border border-slate-300 text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    Enter Manually
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSavedProfile}
                    className="text-xs text-slate-500 hover:text-rose-600 underline ml-auto transition-colors"
                  >
                    Clear Saved Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Non-intrusive Local Storage UX Indicator (Requirement 32) */}
        {savedProfile && !hasPromptedLocal && (
          <div className="bg-slate-100/80 border border-slate-200/80 rounded-2xl px-4 py-2.5 mb-6 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Your basic details are saved on this device for faster workshop applications.
            </span>
            <button
              type="button"
              onClick={handleClearSavedProfile}
              className="text-slate-500 hover:text-rose-600 font-semibold underline transition-colors shrink-0 ml-2"
            >
              Clear Saved Details
            </button>
          </div>
        )}

        {localClearedNotice && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl p-3 mb-6 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Saved profile removed from this browser. Your submitted server applications remain safe.</span>
          </div>
        )}

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm space-y-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User className="w-5 h-5 text-[#173B8F]" /> Participant Application
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Please enter your details carefully. Your GHC pass will be verified by our team prior to confirmation.
            </p>
          </div>

          {/* SECTION 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              1. Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Dr. Full Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="name@hospital.org"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={form.mobile}
                  onChange={(e) => updateField("mobile", e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">WhatsApp Number</label>
                  <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.sameAsMobile}
                      onChange={(e) => updateField("sameAsMobile", e.target.checked)}
                      className="rounded text-[#173B8F]"
                    />
                    Same as mobile
                  </label>
                </div>
                {!form.sameAsMobile && (
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={(e) => updateField("whatsapp", e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F] transition-all"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: Location Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              2. Location Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Country <span className="text-rose-500">*</span>
                </label>
                {countries.length > 0 ? (
                  <select
                    value={form.country}
                    onChange={(e) => {
                      const selected = countries.find((c) => c.name === e.target.value);
                      if (selected) setSelectedCountryId(selected.id);
                      updateField("country", e.target.value);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                  >
                    {countries.map((c) => (
                      <option key={c.id || c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    placeholder="India"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  State / Province <span className="text-rose-500">*</span>
                </label>
                {states.length > 0 ? (
                  <select
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.id || s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                    placeholder="e.g. Delhi"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  placeholder="e.g. New Delhi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Academic / Professional Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              3. Academic & Professional Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Institution / Medical College / Hospital <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.institution}
                  onChange={(e) => updateField("institution", e.target.value)}
                  placeholder="e.g. AIIMS New Delhi"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Designation / Role <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => updateField("designation", e.target.value)}
                  placeholder="e.g. Senior Resident / Student"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Academic Level <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.academicLevel}
                  onChange={(e) => updateField("academicLevel", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
                >
                  {ACADEMIC_LEVELS.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: GHC Pass Integration (Optional Lookup) */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">
              4. GHC Pass Verification
            </h3>

            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4">
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Put your GHC pass transaction ID
              </label>
              <p className="text-xs text-slate-500 mb-2.5">
                Please register for GHC first before applying for a workshop. If you have already registered, enter your GHC pass transaction ID below.
              </p>
              <input
                type="text"
                value={form.ghcRegistrationId}
                onChange={(e) => updateField("ghcRegistrationId", e.target.value)}
                placeholder="Register for GHC first before applying for workshop"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono text-sm uppercase bg-white focus:outline-none focus:ring-2 focus:ring-[#173B8F]"
              />
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Need a GHC Pass?</span>
                <Link
                  to="/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#173B8F] hover:text-[#00A6A6] hover:underline inline-flex items-center gap-1"
                >
                  Register for GHC Pass First <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {submitError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-4 border-t border-slate-100">
            {isClosed ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-slate-200 text-slate-500 font-bold text-center text-sm cursor-not-allowed">
                Applications Closed for this Workshop
              </div>
            ) : isFull ? (
              <div className="w-full py-4 px-6 rounded-2xl bg-slate-200 text-slate-500 font-bold text-center text-sm cursor-not-allowed">
                Workshop Capacity Reached (Seats Full)
              </div>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#173B8F] to-[#6C4AB6] text-white font-bold text-base hover:opacity-95 shadow-md shadow-[#173B8F]/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {submitting ? "Submitting Application..." : "Submit Application"}
                {!submitting && <ArrowRight className="w-5 h-5" />}
              </button>
            )}
            <p className="text-[11px] text-slate-400 text-center mt-3">
              Submission does not guarantee seat confirmation until GHC registration status is verified.
            </p>
          </div>
        </form>
      </div>

      {/* SUCCESS MODAL (Requirement 10) */}
      {successModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-slate-200 shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Application Received
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                Application Submitted!
              </h2>
            </div>

            {/* Exact required wording from Requirement 10 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left text-xs sm:text-sm text-slate-700 space-y-2.5">
              <p className="font-semibold text-slate-900">
                Congratulations! Your workshop application has been submitted successfully.
              </p>
              <p>
                Our team will review your application and verify your GHC pass transaction ID.
              </p>
              <p className="text-slate-600 text-xs">
                If you have already purchased a GHC Pass, our team will verify your transaction ID and email you your <strong>Workshop Registration ID</strong> once your application is confirmed.
              </p>
            </div>

            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between items-center border-b border-purple-200/50 pb-2">
                <span className="text-slate-500 uppercase font-bold tracking-wider text-[11px]">Application ID</span>
                <strong className="font-mono text-sm text-[#173B8F]">{successModalData.applicationId}</strong>
              </div>
              <div className="flex justify-between items-center border-b border-purple-200/50 pb-2">
                <span className="text-slate-500 uppercase font-bold tracking-wider text-[11px]">Workshop</span>
                <span className="font-semibold text-slate-900">{successModalData.workshopTitle}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 uppercase font-bold tracking-wider text-[11px]">Status</span>
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 text-[11px]">
                  Under Review
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate("/#workshops-experience")}
                className="w-full py-3.5 px-6 rounded-full bg-[#173B8F] text-white font-bold text-sm hover:opacity-95 transition-opacity shadow-sm"
              >
                Return to Conclave Workshops
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
