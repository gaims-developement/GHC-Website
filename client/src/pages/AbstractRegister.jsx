import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Upload, User, BookOpen, CheckCircle2, ChevronRight, Info } from "lucide-react";
import { apiUrl } from "../config/api";
import { Link } from "react-router-dom";

const specialties = [
  "Cardiology", "Gastroenterology", "Nephrology", "Oncology", "Hematology",
  "Pediatrics", "Surgery", "General Surgery", "Orthopedics", "Neurosurgery",
  "Cardiothoracic Surgery", "Plastic Surgery", "Ophthalmology", "Otolaryngology (ENT)",
  "Obstetrics and Gynecology (OB/GYN)", "Psychiatry", "Emergency Medicine",
  "Anesthesiology", "Dermatology", "Radiology", "Pathology", "Neurology",
  "Urology", "Endocrinology", "Rheumatology", "Infectious Diseases", "Other"
];

const initialForm = {
  name: "",
  category: "Medical Student/Interns",
  specialty: "",
  yearOfStudy: "",
  college: "",
  cityState: "",
  country: "",
  phone: "",
  email: "",
  title: "",
  subCategory: "Research abstract",
  consent: false,
};

export default function AbstractRegister() {
  const [form, setForm] = useState(initialForm);
  const [pdf, setPdf] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [step, setStep] = useState(0);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });
  const [errors, setErrors] = useState({});

  const updateForm = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((curr) => ({ ...curr, [key]: null }));
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0];
    const isValidType = file && (file.type === "application/pdf" || file.type.includes("wordprocessingml") || file.type.includes("msword"));
    
    if (isValidType) {
      if (type === 'pdf') setPdf(file);
      if (type === 'declaration') setDeclaration(file);
      setErrors((curr) => ({ ...curr, [type]: null }));
    } else {
      setErrors((curr) => ({ ...curr, [type]: "Please upload a valid PDF or DOCX file" }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.name.trim()) newErrors.name = "Name is required";
      if (!form.specialty.trim()) newErrors.specialty = "Specialty is required";
      if (!form.yearOfStudy.trim()) newErrors.yearOfStudy = "Year of Study is required";
      if (!form.college.trim()) newErrors.college = "College / Hospital is required";
      if (!form.cityState.trim()) newErrors.cityState = "City and State is required";
      if (!form.country.trim()) newErrors.country = "Country is required";
      if (!form.phone.trim()) newErrors.phone = "Phone number is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Valid email is required";
    }
    if (currentStep === 2) {
      if (!form.title.trim()) newErrors.title = "Abstract title is required";
      if (!pdf) newErrors.pdf = "Please upload your abstract file";
      if (!declaration) newErrors.declaration = "Please upload your declaration form";
    }
    if (currentStep === 3) {
      if (!form.consent) newErrors.consent = "You must agree to the guidelines to submit";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 0 || validateStep(step)) {
      setStep((curr) => Math.min(curr + 1, 3));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((curr) => Math.max(curr - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitAbstract = async () => {
    if (!validateStep(3)) return;
    
    setSubmissionState({ status: "loading", message: "Submitting abstract..." });

    const data = new FormData();
    data.append("name", form.name);
    data.append("track", form.category);
    data.append("specialty", form.specialty);
    data.append("year_of_study", form.yearOfStudy);
    data.append("college", form.college);
    data.append("city_state", form.cityState);
    data.append("country", form.country);
    data.append("phone", form.phone);
    data.append("email", form.email);
    data.append("title", form.title);
    data.append("category", form.subCategory === "Research abstract" ? "research_paper" : "case_report");
    
    if (pdf) data.append("pdf", pdf);
    if (declaration) data.append("declaration", declaration);

    try {
      await axios.post(apiUrl("/api/research/submit"), data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmissionState({ status: "success", message: "Your abstract and declaration have been submitted successfully. Our team will contact you shortly." });
    } catch (error) {
      setSubmissionState({ status: "error", message: error.response?.data?.message || "Unable to submit abstract. Please try again." });
    }
  };

  if (submissionState.status === "success") {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6 font-['Syne',sans-serif]">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/[0.03] border border-white/10 p-10 rounded-3xl text-center">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">Submission Successful</h2>
          <p className="text-white/60 mb-8 leading-relaxed">{submissionState.message}</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/[0.05] hover:bg-white/10 text-white font-semibold transition-colors">
            Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-['Syne',sans-serif] selection:bg-[#ff3d7f]/30">
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-5 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-semibold font-['DM_Sans']">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="text-xs font-bold tracking-widest text-white/40 uppercase">GHC 2026 Research</div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        
        {step > 0 && (
          <div className="mb-12">
            <div className="flex justify-between relative z-10">
              {["Details", "Uploads", "Consent"].map((label, i) => {
                const isActive = step >= i + 1;
                return (
                  <div key={label} className="flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-500 ${isActive ? "bg-gradient-to-br from-[#ff6b9d] to-[#ff3d7f] text-white shadow-[0_0_20px_rgba(255,61,127,0.4)]" : "border-2 border-white/15 text-white/30"}`}>
                      {isActive && step > i + 1 ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                    </div>
                    <span className={`text-xs font-semibold tracking-wider uppercase font-['DM_Sans'] ${isActive ? "text-white/90" : "text-white/30"}`}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div className="h-1 bg-white/10 absolute top-[148px] md:top-[164px] left-0 right-0 max-w-4xl mx-auto px-16 -z-0">
              <div className="h-full bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 0: GUIDELINES */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8 font-['DM_Sans']">
                <div className="text-center mb-8">
                  <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] font-['Syne']">Abstract Submission</h1>
                  <p className="text-white/60 mt-4 text-lg">Please read the guidelines carefully before submitting.</p>
                </div>
                
                <div className="space-y-6 text-white/80 leading-relaxed text-sm md:text-base">
                  <div className="bg-[#ff3d7f]/10 border border-[#ff3d7f]/20 rounded-2xl p-6">
                    <p className="font-bold text-[#ff3d7f] text-lg mb-2 flex items-center gap-2"><Info className="w-5 h-5"/> Important Note</p>
                    <p>Last date for Submission: <strong>30th October , 2026.</strong></p>
                    <ul className="list-disc list-inside mt-4 space-y-2">
                      <li>The file must be in <strong>PDF or DOCX</strong> format and not more than <strong>10 MB</strong> in size.</li>
                      <li>All data entered must be accurate and verified.</li>
                      <li>Abstracts may include tables and references.</li>
                      <li>Word Limit: <strong>350–400 words</strong>.</li>
                      <li>No AI-generated content. Plagiarism up to 10% allowed. (We will use a standardized tool to screen).</li>
                      <li>If you are the presenting author, you can submit <strong>only one poster</strong> for presentation. You cannot be the presenting author on more than one submission. You may still be a co-author on other submissions — but you can present only one.</li>
                      <li>Cash prize and Certificate of presentation will <strong>only be given to presenting author</strong>.</li>
                      <li className="text-emerald-400 font-bold">FREE Accommodation & LUNCH to selected PRESENTORS.</li>
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                      <h3 className="font-bold text-xl text-white mb-4 border-b border-white/10 pb-2">Research Abstract Format</h3>
                      <ul className="space-y-1 opacity-80">
                        <li>1. TITLE</li>
                        <li>2. AUTHOR & CO-AUTHOR DETAILS</li>
                        <li>3. INTRODUCTION</li>
                        <li>4. AIMS & OBJECTIVES</li>
                        <li>5. METHODOLOGY</li>
                        <li>6. RESULTS</li>
                        <li>7. CONCLUSION</li>
                        <li>8. KEYWORDS</li>
                        <li>9. References (Optional)</li>
                        <li>10. Tables (Optional)</li>
                      </ul>
                    </div>
                    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                      <h3 className="font-bold text-xl text-white mb-4 border-b border-white/10 pb-2">Case Abstract Format</h3>
                      <ul className="space-y-1 opacity-80">
                        <li>1. TITLE</li>
                        <li>2. INTRODUCTION</li>
                        <li>3. AUTHOR & CO-AUTHOR DETAILS</li>
                        <li>4. CASE DESCRIPTION</li>
                      </ul>
                      <p className="mt-4 text-xs opacity-60 italic">Note: The Case Description should include History, Examination, Investigations, Diagnosis, Treatment, and Follow-up presented together under the single CASE DESCRIPTION heading.</p>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 mt-6">
                    <h3 className="font-bold text-blue-400 text-lg mb-2">Submission Instructions</h3>
                    <p>Kindly review the declaration form on the uploads page. If you agree with its terms, please sign the document and return a copy in PDF format using this form. <strong>Submission of your signed declaration is mandatory</strong> to confirm your participation/submission.</p>
                    
                    <div className="mt-6 pt-6 border-t border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-white/80">For any Queries; Contact -</p>
                          <p className="text-blue-300 font-medium">
                            <a href="mailto:ghcscientific@gmail.com" className="hover:text-blue-200 transition-colors">ghcscientific@gmail.com</a>
                            <br className="md:hidden" />
                            <span className="hidden md:inline"> • </span>
                            +91 8169011833 <br className="md:hidden" /> <span className="hidden md:inline"> • </span> +91 7022408203
                          </p>
                        </div>
                      </div>
                  </div>
                </div>

                <div className="flex justify-center pt-8">
                  <button onClick={nextStep} className="flex items-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] text-white font-extrabold transition-all hover:scale-105 active:scale-95 shadow-[#ff3d7f]/20">
                    I Have Read The Guidelines <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: DETAILS */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
                  <div className="p-3 bg-[#ff3d7f]/10 rounded-2xl text-[#ff3d7f]"><User className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white">Section 1: Details</h2>
                    <p className="text-white/50 text-sm mt-1 font-['DM_Sans']">Provide your personal and academic information.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-white/70 mb-2">Name *</label>
                    <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="Dr. John Doe" />
                    {errors.name && <p className="text-red-400 mt-2 text-sm">{errors.name}</p>}
                  </div>
                  
                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-white/70 mb-2">Category *</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {["Medical Student/Interns", "Post Intern/Resident (Ongoing PG)"].map(cat => (
                        <label key={cat} className={`flex-1 flex items-center justify-center p-4 rounded-xl border cursor-pointer transition-all ${form.category === cat ? "bg-blue-500/10 border-blue-500 text-blue-400" : "bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]"}`}>
                          <input type="radio" name="category" value={cat} checked={form.category === cat} onChange={() => updateForm("category", cat)} className="hidden" />
                          <span className="font-bold text-center">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Specialty *</label>
                    <select value={form.specialty} onChange={(e) => updateForm("specialty", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans'] [&>option]:bg-[#0a0a0f]">
                      <option value="">Select Specialty</option>
                      {specialties.map(spec => (
                        <option key={spec} value={spec}>{spec}</option>
                      ))}
                    </select>
                    {errors.specialty && <p className="text-red-400 mt-2 text-sm">{errors.specialty}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Year of Study *</label>
                    <input type="text" value={form.yearOfStudy} onChange={(e) => updateForm("yearOfStudy", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="e.g. 3rd Year" />
                    {errors.yearOfStudy && <p className="text-red-400 mt-2 text-sm">{errors.yearOfStudy}</p>}
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-white/70 mb-2">College / Hospital *</label>
                    <input type="text" value={form.college} onChange={(e) => updateForm("college", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="AIIMS New Delhi" />
                    {errors.college && <p className="text-red-400 mt-2 text-sm">{errors.college}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">City and State *</label>
                    <input type="text" value={form.cityState} onChange={(e) => updateForm("cityState", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="New Delhi, Delhi" />
                    {errors.cityState && <p className="text-red-400 mt-2 text-sm">{errors.cityState}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Country *</label>
                    <input type="text" value={form.country} onChange={(e) => updateForm("country", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="India" />
                    {errors.country && <p className="text-red-400 mt-2 text-sm">{errors.country}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Phone number *</label>
                    <input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="+91 9876543210" />
                    {errors.phone && <p className="text-red-400 mt-2 text-sm">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Email ID *</label>
                    <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-[#ff3d7f] outline-none transition-all font-['DM_Sans']" placeholder="john@hospital.com" />
                    {errors.email && <p className="text-red-400 mt-2 text-sm">{errors.email}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: UPLOADS */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-400"><Upload className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white">Section 2: Uploads</h2>
                    <p className="text-white/50 text-sm mt-1 font-['DM_Sans']">Abstract details and document uploads.</p>
                  </div>
                </div>

                <div className="bg-[#ff3d7f]/5 border border-[#ff3d7f]/10 p-5 rounded-xl mb-6">
                  <h4 className="font-bold text-[#ff3d7f] mb-2 text-sm">Guidelines for Submission -</h4>
                  <ul className="list-disc list-inside text-sm text-white/70 space-y-1">
                    <li>The file must be in PDF/Docx format, not more than (10mb) size</li>
                    <li>Data entered must be correct and Verified</li>
                    <li>Double Submissions for the Same Abstract would lead to direct Disqualification</li>
                  </ul>
                  <p className="mt-4 text-sm text-white/80">Kindly review the attached declaration form. If you agree with its terms, please sign the document and return a copy in PDF format in this form.<br/>Submission of your declaration would be necessary for confirming your participation/submission.</p>
                  <p className="mt-4 text-xs font-bold text-white/60">For Queries ; Contact - <br/><a href="mailto:ghcscientific@gmail.com" className="text-blue-300 hover:text-blue-200">ghcscientific@gmail.com</a><br/>+91 8169011833 <br/>+91 7022408203</p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Title of your Abstract *</label>
                    <input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-white focus:border-purple-500 outline-none transition-all font-['DM_Sans']" placeholder="Enter the full title of your research" />
                    {errors.title && <p className="text-red-400 mt-2 text-sm">{errors.title}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Sub - Category *</label>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {["Research abstract", "Case abstract"].map(cat => (
                        <label key={cat} className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${form.subCategory === cat ? "bg-purple-500/10 border-purple-500 text-purple-400" : "bg-white/[0.02] border-white/10 text-white/60 hover:bg-white/[0.05]"}`}>
                          <input type="radio" name="subCategory" value={cat} checked={form.subCategory === cat} onChange={() => updateForm("subCategory", cat)} className="hidden" />
                          <span className="font-bold">{cat}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Abstract Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-white/70 mb-2">Upload your abstract here *</label>
                    <div className={`border-2 border-dashed ${errors.pdf ? "border-red-500/50 bg-red-500/5" : "border-white/15 hover:border-purple-500/50 hover:bg-purple-500/5"} rounded-2xl p-8 text-center transition-all group relative`}>
                      <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileUpload(e, 'pdf')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="pointer-events-none relative z-0 flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-3 text-white/20 group-hover:text-purple-400 transition-colors" />
                        {pdf ? (
                          <>
                            <h4 className="font-bold text-white mb-1 truncate max-w-xs">{pdf.name}</h4>
                            <p className="text-white/50 text-sm">{(pdf.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">Select Abstract Document</h4>
                            <p className="text-white/40 text-xs">PDF or DOCX (Max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.pdf && <p className="text-red-400 mt-2 text-center font-semibold text-sm">{errors.pdf}</p>}
                  </div>

                  {/* Declaration Form Upload */}
                  <div className="pt-6 border-t border-white/10">
                    <label className="block text-sm font-semibold text-white/70 mb-2 flex items-center justify-between">
                      <span>Upload your Declaration form here *</span>
                      <a href="/assets/forms/GHC%20Poster%20Presenter%20Declaration%20Form%201.docx" download="GHC Poster Presenter Declaration Form.docx" className="text-sm text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                        Download declaration form <ArrowRight className="w-3 h-3"/>
                      </a>
                    </label>
                    <div className={`border-2 border-dashed ${errors.declaration ? "border-red-500/50 bg-red-500/5" : "border-white/15 hover:border-blue-500/50 hover:bg-blue-500/5"} rounded-2xl p-8 text-center transition-all group relative`}>
                      <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileUpload(e, 'declaration')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                      <div className="pointer-events-none relative z-0 flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-3 text-white/20 group-hover:text-blue-400 transition-colors" />
                        {declaration ? (
                          <>
                            <h4 className="font-bold text-white mb-1 truncate max-w-xs">{declaration.name}</h4>
                            <p className="text-white/50 text-sm">{(declaration.size / 1024 / 1024).toFixed(2)} MB</p>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">Select Signed Declaration</h4>
                            <p className="text-white/40 text-xs">PDF or DOCX (Max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.declaration && <p className="text-red-400 mt-2 text-center font-semibold text-sm">{errors.declaration}</p>}
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 3: CONSENT */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                <div className="flex items-center gap-4 border-b border-white/10 pb-6 mb-8">
                  <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400"><CheckCircle2 className="w-8 h-8" /></div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-white">Section 3: Consent</h2>
                    <p className="text-white/50 text-sm mt-1 font-['DM_Sans']">Final confirmation before submitting.</p>
                  </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="mt-1 flex-shrink-0">
                      <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${form.consent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/30 text-transparent group-hover:border-emerald-500/50'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <input type="checkbox" className="hidden" checked={form.consent} onChange={(e) => updateForm("consent", e.target.checked)} />
                    </div>
                    <p className={`text-lg leading-relaxed transition-colors ${form.consent ? 'text-white' : 'text-white/70'}`}>
                      I, Hereby Confirm that I have verified all the details submitted by me and the Guidelines provided by GAIMS are followed and I am officially Submitting my entry for the Abstract for the Competition.
                    </p>
                  </label>
                  {errors.consent && <p className="text-red-400 mt-4 font-semibold text-sm ml-10">{errors.consent}</p>}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation */}
          {step > 0 && (
            <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
              <button onClick={prevStep} className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 font-bold transition-colors">
                Back
              </button>

              {step < 3 ? (
                <button onClick={nextStep} className="flex items-center gap-2 px-10 py-4 rounded-full bg-white text-[#0a0a0f] hover:bg-white/90 font-extrabold transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                  Next Step <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button onClick={submitAbstract} disabled={submissionState.status === "loading" || !form.consent} className={`flex items-center gap-2 px-10 py-4 rounded-full font-extrabold transition-all shadow-lg ${submissionState.status === "loading" || !form.consent ? "bg-white/20 text-white/30 cursor-not-allowed" : "bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] text-white hover:scale-105 active:scale-95 shadow-[#ff3d7f]/20"}`}>
                  {submissionState.status === "loading" ? "Submitting..." : "Submit Application"}
                </button>
              )}
            </div>
          )}
          
          {submissionState.status === "error" && (
            <p className="mt-6 text-center text-red-400 bg-red-400/10 py-3 rounded-lg font-semibold">{submissionState.message}</p>
          )}

        </div>
      </div>
    </div>
  );
}
