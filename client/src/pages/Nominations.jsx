import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, ChevronRight, User, Briefcase, FileText, Share2, Check, ArrowRight, ArrowLeft, Upload, BadgeCheck, X } from "lucide-react";
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
    cvFile: null,
    photoFile: null,
  });

  const [errors, setErrors] = useState({});
  const formTopRef = useRef(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    setPageSeo({
      title: "GHC Awards 2026 — Nominations",
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
      if (!formData.cvFile) newErrors.cvFile = "CV is required.";
      if (!formData.photoFile) newErrors.photoFile = "Photo is required.";
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

    updateForm(type === "cv" ? "cvFile" : "photoFile", file);
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-[#e244b7]/10 border border-[#e244b7]/25 text-[#e244b7] text-xs font-bold tracking-widest uppercase"
          >
            <BadgeCheck className="w-4 h-4 text-[#e244b7]" /> GHC Awards 2026
          </motion.div>
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
          
          {step === 7 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <BadgeCheck className="w-12 h-12" />
              </div>
              <h2 className="text-3xl font-extrabold text-[#101828] mb-3">Review & Submit Nomination</h2>
              <p className="text-[#475467] mb-8 max-w-lg mx-auto text-base">
                Your nomination for <strong className="text-[#6C4AB6]">{awardsList.find(a => a.id === formData.awardId)?.name}</strong> is ready. Proceed to complete the ₹5,000 nomination fee.
              </p>

              <div className="max-w-md mx-auto bg-white p-6 rounded-2xl border border-gray-200 text-left mb-8 text-sm space-y-2 shadow-sm">
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Candidate:</span>
                  <span className="font-semibold text-gray-900">{formData.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Category:</span>
                  <span className="font-semibold text-gray-900">{awardsList.find(a => a.id === formData.awardId)?.name}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Email:</span>
                  <span className="font-semibold text-gray-900">{formData.email}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Fee Amount:</span>
                  <span className="font-bold text-[#6C4AB6]">₹5,000 (Complimentary Pass Included)</span>
                </div>
              </div>

              <button 
                type="button"
                className="px-10 py-4 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white font-bold text-lg hover:opacity-95 transition-transform shadow-lg shadow-[#e244b7]/30 hover:-translate-y-0.5"
                onClick={() => alert("Proceeding to Razorpay checkout (mock)")}
              >
                Pay ₹5,000 & Submit Nomination
              </button>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            {step > 1 ? (
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
                Review Application <ArrowRight className="w-4 h-4" />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
