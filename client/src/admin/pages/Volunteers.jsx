import { Award, CalendarClock, ClipboardCheck, Plus, Search, UserCheck, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const emptyVolunteer = {
  fullName: "",
  email: "",
  phone: "",
  gender: "",
  dateOfBirth: "",
  institution: "",
  course: "",
  yearOfStudy: "",
  city: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  skills: "",
  availability: "",
  applicationStatus: "applied",
  joinedAt: "",
};

const statuses = ["all", "applied", "shortlisted", "interviewed", "selected", "rejected", "inactive"];

function Volunteers({ api }) {
  const [dashboard, setDashboard] = useState({ metrics: {}, departmentDistribution: [], topPerformers: [], recentActivity: [] });
  const [volunteers, setVolunteers] = useState([]);
  const [form, setForm] = useState(emptyVolunteer);
  const [editing, setEditing] = useState(null);
  const [files, setFiles] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [dashboardResponse, volunteersResponse] = await Promise.all([
        api.get("/api/volunteer-dashboard"),
        api.get("/api/volunteers"),
      ]);
      setDashboard(dashboardResponse.data || {});
      setVolunteers(volunteersResponse.data.volunteers || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load volunteers.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const filtered = useMemo(() => volunteers.filter((volunteer) => {
    const text = [volunteer.full_name, volunteer.email, volunteer.phone, volunteer.institution, volunteer.skills].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (status === "all" || volunteer.application_status === status);
  }), [search, status, volunteers]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
    if (files.profilePhoto) payload.append("profilePhoto", files.profilePhoto);
    if (files.resume) payload.append("resume", files.resume);
    if (files.idCard) payload.append("idCard", files.idCard);
    try {
      if (editing?.id) await api.put(`/api/volunteers/${editing.id}`, payload);
      else await api.post("/api/volunteers", payload);
      setMessage("Volunteer saved.");
      setForm(emptyVolunteer);
      setEditing(null);
      setFiles({});
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save volunteer.");
    }
  };

  const edit = (volunteer) => {
    setEditing(volunteer);
    setForm({
      ...emptyVolunteer,
      ...volunteer,
      fullName: volunteer.full_name || "",
      dateOfBirth: volunteer.date_of_birth?.slice(0, 10) || "",
      yearOfStudy: volunteer.year_of_study || "",
      emergencyContactName: volunteer.emergency_contact_name || "",
      emergencyContactPhone: volunteer.emergency_contact_phone || "",
      applicationStatus: volunteer.application_status || "applied",
      joinedAt: volunteer.joined_at?.slice(0, 16) || "",
    });
  };

  const checkIn = async (volunteer) => {
    await api.post(`/api/volunteers/${volunteer.id}/check-in`, { location: "CMS manual check-in" });
    setMessage(`${volunteer.full_name} checked in.`);
    await load();
  };

  const metrics = dashboard.metrics || {};
  return (
    <div className="admin-speakers-page volunteer-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Volunteer Workforce</p>
        <h1>Volunteer Management</h1>
        <p className="admin-muted">Recruit, assign, schedule, track attendance and recognize volunteers across CMS-driven departments.</p>
      </section>
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-kpi-grid">
        <Kpi icon={Users} label="Total Volunteers" value={metrics.totalVolunteers || 0} />
        <Kpi icon={UserCheck} label="Active Volunteers" value={metrics.activeVolunteers || 0} />
        <Kpi icon={ClipboardCheck} label="Pending Applications" value={metrics.pendingApplications || 0} />
        <Kpi icon={CalendarClock} label="Today's Shifts" value={metrics.todayShifts || 0} />
        <Kpi icon={Award} label="Attendance Rate" value={`${metrics.attendanceRate || 0}%`} />
      </section>
      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <p className="admin-eyebrow">{editing ? "Edit Volunteer" : "New Volunteer"}</p>
            <div className="speaker-form-grid">
              <label>Full Name<input value={form.fullName || ""} onChange={(event) => updateField("fullName", event.target.value)} required /></label>
              <label>Email<input type="email" value={form.email || ""} onChange={(event) => updateField("email", event.target.value)} /></label>
              <label>Phone<input value={form.phone || ""} onChange={(event) => updateField("phone", event.target.value)} /></label>
              <label>Gender<input value={form.gender || ""} onChange={(event) => updateField("gender", event.target.value)} /></label>
              <label>Date of Birth<input type="date" value={form.dateOfBirth || ""} onChange={(event) => updateField("dateOfBirth", event.target.value)} /></label>
              <label>Institution<input value={form.institution || ""} onChange={(event) => updateField("institution", event.target.value)} /></label>
              <label>Course<input value={form.course || ""} onChange={(event) => updateField("course", event.target.value)} /></label>
              <label>Year<input value={form.yearOfStudy || ""} onChange={(event) => updateField("yearOfStudy", event.target.value)} /></label>
              <label>City<input value={form.city || ""} onChange={(event) => updateField("city", event.target.value)} /></label>
              <label>Status<select value={form.applicationStatus} onChange={(event) => updateField("applicationStatus", event.target.value)}>{statuses.filter((item) => item !== "all").map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            </div>
            <label>Skills<textarea rows="3" value={form.skills || ""} onChange={(event) => updateField("skills", event.target.value)} /></label>
            <label>Availability<textarea rows="3" value={form.availability || ""} onChange={(event) => updateField("availability", event.target.value)} /></label>
            <div className="speaker-form-grid">
              <label>Emergency Contact<input value={form.emergencyContactName || ""} onChange={(event) => updateField("emergencyContactName", event.target.value)} /></label>
              <label>Emergency Phone<input value={form.emergencyContactPhone || ""} onChange={(event) => updateField("emergencyContactPhone", event.target.value)} /></label>
              <label>Profile Photo<input type="file" accept="image/*" onChange={(event) => setFiles({ ...files, profilePhoto: event.target.files?.[0] })} /></label>
              <label>Resume<input type="file" onChange={(event) => setFiles({ ...files, resume: event.target.files?.[0] })} /></label>
              <label>ID Card<input type="file" onChange={(event) => setFiles({ ...files, idCard: event.target.files?.[0] })} /></label>
            </div>
            <div className="speaker-form-actions"><button type="submit"><Plus size={16} /> Save Volunteer</button>{editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyVolunteer); }}>Cancel</button>}</div>
          </div>
        </form>
      </section>
      <section className="admin-panel">
        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search volunteers" /></label>
          <div className="speaker-filter-row">{statuses.map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}</div>
        </div>
      </section>
      <section className="payment-card-grid">
        {filtered.map((volunteer) => (
          <article className="payment-card" key={volunteer.id}>
            <span className="status-pill">{volunteer.application_status}</span>
            <strong>{volunteer.full_name}</strong>
            <p>{volunteer.institution || volunteer.city || "Volunteer profile"}</p>
            <dl>
              <div><dt>Email</dt><dd>{volunteer.email || "-"}</dd></div>
              <div><dt>Phone</dt><dd>{volunteer.phone || "-"}</dd></div>
              <div><dt>Skills</dt><dd>{volunteer.skills || "-"}</dd></div>
            </dl>
            <div className="payment-card-actions"><button onClick={() => edit(volunteer)}>Edit</button><button onClick={() => checkIn(volunteer)}>Check in</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return <article className="admin-kpi-card"><Icon size={20} /><strong>{value}</strong><span>{label}</span></article>;
}

export default Volunteers;
