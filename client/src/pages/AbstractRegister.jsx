import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, FileText, Upload, User, BookOpen, CheckCircle2, ChevronRight, Info, Check, Microscope, Stethoscope } from "lucide-react";
import { apiUrl } from "../config/api";
import { Link } from "react-router-dom";
import '../home-redesign.css';

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
  state: "",
  stateId: null,
  city: "",
  cityId: null,
  country: "",
  countryId: null,
  phone: "",
  email: "",
  title: "",
  subCategory: "Research abstract",
  consent: false,
};

const researchAbstractFormat = [
  { num: "01", title: "TITLE", required: true },
  { num: "02", title: "AUTHOR & CO-AUTHOR DETAILS", required: true },
  { num: "03", title: "INTRODUCTION", required: true },
  { num: "04", title: "AIMS & OBJECTIVES", required: true },
  { num: "05", title: "METHODOLOGY", required: true },
  { num: "06", title: "RESULTS", required: true },
  { num: "07", title: "CONCLUSION", required: true },
  { num: "08", title: "KEYWORDS", required: true },
  { num: "09", title: "References", optional: true },
  { num: "10", title: "Tables", optional: true },
];

const caseAbstractFormat = [
  { num: "01", title: "TITLE", required: true },
  { num: "02", title: "INTRODUCTION", required: true },
  { num: "03", title: "AUTHOR & CO-AUTHOR DETAILS", required: true },
  { num: "04", title: "CASE DESCRIPTION", required: true },
];

const caseDescriptionSubItems = [
  "History",
  "Examination",
  "Investigations",
  "Diagnosis",
  "Treatment",
  "Follow-up",
];

