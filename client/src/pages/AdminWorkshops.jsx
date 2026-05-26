import { useMemo, useState } from "react";
import { ArrowLeft, Edit3, Plus, Save, Trash2, X } from "lucide-react";
import { createWorkshopSlug, deleteWorkshopById, formatWorkshopDate, getInitials, loadWorkshops, saveWorkshops, workshopCategories } from "../data/workshops";

const emptyForm = {
  id: "",
  slug: "",
  title: "",
  category: "Clinical Skills",
  facilitatorName: "",
  facilitatorDesignation: "",
  date: "",
  startTime: "",
  endTime: "",
  room: "",
  totalSeats: 30,
  filledSeats: 0,
  duration: "2 hrs",
  image: "",
  description: "",
  agenda: [],
  requirementsText: "",
  learningOutcomesText: "",
  whoShouldAttendText: "",
  prerequisites: "",
  faq: [],
};

const toForm = (workshop) => ({
  id: workshop.id,
  slug: workshop.slug || createWorkshopSlug(workshop.title),
  title: workshop.title,
  category: workshop.category,
  facilitatorName: workshop.facilitator.name,
  facilitatorDesignation: workshop.facilitator.designation || "",
  date: /^\d{4}-\d{2}-\d{2}$/.test(workshop.date) ? workshop.date : "",
  startTime: workshop.startTime || "",
  endTime: workshop.endTime || "",
  room: workshop.room || "",
  totalSeats: workshop.seats.total,
  filledSeats: workshop.seats.filled,
  duration: workshop.duration || "2 hrs",
  image: workshop.image || "",
  description: workshop.description || "",
  agenda: workshop.agenda || [],
  requirementsText: (workshop.requirements || []).join(", "),
  learningOutcomesText: (workshop.learningOutcomes || []).join("\n"),
  whoShouldAttendText: (workshop.whoShouldAttend || []).join("\n"),
  prerequisites: workshop.prerequisites || "",
  faq: workshop.faqs || [],
});

const fromForm = (form) => ({
  id: form.id || `ws-${Date.now()}`,
  slug: form.slug || createWorkshopSlug(form.title),
  title: form.title,
  category: form.category,
  duration: form.duration,
  facilitator: {
    name: form.facilitatorName,
    initials: getInitials(form.facilitatorName),
    designation: form.facilitatorDesignation,
  },
  seats: {
    filled: Number(form.filledSeats || 0),
    total: Number(form.totalSeats || 0),
  },
  date: form.date,
  startTime: form.startTime,
  endTime: form.endTime,
  room: form.room,
  image: form.image,
  description: form.description,
  agenda: form.agenda.filter((item) => item.time || item.title || item.desc),
  requirements: form.requirementsText.split(",").map((item) => item.trim()).filter(Boolean),
  learningOutcomes: form.learningOutcomesText.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
  whoShouldAttend: form.whoShouldAttendText.split(/\n|,/).map((item) => item.trim()).filter(Boolean),
  prerequisites: form.prerequisites,
  faqs: form.faq.filter((item) => item.question || item.answer),
});

