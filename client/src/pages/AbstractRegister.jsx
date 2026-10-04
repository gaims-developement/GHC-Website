import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Upload,
  User,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Microscope,
  Stethoscope,
  Download,
  Phone,
  Mail,
  BadgeCheck,
  MapPin,
  Calendar,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
} from "lucide-react";
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
  state: "",
  stateId: null,
  city: "",
  cityId: null,
  country: "India",
  countryId: 101,
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

const submissionGuidelinesData = [
  {
    num: "01",
    title: "Original and Unpublished Work",
    points: [
      "Only original and unpublished work will be accepted.",
      "The submitted abstract must not have been previously published or presented elsewhere.",
      "All submissions must comply with the prescribed originality, plagiarism, and AI-use requirements."
    ]
  },
  {
    num: "02",
    title: "Submission Timeline",
    points: [
      "Initial Abstract Submission Deadline: 22 October 2026.",
      "The submission deadline may be extended until 31 October 2026, subject to an official announcement.",
      "Abstract screening will begin on a rolling basis from approximately 10–15 October 2026 rather than waiting until the final submission deadline.",
      "Registration, screening, and acceptance/rejection communication will take place in parallel on a rolling basis to avoid a concentration of submissions near the deadline."
    ]
  },
  {
    num: "03",
    title: "Revision Deadlines",
    points: [
      "31 October 2026: Deadline for revised submissions where the original abstract was submitted on or before 22 October 2026.",
      "5 November 2026: Deadline for revised submissions where the original abstract was submitted between 23 and 31 October 2026, if the submission deadline has officially been extended.",
      "Only the revision specifically requested by the Scientific Committee should be submitted within the applicable revision deadline."
    ]
  },
  {
    num: "04",
    title: "Multiple Submission Policy & Presenting Author Restriction",
    points: [
      "Multiple submissions will be permitted only sequentially.",
      "An applicant may have only one active abstract submission at a time.",
      "A second abstract may be submitted only if the applicant's first abstract has been outrightly rejected.",
      "The second submission must be made within the applicable abstract submission deadline (22 October 2026, or the officially announced extended deadline, if applicable).",
      "Participants must not submit two different abstracts simultaneously while the first submission is still under review.",
      "If two submissions are made simultaneously, the second submission will be flagged and will not be reviewed until the eligibility conditions are satisfied.",
      "Each eligible submission receives its own unique submission ID and review status.",
      "Presenting Author Restriction: A participant may be the presenting author for only one accepted poster. A participant may be listed as a co-author on other abstracts or posters but cannot serve as the presenting author for more than one presentation."
    ]
  },
  {
    num: "05",
    title: "Abstract Submission Format",
    points: [
      "File format: DOCX only (Maximum file size: 10 MB).",
      "Font: Times New Roman, Font size: 12.",
      "Word count: 350–400 words (Tables, legends, and references are excluded from the abstract word count).",
      "Abstracts may include relevant tables and references.",
      "All information and data entered in the submission must be accurate and verified."
    ]
  },
  {
    num: "06",
    title: "Plagiarism and AI Usage",
    points: [
      "Plagiarism screening threshold: Less than 20%.",
      "AI-detection score: Less than 30%.",
      "These thresholds are intended for preliminary screening and do not override the requirement that the submitted work must be original.",
      "Use of artificial intelligence tools must comply with applicable JAMA policies and guidelines concerning the use and disclosure of AI in medical writing and publishing.",
      "Authors remain responsible for the accuracy, originality, scientific integrity, references, analysis, and content of their submission."
    ]
  },
  {
    num: "07",
    title: "Screening and Acceptance",
    points: [
      "Abstracts will be evaluated on a rolling basis, beginning approximately 10–15 October 2026.",
      "The Scientific Committee should not wait until the final submission deadline before beginning evaluation.",
      "Participants may receive: Accepted → Revision Required → Rejected decisions while the submission window remains open.",
      "Acceptance, revision, and rejection communication will also be sent on a rolling basis."
    ]
  },
  {
    num: "08",
    title: "Waitlist / Standby Policy",
    points: [
      "There will generally be no formal waitlist.",
      "However, if the number of high-quality accepted abstracts exceeds available presentation slots, additional eligible abstracts may be placed on a standby list.",
      "If an accepted presenting author subsequently withdraws, an eligible standby participant may be offered the vacant presentation slot.",
      "Placement on the standby list does not guarantee a presentation opportunity."
    ]
  },
  {
    num: "09",
    title: "Poster Specifications",
    points: [
      "Orientation: Portrait.",
      "Size: 36 inches × 48 inches.",
      "Posters must follow the official template and formatting requirements provided by the organizers."
    ]
  },
  {
    num: "10",
    title: "Author and Affiliation Format",
    points: [
      "Display Format: Author Name¹, Author Name²",
      "¹Department, Institution/Affiliation, State, Country",
      "²Department, Institution/Affiliation, State, Country",
      "Superscript numbers must associate each author with their appropriate department and institutional affiliation."
    ]
  },
  {
    num: "11",
    title: "Poster Formatting",
    points: [
      "Main poster content font size: more than 30 pt.",
      "Introduction or major section headings font size: more than 50 pt.",
      "Presenting author's email address and LinkedIn ID must be included.",
      "Relevant graphs, figures, photographs, tables, charts, and visual material should be incorporated.",
      "Posters must remain readable, visually clear, and scientifically structured."
    ]
  },
  {
    num: "12",
    title: "Research Poster Structure",
    points: [
      "Sections: Title, Authors & Affiliations, Introduction, Objectives (where applicable), Methodology, Results, Conclusion, References (where applicable), Relevant graphs/tables.",
      "Presenters must use the official Research Poster Template provided by the organizers."
    ]
  },
  {
    num: "13",
    title: "Case Poster Structure",
    points: [
      "Sections: Title, Authors & Affiliations, Introduction, Case Report / Case Presentation, Investigations (where applicable), Treatment / Management, Follow-up / Outcome, Discussion, Conclusion (where applicable), References, Clinical images.",
      "Presenters must use the official Case Poster Template provided by the organizers."
    ]
  },
  {
    num: "14",
    title: "Presentation, Certificate and Cash Prize",
    points: [
      "Only the officially designated presenting author may present the poster.",
      "An individual may serve as the presenting author for only one poster (though may be listed as a co-author on other submissions).",
      "The Certificate of Presentation will be issued only to the presenting author.",
      "Any applicable cash prize will also be awarded only to the presenting author.",
      "Co-authorship alone does not create eligibility for a presentation certificate or cash prize."
    ]
  },
  {
    num: "15",
    title: "Responsibility of Authors",
    points: [
      "Submission of an abstract confirms that the authors: have verified the accuracy of the submitted information; take responsibility for the originality and scientific integrity of the work; have obtained appropriate permissions or approvals wherever required; have complied with submission, plagiarism, AI-use, authorship, and presentation policies; and agree to follow the decisions and timelines communicated by the Scientific Committee."
    ]
  }
];

