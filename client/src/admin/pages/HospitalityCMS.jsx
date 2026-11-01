import { useState, useEffect, useCallback } from "react";
import { MapPin, Coffee, Hotel, Plus, Edit2, Trash2, AlertCircle, CheckCircle2, Map as MapIcon, ExternalLink, Loader2, X, EyeOff } from "lucide-react";

const endpoints = {
  places: { path: "/api/stays", title: "Accommodations", hint: "Hotels, hostels and guesthouses", icon: Hotel, key: "stays", singular: "Accommodation" },
  cafe: { path: "/api/cafes", title: "Food & Cafes", hint: "Places to eat, grouped by list", icon: Coffee, key: "cafes", singular: "Food Place" },
  guide: { path: "/api/venue-guide", title: "Travel Guide", hint: "Routes, areas, sights and tips", icon: MapIcon, key: "guideItems", singular: "Guide Item" }
};

// What each Travel Guide field means in each Venue page section; a field left out is hidden.
const GUIDE_SECTIONS = {
  bharat_route: { label: "Routes: Bharat Mandapam", title: "From (e.g. IGI T3)", detail: "Route" },
  bharat_info: { label: "Bharat Mandapam option", title: "Button label", subtitle: "Heading above routes", detail: "Note below routes", link: "Location link" },
  safdarjung_route: { label: "Routes: VMMC & Safdarjung", title: "From (e.g. IGI T3)", detail: "Route" },
  safdarjung_info: { label: "VMMC & Safdarjung option", title: "Button label", subtitle: "Heading above routes", detail: "Note below routes", link: "Location link" },
  area: { label: "Where should I stay? (areas)", title: "Area", subtitle: "Highlights", detail: "Advice" },
  stay_group: { label: "Stay groups", title: "Group heading", subtitle: "Card tag", detail: "Group description" },
  stay_note: { label: "Stay notices", title: "Heading", detail: "Text" },
  stay_help: { label: "Group travel help", title: "Heading", subtitle: "Phone or link text", detail: "Text", link: "Link (e.g. tel:+91...)" },
  place: { label: "Places to visit", title: "Place", subtitle: "Nearest metro", detail: "Description", link: "Map link", imageUrl: "Image path or URL" },
  place_pick: { label: "President's recommendations", title: "Place", detail: "Description" },
  market: { label: "Shopping & souvenirs", title: "Market", subtitle: "Metro and speciality", detail: "Warning (e.g. closed Mondays)", link: "Map link" },
  checklist: { label: "Travel checklist", title: "Checklist item" },
  app: { label: "Apps and numbers", title: "App or number", detail: "Description" }
};

const GUIDE_GROUPS = [
  { title: "Getting there", sections: ["bharat_route", "bharat_info", "safdarjung_route", "safdarjung_info"] },
  { title: "Stays", sections: ["area", "stay_group", "stay_note", "stay_help"] },
  { title: "Explore Delhi", sections: ["place", "place_pick", "market"] },
  { title: "Before you travel", sections: ["checklist", "app"] }
];

const inputClass = "w-full bg-white border border-[#D0D5DD] rounded-xl px-4 py-3 text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#0D47A1]/20 focus:border-[#0D47A1] transition";
const labelClass = "block text-xs font-bold text-[#475467] uppercase tracking-wider mb-2";
const cardClass = "bg-white border border-[#EAECF0] rounded-2xl shadow-[0_1px_3px_rgba(16,24,40,0.06)]";

function Field({ id, label, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      {children}
      {hint && <p className="text-xs text-[#667085] mt-1.5">{hint}</p>}
    </div>
  );
}