export default function AdminWorkshops() {
  const [workshops, setWorkshops] = useState(() => loadWorkshops());
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const allowed = useMemo(() => localStorage.getItem("ghc_admin") === "true", []);

  const persist = (next) => {
    setWorkshops(saveWorkshops(next));
  };

  const editWorkshop = (workshop) => {
    setForm(toForm(workshop));
    setOpen(true);
  };

  const deleteWorkshop = (event, id) => {
    event.stopPropagation();
    setWorkshops(deleteWorkshopById(id));
  };

  const submit = (event) => {
    event.preventDefault();
    const saved = fromForm({ ...form, slug: form.slug || createWorkshopSlug(form.title) });
    const exists = workshops.some((workshop) => workshop.id === saved.id);
    persist(exists ? workshops.map((workshop) => (workshop.id === saved.id ? saved : workshop)) : [saved, ...workshops]);
    setOpen(false);
    setForm(emptyForm);
  };

  const updateAgenda = (index, key, value) => {
    setForm((current) => ({
      ...current,
      agenda: current.agenda.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)),
    }));
  };

  if (!allowed) {
    return (
      <main className="admin-workshops-page">
        <div className="admin-workshops-topbar"><a href="/admin"><ArrowLeft className="h-4 w-4" />Back to Admin</a></div>
        <section className="admin-workshops-locked">
          <h1>Workshop Manager Locked</h1>
          <p>Set <code>ghc_admin</code> to <code>true</code> in localStorage to access this manager.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-workshops-page">
      <div className="admin-workshops-topbar"><a href="/admin"><ArrowLeft className="h-4 w-4" />Back to Admin</a></div>
      <section className="admin-workshops-shell">
        <header>
          <div>
            <span>Operations</span>
            <h1>Workshop Manager</h1>
          </div>
          <button type="button" onClick={() => { setForm(emptyForm); setOpen(true); }}><Plus className="h-4 w-4" />Add Workshop</button>
        </header>

        <div className="admin-workshop-list">
          {workshops.map((workshop) => (
            <article key={workshop.id} onClick={() => editWorkshop(workshop)}>
              <div>
                <h2>{workshop.title}</h2>
                <p><span>{workshop.category}</span>{formatWorkshopDate(workshop.date)} · {workshop.seats.filled}/{workshop.seats.total} seats</p>
              </div>
              <div>
                <button type="button" onClick={(event) => { event.stopPropagation(); editWorkshop(workshop); }}><Edit3 className="h-4 w-4" /></button>
                <button type="button" onClick={(event) => deleteWorkshop(event, workshop.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {open && (
        <section className="admin-workshop-sheet">
          <form onSubmit={submit}>
            <div className="admin-workshop-sheet-header">
              <h2>{form.id ? "Edit Workshop" : "Add Workshop"}</h2>
              <button type="button" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Workshop Title" required />
            <input value={form.slug || createWorkshopSlug(form.title)} onChange={(event) => setForm({ ...form, slug: event.target.value })} placeholder="Auto slug" />
            <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{workshopCategories.map((category) => <option key={category}>{category}</option>)}</select>
            <input value={form.facilitatorName} onChange={(event) => setForm({ ...form, facilitatorName: event.target.value })} placeholder="Facilitator Name" required />
            <input value={form.facilitatorDesignation} onChange={(event) => setForm({ ...form, facilitatorDesignation: event.target.value })} placeholder="Facilitator Designation" />
            <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            <div className="admin-workshop-field-grid">
              <input type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} />
              <input type="time" value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} />
            </div>
            <input value={form.room} onChange={(event) => setForm({ ...form, room: event.target.value })} placeholder="Room / Location" />
            <div className="admin-workshop-field-grid">
              <input type="number" value={form.totalSeats} onChange={(event) => setForm({ ...form, totalSeats: event.target.value })} placeholder="Total Seats" />
              <input type="number" value={form.filledSeats} onChange={(event) => setForm({ ...form, filledSeats: event.target.value })} placeholder="Filled Seats" />
            </div>
            <input value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} placeholder="Duration" />
            <input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="https://..." />
            <textarea rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Description" />
            <textarea rows={4} value={form.learningOutcomesText} onChange={(event) => setForm({ ...form, learningOutcomesText: event.target.value })} placeholder="Learning outcomes, one per line" />
            <textarea rows={4} value={form.whoShouldAttendText} onChange={(event) => setForm({ ...form, whoShouldAttendText: event.target.value })} placeholder="Who should attend, one per line" />
            <textarea rows={3} value={form.prerequisites} onChange={(event) => setForm({ ...form, prerequisites: event.target.value })} placeholder="Prerequisites" />

            <div className="admin-agenda-builder">
              <div><strong>Agenda Items</strong><button type="button" onClick={() => setForm((current) => ({ ...current, agenda: [...current.agenda, { time: "", title: "", desc: "" }] }))}>+ Add Agenda Item</button></div>
              {form.agenda.map((item, index) => (
                <div className="admin-agenda-row" key={index}>
                  <input value={item.time} onChange={(event) => updateAgenda(index, "time", event.target.value)} placeholder="Time" />
                  <input value={item.title} onChange={(event) => updateAgenda(index, "title", event.target.value)} placeholder="Title" />
                  <input value={item.desc} onChange={(event) => updateAgenda(index, "desc", event.target.value)} placeholder="Description" />
                </div>
              ))}
            </div>

            <input value={form.requirementsText} onChange={(event) => setForm({ ...form, requirementsText: event.target.value })} placeholder="Requirements, comma-separated" />
            <div className="admin-agenda-builder">
              <div><strong>FAQs</strong><button type="button" onClick={() => setForm((current) => ({ ...current, faq: [...current.faq, { question: "", answer: "" }] }))}>+ Add FAQ</button></div>
              {form.faq.map((item, index) => (
                <div className="admin-agenda-row" key={index}>
                  <input value={item.question} onChange={(event) => setForm((current) => ({ ...current, faq: current.faq.map((faq, faqIndex) => faqIndex === index ? { ...faq, question: event.target.value } : faq) }))} placeholder="Question" />
                  <input value={item.answer} onChange={(event) => setForm((current) => ({ ...current, faq: current.faq.map((faq, faqIndex) => faqIndex === index ? { ...faq, answer: event.target.value } : faq) }))} placeholder="Answer" />
                </div>
              ))}
            </div>
            <button type="submit" className="save"><Save className="h-4 w-4" />Save Workshop</button>
            <button type="button" className="cancel" onClick={() => setOpen(false)}>Cancel</button>
          </form>
        </section>
      )}
    </main>
  );
}