const defaultCountries = [
  { id: 101, name: "India" },
  { id: 233, name: "United States" },
  { id: 232, name: "United Kingdom" },
  { id: 13, name: "Australia" },
  { id: 38, name: "Canada" },
  { id: 229, name: "United Arab Emirates" },
  { id: 199, name: "Singapore" },
  { id: 156, name: "Nepal" },
  { id: 167, name: "Pakistan" },
  { id: 18, name: "Bangladesh" },
  { id: 206, name: "Sri Lanka" },
  { id: 82, name: "Germany" },
  { id: 75, name: "France" },
  { id: 132, name: "Malaysia" },
  { id: 191, name: "Saudi Arabia" },
  { id: 169, name: "Philippines" },
  { id: 162, name: "Nigeria" },
  { id: 113, name: "Kenya" },
  { id: 204, name: "South Africa" }
];

export default function AbstractRegister() {
  const [form, setForm] = useState(initialForm);
  const [pdf, setPdf] = useState(null);
  const [declaration, setDeclaration] = useState(null);
  const [step, setStep] = useState(0);
  const [submissionState, setSubmissionState] = useState({ status: "idle", message: "", data: null });
  const [errors, setErrors] = useState({});
  const [isCallsOpen, setIsCallsOpen] = useState(true);
  const [abstractWhatsapp, setAbstractWhatsapp] = useState({ url: "", text: "" });
  const [expandedGuidelines, setExpandedGuidelines] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const formTopRef = useRef(null);

  // Location Data States
  const [countriesList, setCountriesList] = useState(defaultCountries);
  const [statesList, setStatesList] = useState([]);
  const [citiesList, setCitiesList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef(null);

  const scrollToFormTop = () => {
    if (formTopRef.current) {
      formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    axios.get(apiUrl("/api/settings/public"))
      .then(res => {
        if (res.data?.registration?.abstractSubmissionOpen !== undefined) {
          setIsCallsOpen(res.data.registration.abstractSubmissionOpen);
        } else {
          setIsCallsOpen(true);
        }
        setAbstractWhatsapp({
          url: res.data?.registration?.abstractWhatsappGroupUrl || "",
          text: res.data?.registration?.abstractWhatsappGroupText || "",
        });
      })
      .catch(err => {
        console.error("Failed to load public settings:", err);
        setIsCallsOpen(true);
      });
  }, []);

  useEffect(() => {
    axios.get(apiUrl("/api/locations/countries"))
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          setCountriesList(res.data);
        }
      })
      .catch(err => console.error("Failed to load countries:", err));
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (form.countryId) {
      setStatesList([]);
      setForm(curr => ({ ...curr, state: "", stateId: null, city: "", cityId: null }));
      axios.get(apiUrl(`/api/locations/states/${form.countryId}`))
        .then(res => setStatesList(Array.isArray(res.data) ? res.data : []))
        .catch(err => console.error("Failed to load states:", err));
    }
  }, [form.countryId]);

  // Search cities
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
      setErrors((curr) => ({ ...curr, [type]: "Please upload a valid DOCX or PDF file" }));
    }
  };

  const validateStep = (currentStep) => {
    const newErrors = {};
    if (currentStep === 1) {
      if (!form.name.trim()) newErrors.name = "Full Name is required";
      if (!form.specialty.trim()) newErrors.specialty = "Specialty is required";
      if (!form.yearOfStudy.trim()) newErrors.yearOfStudy = "Year of study is required";
      if (!form.college.trim()) newErrors.college = "College / Hospital name is required";
      if (!form.country.trim()) newErrors.country = "Country is required";
      if (!form.state.trim()) newErrors.state = "State is required";
      if (!form.city.trim()) newErrors.city = "City is required";
      if (!form.phone.trim()) newErrors.phone = "Phone number is required";
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = "A valid email is required";
    }
    if (currentStep === 2) {
      if (!form.title.trim()) newErrors.title = "Abstract title is required";
      if (!pdf) newErrors.pdf = "Please upload your abstract document (DOCX or PDF)";
      if (!declaration) newErrors.declaration = "Please upload your signed declaration form";
    }
    if (currentStep === 3) {
      if (!form.consent) newErrors.consent = "You must confirm that you have verified all details and follow the GHC guidelines";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 0 || validateStep(step)) {
      setStep((curr) => Math.min(curr + 1, 3));
      scrollToFormTop();
    }
  };

  const prevStep = () => {
    setStep((curr) => Math.max(curr - 1, 0));
    scrollToFormTop();
  };

  const submitAbstract = async () => {
    if (!validateStep(3)) return;
    
    setSubmissionState({ status: "loading", message: "Submitting abstract...", data: null });

    const data = new FormData();
    data.append("name", form.name);
    data.append("track", form.category);
    data.append("specialty", form.specialty);
    data.append("year_of_study", form.yearOfStudy);
    data.append("college", form.college);
    data.append("city_state", `${form.city}, ${form.state}`);
    data.append("country", form.country);
    if (form.countryId) data.append("country_id", form.countryId);
    if (form.stateId) data.append("state_id", form.stateId);
    if (form.cityId) data.append("city_id", form.cityId);
    data.append("phone", form.phone);
    data.append("email", form.email);
    data.append("title", form.title);
    data.append("category", form.subCategory === "Research abstract" ? "research_paper" : "case_report");
    
    if (pdf) data.append("pdf", pdf);
    if (declaration) data.append("declaration", declaration);

    try {
      const res = await axios.post(apiUrl("/api/research/submit"), data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSubmissionState({
        status: "success",
        message: "Your abstract and declaration have been submitted successfully. The Scientific Committee will review your submission on a rolling basis.",
        data: res.data?.submission || null
      });
      scrollToFormTop();
    } catch (error) {
      setSubmissionState({
        status: "error",
        message: error.response?.data?.message || "Unable to submit abstract. Please verify all details and try again.",
        data: null
      });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // SUCCESS STATE
  if (submissionState.status === "success") {
    const submissionId = submissionState.data?.abstractId || (submissionState.data?.id ? `GHC-ABS-${String(submissionState.data.id).padStart(5, '0')}` : null);

    return (
      <div className="bg-white min-h-screen font-['Outfit'] text-[#101828]">
        <div className="h-28 md:h-32" />
        <div className="max-w-2xl mx-auto px-4 pb-24">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-[#6C4AB6]/10 to-[#e244b7]/10 border border-[#6C4AB6]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-[#6C4AB6]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold tracking-wider uppercase mb-3">
              <Check className="w-3.5 h-3.5" /> Abstract Submitted
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#101828] mb-3">
              Submission Successful!
            </h2>

            <p className="text-base text-[#475467] mb-6 max-w-lg mx-auto leading-relaxed">
              {submissionState.message}
            </p>

            {submissionId && (
              <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-[#6C4AB6]/5 to-[#e244b7]/5 border border-[#6C4AB6]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div>
                  <span className="text-[11px] font-bold text-[#6C4AB6] uppercase tracking-wider block">Your Submission Tracking Code</span>
                  <span className="font-mono text-lg sm:text-xl font-extrabold text-[#101828]">{submissionId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(submissionId)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#6C4AB6] text-xs font-bold text-[#101828] shadow-xs transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
                  {copiedId ? "Copied!" : "Copy Code"}
                </button>
              </div>
            )}

            {/* Submission summary info */}
            <div className="text-left bg-gray-50/70 border border-gray-100 rounded-2xl p-5 mb-6 space-y-2 text-xs text-[#344054]">
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-medium">Presenting Author</span>
                <span className="font-bold text-[#101828]">{form.name}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-medium">Category</span>
                <span className="font-bold text-[#101828]">{form.subCategory} ({form.category})</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-2">
                <span className="text-gray-500 font-medium">Specialty & Institution</span>
                <span className="font-bold text-[#101828]">{form.specialty} • {form.college}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-gray-500 font-medium">Abstract Title</span>
                <span className="font-bold text-[#101828] max-w-[280px] text-right truncate">{form.title}</span>
              </div>
            </div>

            {/* WhatsApp Community Link */}
            {abstractWhatsapp.url && (
              <div className="mb-6 p-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50">
                <a
                  href={abstractWhatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#25D366] text-white rounded-full font-bold hover:bg-[#1fb855] transition-all shadow-md shadow-[#25D366]/20 text-sm"
                >
                  Join GHC Abstract WhatsApp Group <ArrowRight className="w-4 h-4" />
                </a>
                <p className="mt-2.5 text-xs text-[#475467] leading-relaxed">
                  {abstractWhatsapp.text || "Join the official GHC Abstract WhatsApp Group for real-time announcements, review timelines, and presentation schedules."}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white font-bold text-sm hover:opacity-95 shadow-md shadow-[#e244b7]/25 transition-all"
              >
                Return to Homepage <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // CALLS CLOSED STATE
  if (isCallsOpen === false) {
    return (
      <div className="bg-white min-h-screen font-['Outfit'] text-[#101828]">
        <div className="h-28 md:h-32" />
        <div className="max-w-xl mx-auto px-4 pb-24">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-gray-200/80 rounded-3xl p-8 sm:p-12 text-center shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
          >
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-[#101828] mb-3">Abstract Calls Closed</h2>
            <p className="text-[#475467] text-base mb-8 max-w-md mx-auto leading-relaxed">
              Abstract submissions for the Global Healthcare Conclave 2026 are currently closed. For inquiries, please reach out to the scientific committee.
            </p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] text-white rounded-full font-bold text-sm hover:opacity-95 shadow-md shadow-[#e244b7]/25 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Homepage
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  const stepsList = ["Guidelines", "Personal Details", "Abstract & Uploads", "Review & Consent"];

  return (
    <div className="bg-white min-h-screen font-['Outfit'] text-[#101828]">
      {/* Top spacing */}
      <div className="h-28 md:h-32" />

      {/* Back to Home Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#475467] hover:text-[#101828] font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-[#6C4AB6]" /> Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      {step === 0 && (
        <section className="relative px-6 py-10 md:py-14 overflow-hidden text-center max-w-5xl mx-auto bg-white">
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#e244b7]/10 border border-[#e244b7]/25 text-[#e244b7] text-xs font-bold tracking-widest uppercase"
            >
              <BadgeCheck className="w-4 h-4 text-[#e244b7]" /> Call for Abstracts 2026
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6C4AB6]/10 border border-[#6C4AB6]/25 text-[#6C4AB6] text-xs font-bold tracking-wider uppercase"
            >
              <MapPin className="w-3.5 h-3.5 text-[#6C4AB6]" /> Venue: New Delhi
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 text-xs font-bold tracking-wider uppercase"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Deadline: 22 Oct 2026
            </motion.div>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#101828] mb-6 leading-tight"
          >
            Submit Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]">Scientific Abstract</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-[#475467] max-w-2xl mx-auto mb-6 leading-relaxed"
          >
            Present your breakthrough research and clinical case studies before distinguished academic juries and healthcare leaders at GHC 2026.
          </motion.p>
        </section>
      )}

      {/* Main Form Container */}
      <div ref={formTopRef} className="max-w-4xl mx-auto px-4 pb-24 scroll-mt-24">
        
        {/* Sticky Horizontal Step Progress Bar */}
        <div className="mb-10 sticky top-24 z-40 bg-white/95 backdrop-blur-md py-4 border-b border-gray-100">
          <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-[#475467] mb-2.5">
            <span className="text-[#6C4AB6]">Step {step + 1} of 4: {stepsList[step]}</span>
            <span>{Math.round(((step + 1) / 4) * 100)}% Completed</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7]"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / 4) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Card Form Wrapper */}
        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-10 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
          <AnimatePresence mode="wait">

            {/* STEP 0: GUIDELINES & SPECIFICATIONS */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div>
                  <p className="text-[#e244b7] text-xs font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-[#e244b7] rounded-full"></span>
                    SUBMISSION GUIDELINES
                  </p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828] mb-2">Guidelines & Submission Protocol</h2>
                  <p className="text-[#475467] text-base">Please review all submission rules, timelines, and format outlines carefully before continuing.</p>
                </div>

                {/* Important Notice & Timeline Box */}
                <div className="bg-gradient-to-br from-[#6C4AB6]/5 to-[#e244b7]/5 border border-[#6C4AB6]/20 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center gap-2 text-[#6C4AB6] font-bold text-sm sm:text-base mb-4">
                    <Info className="w-5 h-5 text-[#6C4AB6]" />
                    <span>Important Timeline & Screening Protocol</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <div className="bg-white rounded-xl p-3.5 border border-[#6C4AB6]/15 shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Initial Submission Deadline</span>
                      <span className="text-sm font-extrabold text-[#101828]">22 October 2026</span>
                      <span className="text-[10px] text-amber-700 block mt-0.5">(Subject to extension up to 31 Oct by notice)</span>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-[#6C4AB6]/15 shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Screening Mode</span>
                      <span className="text-sm font-extrabold text-emerald-700">Rolling Basis (~10–15 Oct onwards)</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Decisions and feedback sent in parallel</span>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-[#6C4AB6]/15 shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Revision Deadline (Submitted ≤ 22 Oct)</span>
                      <span className="text-sm font-extrabold text-[#6C4AB6]">31 October 2026</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">Strict deadline for first-batch revisions</span>
                    </div>

                    <div className="bg-white rounded-xl p-3.5 border border-[#6C4AB6]/15 shadow-2xs">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Revision Deadline (Submitted 23–31 Oct)</span>
                      <span className="text-sm font-extrabold text-[#6C4AB6]">5 November 2026</span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">For abstracts received during extended period</span>
                    </div>
                  </div>

                  <ul className="list-disc list-inside space-y-1.5 text-xs text-[#344054] leading-relaxed">
                    <li>The file must be in <strong>DOCX format</strong> and not more than <strong>10 MB</strong> in size (Font: <strong>Times New Roman, Size: 12</strong>).</li>
                    <li>Word Limit: <strong>350–400 words</strong> (Tables, legends, and references are excluded from count).</li>
                    <li>Screening Thresholds: Plagiarism <strong>less than 20%</strong>; AI-detection score <strong>less than 30%</strong> (compliant with JAMA guidelines).</li>
                    <li><strong>Multiple Submissions:</strong> Permitted <em>only sequentially</em> if the first abstract has been rejected.</li>
                    <li><strong>Presenting Author Restriction:</strong> An individual may serve as presenting author for <strong>only one accepted poster</strong>.</li>
                    <li>Cash prize and presentation certificate are issued <strong>exclusively to the presenting author</strong>.</li>
                  </ul>
                </div>

                {/* Formats Grid: Research vs Case Abstract */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Research Abstract Format */}
                  <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:border-[#6C4AB6]/40 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                            <Microscope className="w-5 h-5" />
                          </span>
                          <div>
                            <h4 className="font-bold text-[#101828] text-sm">Research Abstract</h4>
                            <p className="text-[11px] text-gray-500">Original clinical/biomedical studies</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#6C4AB6]/10 text-[#6C4AB6] border border-[#6C4AB6]/20">
                          10 Sections
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-1.5">
                        {researchAbstractFormat.map((item) => (
                          <div
                            key={item.num}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs ${
                              item.optional
                                ? "bg-amber-50/40 border border-dashed border-amber-200/80"
                                : "bg-gray-50/80 border border-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-[#101828] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {item.num}
                              </span>
                              <span className="font-semibold text-[#101828] text-[11px] sm:text-xs truncate">
                                {item.title}
                              </span>
                            </div>
                            {item.optional ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                                Optional
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                                Required
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Case Abstract Format */}
                  <div className="bg-white border border-gray-200/90 rounded-2xl p-5 shadow-xs hover:border-[#e244b7]/40 transition-colors flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-[#e244b7]/10 text-[#e244b7] flex items-center justify-center shrink-0">
                            <Stethoscope className="w-5 h-5" />
                          </span>
                          <div>
                            <h4 className="font-bold text-[#101828] text-sm">Case Abstract</h4>
                            <p className="text-[11px] text-gray-500">Clinical case reports & series</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#e244b7]/10 text-[#e244b7] border border-[#e244b7]/20">
                          4 Sections
                        </span>
                      </div>

                      <div className="mt-3.5 space-y-1.5">
                        {caseAbstractFormat.map((item) => (
                          <div
                            key={item.num}
                            className="flex items-center justify-between px-3 py-2 rounded-xl text-xs bg-gray-50/80 border border-gray-100"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-md bg-white border border-gray-200 text-[#101828] font-bold text-[10px] flex items-center justify-center shrink-0">
                                {item.num}
                              </span>
                              <span className="font-semibold text-[#101828] text-[11px] sm:text-xs truncate">
                                {item.title}
                              </span>
                            </div>
                            <span className="text-[10px] font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                              Required
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3.5 rounded-xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] border border-gray-200/90 p-3.5 space-y-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6C4AB6]">
                          <Info className="w-3.5 h-3.5 shrink-0" />
                          <span>Case Description Sub-sections:</span>
                        </div>
                        <p className="text-[11px] text-gray-600 leading-relaxed">
                          Must be presented together under the single <strong>CASE DESCRIPTION</strong> heading:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          {caseDescriptionSubItems.map((part) => (
                            <div key={part} className="flex items-center gap-1.5 text-[11px] text-[#101828] font-medium bg-white px-2.5 py-1.5 rounded-lg border border-gray-200/70 shadow-2xs">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#6C4AB6] shrink-0" />
                              <span>{part}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable Accordion: All 15 Guidelines */}
                <div className="border border-gray-200/90 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedGuidelines(!expandedGuidelines)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left font-bold text-[#101828] text-xs sm:text-sm"
                  >
                    <span className="flex items-center gap-2 text-[#6C4AB6]">
                      <BookOpen className="w-4 h-4 text-[#6C4AB6]" />
                      Comprehensive Guidelines & Poster Protocol (All 15 Sections)
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 font-semibold">
                      {expandedGuidelines ? "Hide Details" : "View Full Guidelines"}
                      {expandedGuidelines ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>

                  {expandedGuidelines && (
                    <div className="p-4 sm:p-6 space-y-4 max-h-96 overflow-y-auto border-t border-gray-100 bg-[#fbfbfd] text-xs">
                      {submissionGuidelinesData.map((item) => (
                        <div key={item.num} className="bg-white p-3.5 rounded-xl border border-gray-200/80 space-y-1.5 shadow-2xs">
                          <h5 className="font-bold text-[#101828] text-xs flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-[#6C4AB6]/10 text-[#6C4AB6] font-bold text-[10px] flex items-center justify-center shrink-0">
                              {item.num}
                            </span>
                            {item.title}
                          </h5>
                          <ul className="list-disc list-inside text-gray-600 space-y-1 pl-1 text-[11px] leading-relaxed">
                            {item.points.map((pt, idx) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Declaration Notice Callout */}
                <div className="border-l-4 border-[#6C4AB6] bg-gradient-to-r from-[#6C4AB6]/5 to-transparent p-5 rounded-r-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#101828]">Mandatory Signed Declaration</h4>
                    <p className="text-xs text-[#475467] mt-1 leading-relaxed">
                      All presenting authors must download the official declaration form, sign it, and upload the scanned copy during Step 2.
                    </p>
                  </div>
                  <a
                    href="/assets/forms/GHC%20Poster%20Presenter%20Declaration%20Form%201.docx"
                    download="GHC Poster Presenter Declaration Form.docx"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-[#6C4AB6]/30 text-[#6C4AB6] hover:bg-[#6C4AB6]/5 rounded-xl font-bold text-xs shadow-xs transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" /> Download Declaration Form
                  </a>
                </div>

                {/* Queries / Contacts Box */}
                <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-5">
                  <h4 className="font-bold text-[#101828] text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#6C4AB6]" /> For Scientific Committee Queries, Contact:
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
                      <Mail className="w-4 h-4 text-[#6C4AB6] shrink-0" />
                      <span className="text-gray-500 font-medium">Email:</span>
                      <a href="mailto:ghcscientific@gmail.com" className="font-bold text-[#6C4AB6] hover:underline truncate">
                        ghcscientific@gmail.com
                      </a>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
                      <Phone className="w-4 h-4 text-[#6C4AB6] shrink-0" />
                      <span className="text-gray-500 font-medium">Girik Subudhi:</span>
                      <a href="tel:+918169011833" className="font-bold text-[#101828] hover:text-[#6C4AB6]">
                        +91 81690 11833
                      </a>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
                      <Phone className="w-4 h-4 text-[#6C4AB6] shrink-0" />
                      <span className="text-gray-500 font-medium">Gaurav Jayadev:</span>
                      <a href="tel:+917022408203" className="font-bold text-[#101828] hover:text-[#6C4AB6]">
                        +91 70224 08203
                      </a>
                    </div>
                    <div className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200/70 shadow-2xs">
                      <Phone className="w-4 h-4 text-[#6C4AB6] shrink-0" />
                      <span className="text-gray-500 font-medium">Dr Prakhar Bajpai:</span>
                      <a href="tel:+919758523839" className="font-bold text-[#101828] hover:text-[#6C4AB6]">
                        +91 97585 23839
                      </a>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* STEP 1: PERSONAL & LOCATION DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">Personal & Academic Details</h2>
                    <p className="text-sm text-[#475467]">Provide your identification, institution, and contact details.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateForm("name", e.target.value)}
                      placeholder="e.g. Dr. Aryan Sharma"
                      className={`w-full bg-white border ${errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs`}
                    />
                    {errors.name && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.name}</p>}
                  </div>

                  {/* Academic Category Selector */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Academic Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {["Medical Student/Interns", "Post Intern/Resident (Ongoing PG)"].map(cat => {
                        const isSelected = form.category === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => updateForm("category", cat)}
                            className={`p-4 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between ${
                              isSelected
                                ? "bg-gradient-to-br from-[#6C4AB6]/5 to-[#e244b7]/5 border-2 border-[#6C4AB6] text-[#101828] shadow-xs"
                                : "bg-white border-gray-300 text-[#475467] hover:bg-gray-50"
                            }`}
                          >
                            <span>{cat}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#6C4AB6]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Specialty & Year of Study */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Specialty <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.specialty}
                        onChange={(e) => updateForm("specialty", e.target.value)}
                        className={`w-full bg-white border ${errors.specialty ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:ring-2 shadow-xs transition-all`}
                      >
                        <option value="" disabled>Select Specialty</option>
                        {specialties.map(spec => <option key={spec} value={spec}>{spec}</option>)}
                      </select>
                      {errors.specialty && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.specialty}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Year of Study / Seniority <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.yearOfStudy}
                        onChange={(e) => updateForm("yearOfStudy", e.target.value)}
                        className={`w-full bg-white border ${errors.yearOfStudy ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:ring-2 shadow-xs transition-all`}
                      >
                        <option value="" disabled>Select Year</option>
                        {form.category === "Medical Student/Interns" 
                          ? ["1st year", "2nd year", "3rd year", "4th year", "Intern"].map(y => <option key={y} value={y}>{y}</option>)
                          : ["Post intern", "JR1", "JR2", "JR3"].map(y => <option key={y} value={y}>{y}</option>)
                        }
                      </select>
                      {errors.yearOfStudy && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.yearOfStudy}</p>}
                    </div>
                  </div>

                  {/* College / Hospital */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      College / Hospital Affiliation <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.college}
                      onChange={(e) => updateForm("college", e.target.value)}
                      placeholder="e.g. All India Institute of Medical Sciences"
                      className={`w-full bg-white border ${errors.college ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs`}
                    />
                    {errors.college && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.college}</p>}
                  </div>

                  {/* Country, State, City */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Country <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.countryId || ""}
                        onChange={(e) => {
                          const country = countriesList.find(c => c.id.toString() === e.target.value);
                          updateForm("countryId", country ? country.id : null, { country: country ? country.name : "" });
                        }}
                        className={`w-full bg-white border ${errors.country ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:ring-2 shadow-xs transition-all`}
                      >
                        <option value="" disabled>Select Country</option>
                        {countriesList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {errors.country && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.country}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        State / Province <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={form.stateId || ""}
                        onChange={(e) => {
                          const stateObj = statesList.find(s => s.id.toString() === e.target.value);
                          updateForm("stateId", stateObj ? stateObj.id : null, { state: stateObj ? stateObj.name : "", city: "", cityId: null });
                          setCitySearchTerm("");
                        }}
                        disabled={!form.countryId || statesList.length === 0}
                        className={`w-full bg-white border ${errors.state ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] focus:outline-none focus:ring-2 shadow-xs transition-all disabled:opacity-50`}
                      >
                        <option value="" disabled>{statesList.length === 0 && form.countryId ? "No states loaded" : "Select State"}</option>
                        {statesList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      {errors.state && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.state}</p>}
                    </div>

                    <div className="relative" ref={cityDropdownRef}>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        City <span className="text-rose-500">*</span>
                      </label>
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
                          placeholder={!form.stateId ? "Select state first" : "Search city..."}
                          className={`w-full bg-white border ${errors.city ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs disabled:opacity-50`}
                        />
                        {loadingLocations && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <RefreshCw className="w-4 h-4 text-[#6C4AB6] animate-spin" />
                          </div>
                        )}
                      </div>

                      {showCityDropdown && citySearchTerm.length >= 2 && !form.cityId && (
                        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                          {citiesList.length > 0 ? (
                            citiesList.map(city => (
                              <div
                                key={city.id}
                                onClick={() => {
                                  updateForm("cityId", city.id, { city: city.name });
                                  setCitySearchTerm("");
                                  setShowCityDropdown(false);
                                }}
                                className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer text-sm text-[#101828]"
                              >
                                {city.name}
                              </div>
                            ))
                          ) : (
                            !loadingLocations && <div className="px-4 py-3 text-gray-500 text-xs text-center">No matching cities found</div>
                          )}
                        </div>
                      )}
                      {errors.city && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.city}</p>}
                    </div>
                  </div>

                  {/* Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => updateForm("phone", e.target.value)}
                        placeholder="+91 98765 43210"
                        className={`w-full bg-white border ${errors.phone ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs`}
                      />
                      {errors.phone && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateForm("email", e.target.value)}
                        placeholder="author@hospital.org"
                        className={`w-full bg-white border ${errors.email ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs`}
                      />
                      {errors.email && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.email}</p>}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ABSTRACT & UPLOADS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">Abstract Details & Document Uploads</h2>
                    <p className="text-sm text-[#475467]">Provide your abstract title, track type, and upload required documents.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Abstract Title */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Title of Your Abstract <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateForm("title", e.target.value)}
                      placeholder="e.g. Assessment of Cardiovascular Outcomes in Post-COVID Patients"
                      className={`w-full bg-white border ${errors.title ? 'border-rose-400 focus:ring-rose-200' : 'border-gray-300 focus:border-[#6C4AB6] focus:ring-[#6C4AB6]/20'} rounded-xl px-4 py-3 text-[#101828] placeholder-gray-400 focus:outline-none focus:ring-2 transition-all shadow-xs`}
                    />
                    {errors.title && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.title}</p>}
                  </div>

                  {/* Abstract Type Selection Cards */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Abstract Category <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { id: "Research abstract", title: "Research Abstract", desc: "Original clinical or biomedical studies", icon: Microscope, count: "10 Sections" },
                        { id: "Case abstract", title: "Case Abstract", desc: "Clinical case reports & case series", icon: Stethoscope, count: "4 Sections" },
                      ].map((item) => {
                        const isSelected = form.subCategory === item.id;
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.id}
                            onClick={() => updateForm("subCategory", item.id)}
                            className={`cursor-pointer relative p-5 rounded-2xl border transition-all ${
                              isSelected
                                ? "bg-gradient-to-br from-[#6C4AB6]/5 to-[#e244b7]/5 border-2 border-[#6C4AB6] shadow-[0_8px_25px_rgba(108,74,182,0.12)]"
                                : "bg-white border-gray-300 hover:border-[#6C4AB6]/50 hover:shadow-xs"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-[#6C4AB6] text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                              </div>
                            )}
                            <Icon className={`w-6 h-6 mb-2.5 ${isSelected ? "text-[#6C4AB6]" : "text-gray-400"}`} />
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-[#101828] text-base">{item.title}</h4>
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#6C4AB6]/10 text-[#6C4AB6]">
                                {item.count}
                              </span>
                            </div>
                            <p className="text-xs text-[#475467] leading-relaxed">{item.desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format outline pill preview */}
                  <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-200/80 text-xs">
                    <span className="font-bold text-[#101828] block mb-2">
                      Required Sections for {form.subCategory}:
                    </span>
                    {form.subCategory === "Research abstract" ? (
                      <div className="flex flex-wrap gap-1.5">
                        {researchAbstractFormat.map(item => (
                          <span
                            key={item.num}
                            className={`px-2.5 py-1 rounded-lg font-medium border text-[11px] ${
                              item.optional
                                ? "bg-amber-50 text-amber-800 border-amber-200/70"
                                : "bg-white text-[#101828] border-gray-200 shadow-2xs"
                            }`}
                          >
                            <strong className="text-gray-400 mr-1">{item.num}.</strong> {item.title}
                            {item.optional && <span className="ml-1 text-[9px] italic">(Optional)</span>}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1.5">
                          {caseAbstractFormat.map(item => (
                            <span key={item.num} className="px-2.5 py-1 rounded-lg font-medium bg-white text-[#101828] border border-gray-200 shadow-2xs text-[11px]">
                              <strong className="text-gray-400 mr-1">{item.num}.</strong> {item.title}
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-gray-500 italic">
                          * Case Description must include: History, Examination, Investigations, Diagnosis, Treatment, and Follow-up.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Abstract Document Upload */}
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Upload Abstract Document (DOCX or PDF) <span className="text-rose-500">*</span>
                    </label>
                    <div className={`border-2 border-dashed ${errors.pdf ? "border-rose-400 bg-rose-50/30" : "border-gray-300 hover:border-[#6C4AB6] hover:bg-[#6C4AB6]/5"} rounded-2xl p-8 text-center transition-all group relative cursor-pointer`}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => handleFileUpload(e, 'pdf')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="pointer-events-none relative z-0 flex flex-col items-center">
                        <FileText className={`w-9 h-9 mb-2 transition-colors ${pdf ? 'text-[#6C4AB6]' : 'text-gray-400 group-hover:text-[#6C4AB6]'}`} />
                        {pdf ? (
                          <>
                            <h4 className="font-bold text-[#101828] mb-1 truncate max-w-sm text-sm">{pdf.name}</h4>
                            <p className="text-[#6C4AB6] text-xs font-semibold">{(pdf.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-[#101828] mb-1 text-sm">Choose your Abstract document</h4>
                            <p className="text-[#475467] text-xs">DOCX or PDF (Times New Roman 12 pt, 350–400 words, Max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.pdf && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.pdf}</p>}
                  </div>

                  {/* Declaration Form Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-semibold text-[#344054]">
                        Upload Signed Declaration Form <span className="text-rose-500">*</span>
                      </label>
                      <a
                        href="/assets/forms/GHC%20Poster%20Presenter%20Declaration%20Form%201.docx"
                        download="GHC Poster Presenter Declaration Form.docx"
                        className="text-xs text-[#6C4AB6] hover:underline font-bold inline-flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" /> Download Template
                      </a>
                    </div>
                    <div className={`border-2 border-dashed ${errors.declaration ? "border-rose-400 bg-rose-50/30" : "border-gray-300 hover:border-[#6C4AB6] hover:bg-[#6C4AB6]/5"} rounded-2xl p-8 text-center transition-all group relative cursor-pointer`}>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={(e) => handleFileUpload(e, 'declaration')}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="pointer-events-none relative z-0 flex flex-col items-center">
                        <FileText className={`w-9 h-9 mb-2 transition-colors ${declaration ? 'text-[#6C4AB6]' : 'text-gray-400 group-hover:text-[#6C4AB6]'}`} />
                        {declaration ? (
                          <>
                            <h4 className="font-bold text-[#101828] mb-1 truncate max-w-sm text-sm">{declaration.name}</h4>
                            <p className="text-[#6C4AB6] text-xs font-semibold">{(declaration.size / 1024 / 1024).toFixed(2)} MB • Click to replace</p>
                          </>
                        ) : (
                          <>
                            <h4 className="font-bold text-[#101828] mb-1 text-sm">Choose signed declaration file</h4>
                            <p className="text-[#475467] text-xs">Scanned PDF or DOCX (Max 10MB)</p>
                          </>
                        )}
                      </div>
                    </div>
                    {errors.declaration && <p className="text-rose-500 mt-1.5 text-xs font-semibold">{errors.declaration}</p>}
                  </div>

                </div>
              </motion.div>
            )}

            {/* STEP 3: REVIEW & CONSENT */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6C4AB6]/10 text-[#6C4AB6] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101828]">Review & Final Confirmation</h2>
                    <p className="text-sm text-[#475467]">Review your submission summary and provide mandatory authorship consent.</p>
                  </div>
                </div>

                {/* Summary Card */}
                <div className="bg-gray-50/70 border border-gray-200/80 rounded-2xl p-6 space-y-4 text-xs">
                  <h4 className="font-bold text-sm text-[#101828] uppercase tracking-wider border-b border-gray-200/80 pb-2.5">
                    Submission Summary
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-500 font-medium block">Presenting Author</span>
                      <span className="font-bold text-[#101828] text-sm">{form.name || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Academic Track</span>
                      <span className="font-bold text-[#101828] text-sm">{form.category}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Specialty & Year</span>
                      <span className="font-bold text-[#101828] text-sm">{form.specialty} • {form.yearOfStudy}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">College / Institution</span>
                      <span className="font-bold text-[#101828] text-sm">{form.college || "—"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Location</span>
                      <span className="font-bold text-[#101828] text-sm">{form.city}, {form.state}, {form.country}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Contact</span>
                      <span className="font-bold text-[#101828] text-sm">{form.email} • {form.phone}</span>
                    </div>
                  </div>

                  <div className="border-t border-gray-200/80 pt-3">
                    <span className="text-gray-500 font-medium block mb-1">Abstract Title</span>
                    <p className="font-bold text-sm text-[#101828] leading-relaxed">{form.title}</p>
                    <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full bg-[#6C4AB6]/10 text-[#6C4AB6] font-bold text-[10px] uppercase tracking-wider">
                      {form.subCategory}
                    </span>
                  </div>

                  <div className="border-t border-gray-200/80 pt-3 flex flex-wrap gap-4">
                    <div>
                      <span className="text-gray-500 font-medium block">Abstract File</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" /> {pdf?.name || "Attached"}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 font-medium block">Signed Declaration</span>
                      <span className="font-bold text-emerald-700 flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" /> {declaration?.name || "Attached"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <div className="p-6 rounded-2xl bg-white border border-gray-200/90 shadow-xs">
                  <label className="flex items-start gap-3.5 cursor-pointer group">
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        form.consent
                          ? 'bg-[#6C4AB6] border-[#6C4AB6] text-white shadow-xs'
                          : 'border-gray-300 text-transparent group-hover:border-[#6C4AB6]'
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={form.consent}
                        onChange={(e) => updateForm("consent", e.target.checked)}
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-sm font-bold text-[#101828] block">
                        Mandatory Authorship & Integrity Confirmation
                      </span>
                      <p className="text-xs text-[#475467] leading-relaxed">
                        I hereby confirm that the submitted abstract is original, unpublished, and has not been presented elsewhere. I verify that all data entered is accurate, and I agree to follow the guidelines, timelines, and screening decisions set by GAIMS and the Scientific Committee.
                      </p>
                    </div>
                  </label>
                  {errors.consent && <p className="text-rose-500 mt-2 text-xs font-semibold">{errors.consent}</p>}
                </div>

                {submissionState.status === "error" && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{submissionState.message}</span>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="mt-12 pt-8 border-t border-gray-100 flex items-center justify-between">
            {step > 0 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-[#344054] font-semibold transition-colors text-sm shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] hover:opacity-95 text-white font-bold transition-all shadow-md shadow-[#e244b7]/25 text-sm"
              >
                {step === 0 ? "Begin Abstract Submission" : "Continue"} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={submitAbstract}
                disabled={submissionState.status === "loading" || !form.consent}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-[#6C4AB6] to-[#e244b7] hover:opacity-95 text-white font-bold transition-all shadow-md shadow-[#e244b7]/25 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submissionState.status === "loading" ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Abstract...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Submit Abstract
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
