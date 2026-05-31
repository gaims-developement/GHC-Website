export const categoryColors = {
  "Clinical Skills": { bg: "rgba(127,119,221,0.18)", color: "#afa9ec" },
  "AI & Health": { bg: "rgba(29,158,117,0.15)", color: "#5dcaa5" },
  "Policy Lab": { bg: "rgba(250,199,117,0.15)", color: "#fac775" },
  Research: { bg: "rgba(255,59,139,0.15)", color: "#ff80be" },
  Innovation: { bg: "rgba(55,138,221,0.15)", color: "#85b7eb" },
};

export const workshopCategories = Object.keys(categoryColors);

export const createWorkshopSlug = (title = "") => {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `workshop-${Date.now()}`;
};

export const defaultWorkshops = [
  {
    id: "ws-001",
    slug: "ai-assisted-diagnostics-in-clinical-practice",
    title: "AI-Assisted Diagnostics in Clinical Practice",
    category: "AI & Health",
    duration: "2 hrs",
    facilitator: { name: "Dr. Priya Nair", initials: "PN", designation: "Clinical AI Lead" },
    seats: { filled: 22, total: 30 },
    date: "Dates will be announced soon",
    startTime: "10:00",
    endTime: "12:00",
    time: "10:00 AM",
    room: "Hall B, Level 2",
    description: "",
    agenda: [],
    requirements: [],
    image: "",
    learningOutcomes: ["Understand clinical AI use cases", "Assess workflow readiness", "Identify governance and validation checkpoints"],
    whoShouldAttend: ["Clinicians", "Residents", "Digital health teams"],
    prerequisites: "Basic understanding of clinical workflows.",
    faqs: [{ question: "Is coding required?", answer: "No. The workshop focuses on clinical adoption and governance." }],
    featured: true,
  },
  {
    id: "ws-002",
    slug: "global-health-policy-frameworks-for-low-resource-settings",
    title: "Global Health Policy: Frameworks for Low-Resource Settings",
    category: "Policy Lab",
    duration: "3 hrs",
    facilitator: { name: "Prof. James Okafor", initials: "JO", designation: "Health Policy Chair" },
    seats: { filled: 14, total: 25 },
    date: "Dates will be announced soon",
    startTime: "14:00",
    endTime: "17:00",
    time: "02:00 PM",
    room: "Conference Room 4A",
    description: "",
    agenda: [],
    requirements: [],
    image: "",
    learningOutcomes: ["Map policy barriers", "Design implementation frameworks", "Review case studies for low-resource settings"],
    whoShouldAttend: ["Policy students", "Public health professionals", "NGO teams"],
    prerequisites: "Interest in global health policy.",
    faqs: [],
    featured: false,
  },
  {
    id: "ws-003",
    slug: "advanced-surgical-simulation-lab",
    title: "Advanced Surgical Simulation Lab",
    category: "Clinical Skills",
    duration: "4 hrs",
    facilitator: { name: "Dr. Elena Russo", initials: "ER", designation: "Simulation Lab Director" },
    seats: { filled: 30, total: 30 },
    date: "Dates will be announced soon",
    startTime: "09:00",
    endTime: "13:00",
    time: "09:00 AM",
    room: "Skills Lab, Level 1",
    description: "",
    agenda: [],
    requirements: [],
    image: "",
    learningOutcomes: ["Practice structured simulation drills", "Review procedural safety principles", "Improve team communication"],
    whoShouldAttend: ["Medical students", "Surgical residents", "Skills lab educators"],
    prerequisites: "Clinical skills lab attire recommended.",
    faqs: [],
    featured: true,
  },
  {
    id: "ws-004",
    slug: "research-methodology-and-abstract-writing",
    title: "Research Methodology & Abstract Writing",
    category: "Research",
    duration: "2.5 hrs",
    facilitator: { name: "Dr. Amir Hassan", initials: "AH", designation: "Research Methods Faculty" },
    seats: { filled: 8, total: 30 },
    date: "Dates will be announced soon",
    startTime: "13:00",
    endTime: "15:30",
    time: "01:00 PM",
    room: "Seminar Room 2",
    description: "",
    agenda: [],
    requirements: [],
    image: "",
    learningOutcomes: ["Structure strong abstracts", "Choose suitable research methods", "Prepare for poster or oral presentation"],
    whoShouldAttend: ["Students", "Early-career researchers", "Faculty mentors"],
    prerequisites: "Bring a draft research idea if available.",
    faqs: [],
    featured: false,
  },
];

