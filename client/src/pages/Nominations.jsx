import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  ChevronRight,
  User,
  Briefcase,
  FileText,
  Share2,
  Check,
  ArrowRight,
  ArrowLeft,
  Upload,
  BadgeCheck,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CreditCard,
  Lock,
  RefreshCw,
  MapPin,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { setPageSeo, trackEvent } from "../utils/seo";

const awardsList = [
  { id: "young_entrepreneur", name: "Young Entrepreneur Award", desc: "For innovative healthcare startups and leaders." },
  { id: "women_healthcare", name: "Women in Healthcare Award", desc: "Celebrating female excellence and leadership." },
  { id: "medical_educator", name: "Medical Educator Award", desc: "For outstanding contribution to medical teaching." },
  { id: "young_researcher", name: "Young Researcher Award", desc: "Recognising breakthrough student research." },
  { id: "community_service", name: "Community Service Award", desc: "For impactful public health initiatives." },
  { id: "medical_ngo", name: "Medical NGO Award", desc: "Honouring organizational impact in healthcare." },
  { id: "medical_leadership", name: "Medical Leadership Award", desc: "For exceptional visionary leadership.", hasAgeCategories: true },
  { id: "influencer", name: "Influencer Award", desc: "For driving positive health communication." },
  { id: "academic", name: "Academic Award", desc: "For consistent academic brilliance." },
];

const ageCategories = [
  { id: "under_20", label: "Under 20", maxAge: 20 },
  { id: "under_30", label: "Under 30", maxAge: 30 },
  { id: "under_40", label: "Under 40", maxAge: 40 },
];