function ItemRow({ item, onEdit, onDelete }) {
  const name = item.title || item.name;
  const details = item.address || item.subtitle || item.detail;
  const hidden = item.status === "inactive";
  return (
    <div className={`group flex items-center gap-4 px-5 py-4 border-b border-[#F2F4F7] last:border-b-0 hover:bg-[#F9FAFB] transition-colors ${hidden ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-[#101828]">{name}</h3>
          {hidden && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#B42318] bg-[#FEF3F2] px-2 py-0.5 rounded-full">
              <EyeOff size={11} /> Hidden
            </span>
          )}
        </div>
        {details && <p className="text-sm text-[#667085] mt-0.5 line-clamp-1">{details}</p>}
      </div>
      {item.price && <span className="hidden sm:block shrink-0 text-sm font-bold text-[#0D47A1]">{item.price}</span>}
      <div className="shrink-0 flex items-center gap-1">
        <button type="button" onClick={onEdit} aria-label={`Edit ${name}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-[#0D47A1] hover:bg-[#0D47A1]/10 transition-colors">
          <Edit2 size={14} /> <span className="hidden sm:inline">Edit</span>
        </button>
        <button type="button" onClick={onDelete} aria-label={`Delete ${name}`} className="p-2 rounded-lg text-[#B42318] hover:bg-[#FEF3F2] transition-colors">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function HospitalityCMS({ api }) {
  const [activeTab, setActiveTab] = useState("places");
  const [data, setData] = useState({ stays: [], cafes: [], guideItems: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState(null);
  const [guideSection, setGuideSection] = useState("bharat_route");

  const currentConfig = endpoints[activeTab];
  const isGuide = activeTab === "guide";
  const items = data[currentConfig.key];
  const guideInSection = (section) => data.guideItems.filter((item) => item.section === section);
  const visibleItems = isGuide ? guideInSection(guideSection) : items;
  const guideFields = GUIDE_SECTIONS[form?.section || guideSection];
  const stayGroups = guideInSection("stay_group");
  const formId = form?._id || form?.id;

  const loadAll = useCallback(async () => {
    setError("");
    try {
      const responses = await Promise.all(Object.values(endpoints).map((endpoint) => api.get(endpoint.path)));
      const next = {};
      Object.values(endpoints).forEach((endpoint, index) => { next[endpoint.key] = responses[index].data[endpoint.key] || []; });
      setData(next);
    } catch {
      setError("Could not load hospitality content. Please try again.");
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(timer);
  }, [success]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setForm(null);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    const payload = { ...form, displayOrder: Number(form.displayOrder) || 0 };
    try {
      if (formId) {
        await api.put(`${currentConfig.path}/${formId}`, payload);
        setSuccess("Successfully updated!");
      } else {
        await api.post(currentConfig.path, payload);
        setSuccess("Successfully created!");
      }
      setForm(null);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save item.");
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title || item.name}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api.delete(`${currentConfig.path}/${item._id || item.id}`);
      setSuccess("Item deleted successfully.");
      loadAll();
    } catch {
      setError("Failed to delete item.");
    }
  };

  const getEmptyForm = () => {
    if (isGuide) return { section: guideSection, title: "", subtitle: "", detail: "", link: "", imageUrl: "", displayOrder: visibleItems.length + 1, status: "active" };
    return { name: "", address: "", description: "", googleMapsLink: "", category: "", price: "", displayOrder: visibleItems.length + 1, status: "active" };
  };

  const setField = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  // Stays and food read better under their group headings; ungrouped items still show.
  const listGroups = () => {
    if (isGuide) return [{ title: "", items: visibleItems }];
    const groups = new Map(activeTab === "places" ? stayGroups.map((group) => [group.title, []]) : []);
    visibleItems.forEach((item) => {
      const title = item.category || "No group";
      groups.set(title, [...(groups.get(title) || []), item]);
    });
    return [...groups.entries()].filter(([, rows]) => rows.length > 0).map(([title, rows]) => ({ title, items: rows }));
  };

  const cafeCategories = [...new Set(data.cafes.map((cafe) => cafe.category).filter(Boolean))];

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#081B33] via-[#0D47A1] to-[#1565C0] p-6 md:p-8 mb-6">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute right-32 -bottom-24 w-56 h-56 rounded-full bg-[#4FC3F7]/10" aria-hidden="true" />
        <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <p className="text-[#8fd6f6] font-bold text-xs tracking-widest uppercase mb-2">GHC 2026 · Venue page</p>
            <p className="text-3xl md:text-4xl font-extrabold text-white tracking-tight" role="heading" aria-level="1">Hospitality</p>
            <p className="text-white/75 text-sm mt-2 max-w-xl">Everything delegates see about getting there, staying and exploring Delhi. Saved changes go live straight away.</p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <a href="/venue" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
              <ExternalLink size={16} /> View page
            </a>
            {!form && (
              <button type="button" onClick={() => setForm(getEmptyForm())} className="inline-flex items-center gap-2 bg-white text-[#0D47A1] hover:bg-[#E3F2FD] px-4 py-2.5 rounded-xl text-sm font-bold transition-colors">
                <Plus size={16} /> Add New {currentConfig.singular}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        {Object.entries(endpoints).map(([key, config]) => {
          const Icon = config.icon;
          const selected = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => switchTab(key)}
              className={`text-left flex items-center gap-4 p-4 rounded-2xl border transition-all ${selected ? "bg-white border-[#0D47A1] shadow-[0_4px_16px_rgba(13,71,161,0.14)]" : "bg-white border-[#EAECF0] hover:border-[#0D47A1]/40"}`}
            >
              <span className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${selected ? "bg-[#0D47A1] text-white" : "bg-[#0D47A1]/10 text-[#0D47A1]"}`}>
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-[#101828]">{config.title}</span>
                <span className="block text-xs text-[#667085] truncate">{config.hint}</span>
              </span>
              <span className="text-lg font-extrabold text-[#0D47A1]">{data[config.key].length}</span>
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {error && (
          <div className="mb-5 p-4 bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] rounded-xl flex items-center gap-3 text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}
        {success && (
          <div className="mb-5 p-4 bg-[#ECFDF3] border border-[#ABEFC6] text-[#067647] rounded-xl flex items-center gap-3 text-sm font-medium">
            <CheckCircle2 size={18} className="shrink-0" /> {success}
          </div>
        )}
      </div>

      {form ? (
        <form onSubmit={handleSubmit} className={`${cardClass} p-6 md:p-8 max-w-3xl mx-auto`}>
          <div className="flex justify-between items-start gap-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-[#101828]">{formId ? `Edit ${currentConfig.singular}` : `Add New ${currentConfig.singular}`}</h2>
              {isGuide && <p className="text-sm text-[#0D47A1] font-semibold mt-1">{guideFields.label}</p>}
            </div>
            <button type="button" onClick={() => setForm(null)} aria-label="Cancel" className="p-2 rounded-lg text-[#667085] hover:bg-[#F2F4F7] transition-colors"><X size={18} /></button>
          </div>

          <div className="space-y-5">
            {isGuide ? (
              <>
                {["title", "subtitle", "link", "imageUrl"].filter((field) => guideFields[field]).map((field) => (
                  <Field key={field} id={`guide-${field}`} label={guideFields[field]}>
                    <input id={`guide-${field}`} required={field === "title"} type="text" value={form[field] || ""} onChange={setField(field)} className={inputClass} />
                  </Field>
                ))}
                {guideFields.detail && (
                  <Field id="guide-detail" label={guideFields.detail}>
                    <textarea id="guide-detail" rows={3} value={form.detail || ""} onChange={setField("detail")} className={`${inputClass} resize-none`} />
                  </Field>
                )}
              </>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-5">
                  <Field id="item-name" label="Name">
                    <input id="item-name" required type="text" value={form.name || ""} onChange={setField("name")} className={inputClass} placeholder={activeTab === "cafe" ? "e.g. Saravana Bhavan" : "e.g. Central Delhi Hotel"} />
                  </Field>
                  <Field id="item-address" label="Address / Area">
                    <input id="item-address" required type="text" value={form.address || ""} onChange={setField("address")} className={inputClass} placeholder={activeTab === "cafe" ? "e.g. Connaught Place" : "e.g. Sunder Nagar · approx. 1 km"} />
                  </Field>
                  <Field id="item-category" label={activeTab === "cafe" ? "Food Group" : "Stay Group"}>
                    {activeTab === "cafe" ? (
                      <>
                        <input id="item-category" list="cafe-categories" type="text" value={form.category || ""} onChange={setField("category")} className={inputClass} placeholder="e.g. Student-friendly food" />
                        <datalist id="cafe-categories">{cafeCategories.map((category) => <option key={category} value={category} />)}</datalist>
                      </>
                    ) : (
                      <select id="item-category" required value={form.category || ""} onChange={setField("category")} className={inputClass}>
                        <option value="">Choose a group</option>
                        {stayGroups.map((group) => <option key={group.id} value={group.title}>{group.title}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field id="item-price" label={activeTab === "cafe" ? "Price per person" : "Rate"}>
                    <input id="item-price" type="text" value={form.price || ""} onChange={setField("price")} className={inputClass} placeholder={activeTab === "cafe" ? "e.g. ₹150–350" : "e.g. ₹4,000–₹8,000"} />
                  </Field>
                </div>
                <Field id="item-maps" label="Google Maps Link">
                  <input id="item-maps" type="url" value={form.googleMapsLink || ""} onChange={setField("googleMapsLink")} className={inputClass} placeholder="https://maps.google.com/..." />
                </Field>
                {activeTab === "places" && (
                  <Field id="item-booking" label="Booking Link">
                    <input id="item-booking" type="url" value={form.bookingLink || ""} onChange={setField("bookingLink")} className={inputClass} placeholder="https://www.booking.com/..." />
                  </Field>
                )}
                <Field id="item-description" label={activeTab === "cafe" ? "Speciality or note" : "Warning or note"}>
                  <textarea id="item-description" rows={3} value={form.description || ""} onChange={setField("description")} className={`${inputClass} resize-none`} />
                </Field>
              </>
            )}

            <div className="grid sm:grid-cols-2 gap-5 items-start">
              <Field id="item-order" label="Display Order" hint="Lower numbers appear first.">
                <input id="item-order" type="number" value={form.displayOrder ?? 0} onChange={setField("displayOrder")} className={inputClass} />
              </Field>
              <div>
                <p className={labelClass}>Visibility</p>
                <label className="flex items-center gap-3 cursor-pointer py-2.5">
                  <input type="checkbox" className="sr-only peer" checked={form.status !== "inactive"} onChange={(event) => setForm({ ...form, status: event.target.checked ? "active" : "inactive" })} />
                  <span className={`relative w-11 h-6 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#0D47A1]/40 ${form.status !== "inactive" ? "bg-[#0D47A1]" : "bg-[#D0D5DD]"}`}>
                    <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${form.status !== "inactive" ? "translate-x-5" : ""}`} />
                  </span>
                  <span className="text-sm font-semibold text-[#344054]">{form.status !== "inactive" ? "Shown on the Venue page" : "Hidden from the Venue page"}</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-[#F2F4F7]">
            <button type="submit" className="bg-[#0D47A1] hover:bg-[#1565C0] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors">Save</button>
            <button type="button" onClick={() => setForm(null)} className="px-4 py-2.5 rounded-xl text-sm font-bold text-[#475467] hover:bg-[#F2F4F7] transition-colors">Discard</button>
          </div>
        </form>
      ) : (
        <div className={isGuide ? "grid lg:grid-cols-[280px_1fr] gap-6 items-start" : ""}>
          {isGuide && (
            <nav aria-label="Travel Guide sections" className={`${cardClass} p-3 space-y-4`}>
              {GUIDE_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className="px-3 pt-1 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-[#98A2B3]">{group.title}</p>
                  {group.sections.map((section) => {
                    const selected = guideSection === section;
                    return (
                      <button
                        key={section}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setGuideSection(section)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors ${selected ? "bg-[#0D47A1]/10 text-[#0D47A1] font-bold" : "text-[#344054] hover:bg-[#F2F4F7]"}`}
                      >
                        <span>{GUIDE_SECTIONS[section].label}</span>
                        <span className="text-xs font-semibold text-[#667085]">{guideInSection(section).length}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          )}

          <div className="space-y-6 min-w-0">
            {loading ? (
              <div className={`${cardClass} py-16 flex justify-center`}>
                <Loader2 className="animate-spin text-[#0D47A1]" aria-label="Loading" />
              </div>
            ) : visibleItems.length === 0 ? (
              <div className={`${cardClass} py-14 px-6 text-center`}>
                <MapPin className="w-9 h-9 text-[#98A2B3] mx-auto mb-3" />
                <h2 className="text-base font-bold text-[#101828] mb-1">Nothing here yet</h2>
                <p className="text-sm text-[#667085] mb-4">Items you add here appear on the Venue page.</p>
                <button type="button" onClick={() => setForm(getEmptyForm())} className="text-sm font-bold text-[#0D47A1] hover:underline">
                  Add the first {currentConfig.singular.toLowerCase()}
                </button>
              </div>
            ) : listGroups().map((group) => (
              <section key={group.title || "items"}>
                {group.title && (
                  <h2 className="flex items-center gap-2 text-sm font-extrabold text-[#101828] mb-2 px-1">
                    {group.title} <span className="text-xs font-bold text-[#667085] bg-[#F2F4F7] px-2 py-0.5 rounded-full">{group.items.length}</span>
                  </h2>
                )}
                <div className={`${cardClass} overflow-hidden`}>
                  {group.items.map((item) => (
                    <ItemRow key={item._id || item.id} item={item} onEdit={() => setForm(item)} onDelete={() => handleDelete(item)} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalityCMS;
