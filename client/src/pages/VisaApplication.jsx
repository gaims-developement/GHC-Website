import React, { useState } from "react";
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
  ChevronLeft,
  Upload,
  Calendar,
  Building2,
  Globe2,
  Phone,
  Mail,
  FileText
} from "lucide-react";
import { apiUrl } from "../config/api";
import "../premium.css";

const steps = [
  { id: 1, title: "Personal Details", icon: User },
  { id: 2, title: "Passport Info", icon: Book },
  { id: 3, title: "Professional", icon: BriefcaseMedical },
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
      />
    );
  }

  return (
    <div className="space-y-2 font-['DM_Sans']">
      <label className="text-sm font-bold text-white/90 uppercase tracking-wider ml-1 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-blue-400" />} {label} {required && <span className="text-[#ff3d7f]">*</span>}
      </label>
      <input
        type={type}
        value={form[field]}
        onChange={(e) => updateForm(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[#051329] border ${errors[field] ? 'border-red-500/50 focus:border-red-500' : 'border-blue-500/20 focus:border-blue-400'} rounded-2xl px-5 py-4 text-white placeholder-white/20 transition-all outline-none focus:ring-4 ${errors[field] ? 'focus:ring-red-500/10' : 'focus:ring-blue-500/10'}`}
      />
      {errors[field] && <p className="text-red-400 text-sm ml-2 font-medium">{errors[field]}</p>}
    </div>
  );
};

const VisaApplication = () => {
  const [currentStep, setCurrentStep] = useState(1);
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

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <div className="min-h-screen bg-[#081B33] flex items-center justify-center p-6 font-['Syne']">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#0A2240] p-10 md:p-16 rounded-[3rem] text-center max-w-2xl border border-blue-500/20 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f]" />
          <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Application Submitted</h2>
          <p className="text-xl text-white/80 leading-relaxed font-['DM_Sans'] mb-4">{submissionState.message}</p>
          
          <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl mb-8">
            <p className="text-white/90 font-['DM_Sans'] font-medium">
              Your application is under review. Once approved by our team, your Visa Invitation Letter will be generated and automatically sent to your registered email address.
            </p>
          </div>
          
          <a href="/" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#081B33] rounded-full font-extrabold hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10">
            Back to Homepage
          </a>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#081B33] pt-28 pb-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
      
      <div className="container mx-auto px-4 max-w-4xl relative z-10">
        <div className="text-center mb-12">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold text-sm mb-6 uppercase tracking-widest font-['DM_Sans']">
            <PlaneTakeoff className="w-4 h-4" /> Visa Services
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 mb-4 font-['Syne'] tracking-tight">Visa Invitation Letter</h1>
          <p className="text-xl text-white/60 font-medium font-['DM_Sans'] max-w-2xl mx-auto">International participants requiring a visa invitation letter may submit their details through this form.</p>
        </div>

        <div className="mb-12">
          <div className="flex justify-between items-center relative z-10 px-4 md:px-8">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/5 -z-10 rounded-full" />
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] -z-10 rounded-full transition-all duration-500 ease-out" 
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isPast = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 font-bold text-lg shadow-xl ${isActive ? 'bg-gradient-to-br from-[#ff6b9d] to-[#ff3d7f] text-white scale-110 shadow-[#ff3d7f]/30' : isPast ? 'bg-[#ff3d7f]/20 text-[#ff3d7f] border border-[#ff3d7f]/30' : 'bg-[#051329] text-white/30 border border-white/5'}`}>
                    {isPast ? <CheckCircle2 className="w-6 h-6 md:w-7 md:h-7" /> : <Icon className="w-6 h-6 md:w-7 md:h-7" />}
                  </div>
                  <span className={`text-xs md:text-sm font-bold uppercase tracking-wider hidden md:block ${isActive ? 'text-[#ff3d7f]' : isPast ? 'text-white/80' : 'text-white/30'}`}>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-[#0A2240] p-8 md:p-12 rounded-[2rem] md:rounded-[3rem] border border-blue-500/20 shadow-2xl relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="font-['DM_Sans']"
            >
              {currentStep === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white font-['Syne']">Section A: Personal Details</h2>
                    <p className="text-white/50 text-sm mt-2">Please enter your information exactly as it appears on your passport.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Full Name" field="full_name" icon={User} required placeholder="As on passport" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Date of Birth" field="date_of_birth" type="date" icon={Calendar} required />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/90 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-400" /> Gender
                      </label>
                      <select
                        value={form.gender}
                        onChange={(e) => updateForm("gender", e.target.value)}
                        className="w-full bg-[#051329] border border-blue-500/20 rounded-2xl px-5 py-4 text-white appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <InputField form={form} updateForm={updateForm} errors={errors} label="Nationality" field="nationality" icon={Globe2} required placeholder="e.g. British" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Email Address" field="email" type="email" icon={Mail} required placeholder="your@email.com" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="WhatsApp / Mobile Number" field="mobile" icon={Phone} required placeholder="+44 7700 900077" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white font-['Syne']">Section B: Passport Details</h2>
                    <p className="text-white/50 text-sm mt-2">Information required for processing your visa invitation.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Number" field="passport_number" icon={Book} required placeholder="e.g. A1234567" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Issuing Country" field="passport_issuing_country" icon={Globe2} placeholder="e.g. United Kingdom" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Issue Date" field="passport_issue_date" type="date" icon={Calendar} />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Passport Expiry Date" field="passport_expiry_date" type="date" icon={Calendar} required />
                  </div>
                  <div className="mt-8 space-y-4">
                    <label className="text-sm font-bold text-white/90 uppercase tracking-wider flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-400" /> Upload Passport Copy <span className="text-[#ff3d7f]">*</span>
                    </label>
                    <label className={`block w-full border-2 border-dashed ${errors.passport_document ? 'border-red-500/50 bg-red-500/5' : passportDocument ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60 hover:bg-blue-500/10'} rounded-[2rem] p-10 cursor-pointer transition-all text-center group`}>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                      <div className="flex flex-col items-center justify-center gap-4">
                        <div className={`p-4 rounded-full ${passportDocument ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform'}`}>
                          {passportDocument ? <CheckCircle2 className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className={`font-bold text-lg mb-1 ${passportDocument ? 'text-emerald-400' : 'text-white'}`}>
                            {passportDocument ? passportDocument.name : 'Click or drag to upload'}
                          </p>
                          <p className="text-white/40 text-sm">PDF, JPG or PNG (Max. 5MB)</p>
                        </div>
                      </div>
                    </label>
                    {errors.passport_document && <p className="text-red-400 text-sm font-medium text-center">{errors.passport_document}</p>}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white font-['Syne']">Section C & D: Professional & GHC Participation</h2>
                    <p className="text-white/50 text-sm mt-2">Details about your organisation and GHC registration.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Organisation / Institution" field="organisation" icon={Building2} required placeholder="e.g. WHO" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Designation" field="designation" icon={User} placeholder="e.g. Chief Medical Officer" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Medical College / Hospital" field="medical_college_hospital" icon={Building2} placeholder="Optional" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Country of Residence" field="country_of_residence" icon={Globe2} placeholder="e.g. Switzerland" />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="GHC Registration ID" field="ghc_registration_id" icon={FileText} required placeholder="e.g. GHC-2026-102" />
                    
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-white/90 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <BriefcaseMedical className="w-4 h-4 text-blue-400" /> Participant Category <span className="text-[#ff3d7f]">*</span>
                      </label>
                      <select
                        value={form.participant_category}
                        onChange={(e) => updateForm("participant_category", e.target.value)}
                        className="w-full bg-[#051329] border border-blue-500/20 rounded-2xl px-5 py-4 text-white appearance-none outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 transition-all"
                      >
                        <option value="Delegate">Delegate</option>
                        <option value="Speaker">Speaker</option>
                        <option value="Research Presenter">Research Presenter</option>
                        <option value="Workshop Participant">Workshop Participant</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    {form.participant_category === "Other" && (
                      <InputField form={form} updateForm={updateForm} errors={errors} label="Specify Category" field="participant_category_other" required placeholder="Please specify" />
                    )}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-3xl font-extrabold text-white font-['Syne']">Section E: Travel Details & Declaration</h2>
                    <p className="text-white/50 text-sm mt-2">Final details and confirmation.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Arrival Date in India" field="arrival_date" type="date" icon={Calendar} required />
                    <InputField form={form} updateForm={updateForm} errors={errors} label="Departure Date from India" field="departure_date" type="date" icon={Calendar} required />
                    
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <label className="text-sm font-bold text-white/90 uppercase tracking-wider ml-1 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-400" /> Accommodation Details
                      </label>
                      <textarea
                        value={form.accommodation_details}
                        onChange={(e) => updateForm("accommodation_details", e.target.value)}
                        placeholder="Hotel name, address, etc."
                        rows="2"
                        className="w-full bg-[#051329] border border-blue-500/20 rounded-2xl px-5 py-4 text-white placeholder-white/20 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                    <label className={`flex items-start gap-5 p-6 rounded-3xl border-2 transition-all cursor-pointer ${form.declaration_accepted ? 'bg-[#ff3d7f]/10 border-[#ff3d7f]/50' : 'bg-[#051329] border-blue-500/20 hover:border-blue-500/40'}`}>
                      <div className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors mt-1 ${form.declaration_accepted ? 'bg-[#ff3d7f] border-[#ff3d7f]' : 'border-white/30'}`}>
                        {form.declaration_accepted && <CheckCircle2 className="w-5 h-5 text-white" />}
                        <input type="checkbox" className="hidden" checked={form.declaration_accepted} onChange={(e) => updateForm("declaration_accepted", e.target.checked)} />
                      </div>
                      <p className={`text-lg leading-relaxed transition-colors ${form.declaration_accepted ? 'text-white' : 'text-white/70'}`}>
                        I confirm that the information provided by me is accurate and that the details submitted may be used for processing my visa invitation letter.
                      </p>
                    </label>
                    {errors.declaration_accepted && <p className="text-red-400 mt-4 font-semibold text-sm ml-14">{errors.declaration_accepted}</p>}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between font-['Syne']">
            {currentStep > 1 ? (
              <button onClick={prevStep} className="flex items-center gap-2 px-6 py-4 rounded-full font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all">
                <ChevronLeft className="w-5 h-5" /> Back
              </button>
            ) : <div />}

            {currentStep < steps.length ? (
              <button onClick={nextStep} className="flex items-center gap-2 px-10 py-4 bg-white text-[#081B33] rounded-full font-extrabold hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-white/10">
                Continue <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={submitApplication} disabled={submissionState.status === "loading" || !form.declaration_accepted} className={`flex items-center gap-2 px-10 py-4 rounded-full font-extrabold transition-all shadow-lg ${submissionState.status === "loading" || !form.declaration_accepted ? "bg-white/20 text-white/30 cursor-not-allowed" : "bg-gradient-to-r from-[#ff6b9d] to-[#ff3d7f] text-white hover:scale-105 active:scale-95 shadow-[#ff3d7f]/20"}`}>
                {submissionState.status === "loading" ? "Submitting..." : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisaApplication;
