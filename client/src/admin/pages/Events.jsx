import { Archive, CalendarDays, CheckCircle2, Copy, CreditCard, FileCheck2, Plus, Search, Ticket, Users, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyEvent = {
  title: "",
  slug: "",
  description: "",
  eventTypeId: "",
  status: "draft",
  startDatetime: "",
  endDatetime: "",
  venueId: "",
  capacity: 0,
  registrationLimit: 0,
  fee: 0,
  prerequisites: "",
  learningOutcomes: "",
  waitlistEnabled: false,
  registrationRequired: true,
  registrationOpen: true,
  manualApproval: false,
  certificateEnabled: false,
  bannerImage: "",
};

const statuses = ["all", "draft", "published", "cancelled", "completed", "archived"];
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const viewFromPage = (activePage) => {
  if (activePage === "events-create") return { mode: "create" };
  const match = activePage.match(/^event-(\d+)$/);
  if (match) return { mode: "detail", id: match[1] };
  return { mode: "list" };
};

function Events({ api, activePage, onNavigate }) {
  const view = viewFromPage(activePage);
  const [dashboard, setDashboard] = useState({ metrics: {}, recentRegistrations: [] });
  const [events, setEvents] = useState([]);
  const [types, setTypes] = useState([]);
  const [venues, setVenues] = useState([]);
  const [detail, setDetail] = useState(null);
  const [form, setForm] = useState(emptyEvent);
  const [banner, setBanner] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: "", slug: "", description: "", isActive: true });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");

  const loadBase = useCallback(async () => {
    setError("");
    try {
      const [dashboardResponse, eventsResponse, typesResponse, venuesResponse] = await Promise.all([
        api.get("/api/event-dashboard"),
        api.get("/api/events"),
        api.get("/api/event-types"),
        api.get("/api/venues"),
      ]);
      setDashboard(dashboardResponse.data || {});
      setEvents(eventsResponse.data.events || []);
      setTypes(typesResponse.data.types || []);
      setVenues(venuesResponse.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load events.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(loadBase);
  }, [loadBase]);

  useEffect(() => {
    if (view.mode === "create") {
      queueMicrotask(() => {
        setForm(emptyEvent);
        setDetail(null);
      });
      return;
    }
    if (view.mode !== "detail") return;
    api.get(`/api/events/${view.id}`).then((response) => {
      const event = response.data.event;
      setDetail(event);
      setForm({ ...emptyEvent, ...event, eventTypeId: event.eventTypeId || "", venueId: event.venueId || "" });
    }).catch((err) => setError(err.response?.data?.message || "Unable to load event."));
  }, [api, view.id, view.mode]);

  const filtered = useMemo(() => events.filter((event) => {
    const text = [event.title, event.eventTypeName, event.venueName].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (filter === "all" || event.status === filter);
  }), [events, filter, search]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
    if (banner) payload.append("banner", banner);
    try {
      const response = view.mode === "detail" ? await api.put(`/api/events/${view.id}`, payload) : await api.post("/api/events", payload);
      await loadBase();
      onNavigate(`event-${response.data.event.id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save event.");
    }
  };

  const action = async (path) => {
    const response = await api.patch(path);
    setDetail(response.data.event);
    await loadBase();
  };

  const duplicate = async () => {
    const response = await api.post(`/api/events/${view.id}/duplicate`);
    await loadBase();
    onNavigate(`event-${response.data.event.id}`);
  };

  const saveType = async (event) => {
    event.preventDefault();
    await api.post("/api/event-types", typeForm);
    setTypeForm({ name: "", slug: "", description: "", isActive: true });
    const response = await api.get("/api/event-types");
    setTypes(response.data.types || []);
  };

  if (view.mode === "create" || view.mode === "detail") {
    return (
      <div className="admin-speakers-page event-workspace">
        <section className="admin-panel">
          <div className="speaker-page-top">
            <div>
              <p className="admin-eyebrow">Events CMS</p>
              <h1>{view.mode === "create" ? "Create Event" : form.title || "Event Detail"}</h1>
              <p className="admin-muted">Configure event capacity, registration, venue, certification and publication settings.</p>
            </div>
            <button className="admin-secondary-button" onClick={() => onNavigate("events")}><X size={17} /> Close</button>
          </div>
        </section>
        {error && <div className="admin-error">{error}</div>}
        <section className="admin-panel">
          <form className="speaker-form" onSubmit={submit}>
            <div className="speaker-form-fields">
              <div className="speaker-form-grid">
                <label>Title<input value={form.title || ""} onChange={(event) => updateField("title", event.target.value)} required /></label>
                <label>Slug<input value={form.slug || ""} onChange={(event) => updateField("slug", event.target.value)} /></label>
                <label>Type<select value={form.eventTypeId || ""} onChange={(event) => updateField("eventTypeId", event.target.value)}><option value="">Select type</option>{types.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
                <label>Status<select value={form.status || "draft"} onChange={(event) => updateField("status", event.target.value)}>{statuses.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <label>Start<input type="datetime-local" value={String(form.startDatetime || "").slice(0, 16)} onChange={(event) => updateField("startDatetime", event.target.value)} /></label>
                <label>End<input type="datetime-local" value={String(form.endDatetime || "").slice(0, 16)} onChange={(event) => updateField("endDatetime", event.target.value)} /></label>
                <label>Venue<select value={form.venueId || ""} onChange={(event) => updateField("venueId", event.target.value)}><option value="">Select venue</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}</option>)}</select></label>
                <label>Capacity<input type="number" value={form.capacity || 0} onChange={(event) => updateField("capacity", event.target.value)} /></label>
                <label>Registration Limit<input type="number" value={form.registrationLimit || 0} onChange={(event) => updateField("registrationLimit", event.target.value)} /></label>
                <label>Fee<input type="number" value={form.fee || 0} onChange={(event) => updateField("fee", event.target.value)} /></label>
              </div>
              <label>Description<textarea rows="4" value={form.description || ""} onChange={(event) => updateField("description", event.target.value)} /></label>
              <label>Prerequisites<textarea rows="3" value={form.prerequisites || ""} onChange={(event) => updateField("prerequisites", event.target.value)} /></label>
              <label>Learning Outcomes<textarea rows="3" value={form.learningOutcomes || ""} onChange={(event) => updateField("learningOutcomes", event.target.value)} /></label>
              <div className="speaker-form-grid">
                <label>Banner URL<input value={form.bannerImage || ""} onChange={(event) => updateField("bannerImage", event.target.value)} /></label>
                <label>Upload Banner<input type="file" accept="image/*" onChange={(event) => setBanner(event.target.files?.[0] || null)} /></label>
              </div>
              <div className="speaker-toggle-row">
                {["waitlistEnabled", "registrationRequired", "registrationOpen", "manualApproval", "certificateEnabled"].map((field) => (
                  <label key={field}><input type="checkbox" checked={Boolean(form[field])} onChange={(event) => updateField(field, event.target.checked)} /> {field.replace(/[A-Z]/g, " $&")}</label>
                ))}
              </div>
              <div className="speaker-form-actions">
                <button type="submit">Save Event</button>
                {view.mode === "detail" && <button type="button" onClick={() => action(`/api/events/${view.id}/publish`)}><CheckCircle2 size={16} /> Publish</button>}
                {view.mode === "detail" && <button type="button" onClick={duplicate}><Copy size={16} /> Duplicate</button>}
                {view.mode === "detail" && <button type="button" onClick={() => action(`/api/events/${view.id}/archive`)}><Archive size={16} /> Archive</button>}
              </div>
            </div>
          </form>
        </section>
        {detail && (
          <section className="payment-card-grid">
            <EventKpi icon={Ticket} label="Registrations" value={detail.registeredCount} />
            <EventKpi icon={Users} label="Waitlist" value={detail.waitlistCount} />
            <EventKpi icon={CreditCard} label="Revenue" value={money(detail.revenue)} />
            <EventKpi icon={FileCheck2} label="Certificates" value={detail.certificates?.length || 0} />
          </section>
        )}
      </div>
    );
  }

  const metrics = dashboard.metrics || {};
  return (
    <div className="admin-speakers-page event-workspace">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Events CMS</p>
            <h1>Workshops & Events</h1>
            <p className="admin-muted">Manage workshops, masterclasses, competitions, hackathons and parallel event registrations.</p>
          </div>
          <button className="admin-primary-button" onClick={() => onNavigate("events-create")}><Plus size={18} /> Add Event</button>
        </div>
        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search events" /></label>
          <div className="speaker-filter-row">{statuses.map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => setFilter(item)}>{item}</button>)}</div>
        </div>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-kpi-grid">
        <EventKpi icon={CalendarDays} label="Total Events" value={metrics.totalEvents || 0} />
        <EventKpi icon={CheckCircle2} label="Published" value={metrics.publishedEvents || 0} />
        <EventKpi icon={Ticket} label="Registrations" value={metrics.registrations || 0} />
        <EventKpi icon={CreditCard} label="Revenue" value={money(metrics.revenueGenerated)} />
        <EventKpi icon={FileCheck2} label="Certificates" value={metrics.certificatesIssued || 0} />
        <EventKpi icon={Users} label="Feedback Score" value={Number(metrics.averageFeedbackScore || 0).toFixed(1)} />
      </section>
      <section className="payment-card-grid">
        {filtered.map((item) => (
          <article className="payment-card" key={item.id}>
            <span className="status-pill">{item.status}</span>
            <strong>{item.title}</strong>
            <p>{item.eventTypeName || "Unassigned type"} · {item.venueName || "No venue"}</p>
            <dl>
              <div><dt>Starts</dt><dd>{item.startDatetime ? new Date(item.startDatetime).toLocaleString() : "-"}</dd></div>
              <div><dt>Seats</dt><dd>{item.registeredCount}/{item.capacity || item.registrationLimit || "-"}</dd></div>
              <div><dt>Available</dt><dd>{item.availableSeats}</dd></div>
              <div><dt>Fee</dt><dd>{money(item.fee)}</dd></div>
            </dl>
            <div className="payment-card-actions"><button onClick={() => onNavigate(`event-${item.id}`)}>Open</button></div>
          </article>
        ))}
      </section>
      <section className="admin-panel">
        <h2>Event Types</h2>
        <form className="speaker-form" onSubmit={saveType}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              <label>Name<input value={typeForm.name} onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })} required /></label>
              <label>Slug<input value={typeForm.slug} onChange={(event) => setTypeForm({ ...typeForm, slug: event.target.value })} /></label>
              <label>Description<input value={typeForm.description} onChange={(event) => setTypeForm({ ...typeForm, description: event.target.value })} /></label>
              <label className="speaker-toggle-row"><input type="checkbox" checked={typeForm.isActive} onChange={(event) => setTypeForm({ ...typeForm, isActive: event.target.checked })} /> Active</label>
            </div>
            <div className="speaker-form-actions"><button type="submit"><Plus size={16} /> Save Type</button></div>
          </div>
        </form>
        <div className="speaker-filter-row">{types.map((type) => <button key={type.id} type="button">{type.name}</button>)}</div>
      </section>
    </div>
  );
}

function EventKpi({ icon: Icon, label, value }) {
  return <article className="admin-kpi-card"><Icon size={20} /><strong>{value}</strong><span>{label}</span></article>;
}

export default Events;