export default function Nominations() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    awardId: "",
    ageCategory: "",
    fullName: "",
    dob: "",
    dobYear: "",
    dobMonth: "",
    dobDay: "",
    sex: "",
    medicalCollege: "",
    orgAffiliation: "",
    designation: "",
    email: "",
    mobile: "",
    socialLinks: [{ platform: "LinkedIn", url: "" }],
    nominationStatement: "",
    cvFile: null,
    photoFile: null,
    paymentId: "",
  });

  const [nominationConfig, setNominationConfig] = useState({
    fee: 5000,
    currency: "INR",
    paymentUrl: "https://mc.clirnet.com/mastercast/connect/D0921-Conclave-2",
    instructions: "Complete your nomination payment through CLIRNET. After payment, return to this page and enter your Payment ID to submit your nomination.",
  });

  const [savedCvUrl, setSavedCvUrl] = useState("");
  const [savedCvName, setSavedCvName] = useState("");
  const [savedPhotoUrl, setSavedPhotoUrl] = useState("");
  const [savedPhotoName, setSavedPhotoName] = useState("");
  const [draftId, setDraftId] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [clirnetOpened, setClirnetOpened] = useState(false);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const formTopRef = useRef(null);

  // Fetch dynamic payment configuration from backend
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/judge/public/config`)
      .then((res) => {
        if (res.data) {
          setNominationConfig((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch((err) => {
        console.warn("Using default nomination payment config:", err.message);
      });
  }, []);

  // Restore draft from localStorage (satisfies Section 4 & 28 requirement)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ghc_nomination_draft");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          setFormData((prev) => ({
            ...prev,
            ...parsed,
            cvFile: null,
            photoFile: null,
          }));
          if (parsed.savedCvUrl) setSavedCvUrl(parsed.savedCvUrl);
          if (parsed.savedCvName) setSavedCvName(parsed.savedCvName);
          if (parsed.savedPhotoUrl) setSavedPhotoUrl(parsed.savedPhotoUrl);
          if (parsed.savedPhotoName) setSavedPhotoName(parsed.savedPhotoName);
          if (parsed.draftId) setDraftId(parsed.draftId);
          if (parsed.clirnetOpened) setClirnetOpened(true);
          if (parsed.step && parsed.step > 1 && parsed.step <= 7) {
            setStep(parsed.step);
          }
          setDraftRestored(true);
        }
      }
    } catch (e) {
      console.warn("Failed to restore draft from localStorage:", e);
    }
  }, []);

  // Persist draft to localStorage on any change (preserves entered data)
  useEffect(() => {
    if (submitSuccess) return;
    const timeout = setTimeout(() => {
      try {
        const dataToSave = {
          ...formData,
          cvFile: null,
          photoFile: null,
          savedCvUrl,
          savedCvName,
          savedPhotoUrl,
          savedPhotoName,
          draftId,
          clirnetOpened,
          step,
        };
        localStorage.setItem("ghc_nomination_draft", JSON.stringify(dataToSave));
      } catch (e) {
        console.warn("Failed to save draft to localStorage:", e);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [formData, savedCvUrl, savedCvName, savedPhotoUrl, savedPhotoName, draftId, clirnetOpened, step, submitSuccess]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    setPageSeo({
      title: "GHC Awards 2026 — Nominations & Awards",
      description: "Nominate outstanding healthcare professionals, educators, and leaders for the GHC Awards.",
      path: "/nominations",
    });
  }, []);

  const scrollToFormTop = () => {
    setTimeout(() => {
      if (formTopRef.current) {
        const yOffset = -90;
        const element = formTopRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 60);
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "";
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = useMemo(() => calculateAge(formData.dob), [formData.dob]);

  const updateForm = (key, value) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (["dobYear", "dobMonth", "dobDay"].includes(key)) {
        if (next.dobYear && next.dobMonth && next.dobDay) {
          next.dob = `${next.dobYear}-${next.dobMonth.padStart(2, '0')}-${next.dobDay.padStart(2, '0')}`;
        } else {
          next.dob = "";
        }
      }
      return next;
    });
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
    if (["dobYear", "dobMonth", "dobDay"].includes(key) && errors.dob) {
      setErrors((prev) => ({ ...prev, dob: "" }));
    }
  };

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "Other", url: "" }]
    }));
  };

  const updateSocialLink = (index, field, value) => {
    const newLinks = [...formData.socialLinks];
    newLinks[index][field] = value;
    setFormData(prev => ({ ...prev, socialLinks: newLinks }));
  };

  const removeSocialLink = (index) => {
    const newLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, socialLinks: newLinks }));
  };

  const validateStep = () => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.awardId) newErrors.awardId = "Please select an award category.";
      if (formData.awardId === "medical_leadership" && !formData.ageCategory) {
        newErrors.ageCategory = "Please select an age category for this award.";
      }
    }
    if (step === 2) {
      if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required.";
      if (!formData.dob) {
        newErrors.dob = "Date of Birth is required.";
      } else {
        const dobDate = new Date(formData.dob);
        if (dobDate > new Date()) newErrors.dob = "Date of Birth cannot be in the future.";
      }
      if (formData.awardId === "medical_leadership" && formData.ageCategory && calculatedAge !== "") {
        const selectedCat = ageCategories.find(c => c.id === formData.ageCategory);
        if (selectedCat && calculatedAge >= selectedCat.maxAge) {
          newErrors.dob = `Age (${calculatedAge}) must be strictly below ${selectedCat.maxAge} for the selected category.`;
        }
      }
    }
    if (step === 3) {
      if (!formData.orgAffiliation.trim()) newErrors.orgAffiliation = "Organization Affiliation is required.";
      if (!formData.designation.trim()) newErrors.designation = "Designation is required.";
    }
    if (step === 4) {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Valid email is required.";
      if (!formData.mobile.trim()) newErrors.mobile = "Mobile Number is required.";
    }
    if (step === 5) {
      formData.socialLinks.forEach((link, idx) => {
        if (link.url && !/^https?:\/\/.+/.test(link.url)) {
          newErrors[`social_${idx}`] = "Please enter a valid URL (starting with http:// or https://).";
        }
      });
    }
    if (step === 6) {
      if (!formData.cvFile && !savedCvUrl) newErrors.cvFile = "CV is required.";
      if (!formData.photoFile && !savedPhotoUrl) newErrors.photoFile = "Photo is required.";
    }
    if (step === 7) {
      if (!formData.paymentId || !formData.paymentId.trim()) {
        newErrors.paymentId = "After completing your payment on CLIRNET, enter the Payment ID provided to you.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 7));
      scrollToFormTop();
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
    scrollToFormTop();
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === "cv" && file.type !== "application/pdf") {
      setErrors(prev => ({ ...prev, cvFile: "CV must be a PDF file." }));
      return;
    }

    if (type === "cv") {
      setSavedCvName(file.name);
      updateForm("cvFile", file);
    } else {
      setSavedPhotoName(file.name);
      updateForm("photoFile", file);
    }
  };

  const handlePayClick = async () => {
    setSavingDraft(true);
    setSubmitError("");
    try {
      const currentDraftId = draftId || (`ghc-draft-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`);
      if (!draftId) setDraftId(currentDraftId);

      const data = new FormData();
      data.append("draftId", currentDraftId);
      data.append("awardId", formData.awardId);
      const awardObj = awardsList.find((a) => a.id === formData.awardId);
      data.append("awardCategory", awardObj?.name || formData.awardId);
      data.append("fullName", formData.fullName);
      data.append("email", formData.email);
      data.append(
        "formData",
        JSON.stringify({
          ...formData,
          cvFile: null,
          photoFile: null,
          savedCvUrl,
          savedPhotoUrl,
          awardCategory: awardObj?.name || formData.awardId,
        })
      );

      if (formData.cvFile) data.append("cvFile", formData.cvFile);
      if (formData.photoFile) data.append("photoFile", formData.photoFile);

      const res = await axios.post(`${API_BASE_URL}/api/judge/public/draft`, data);
      if (res.data?.cvUrl) setSavedCvUrl(res.data.cvUrl);
      if (res.data?.photoUrl) setSavedPhotoUrl(res.data.photoUrl);

      // Open CLIRNET payment in new tab (satisfies Section 3 & 4 requirement)
      window.open(nominationConfig.paymentUrl, "_blank", "noopener,noreferrer");
      setClirnetOpened(true);
    } catch (err) {
      console.warn("Failed to persist backend draft session, proceeding with local draft:", err);
      window.open(nominationConfig.paymentUrl, "_blank", "noopener,noreferrer");
      setClirnetOpened(true);
    } finally {
      setSavingDraft(false);
    }
  };

  const handleSubmitNomination = async () => {
    const newErrors = {};
    if (!formData.paymentId || !formData.paymentId.trim()) {
      newErrors.paymentId = "After completing your payment on CLIRNET, enter the Payment ID provided to you.";
      setErrors(newErrors);
      return;
    }
    const cleanId = formData.paymentId.trim();
    if (cleanId.length < 3 || cleanId.length > 100) {
      newErrors.paymentId = "Please enter a valid CLIRNET Payment ID (between 3 and 100 characters).";
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      const data = new FormData();
      data.append("awardId", formData.awardId);
      const awardObj = awardsList.find((a) => a.id === formData.awardId);
      data.append("awardCategory", awardObj?.name || formData.awardId);
      data.append("awardKey", formData.awardId);
      if (formData.ageCategory) data.append("ageCategory", formData.ageCategory);
      data.append("fullName", formData.fullName);
      data.append("dob", formData.dob);
      if (calculatedAge) data.append("age", calculatedAge);
      data.append("sex", formData.sex);
      data.append("medicalCollege", formData.medicalCollege || "");
      data.append("organisation", formData.orgAffiliation);
      data.append("designation", formData.designation);
      data.append("email", formData.email);
      data.append("mobile", formData.mobile);
      data.append("socialLinks", JSON.stringify(formData.socialLinks || []));
      data.append("nominationStatement", formData.nominationStatement || "");
      data.append("paymentId", cleanId);
      if (draftId) data.append("draftId", draftId);

      if (formData.cvFile) {
        data.append("cvFile", formData.cvFile);
      } else if (savedCvUrl) {
        data.append("cvUrl", savedCvUrl);
      }

      if (formData.photoFile) {
        data.append("photoFile", formData.photoFile);
      } else if (savedPhotoUrl) {
        data.append("photoUrl", savedPhotoUrl);
      }

      const res = await axios.post(`${API_BASE_URL}/api/judge/public/submit`, data);
      setSubmitSuccess(res.data);
      localStorage.removeItem("ghc_nomination_draft");
      scrollToFormTop();
    } catch (err) {
      console.error("Nomination submission error:", err);
      setSubmitError(
        err.response?.data?.message ||
          "Failed to submit nomination. Please verify your Payment ID and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen font-['Outfit'] text-[#101828]">
      {/* Top spacing */}
      <div className="h-28 md:h-32" />

      <div className="max-w-5xl mx-auto px-6 pt-2">
        <a href="/" className="inline-flex items-center gap-2 text-[#475467] hover:text-[#101828] font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#6C4AB6]" /> Back to Home
        </a>
      </div>

      {/* Hero Section */}
      {step === 1 && (
        <section className="relative px-6 py-10 md:py-14 overflow-hidden text-center max-w-5xl mx-auto bg-white">
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e244b7]/10 border border-[#e244b7]/25 text-[#e244b7] text-xs font-bold tracking-widest uppercase"
            >
              <BadgeCheck className="w-4 h-4 text-[#e244b7]" /> GHC Awards 2026
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6C4AB6]/10 border border-[#6C4AB6]/25 text-[#6C4AB6] text-xs font-bold tracking-wider uppercase"
            >
              <MapPin className="w-3.5 h-3.5 text-[#6C4AB6]" /> Venue: New Delhi
            </motion.div>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#101828] mb-6 leading-tight"
          >
            Recognising the <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]">People</span> Shaping Healthcare
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#475467] max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Celebrate visionaries, innovators, educators, researchers and changemakers who are creating meaningful impact across healthcare.
          </motion.p>
        </section>
      )}

      {/* Main Form Container */}
      <div ref={formTopRef} className="max-w-4xl mx-auto px-4 pb-24 scroll-mt-24">
        {/* Progress Indicator */}
        <div className="mb-10 sticky top-24 z-40 bg-white/95 backdrop-blur-md py-4 border-b border-gray-100">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#475467] mb-2.5">
            <span className="text-[#6C4AB6]">Step {step} of 7</span>
            <span>{Math.min(100, Math.round((step / 7) * 100))}% Completed</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (step / 7) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          
          {/* STEP 1: Award Selection */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <p className="text-[#e244b7] text-xs font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#e244b7] rounded-full"></span>
                  CATEGORY SELECTION
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] mb-2">The GHC Awards</h2>
                <p className="text-[#475467] text-base">Honouring excellence across healthcare, research, education, leadership and social impact.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {awardsList.map(award => {
                  const isSelected = formData.awardId === award.id;
                  return (
                    <div
                      key={award.id}
                      onClick={() => {
                        updateForm("awardId", award.id);
                        if (!award.hasAgeCategories) updateForm("ageCategory", "");
                      }}
                      className={`cursor-pointer relative overflow-hidden group p-6 rounded-2xl border transition-all duration-300 ${
                        isSelected 
                          ? "bg-gradient-to-br from-[#6C4AB6]/5 to-[#e244b7]/5 border-2 border-[#6C4AB6] shadow-[0_8px_25px_rgba(108,74,182,0.12)] -translate-y-0.5" 
                          : "bg-white border-gray-200/90 hover:border-[#6C4AB6]/50 hover:shadow-md hover:-translate-y-0.5"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#6C4AB6] text-white flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                      <Award className={`w-8 h-8 mb-4 transition-colors ${isSelected ? "text-[#6C4AB6]" : "text-gray-400 group-hover:text-[#e244b7]"}`} />
                      <h3 className={`text-lg font-bold mb-2 transition-colors ${isSelected ? "text-[#6C4AB6]" : "text-[#101828] group-hover:text-[#6C4AB6]"}`}>{award.name}</h3>
                      <p className="text-sm text-[#475467] leading-relaxed">{award.desc}</p>
                    </div>
                  );
                })}
              </div>
              {errors.awardId && <p className="text-red-500 mt-4 text-sm font-medium">{errors.awardId}</p>}

              <AnimatePresence>
                {formData.awardId === "medical_leadership" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 overflow-hidden bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
                  >
                    <h3 className="text-lg font-bold text-[#101828] mb-3">Select Age Category</h3>
                    <div className="flex flex-wrap gap-3">
                      {ageCategories.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => updateForm("ageCategory", cat.id)}
                          className={`px-6 py-2.5 rounded-full border text-sm font-semibold transition-all ${
                            formData.ageCategory === cat.id
                              ? "bg-[#6C4AB6] text-white border-[#6C4AB6] shadow-sm"
                              : "bg-white text-[#475467] border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {errors.ageCategory && <p className="text-red-500 mt-2 text-sm font-medium">{errors.ageCategory}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Benefit Section inside step 1 */}
              <div className="mt-14 p-8 rounded-3xl bg-white border-2 border-[#6C4AB6]/20 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-8 opacity-10 text-[#6C4AB6] pointer-events-none">
                  <Award className="w-36 h-36" />
                </div>
                <h3 className="text-2xl font-bold text-[#101828] mb-4">Your Nomination Includes More Than Recognition</h3>
                <div className="flex items-end gap-3 mb-4">
                  <span className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]">₹5,000</span>
                  <span className="text-[#475467] text-sm font-semibold uppercase tracking-wider mb-2">Nomination Fee</span>
                </div>
                <p className="text-[#475467] text-base mb-6 max-w-xl">Self-nomination includes complimentary registration to the Global Health Conclave.</p>
                <ul className="space-y-3 text-sm sm:text-base text-[#344054]">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-[#e244b7] shrink-0" /> Award nomination consideration by expert jury</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-[#e244b7] shrink-0" /> Complimentary GHC event registration</li>
                  <li className="flex items-center gap-3"><MapPin className="w-5 h-5 text-[#6C4AB6] shrink-0" /> <span className="font-semibold text-slate-800">Conclave Venue:</span> New Delhi</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-[#e244b7] shrink-0" /> Opportunity to showcase your work and impact</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-[#e244b7] shrink-0" /> Official nomination acknowledgement & certificate</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Personal Details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828]">Personal Details</h2>
                  <p className="text-sm text-[#475467]">Provide the candidate's core identity details.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="Dr. Jane Doe"
                  />
                  {errors.fullName && <p className="text-red-500 mt-1 text-sm font-medium">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Date of Birth</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={formData.dobYear}
                      onChange={(e) => updateForm("dobYear", e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm"
                    >
                      <option value="" className="text-gray-500">Year</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y} className="text-[#101828]">{y}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobMonth}
                      onChange={(e) => updateForm("dobMonth", e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm"
                    >
                      <option value="" className="text-gray-500">Month</option>
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                        <option key={m} value={i + 1} className="text-[#101828]">{m}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobDay}
                      onChange={(e) => updateForm("dobDay", e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-xl px-3 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm"
                    >
                      <option value="" className="text-gray-500">Day</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d} className="text-[#101828]">{d}</option>
                      ))}
                    </select>
                  </div>
                  {errors.dob && <p className="text-red-500 mt-1 text-sm font-medium">{errors.dob}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Age (Auto-calculated)</label>
                  <input
                    type="text"
                    value={calculatedAge !== "" ? `${calculatedAge} years` : ""}
                    readOnly
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-700 cursor-not-allowed font-medium shadow-sm"
                    placeholder="--"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-[#344054] mb-3">Sex</label>
                  <div className="flex flex-wrap gap-5">
                    {["Male", "Female", "Other", "Prefer not to say"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#344054]">
                        <input
                          type="radio"
                          name="sex"
                          value={opt}
                          checked={formData.sex === opt}
                          onChange={(e) => updateForm("sex", e.target.value)}
                          className="w-4 h-4 text-[#6C4AB6] accent-[#6C4AB6] focus:ring-[#6C4AB6]"
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Professional Details */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828]">Professional Details</h2>
                  <p className="text-sm text-[#475467]">Provide institutional affiliation and position.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Organisation Affiliation</label>
                  <input
                    type="text"
                    value={formData.orgAffiliation}
                    onChange={(e) => updateForm("orgAffiliation", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="e.g. HealthTech Innovators, NGO Care, Global Hospital"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Includes NGOs, startups, colleges, or hospitals.</p>
                  {errors.orgAffiliation && <p className="text-red-500 mt-1 text-sm font-medium">{errors.orgAffiliation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Medical College / Hospital (Optional)</label>
                  <input
                    type="text"
                    value={formData.medicalCollege}
                    onChange={(e) => updateForm("medicalCollege", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="If applicable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => updateForm("designation", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="e.g. Chief Medical Officer, Founder, Professor"
                  />
                  {errors.designation && <p className="text-red-500 mt-1 text-sm font-medium">{errors.designation}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Contact Details */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828]">Contact Details</h2>
                  <p className="text-sm text-[#475467]">Provide verified contact information for communication.</p>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-red-500 mt-1 text-sm font-medium">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Mobile Number / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateForm("mobile", e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                    placeholder="+91 98765 43210"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">Please include country code if outside India.</p>
                  {errors.mobile && <p className="text-red-500 mt-1 text-sm font-medium">{errors.mobile}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Social Links */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828]">Social & Professional Links</h2>
                  <p className="text-sm text-[#475467]">Help the jury learn more about your contributions.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                      className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm w-full sm:w-48 shrink-0"
                    >
                      {["LinkedIn", "Instagram", "X / Twitter", "Facebook", "Personal Website", "Other"].map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <div className="relative w-full">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                        placeholder="https://"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 transition-all shadow-sm"
                      />
                    </div>
                    {formData.socialLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSocialLink(index)}
                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {errors[`social_${index}`] && <p className="text-red-500 mt-1 text-sm sm:hidden font-medium">{errors[`social_${index}`]}</p>}
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={addSocialLink}
                className="mt-6 text-sm font-bold text-[#6C4AB6] hover:text-[#e244b7] flex items-center gap-2 transition-colors"
              >
                + Add another link
              </button>
            </motion.div>
          )}

          {/* STEP 6: Document Uploads */}
          {step === 6 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-[#101828]">Document Uploads</h2>
                  <p className="text-sm text-[#475467]">Attach your curriculum vitae and candidate portrait.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CV Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-3">Upload CV (PDF Only)</label>
                  <div className="border-2 border-dashed border-gray-300 hover:border-[#6C4AB6] bg-white rounded-2xl p-8 text-center transition-all group relative shadow-sm">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, "cv")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <FileText className="w-10 h-10 mx-auto mb-4 text-gray-400 group-hover:text-[#6C4AB6] transition-colors" />
                      {formData.cvFile ? (
                        <div>
                          <p className="text-[#101828] font-semibold truncate max-w-[200px] mx-auto">{formData.cvFile.name}</p>
                          <p className="text-gray-500 text-xs mt-1">{(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="text-[#6C4AB6] text-sm mt-3 inline-block font-semibold">Replace File</span>
                        </div>
                      ) : savedCvName || savedCvUrl ? (
                        <div>
                          <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Preserved in Draft
                          </span>
                          <p className="text-[#101828] font-semibold truncate max-w-[200px] mx-auto">
                            {savedCvName || "Curriculum Vitae (PDF)"}
                          </p>
                          <span className="text-[#6C4AB6] text-sm mt-2 inline-block font-semibold">Click to Replace</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[#101828] font-semibold mb-1">Click or drag & drop</p>
                          <p className="text-gray-500 text-xs">Maximum size 5MB (PDF only)</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cvFile && <p className="text-red-500 mt-2 text-sm font-medium">{errors.cvFile}</p>}
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-3">Upload Photo</label>
                  <div className="border-2 border-dashed border-gray-300 hover:border-[#6C4AB6] bg-white rounded-2xl p-8 text-center transition-all group relative shadow-sm">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "photo")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <User className="w-10 h-10 mx-auto mb-4 text-gray-400 group-hover:text-[#6C4AB6] transition-colors" />
                      {formData.photoFile ? (
                        <div>
                          <p className="text-[#101828] font-semibold truncate max-w-[200px] mx-auto">{formData.photoFile.name}</p>
                          <p className="text-gray-500 text-xs mt-1">{(formData.photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="text-[#6C4AB6] text-sm mt-3 inline-block font-semibold">Replace File</span>
                        </div>
                      ) : savedPhotoName || savedPhotoUrl ? (
                        <div>
                          <span className="inline-block px-2.5 py-0.5 mb-2 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Preserved in Draft
                          </span>
                          <p className="text-[#101828] font-semibold truncate max-w-[200px] mx-auto">
                            {savedPhotoName || "Candidate Photo"}
                          </p>
                          <span className="text-[#6C4AB6] text-sm mt-2 inline-block font-semibold">Click to Replace</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-[#101828] font-semibold mb-1">Click or drag & drop</p>
                          <p className="text-gray-500 text-xs">High resolution JPG or PNG format</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.photoFile && <p className="text-red-500 mt-2 text-sm font-medium">{errors.photoFile}</p>}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* STEP 7: Review & Dedicated Payment Section */}
          {step === 7 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="py-2">
              {submitSuccess ? (
                /* CONFIRMATION PAGE (Section 13 requirement) */
                <div className="space-y-6 text-center py-6">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828]">
                    ✓ Nomination Submitted Successfully
                  </h2>
                  <p className="text-[#475467] text-base max-w-lg mx-auto">
                    Your nomination has been received by the Global Health Conclave.
                  </p>

                  <div className="max-w-lg mx-auto bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-left shadow-sm space-y-3.5">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nomination ID</span>
                      <strong className="text-xl font-mono text-[#6C4AB6]">{submitSuccess.nominationId}</strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Payment ID</span>
                      <strong className="text-sm font-mono text-slate-800">{submitSuccess.paymentId}</strong>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Award</span>
                      <span className="text-sm font-semibold text-slate-900">{submitSuccess.awardCategory}</span>
                    </div>

                    <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Venue</span>
                      <span className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#6C4AB6]" /> New Delhi
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Status</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Submitted (Pending Verification)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    An official acknowledgement has been sent to your registered email. The GHC Award Jury will review your submission documents and profile.
                  </p>

                  <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                    <a
                      href="/"
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#101828] text-white font-bold text-sm hover:bg-slate-800 transition-colors shadow-sm"
                    >
                      Return to Conclave Homepage
                    </a>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Candidate Summary Banner */}
                  <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-left">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Application Summary
                      </span>
                      <span className="text-xs font-semibold text-[#6C4AB6]">
                        {awardsList.find((a) => a.id === formData.awardId)?.name}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-slate-400 block">Candidate Name</span>
                        <strong className="text-slate-900 font-semibold">{formData.fullName}</strong>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Organisation / Hospital</span>
                        <span className="text-slate-800">{formData.orgAffiliation}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Designation</span>
                        <span className="text-slate-800">{formData.designation}</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block">Email & Mobile</span>
                        <span className="text-slate-800">{formData.email} • {formData.mobile}</span>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-[#6C4AB6] shrink-0" />
                        <span><strong>Event Venue:</strong> S.E.T Facility, AIIMS New Delhi</span>
                      </div>
                    </div>
                  </div>

                  {/* DEDICATED PAYMENT SECTION (Section 2, 3, 5, 6 requirements) */}
                  <div className="max-w-2xl mx-auto bg-slate-50 border-2 border-[#6C4AB6]/20 rounded-3xl p-6 sm:p-8 shadow-sm text-left">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-100 text-purple-800 mb-2">
                          <CreditCard className="w-3.5 h-3.5" /> Nomination Fee
                        </div>
                        <h3 className="text-4xl font-extrabold text-[#101828] font-mono">
                          ₹{nominationConfig.fee.toLocaleString("en-IN")}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-500 sm:text-right">
                        <span>Includes full conclave registration</span>
                        <br />
                        <span className="font-semibold text-slate-700">Official Jury Evaluation</span>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 mt-4 leading-relaxed">
                      Complete your nomination payment through CLIRNET. After payment, return to this page and enter your Payment ID to submit your nomination.
                    </p>

                    {/* PAYMENT INSTRUCTIONS (Section 6 requirement) */}
                    <div className="my-5 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2.5 flex items-center gap-1.5">
                        <BadgeCheck className="w-4 h-4 text-[#6C4AB6]" /> How to Complete Your Submission:
                      </h4>
                      <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside pl-1">
                        <li>Click <strong>"Pay"</strong> below to open the CLIRNET payment page.</li>
                        <li>Complete the nomination payment on CLIRNET.</li>
                        <li>Copy your <strong>Payment ID</strong> from your transaction receipt.</li>
                        <li>Return to this page (your nomination form data is preserved).</li>
                        <li>Enter your Payment ID in the field below.</li>
                        <li>Click <strong>"Submit Nomination"</strong>.</li>
                      </ol>
                    </div>

                    {/* PAY BUTTON (Section 3 requirement) */}
                    <div className="mb-6">
                      <button
                        type="button"
                        onClick={handlePayClick}
                        disabled={savingDraft}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white font-bold text-base hover:opacity-95 shadow-md shadow-[#e244b7]/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-60"
                      >
                        <ExternalLink className="w-5 h-5" />
                        {savingDraft ? "Saving Draft & Opening CLIRNET..." : "PAY NOW ON CLIRNET"}
                      </button>
                      <p className="text-[11px] text-slate-400 text-center mt-2 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Opens the official CLIRNET external payment gateway in a new tab.
                      </p>
                      {clirnetOpened && (
                        <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>CLIRNET payment opened in a new tab. Enter your Payment ID below after completing payment.</span>
                        </div>
                      )}
                    </div>

                    {/* PAYMENT ID FIELD (Section 5 & 7 requirements) */}
                    <div className="pt-5 border-t border-slate-200">
                      <label className="block text-sm font-bold text-slate-900 mb-1">
                        Payment ID <span className="text-rose-500">*</span>
                      </label>
                      <p className="text-xs text-slate-500 mb-2.5">
                        After completing your payment on CLIRNET, enter the Payment ID provided to you.
                      </p>
                      <input
                        type="text"
                        value={formData.paymentId}
                        onChange={(e) => updateForm("paymentId", e.target.value)}
                        placeholder="Enter your CLIRNET Payment ID"
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#6C4AB6] focus:border-transparent bg-white shadow-xs transition-all"
                      />
                      {errors.paymentId && (
                        <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {errors.paymentId}
                        </p>
                      )}
                    </div>

                    {submitError && (
                      <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{submitError}</span>
                      </div>
                    )}

                    {/* FINAL SUBMIT BUTTON (Section 9 requirement) */}
                    <div className="mt-6 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={handleSubmitNomination}
                        disabled={submitting}
                        className="w-full py-4 px-8 rounded-full bg-[#101828] text-white font-extrabold text-base hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Nomination...
                          </>
                        ) : (
                          <>
                            <Check className="w-5 h-5 text-emerald-400" /> Submit Nomination
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            {step > 1 && !submitSuccess ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-[#344054] font-semibold transition-colors text-sm shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] hover:opacity-95 text-white font-bold transition-all shadow-md shadow-[#e244b7]/25 text-sm"
              >
                {step === 1 ? "Start Your Nomination" : "Continue"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : step === 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] hover:opacity-95 text-white font-bold transition-all shadow-md shadow-[#e244b7]/25 text-sm"
              >
                Proceed to Payment <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
