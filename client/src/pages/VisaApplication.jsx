import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DatePicker from "../components/DatePicker";
import axios from "axios";
import { 
  PlaneTakeoff, 
  User, 
  Book, 
  BriefcaseMedical, 
  CheckCircle2, 
  ChevronRight, 
  Upload, 
  Calendar, 
  Building2, 
  Globe2, 
  Phone, 
  Mail, 
  FileText, 
  Check, 
  MapPin, 
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { apiUrl } from "../config/api";

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Passport Info", icon: Book },
  { id: 3, title: "Professional Details", icon: BriefcaseMedical },
  { id: 4, title: "Travel & Consent", icon: PlaneTakeoff },
];

const InputField = ({ label, field, type = "text", icon: Icon, placeholder, required, form, updateForm, errors }) => {
  if (type === "date") {
    return (
      <DatePicker
        label={label}
        field={field}
        value={form[field]}
        onChange={updateForm}
        required={required}
        error={errors[field]}
        placeholder="Select date"
      />
    );
  }

  return (
    <div className="space-y-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
      <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-[#6C4AB6]" />} {label} {required && <span className="text-[#e244b7]">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => updateForm(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border ${errors[field] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 transition-all outline-none focus:ring-2 shadow-sm text-sm`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      {errors[field] && <p className="text-red-500 text-sm mt-1 font-medium">{errors[field]}</p>}
    </div>
  );
};

const VisaApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const formTopRef = useRef(null);

  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    nationality: "",
    email: "",
    mobile: "",
    passport_number: "",
    passport_issue_date: "",
    passport_expiry_date: "",
    passport_issuing_country: "",
    organisation: "",
    designation: "",
    medical_college_hospital: "",
    country_of_residence: "",
    ghc_registration_id: "",
    participant_category: "Delegate",
    participant_category_other: "",
    arrival_date: "",
    departure_date: "",
    accommodation_details: "",
    purpose_of_visit: "Participation in the Global Health Conclave (GHC)",
    declaration_accepted: false,
  });
  
  const [passportDocument, setPassportDocument] = useState(null);
  const [errors, setErrors] = useState({});
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "" });

  useEffect(() => {
    document.body.classList.add('redesign-active');
    document.documentElement.classList.add('redesign-active');
    return () => {
      document.body.classList.remove('redesign-active');
      document.documentElement.classList.remove('redesign-active');
    };
  }, []);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, passport_document: "File size must be under 5MB" }));
        return;
      }
      setPassportDocument(file);
      setErrors(prev => ({ ...prev, passport_document: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!form.full_name) newErrors.full_name = "Full Name is required";
      if (!form.date_of_birth) newErrors.date_of_birth = "Date of Birth is required";
      if (!form.nationality) newErrors.nationality = "Nationality is required";
      if (!form.email || !/^\S+@\S+\.\S+$/.test(form.email)) newErrors.email = "Valid Email is required";
      if (!form.mobile) newErrors.mobile = "Mobile Number is required";
    }
    if (step === 2) {
      if (!form.passport_number) newErrors.passport_number = "Passport Number is required";
      if (!form.passport_expiry_date) newErrors.passport_expiry_date = "Passport Expiry Date is required";
      if (!passportDocument) newErrors.passport_document = "Passport copy is required";
    }
    if (step === 3) {
      if (!form.organisation) newErrors.organisation = "Organisation is required";
      if (!form.ghc_registration_id) newErrors.ghc_registration_id = "GHC Registration ID is required";
      if (form.participant_category === "Other" && !form.participant_category_other) {
        newErrors.participant_category_other = "Please specify your category";
      }
    }
    if (step === 4) {
      if (!form.arrival_date) newErrors.arrival_date = "Arrival Date is required";
      if (!form.departure_date) newErrors.departure_date = "Departure Date is required";
      if (form.arrival_date && form.departure_date && form.departure_date < form.arrival_date) {
        newErrors.departure_date = "Departure date must be after arrival date";
      }
      if (!form.declaration_accepted) newErrors.declaration_accepted = "You must accept the declaration to submit";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const scrollToFormTop = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      scrollToFormTop();
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    scrollToFormTop();
  };

  const submitApplication = async () => {
    if (!validateStep(4)) return;
    
    setSubmissionState({ status: "loading", message: "Submitting application..." });

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      data.append(key, value);
    });
    if (passportDocument) {
      data.append("passport_document", passportDocument);
    }

    try {
      await axios.post(apiUrl("/api/visa-applications"), data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmissionState({ status: "success", message: "Your visa invitation letter application has been submitted successfully." });
    } catch (error) {
      setSubmissionState({ status: "error", message: error.response?.data?.message || "Unable to submit application. Please try again." });
    }
  };

  if (submissionState.status === "success") {
    return (
      <div className="bg-white min-h-screen font-['Outfit'] text-[#101828] py-20 px-4">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center"
        >
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] mb-3">
            Application Submitted
          </h2>
          <p className="text-[#475467] text-base mb-6 leading-relaxed">
            {submissionState.message}
          </p>

          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-6 text-left shadow-sm mb-8 space-y-3">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Applicant</span>
              <strong className="text-sm font-semibold text-[#101828]">{form.full_name}</strong>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">Nationality</span>
              <span className="text-sm font-semibold text-slate-800">{form.nationality}</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200">
              <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">GHC Registration ID</span>
              <strong className="text-sm font-mono text-[#6C4AB6]">{form.ghc_registration_id}</strong>
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
                Under Review
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
            Your application is under review by the GHC International Delegation Desk. Once approved, your official Visa Facilitation & Invitation Letter will be issued and emailed to <strong className="text-slate-700">{form.email}</strong>.
          </p>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#6C4AB6]/25 hover:opacity-95 transition-all shadow-md"
          >
            Return to Conclave Homepage
          </a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-['Outfit'] text-[#101828]">
      {/* Top spacing matching Nominations */}
      <div className="h-28 md:h-32" />

      {/* Back to Home link */}
      <div className="max-w-5xl mx-auto px-6 pt-2">
        <a href="/" className="inline-flex items-center gap-2 text-[#475467] hover:text-[#101828] font-medium text-sm transition-colors">
          <ArrowLeft className="w-4 h-4 text-[#6C4AB6]" /> Back to Home
        </a>
      </div>

      {/* Hero Section */}
      <section className="relative px-6 py-10 md:py-14 overflow-hidden text-center max-w-5xl mx-auto bg-white">
        <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e244b7]/10 border border-[#e244b7]/25 text-[#e244b7] text-xs font-bold tracking-widest uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <PlaneTakeoff className="w-4 h-4 text-[#e244b7]" /> Visa Services
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6C4AB6]/10 border border-[#6C4AB6]/25 text-[#6C4AB6] text-xs font-bold tracking-wider uppercase"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            <MapPin className="w-3.5 h-3.5 text-[#6C4AB6]" /> Venue: New Delhi
          </motion.div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#101828] mb-6 leading-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Visa Invitation <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]">Letter</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-base sm:text-lg text-[#475467] max-w-2xl mx-auto mb-6 leading-relaxed"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          International delegates, faculty, and research presenters requiring an official Indian visa facilitation letter may submit their details below.
        </motion.p>
      </section>

      {/* Main Form Container */}
      <div ref={formTopRef} className="max-w-4xl mx-auto px-4 pb-24 scroll-mt-24">
        
        {/* Progress Indicator - EXACTLY like Nominations */}
        <div className="mb-10 sticky top-24 z-40 bg-white/95 backdrop-blur-md py-4 border-b border-gray-100" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#475467] mb-2.5">
            <span className="text-[#6C4AB6] font-bold">Step {currentStep} of {steps.length} — {steps[currentStep - 1].title}</span>
            <span>{Math.min(100, Math.round((currentStep / steps.length) * 100))}% Completed</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, (currentStep / steps.length) * 100)}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Main Form Card */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-['Outfit']"
            >
              {/* STEP 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]" style={{ fontFamily: "'Outfit', sans-serif" }}>Personal Details</h2>
                      <p className="text-sm text-[#475467]" style={{ fontFamily: "'Inter', sans-serif" }}>Please enter your identity details exactly as they appear on your passport.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Full Name" field="full_name" icon={User} required placeholder="As shown on passport" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Date of Birth" field="date_of_birth" type="date" icon={Calendar} required />
                    
                    <div className="space-y-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#6C4AB6]" /> Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => updateForm("gender", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm transition-all text-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <InputField form={form} updateForm={updateForm} errors={errors} label="Nationality" field="nationality" icon={Globe2} required placeholder="e.g. British, American, German" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Email Address" field="email" type="email" icon={Mail} required placeholder="your.name@institution.org" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="WhatsApp / Mobile Number" field="mobile" icon={Phone} required placeholder="+44 7700 900077" />
                  </div>
                </div>
              )}

              {/* STEP 2: Passport Info */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                      <Book className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]" style={{ fontFamily: "'Outfit', sans-serif" }}>Passport & Travel Document Details</h2>
                      <p className="text-sm text-[#475467]" style={{ fontFamily: "'Inter', sans-serif" }}>Official passport information required for consular facilitation letter issuance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Number" field="passport_number" icon={Book} required placeholder="e.g. A1234567" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Issuing Country" field="passport_issuing_country" icon={Globe2} placeholder="e.g. United Kingdom" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Issue Date" field="passport_issue_date" type="date" icon={Calendar} />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Expiry Date" field="passport_expiry_date" type="date" icon={Calendar} required />
                  </div>

                  <div className="mt-8 space-y-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#6C4AB6]" /> Upload Passport Copy (Bio Page) <span className="text-[#e244b7]">*</span>
                    </label>
                    <div className={`border-2 border-dashed ${errors.passport_document ? 'border-red-400 bg-red-50/30' : passportDocument ? 'border-emerald-400 bg-emerald-50/30' : 'border-gray-300 hover:border-[#6C4AB6] bg-gray-50/50 hover:bg-[#6C4AB6]/5'} rounded-2xl p-8 text-center transition-all group relative shadow-sm cursor-pointer`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="pointer-events-none flex flex-col items-center justify-center gap-3">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${passportDocument ? 'bg-emerald-100 text-emerald-700' : 'bg-[#6C4AB6]/10 text-[#6C4AB6] group-hover:scale-105'}`}>
                          {passportDocument ? <CheckCircle2 className="w-7 h-7" /> : <Upload className="w-7 h-7" />}
                        </div>
                        <div>
                          <p className={`font-bold text-base mb-1 ${passportDocument ? 'text-emerald-800' : 'text-[#101828]'}`}>
                            {passportDocument ? passportDocument.name : 'Click or drag to upload passport copy'}
                          </p>
                          <p className="text-gray-400 text-xs">PDF, JPG, JPEG or PNG (Max. 5MB)</p>
                        </div>
                        {passportDocument && (
                          <span className="text-xs font-bold text-[#6C4AB6] hover:underline">Change File</span>
                        )}
                      </div>
                    </div>
                    {errors.passport_document && <p className="text-red-500 text-sm mt-1 font-medium">{errors.passport_document}</p>}
                  </div>
                </div>
              )}

              {/* STEP 3: Professional Details */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                      <BriefcaseMedical className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]" style={{ fontFamily: "'Outfit', sans-serif" }}>Professional & Participation Details</h2>
                      <p className="text-sm text-[#475467]" style={{ fontFamily: "'Inter', sans-serif" }}>Details about your institutional affiliation and GHC registration confirmation.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Organisation / Institution" field="organisation" icon={Building2} required placeholder="e.g. World Health Organization" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Designation" field="designation" icon={User} placeholder="e.g. Professor / Medical Officer" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Medical College / Hospital" field="medical_college_hospital" icon={Building2} placeholder="Optional" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Country of Residence" field="country_of_residence" icon={Globe2} placeholder="e.g. United Kingdom" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="GHC Registration ID" field="ghc_registration_id" icon={FileText} required placeholder="e.g. GHC-2026-102" />
                    
                    <div className="space-y-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
                        <BriefcaseMedical className="w-4 h-4 text-[#6C4AB6]" /> Participant Category <span className="text-[#e244b7]">*</span>
                      </label>
                      <select
                        value={form.participant_category}
                        onChange={(e) => updateForm("participant_category", e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm transition-all text-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      >
                        <option value="Delegate">Delegate</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Research Presenter">Research Presenter</option>
                        <option value="Workshop Participant">Workshop Participant</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {form.participant_category === "Other" && (
                      <InputField form={form} updateForm={updateForm} errors={errors} label="Specify Category" field="participant_category_other" required placeholder="Please specify your participation category" />
                    )}
                  </div>
                </div>
              )}

              {/* STEP 4: Travel & Consent */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                      <PlaneTakeoff className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]" style={{ fontFamily: "'Outfit', sans-serif" }}>Travel Details & Declaration</h2>
                      <p className="text-sm text-[#475467]" style={{ fontFamily: "'Inter', sans-serif" }}>Provide your itinerary dates and accept the official invitation declaration.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Arrival Date in India" field="arrival_date" type="date" icon={Calendar} required />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Departure Date from India" field="departure_date" type="date" icon={Calendar} required />
                    
                    <div className="col-span-1 md:col-span-2 space-y-1.5" style={{ fontFamily: "'Inter', sans-serif" }}>
                      <label className="block text-sm font-semibold text-[#344054] mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#6C4AB6]" /> Accommodation Details in India
                      </label>
                      <textarea
                        value={form.accommodation_details}
                        onChange={(e) => updateForm("accommodation_details", e.target.value)}
                        placeholder="Hotel name, booked stay address, or host details in New Delhi..."
                        rows="3"
                        className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:border-[#6C4AB6] focus:ring-2 focus:ring-[#6C4AB6]/20 shadow-sm transition-all text-sm"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-gray-200" style={{ fontFamily: "'Inter', sans-serif" }}>
                    <label className={`flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer ${form.declaration_accepted ? 'bg-[#6C4AB6]/5 border-[#6C4AB6] shadow-sm' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'}`}>
                      <div className={`w-6 h-6 shrink-0 rounded-lg border-2 flex items-center justify-center transition-colors mt-0.5 ${form.declaration_accepted ? 'bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] border-transparent' : 'border-gray-300 bg-white'}`}>
                        {form.declaration_accepted && <Check className="w-4 h-4 text-white" />}
                        <input type="checkbox" className="hidden" checked={form.declaration_accepted} onChange={(e) => updateForm("declaration_accepted", e.target.checked)} />
                      </div>
                      <p className={`text-sm leading-relaxed ${form.declaration_accepted ? 'text-[#101828] font-medium' : 'text-[#475467]'}`}>
                        I confirm that the information provided is accurate and authentic. I understand that the GHC Organising Secretariat will issue an official Visa Facilitation & Invitation Letter solely for the purpose of attending the Global Health Conclave in New Delhi.
                      </p>
                    </label>
                    {errors.declaration_accepted && <p className="text-red-500 mt-2 font-semibold text-sm ml-1">{errors.declaration_accepted}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Submission Error Banner */}
          {submissionState.status === "error" && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submissionState.message}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-[#475467] font-semibold text-sm hover:bg-gray-50 hover:text-[#101828] transition-colors"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                <ArrowLeft className="w-4 h-4" /> Previous Step
              </button>
            ) : <div />}

            {currentStep < steps.length ? (
              <button
                type="button"
                onClick={nextStep}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#6C4AB6]/25 hover:opacity-95 transition-all shadow-md active:scale-95"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitApplication}
                disabled={submissionState.status === "loading" || !form.declaration_accepted}
                className={`inline-flex items-center gap-2 px-9 py-3.5 rounded-full font-bold text-sm transition-all shadow-md ${
                  submissionState.status === "loading" || !form.declaration_accepted
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white hover:shadow-lg hover:shadow-[#6C4AB6]/25 hover:opacity-95 active:scale-95"
                }`}
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {submissionState.status === "loading" ? "Submitting Application..." : "Submit Visa Application"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VisaApplication;