export default function AbstractRegister() {
  const [form, setForm] = useState(initialForm);
  const [pdf, setPdf] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [step, setStep] = useState(0);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });
  const [errors, setErrors] = useState({});
  const [isCallsOpen, setIsCallsOpen] = useState(null);

  useEffect(() => {
    document.body.classList.add('redesign-active')
    return () => document.body.classList.remove('redesign-active')
  }, [])

  useEffect(() => {
    axios.get(apiUrl("/api/settings/public"))
      .then(res => {
        if (res.data?.registration?.abstractSubmissionOpen !== undefined) {
          setIsCallsOpen(res.data.registration.abstractSubmissionOpen);
        } else {
          setIsCallsOpen(true); // Default
        }
      })
      .catch(err => {
        console.error("Failed to load public settings:", err);
        setIsCallsOpen(true);
      });
  }, []);

  // Location Data States
  const [countriesList, setCountriesList] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);

  useEffect(() => {
    axios.get(apiUrl("/api/locations/countries"))
      .then(res => setCountriesList(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Failed to load countries:", err));
  }, []);

  useEffect(() => {
    if (form.countryId) {
      setStatesList([]);
      setForm(curr => ({ ...curr, state: "", stateId: null, city: "", cityId: null }));
      axios.get(apiUrl(`/api/locations/states/${form.countryId}`))
        .then(res => setStatesList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Failed to load states:", err));
    }
  }, [form.countryId]);

  useEffect(() => {
    if (!form.stateId || citySearchTerm.length < 2) {
      setCitiesList([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoadingLocations(true);
      axios.get(apiUrl(`/api/locations/cities?stateId=${form.stateId}&search=${encodeURIComponent(citySearchTerm)}`))
        .then(res => setCitiesList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Failed to search cities:", err))
        .finally(() => setLoadingLocations(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [citySearchTerm, form.stateId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateForm = (key, value, extraPayload = {}) => {
    setForm((current) => {
      const next = { ...current, [key]: value, ...extraPayload };
      if (key === 'category') next.yearOfStudy = "";
      return next;
    });
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
      if (!form.name.trim()) newErrors.name = "Required";
      if (!form.specialty.trim()) newErrors.specialty = "Required";
      if (!form.yearOfStudy.trim()) newErrors.yearOfStudy = "Required";
      if (!form.college.trim()) newErrors.college = "Required";
      if (!form.state.trim()) newErrors.state = "Required";
      if (!form.city.trim()) newErrors.city = "Required";
      if (!form.country.trim()) newErrors.country = "Required";
      if (!form.phone.trim()) newErrors.phone = "Required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "Invalid email";
    }
    if (currentStep === 2) {
      if (!form.title.trim()) newErrors.title = "Required";
      if (!pdf) newErrors.pdf = "Upload required";
      if (!declaration) newErrors.declaration = "Upload required";
    }
    if (currentStep === 3) {
      if (!form.consent) newErrors.consent = "You must agree to submit";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 0 || validateStep(step)) {
      setStep((curr) => Math.min(curr + 1, 3));
    }
  };

  const prevStep = () => {
    setStep((curr) => Math.max(curr - 1, 0));
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
    data.append("city_state", `${form.city}, ${form.state}`);
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
      <div className="min-h-screen bg-[#E5F3EF] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl">
          <div className="w-20 h-20 bg-[#349e81]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#349e81]" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a2b3c] mb-4">Submission Successful</h2>
          <p className="text-gray-500 mb-8">{submissionState.message}</p>
          <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-[#349e81] text-white rounded-full font-medium hover:bg-[#2b836b] transition-colors">
            Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isCallsOpen === false) {
    return (
      <div className="min-h-screen bg-[#E5F3EF] flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white rounded-3xl p-10 text-center shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-red-50 border border-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Info className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1a2b3c] mb-4">Calls are Closed</h2>
          <p className="text-gray-500 mb-8">Abstract submission calls are now closed for GHC 2026. You can apply next year.</p>
          <Link to="/" className="inline-flex items-center justify-center px-8 py-3 bg-[#349e81] text-white rounded-full font-medium hover:bg-[#2b836b] transition-colors gap-2">
            <ArrowLeft className="w-4 h-4" /> Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  if (isCallsOpen === null) {
    return (
      <div className="min-h-screen bg-[#E5F3EF] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-[#349e81] border-t-transparent rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  const stepsList = ["Guidelines", "Personal Details", "Uploads", "Consent"];

  return (
    <div className="min-h-screen bg-[#E5F3EF] text-[#1a2b3c] font-sans flex items-center justify-center p-4 sm:p-8">
      
      <div className="max-w-6xl w-full bg-white rounded-[1.5rem] shadow-[0_15px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col md:flex-row overflow-hidden min-h-[750px]">
        
        {/* Left Sidebar */}
        <div className="w-full md:w-[35%] bg-[#F4FAF8] p-8 md:p-12 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col relative shrink-0">
          <Link to="/" className="flex items-center gap-2 text-[#349e81] hover:text-[#2b836b] transition-colors font-semibold text-lg md:mb-16">
            <ArrowLeft className="w-5 h-5" /> GHC
          </Link>

          <h2 className="text-2xl md:text-[1.6rem] font-bold mt-8 md:mt-0 mb-10 text-[#1a2b3c] leading-tight">Abstract<br/>Submission</h2>

          <div className="flex flex-col gap-0 relative">
            {stepsList.map((label, i) => {
              const isActive = step === i;
              const isPast = step > i;
              
              return (
                <div key={label} className="flex relative z-10">
                  <div className="flex flex-col items-center mr-5 relative">
                    <div className={`w-[2.25rem] h-[2.25rem] rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 z-10 ${
                      isActive || isPast 
                        ? "bg-[#349e81] text-white" 
                        : "bg-[#e5ece9] text-[#7a958b]"
                    }`}>
                      {isPast ? <Check className="w-[18px] h-[18px] stroke-[2.5]" /> : (isActive ? <Check className="w-[18px] h-[18px] stroke-[2.5]" /> : i + 1)}
                    </div>
                    {/* Vertical Line */}
                    {i < stepsList.length - 1 && (
                      <div className={`w-[2px] h-12 transition-colors duration-300 ${
                        isPast ? "bg-[#349e81]" : "bg-[#e5ece9]"
                      }`}></div>
                    )}
                  </div>
                  <div className={`pt-2 font-medium transition-colors duration-300 ${
                    isActive ? "text-[#1a2b3c] font-bold" : isPast ? "text-[#349e81]" : "text-[#7a958b]"
                  }`}>
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Content */}
        <div className="w-full md:w-[65%] p-8 md:p-12 md:px-16 flex flex-col relative overflow-y-auto max-h-[85vh] md:max-h-none">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              
              {/* STEP 0: GUIDELINES */}
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-6">PLEASE READ CAREFULLY</h3>
                  
                  <div className="space-y-6 text-[#4a5f6e] text-sm">
                    <div className="bg-[#fff5f5] border border-[#ffe0e0] rounded-xl p-5">
                      <p className="font-bold text-[#e04040] mb-2 flex items-center gap-2"><Info className="w-4 h-4"/> Important Note</p>
                      <p>Last date for Submission: <strong>30th October , 2026.</strong></p>
                      <ul className="list-disc list-inside mt-3 space-y-1.5 opacity-90">
                        <li>The file must be in <strong>PDF or DOCX</strong> format and not more than <strong>10 MB</strong> in size.</li>
                        <li>All data entered must be accurate and verified.</li>
                        <li>Abstracts may include tables and references.</li>
                        <li>Word Limit: <strong>350–400 words</strong>.</li>
                        <li>No AI-generated content. Plagiarism up to 10% allowed.</li>
                        <li>If you are the presenting author, you can submit <strong>only one poster</strong> for presentation.</li>
                        <li>Cash prize and Certificate of presentation will <strong>only be given to presenting author</strong>.</li>
                      </ul>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-5">
                      {/* Research Abstract Format */}
                      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#349e81]/40 transition-colors">
                        <div>
                          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-[#349e81]/10 text-[#349e81] flex items-center justify-center shrink-0">
                                <Microscope className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-[#1a2b3c] text-sm tracking-tight truncate">Research Abstract</h4>
                                <p className="text-[11px] text-gray-500 font-medium truncate">Original Research Studies</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#349e81]/10 text-[#2b836b] border border-[#349e81]/20 whitespace-nowrap shrink-0">
                              10 Sections
                            </span>
                          </div>

                          <div className="mt-3.5 space-y-1.5">
                            {researchAbstractFormat.map((item) => (
                              <div
                                key={item.num}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                                  item.optional
                                    ? "bg-amber-50/40 border border-dashed border-amber-200/80"
                                    : "bg-gray-50/80 border border-gray-100"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-[#1a2b3c] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                    {item.num}
                                  </span>
                                  <span className="font-semibold text-[#1a2b3c] tracking-tight text-[11px] sm:text-xs">
                                    {item.title}
                                  </span>
                                </div>
                                {item.optional ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0 ml-2">
                                    Optional
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                    Required
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Case Abstract Format */}
                      <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#173B8F]/40 transition-colors">
                        <div>
                          <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-8 h-8 rounded-lg bg-[#173B8F]/10 text-[#173B8F] flex items-center justify-center shrink-0">
                                <Stethoscope className="w-4 h-4" />
                              </span>
                              <div className="min-w-0">
                                <h4 className="font-bold text-[#1a2b3c] text-sm tracking-tight truncate">Case Abstract</h4>
                                <p className="text-[11px] text-gray-500 font-medium truncate">Clinical Case Reports & Series</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#173B8F]/10 text-[#173B8F] border border-[#173B8F]/20 whitespace-nowrap shrink-0">
                              4 Sections
                            </span>
                          </div>

                          <div className="mt-3.5 space-y-1.5">
                            {caseAbstractFormat.map((item) => (
                              <div
                                key={item.num}
                                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-gray-50/80 border border-gray-100"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-[#1a2b3c] font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                    {item.num}
                                  </span>
                                  <span className="font-semibold text-[#1a2b3c] tracking-tight text-[11px] sm:text-xs">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0 ml-2">
                                  Required
                                </span>
                              </div>
                            ))}
                          </div>

                          <div className="mt-3.5 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-gray-200/90 p-3.5 space-y-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#173B8F]">
                              <Info className="w-3.5 h-3.5 shrink-0" />
                              <span>Case Description Breakdown:</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed">
                              Must be presented together under the single <strong>CASE DESCRIPTION</strong> heading and include:
                            </p>
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              {caseDescriptionSubItems.map((part) => (
                                <div key={part} className="flex items-center gap-1.5 text-[11px] text-[#1a2b3c] font-medium bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/70 shadow-2xs whitespace-nowrap">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#173B8F] shrink-0" />
                                  <span>{part}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-l-4 border-[#349e81] bg-[#f4faf8] p-4 rounded-r-xl">
                      <p className="text-xs font-semibold text-[#1a2b3c]">Submission Instructions</p>
                      <p className="text-xs mt-1 opacity-80">Kindly review the declaration form on the uploads page. If you agree with its terms, please sign the document and return a copy in PDF format. <strong>Submission of your signed declaration is mandatory.</strong></p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: DETAILS */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  
                  {/* Personal Section */}
                  <div>
                    <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-4">YOUR PERSONAL DETAILS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} className={`w-full bg-white border ${errors.name ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all placeholder-gray-400`} placeholder="Full Name" />
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex bg-gray-50/50 p-1 rounded-[0.4rem] border border-gray-200">
                          {["Medical Student/Interns", "Post Intern/Resident (Ongoing PG)"].map(cat => (
                            <button 
                              key={cat} 
                              onClick={() => updateForm("category", cat)}
                              className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all ${form.category === cat ? "bg-white text-[#1a2b3c] shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <select value={form.specialty} onChange={(e) => updateForm("specialty", e.target.value)} className={`w-full bg-white border ${errors.specialty ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237a958b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.6rem_auto]`}>
                          <option value="" disabled>Specialty</option>
                          {specialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                        </select>
                      </div>

                      <div>
                        <select value={form.yearOfStudy} onChange={(e) => updateForm("yearOfStudy", e.target.value)} className={`w-full bg-white border ${errors.yearOfStudy ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237a958b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.6rem_auto]`}>
                          <option value="" disabled>Year of Study</option>
                          {form.category === "Medical Student/Interns" 
                            ? ["1st year", "2nd year", "3rd year", "4th year", "Intern"].map(y => <option key={y} value={y}>{y}</option>)
                            : ["Post intern", "JR1", "JR2", "JR3"].map(y => <option key={y} value={y}>{y}</option>)
                          }
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <input type="text" value={form.college} onChange={(e) => updateForm("college", e.target.value)} className={`w-full bg-white border ${errors.college ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all placeholder-gray-400`} placeholder="College / Hospital" />
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div>
                    <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-4 mt-6">LOCATION DETAILS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="sm:col-span-2">
                        <select 
                          value={form.countryId || ""} 
                          onChange={(e) => {
                            const country = countriesList.find(c => c.id.toString() === e.target.value);
                            updateForm("countryId", country ? country.id : null, { country: country ? country.name : "" });
                          }} 
                          className={`w-full bg-white border ${errors.country ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237a958b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.6rem_auto]`}
                        >
                          <option value="" disabled>Country</option>
                          {countriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>

                      <div>
                        <select 
                          value={form.stateId || ""} 
                          onChange={(e) => {
                            const stateObj = statesList.find(s => s.id.toString() === e.target.value);
                            updateForm("stateId", stateObj ? stateObj.id : null, { state: stateObj ? stateObj.name : "", city: "", cityId: null });
                            setCitySearchTerm("");
                          }}
                          disabled={!form.countryId || statesList.length === 0}
                          className={`w-full bg-white border ${errors.state ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%237a958b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.6rem_auto]`}
                        >
                          <option value="" disabled>{statesList.length === 0 && form.countryId ? "No states available" : "State / Province"}</option>
                          {statesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>

                      <div className="relative" ref={cityDropdownRef}>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={form.cityId ? form.city : citySearchTerm} 
                            onChange={(e) => {
                              setCitySearchTerm(e.target.value);
                              updateForm("city", "", { cityId: null });
                              setShowCityDropdown(true);
                            }}
                            onFocus={() => {
                              if (!form.cityId) setShowCityDropdown(true);
                            }}
                            disabled={!form.stateId}
                            className={`w-full bg-white border ${errors.city ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all disabled:opacity-50`} 
                            placeholder={!form.stateId ? "Select a state first" : "City"} 
                          />
                          {loadingLocations && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <div className="w-4 h-4 border-2 border-[#349e81] border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          )}
                        </div>
                        {showCityDropdown && citySearchTerm.length >= 2 && !form.cityId && (
                          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-[0.4rem] shadow-xl max-h-60 overflow-y-auto">
                            {citiesList.length > 0 ? (
                              citiesList.map(city => (
                                <div 
                                  key={city.id} 
                                  onClick={() => {
                                    updateForm("cityId", city.id, { city: city.name });
                                    setCitySearchTerm("");
                                    setShowCityDropdown(false);
                                  }}
                                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-[#1a2b3c]"
                                >
                                  {city.name}
                                </div>
                              ))
                            ) : (
                              !loadingLocations && <div className="px-4 py-3 text-gray-500 text-sm text-center">No cities found</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Section */}
                  <div>
                    <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-4 mt-6">CONTACT DETAILS</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} className={`w-full bg-white border ${errors.phone ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all placeholder-gray-400`} placeholder="Phone Number" />
                      </div>
                      <div>
                        <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} className={`w-full bg-white border ${errors.email ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all placeholder-gray-400`} placeholder="Email Address" />
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}

              {/* STEP 2: UPLOADS */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                  <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-4">ABSTRACT DETAILS</h3>

                  <div className="space-y-6">
                    <div>
                      <input type="text" value={form.title} onChange={(e) => updateForm("title", e.target.value)} className={`w-full bg-white border ${errors.title ? 'border-red-300' : 'border-gray-200'} rounded-[0.4rem] px-4 py-[0.85rem] text-[#1a2b3c] focus:border-[#349e81] outline-none transition-all placeholder-gray-400`} placeholder="Title of your Abstract" />
                    </div>

                    <div className="flex bg-gray-50/50 p-1 rounded-[0.4rem] border border-gray-200">
                      {["Research abstract", "Case abstract"].map(cat => (
                        <button 
                          key={cat} 
                          onClick={() => updateForm("subCategory", cat)}
                          className={`flex-1 py-2 px-3 text-xs sm:text-sm font-medium rounded-[0.3rem] transition-all ${form.subCategory === cat ? "bg-white text-[#1a2b3c] shadow-sm border border-gray-100" : "text-gray-500 hover:text-gray-700"}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>

                    {/* Structure reference preview for selected category */}
                    <div className="mt-3 p-3.5 rounded-xl bg-[#f8fafc] border border-gray-200 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-[#1a2b3c] flex items-center gap-1.5 text-xs">
                          {form.subCategory === "Research abstract" ? (
                            <Microscope className="w-3.5 h-3.5 text-[#349e81]" />
                          ) : (
                            <Stethoscope className="w-3.5 h-3.5 text-[#173B8F]" />
                          )}
                          Format Outline for {form.subCategory}:
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600">
                          {form.subCategory === "Research abstract" ? "10 Sections" : "4 Sections"}
                        </span>
                      </div>
                      {form.subCategory === "Research abstract" ? (
                        <div className="flex flex-wrap gap-1.5 text-[11px]">
                          {researchAbstractFormat.map((item) => (
                            <span
                              key={item.num}
                              className={`px-2 py-0.5 rounded-md font-medium border ${
                                item.optional
                                  ? "bg-amber-50 text-amber-700 border-amber-200/70"
                                  : "bg-white text-[#1a2b3c] border-gray-200"
                              }`}
                            >
                              <strong className="text-gray-400 mr-1">{item.num}.</strong> {item.title}
                              {item.optional && <span className="ml-1 text-[9px] font-normal italic">(Optional)</span>}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            {caseAbstractFormat.map((item) => (
                              <span key={item.num} className="px-2 py-0.5 rounded-md font-medium bg-white text-[#1a2b3c] border border-gray-200">
                                <strong className="text-gray-400 mr-1">{item.num}.</strong> {item.title}
                              </span>
                            ))}
                          </div>
                          <p className="text-[10px] text-gray-500 italic">
                            * Case Description must include: History, Examination, Investigations, Diagnosis, Treatment, and Follow-up.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Abstract Upload */}
                    <div>
                      <h4 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-3 mt-6">UPLOAD ABSTRACT</h4>
                      <div className={`border-2 border-dashed ${errors.pdf ? "border-red-300 bg-[#fff5f5]" : "border-gray-200 hover:border-[#349e81] hover:bg-[#F4FAF8]"} rounded-xl p-8 text-center transition-all group relative`}>
                        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileUpload(e, 'pdf')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="pointer-events-none relative z-0 flex flex-col items-center">
                          <FileText className={`w-8 h-8 mb-2 transition-colors ${pdf ? 'text-[#349e81]' : 'text-gray-300 group-hover:text-[#349e81]'}`} />
                          {pdf ? (
                            <>
                              <h4 className="font-bold text-[#1a2b3c] mb-1 truncate max-w-[200px] text-sm">{pdf.name}</h4>
                              <p className="text-[#7a958b] text-xs">{(pdf.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                          ) : (
                            <>
                              <h4 className="font-semibold text-[#1a2b3c] mb-1 text-sm">Select Abstract Document</h4>
                              <p className="text-[#7a958b] text-xs">PDF or DOCX (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Declaration Form Upload */}
                    <div>
                      <div className="flex items-center justify-between mb-3 mt-6">
                        <h4 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase">SIGNED DECLARATION</h4>
                        <a href="/assets/forms/GHC%20Poster%20Presenter%20Declaration%20Form%201.docx" download="GHC Poster Presenter Declaration Form.docx" className="text-xs text-[#349e81] hover:underline font-semibold flex items-center gap-1 z-20 relative">
                          Download Form
                        </a>
                      </div>
                      <div className={`border-2 border-dashed ${errors.declaration ? "border-red-300 bg-[#fff5f5]" : "border-gray-200 hover:border-[#349e81] hover:bg-[#F4FAF8]"} rounded-xl p-8 text-center transition-all group relative`}>
                        <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => handleFileUpload(e, 'declaration')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="pointer-events-none relative z-0 flex flex-col items-center">
                          <FileText className={`w-8 h-8 mb-2 transition-colors ${declaration ? 'text-[#349e81]' : 'text-gray-300 group-hover:text-[#349e81]'}`} />
                          {declaration ? (
                            <>
                              <h4 className="font-bold text-[#1a2b3c] mb-1 truncate max-w-[200px] text-sm">{declaration.name}</h4>
                              <p className="text-[#7a958b] text-xs">{(declaration.size / 1024 / 1024).toFixed(2)} MB</p>
                            </>
                          ) : (
                            <>
                              <h4 className="font-semibold text-[#1a2b3c] mb-1 text-sm">Select Signed Declaration</h4>
                              <p className="text-[#7a958b] text-xs">PDF or DOCX (Max 10MB)</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}

              {/* STEP 3: CONSENT */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  <h3 className="text-[0.7rem] font-bold text-[#7a958b] tracking-wider uppercase mb-6">FINAL CONSENT</h3>

                  <div className="border border-gray-200 bg-gray-50/50 rounded-xl p-6">
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="mt-1 flex-shrink-0">
                        <div className={`w-5 h-5 rounded-[0.2rem] border flex items-center justify-center transition-colors ${form.consent ? 'bg-[#349e81] border-[#349e81] text-white' : 'border-gray-300 text-transparent group-hover:border-[#349e81]'}`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <input type="checkbox" className="hidden" checked={form.consent} onChange={(e) => updateForm("consent", e.target.checked)} />
                      </div>
                      <p className={`text-sm leading-relaxed transition-colors ${form.consent ? 'text-[#1a2b3c]' : 'text-gray-600'}`}>
                        I hereby confirm that I have verified all the details submitted by me and the Guidelines provided by GAIMS are followed and I am officially Submitting my entry for the Abstract for the Competition.
                      </p>
                    </label>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between mt-auto">
            {step === 0 ? (
              <div /> // Placeholder to push Next button to right
            ) : (
              <button onClick={prevStep} className="px-6 py-2 rounded-full border border-gray-200 text-[#7a958b] hover:text-[#1a2b3c] hover:bg-gray-50 text-sm font-semibold transition-colors">
                Back
              </button>
            )}

            {step < 3 ? (
              <button onClick={nextStep} className="px-10 py-2.5 bg-[#349e81] text-white rounded-full text-sm font-medium hover:bg-[#2b836b] transition-colors shadow-sm ml-auto">
                Next
              </button>
            ) : (
              <button onClick={submitAbstract} disabled={submissionState.status === "loading" || !form.consent} className={`px-10 py-2.5 rounded-full text-sm font-medium transition-colors shadow-sm ml-auto ${submissionState.status === "loading" || !form.consent ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-[#349e81] text-white hover:bg-[#2b836b]"}`}>
                {submissionState.status === "loading" ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
          
          {submissionState.status === "error" && (
            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 w-max max-w-[80%] text-center text-[#e04040] text-xs font-semibold">{submissionState.message}</p>
          )}

        </div>
      </div>
    </div>
  );
}
