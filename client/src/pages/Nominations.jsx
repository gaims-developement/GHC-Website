import React, { useState, useEffect, useMemo } from "react";
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

  useEffect(() => {
    setPageSeo({
      title: "GHC Awards 2026 — Nominations",
      description: "Nominate outstanding healthcare professionals, educators, and leaders for the GHC Awards.",
      path: "/nominations",
    });
  }, []);

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
      // Professional details (optional depending on strictness, but let's make designation/org required)
      if (!formData.orgAffiliation.trim()) newErrors.orgAffiliation = "Organization Affiliation is required.";
      if (!formData.designation.trim()) newErrors.designation = "Designation is required.";
    }
    if (step === 4) {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = "Valid email is required.";
      if (!formData.mobile.trim()) newErrors.mobile = "Mobile Number is required.";
    }
    if (step === 5) {
      // Social links (at least check if URLs are valid if provided)
      formData.socialLinks.forEach((link, idx) => {
        if (link.url && !/^https?:\/\/.+/.test(link.url)) {
          newErrors[`social_${idx}`] = "Please enter a valid URL (starting with http:// or https://).";
        }
      });
    }
    if (step === 6) {
      if (!formData.cvFile) newErrors.cvFile = "CV is required.";
      // Photo is not strictly mentioned as required, but usually is. Let's make it required.
      if (!formData.photoFile) newErrors.photoFile = "Photo is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mock file upload handler
  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check sizes/types here in a real scenario
    if (type === "cv" && file.type !== "application/pdf") {
      setErrors(prev => ({ ...prev, cvFile: "CV must be a PDF file." }));
      return;
    }

    updateForm(type === "cv" ? "cvFile" : "photoFile", file);
  };

  return (
    <div className="bg-[#0a0a0f] min-h-screen font-['Syne',sans-serif] text-white">
      {/* Navbar space filler */}
      <div className="h-20 md:h-24" />

      <div className="max-w-5xl mx-auto px-6 pt-6">
        <a href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors font-['DM_Sans'] text-sm font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </a>
      </div>

      {/* Hero Section */}
      {step === 1 && (
        <section className="relative px-6 py-20 overflow-hidden text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold tracking-widest uppercase"
          >
            <BadgeCheck className="w-4 h-4" /> GHC Awards 2026
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6"
          >
            Recognising the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">People</span> Shaping Healthcare
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed font-['DM_Sans',sans-serif]"
          >
            Celebrate visionaries, innovators, educators, researchers and changemakers who are creating meaningful impact across healthcare.
          </motion.p>
        </section>
      )}

      {/* Main Form Container */}
      <div className="max-w-4xl mx-auto px-4 pb-24">
        {/* Progress Indicator */}
        <div className="mb-12 sticky top-24 z-40 bg-[#0a0a0f]/90 backdrop-blur-md py-4 border-b border-white/5">
          <div className="flex justify-between items-center text-xs font-['DM_Sans'] uppercase tracking-widest text-white/40 mb-3">
            <span>Step {step} of 6</span>
            <span>{Math.round((step / 6) * 100)}% Completed</span>
          </div>
          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-400"
              initial={{ width: 0 }}
              animate={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 md:p-10 backdrop-blur-sm">
          
          {/* STEP 1: Award Selection */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-3">The GHC Awards</h2>
                <p className="text-white/60 font-['DM_Sans'] text-lg">Honouring excellence across healthcare, research, education, leadership and social impact.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                          ? "bg-blue-500/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]" 
                          : "bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-blue-400">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                      <Award className={`w-8 h-8 mb-4 ${isSelected ? "text-blue-400" : "text-white/40 group-hover:text-white/70"}`} />
                      <h3 className="text-lg font-bold mb-2">{award.name}</h3>
                      <p className="text-sm text-white/50 font-['DM_Sans']">{award.desc}</p>
                    </div>
                  );
                })}
              </div>
              {errors.awardId && <p className="text-red-400 mt-4 text-sm">{errors.awardId}</p>}

              <AnimatePresence>
                {formData.awardId === "medical_leadership" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-8 overflow-hidden"
                  >
                    <h3 className="text-xl font-bold mb-4">Select Age Category</h3>
                    <div className="flex flex-wrap gap-4">
                      {ageCategories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => updateForm("ageCategory", cat.id)}
                          className={`px-6 py-3 rounded-full border text-sm font-semibold transition-all ${
                            formData.ageCategory === cat.id
                              ? "bg-blue-500 text-white border-blue-500"
                              : "bg-transparent text-white/70 border-white/20 hover:border-white/40"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                    {errors.ageCategory && <p className="text-red-400 mt-2 text-sm">{errors.ageCategory}</p>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Benefit Section inside step 1 */}
              <div className="mt-16 p-8 rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Award className="w-32 h-32" />
                </div>
                <h3 className="text-2xl font-bold mb-6">Your Nomination Includes More Than Recognition</h3>
                <div className="flex items-end gap-3 mb-6">
                  <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">₹5,000</span>
                  <span className="text-white/50 text-sm font-semibold uppercase tracking-wider mb-2">Nomination Fee</span>
                </div>
                <p className="text-white/80 font-['DM_Sans'] mb-6 text-lg">Self-nomination includes complimentary registration to the Global Health Conclave.</p>
                <ul className="space-y-3 font-['DM_Sans'] text-white/70">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /> Award nomination consideration</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /> Complimentary GHC event registration</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /> Opportunity to showcase your work and impact</li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-400" /> Official nomination acknowledgement</li>
                </ul>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Personal Details */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-400" />
                <h2 className="text-3xl font-bold">Personal Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white/70 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => updateForm("fullName", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="Dr. Jane Doe"
                  />
                  {errors.fullName && <p className="text-red-400 mt-1 text-sm">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Date of Birth</label>
                  <div className="grid grid-cols-3 gap-3">
                    <select
                      value={formData.dobYear}
                      onChange={(e) => updateForm("dobYear", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none"
                    >
                      <option value="" className="bg-[#0a0a0f]">Year</option>
                      {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i).map(y => (
                        <option key={y} value={y} className="bg-[#0a0a0f]">{y}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobMonth}
                      onChange={(e) => updateForm("dobMonth", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none"
                    >
                      <option value="" className="bg-[#0a0a0f]">Month</option>
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                        <option key={m} value={i + 1} className="bg-[#0a0a0f]">{m}</option>
                      ))}
                    </select>
                    <select
                      value={formData.dobDay}
                      onChange={(e) => updateForm("dobDay", e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner appearance-none"
                    >
                      <option value="" className="bg-[#0a0a0f]">Date</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                        <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>
                      ))}
                    </select>
                  </div>
                  {errors.dob && <p className="text-red-400 mt-1 text-sm">{errors.dob}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Age (Auto-calculated)</label>
                  <input
                    type="text"
                    value={calculatedAge !== "" ? `${calculatedAge} years` : ""}
                    readOnly
                    className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-3 text-white/50 cursor-not-allowed shadow-inner"
                    placeholder="--"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-white/70 mb-3">Sex</label>
                  <div className="flex flex-wrap gap-4">
                    {["Male", "Female", "Other", "Prefer not to say"].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="sex"
                          value={opt}
                          checked={formData.sex === opt}
                          onChange={(e) => updateForm("sex", e.target.value)}
                          className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 focus:ring-blue-500 focus:ring-offset-[#0a0a0f]"
                        />
                        <span className="text-white/80">{opt}</span>
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
                <Briefcase className="w-6 h-6 text-blue-400" />
                <h2 className="text-3xl font-bold">Professional Details</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Organisation Affiliation</label>
                  <input
                    type="text"
                    value={formData.orgAffiliation}
                    onChange={(e) => updateForm("orgAffiliation", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="e.g. HealthTech Innovators, NGO Care, Global Hospital"
                  />
                  <p className="text-xs text-white/40 mt-1 font-['DM_Sans']">Includes NGOs, startups, colleges, or hospitals.</p>
                  {errors.orgAffiliation && <p className="text-red-400 mt-1 text-sm">{errors.orgAffiliation}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Medical College / Hospital (Optional)</label>
                  <input
                    type="text"
                    value={formData.medicalCollege}
                    onChange={(e) => updateForm("medicalCollege", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="If applicable"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => updateForm("designation", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="e.g. Chief Medical Officer, Founder, Professor"
                  />
                  {errors.designation && <p className="text-red-400 mt-1 text-sm">{errors.designation}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Contact Details */}
          {step === 4 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-400" />
                <h2 className="text-3xl font-bold">Contact Details</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateForm("email", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="name@example.com"
                  />
                  {errors.email && <p className="text-red-400 mt-1 text-sm">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-2">Mobile Number / WhatsApp</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => updateForm("mobile", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                    placeholder="+91 98765 43210"
                  />
                  <p className="text-xs text-white/40 mt-1 font-['DM_Sans']">Please include country code if outside India.</p>
                  {errors.mobile && <p className="text-red-400 mt-1 text-sm">{errors.mobile}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Social Links */}
          {step === 5 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <Share2 className="w-6 h-6 text-blue-400" />
                <div>
                  <h2 className="text-3xl font-bold mb-1">Social & Professional Links</h2>
                  <p className="text-white/50 text-sm font-['DM_Sans']">Help us learn more about your work.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                    <select
                      value={link.platform}
                      onChange={(e) => updateSocialLink(index, "platform", e.target.value)}
                      className="bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-inner w-full sm:w-48 shrink-0 appearance-none transition-all"
                    >
                      {["LinkedIn", "Instagram", "X / Twitter", "Facebook", "Personal Website", "Other"].map(opt => (
                        <option key={opt} value={opt} className="bg-[#0a0a0f] text-white">{opt}</option>
                      ))}
                    </select>
                    <div className="relative w-full">
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => updateSocialLink(index, "url", e.target.value)}
                        placeholder="https://"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-inner"
                      />
                    </div>
                    {formData.socialLinks.length > 1 && (
                      <button
                        onClick={() => removeSocialLink(index)}
                        className="p-3 text-white/40 hover:text-red-400 hover:bg-white/[0.03] rounded-xl transition-colors shrink-0"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                    {errors[`social_${index}`] && <p className="text-red-400 mt-1 text-sm sm:hidden">{errors[`social_${index}`]}</p>}
                  </div>
                ))}
              </div>
              
              <button
                onClick={addSocialLink}
                className="mt-6 text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
              >
                + Add another link
              </button>
            </motion.div>
          )}

          {/* STEP 6: Document Uploads & Review */}
          {step === 6 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-8 flex items-center gap-3">
                <Upload className="w-6 h-6 text-blue-400" />
                <h2 className="text-3xl font-bold">Document Uploads</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CV Upload */}
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-3">Upload CV (PDF Only)</label>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:bg-white/[0.02] hover:border-blue-500/50 transition-all group relative">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload(e, "cv")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <FileText className="w-10 h-10 mx-auto mb-4 text-white/30 group-hover:text-blue-400 transition-colors" />
                      {formData.cvFile ? (
                        <div>
                          <p className="text-white font-semibold truncate max-w-[200px] mx-auto">{formData.cvFile.name}</p>
                          <p className="text-white/40 text-xs mt-1">{(formData.cvFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="text-blue-400 text-sm mt-3 inline-block">Replace File</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white/70 font-semibold mb-1">Click or drag & drop</p>
                          <p className="text-white/40 text-xs">Maximum size 5MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.cvFile && <p className="text-red-400 mt-2 text-sm">{errors.cvFile}</p>}
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-semibold text-white/70 mb-3">Upload Photo</label>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:bg-white/[0.02] hover:border-blue-500/50 transition-all group relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "photo")}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      <User className="w-10 h-10 mx-auto mb-4 text-white/30 group-hover:text-blue-400 transition-colors" />
                      {formData.photoFile ? (
                        <div>
                          <p className="text-white font-semibold truncate max-w-[200px] mx-auto">{formData.photoFile.name}</p>
                          <p className="text-white/40 text-xs mt-1">{(formData.photoFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          <span className="text-blue-400 text-sm mt-3 inline-block">Replace File</span>
                        </div>
                      ) : (
                        <div>
                          <p className="text-white/70 font-semibold mb-1">Click or drag & drop</p>
                          <p className="text-white/40 text-xs">High resolution format</p>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.photoFile && <p className="text-red-400 mt-2 text-sm">{errors.photoFile}</p>}
                </div>
              </div>
            </motion.div>
          )}
          
          {step === 7 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10">
              <BadgeCheck className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-4">Review & Payment</h2>
              <p className="text-white/60 mb-8 max-w-lg mx-auto">
                Please proceed to pay the ₹5,000 nomination fee. This mock step confirms your details are ready for Razorpay integration.
              </p>
              <button 
                className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg hover:-translate-y-0.5 transition-transform shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                onClick={() => alert("Proceeding to Razorpay checkout (mock)")}
              >
                Pay ₹5,000 & Submit
              </button>
            </motion.div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-white/10 flex items-center justify-between">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/[0.05] hover:bg-white/10 text-white font-semibold transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}
            
            {step < 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors shadow-lg shadow-blue-500/20"
              >
                {step === 1 ? "Start Your Nomination" : "Continue"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : step === 6 ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-colors shadow-lg shadow-emerald-500/20"
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