export const getInitials = (name = "") => {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  return initials || "GH";
};

export const formatWorkshopDate = (date) => {
  if (!date) return "Dates will be announced soon";
  if (/Will be announced soon/i.test(date)) return "Dates will be announced soon";
  if (/June\s+(14|15|16),\s+2026/i.test(date)) return "Dates will be announced soon";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(`${date}T00:00:00`));
};

export const formatWorkshopTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(Number(hours || 0), Number(minutes || 0));
  return new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
};

export const getWorkshopTimeRange = (workshop) => {
  if (workshop.startTime || workshop.endTime) {
    return `${formatWorkshopTime(workshop.startTime) || workshop.time || "Time TBA"}${workshop.endTime ? ` - ${formatWorkshopTime(workshop.endTime)}` : ""}`;
  }
  return workshop.time || "Time TBA";
};

export const normalizeWorkshop = (workshop) => ({
  ...workshop,
  id: workshop.id,
  slug: workshop.slug || createWorkshopSlug(workshop.title),
  title: workshop.title || "",
  category: workshop.category || workshop.workshopType || workshop.workshop_type || "Clinical Skills",
  duration: workshop.duration || "",
  room: workshop.room || workshop.venue || "",
  venue: workshop.venue || workshop.room || "",
  price: Number(workshop.price || 0),
  image: workshop.image || workshop.imageUrl || workshop.image_url || "",
  imageUrl: workshop.imageUrl || workshop.image_url || workshop.image || "",
  featured: Boolean(workshop.featured),
  badge: workshop.badge || (workshop.featured ? "Featured" : ""),
  date: formatWorkshopDate(workshop.date),
  facilitator: {
    name: workshop.facilitator?.name || workshop.facilitatorName || workshop.faculty || "",
    initials: workshop.facilitator?.initials || getInitials(workshop.facilitator?.name || workshop.facilitatorName || workshop.faculty),
    designation: workshop.facilitator?.designation || workshop.facilitatorDesignation || "",
  },
  seats: {
    filled: Number(workshop.seats?.filled ?? workshop.filledSeats ?? workshop.registeredCount ?? workshop.registered_count ?? 0),
    total: Number(workshop.seats?.total ?? workshop.totalSeats ?? workshop.capacity ?? 0),
  },
  agenda: Array.isArray(workshop.agenda) ? workshop.agenda : [],
  requirements: Array.isArray(workshop.requirements)
    ? workshop.requirements
    : String(workshop.requirements || "").split(",").map((item) => item.trim()).filter(Boolean),
  learningOutcomes: Array.isArray(workshop.learningOutcomes)
    ? workshop.learningOutcomes
    : String(workshop.learningOutcomes || workshop.learning_outcomes || "").split(/\n|,/).map((item) => item.trim()).filter(Boolean),
  whoShouldAttend: Array.isArray(workshop.whoShouldAttend)
    ? workshop.whoShouldAttend
    : String(workshop.whoShouldAttend || workshop.who_should_attend || "").split(/\n|,/).map((item) => item.trim()).filter(Boolean),
  prerequisites: workshop.prerequisites || "",
  faqs: Array.isArray(workshop.faqs) ? workshop.faqs : Array.isArray(workshop.faq) ? workshop.faq : [],
});

export const loadWorkshops = () => {
  return defaultWorkshops.map(normalizeWorkshop);
};

export const getWorkshopById = (id) => loadWorkshops().find((workshop) => String(workshop.id) === String(id));
export const getWorkshopBySlug = (slug) => loadWorkshops().find((workshop) => workshop.slug === slug || String(workshop.id) === String(slug));
