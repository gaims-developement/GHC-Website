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

export const defaultWorkshops = [];

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
  if (!date) return "November 22-24, 2026";
  if (/Will be announced soon/i.test(date)) return "November 22-24, 2026";
  if (/June\s+(14|15|16),\s+2026/i.test(date)) return "November 22-24, 2026";
  if (/Dates will be announced soon/i.test(date)) return "November 22-24, 2026";
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
  room: (workshop.room || workshop.venue || "").includes("AIIMS") ? "S.E.T Facility AIIMS Delhi" : (workshop.room || workshop.venue || "S.E.T Facility AIIMS Delhi"),
  venue: (workshop.venue || workshop.room || "").includes("AIIMS") ? "S.E.T Facility AIIMS Delhi" : (workshop.venue || workshop.room || "S.E.T Facility AIIMS Delhi"),
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
