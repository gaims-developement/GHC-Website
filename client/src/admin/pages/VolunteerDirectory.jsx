import { Award, CalendarClock, ClipboardList, ListChecks, Megaphone, Network, Plus, UserCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const configs = {
  recruitment: { title: "Recruitment", endpoint: "/api/volunteers", key: "volunteers", icon: UserCheck, empty: { fullName: "", email: "", phone: "", applicationStatus: "applied" }, fields: [["fullName", "Full Name"], ["email", "Email"], ["phone", "Phone"], ["applicationStatus", "Status", "select", ["applied", "shortlisted", "interviewed", "selected", "rejected", "inactive"]]] },
  interviews: { title: "Interviews", endpoint: "/api/volunteer-interviews", key: "interviews", icon: ClipboardList, empty: { volunteerId: "", scheduledAt: "", feedback: "", score: 0, status: "scheduled" }, fields: [["volunteerId", "Volunteer", "volunteer"], ["scheduledAt", "Scheduled", "datetime-local"], ["feedback", "Feedback", "textarea"], ["score", "Score", "number"], ["status", "Status", "select", ["scheduled", "completed", "approved", "rejected"]]] },
  departments: { title: "Volunteer Departments", endpoint: "/api/volunteer-departments", key: "departments", icon: Network, empty: { name: "", description: "", isActive: true }, fields: [["name", "Name"], ["description", "Description", "textarea"]] },
  shifts: { title: "Shifts", endpoint: "/api/shifts", key: "shifts", icon: CalendarClock, empty: { title: "", departmentId: "", date: "", startTime: "", endTime: "", location: "", capacity: 0 }, fields: [["title", "Title"], ["departmentId", "Department", "department"], ["date", "Date", "date"], ["startTime", "Start Time", "time"], ["endTime", "End Time", "time"], ["location", "Location"], ["capacity", "Capacity", "number"]] },
  attendance: { title: "Attendance", endpoint: "/api/volunteer-attendance", key: "attendance", icon: UserCheck, empty: { volunteerId: "", checkInTime: "", checkOutTime: "", location: "" }, fields: [["volunteerId", "Volunteer", "volunteer"], ["checkInTime", "Check In", "datetime-local"], ["checkOutTime", "Check Out", "datetime-local"], ["location", "Location"]] },
  tasks: { title: "Tasks", endpoint: "/api/volunteer-tasks", key: "tasks", icon: ListChecks, empty: { title: "", description: "", volunteerId: "", departmentId: "", priority: "medium", status: "todo", dueDate: "" }, fields: [["title", "Title"], ["description", "Description", "textarea"], ["volunteerId", "Volunteer", "volunteer"], ["departmentId", "Department", "department"], ["priority", "Priority", "select", ["low", "medium", "high", "critical"]], ["status", "Status", "select", ["todo", "in_progress", "done"]], ["dueDate", "Due Date", "datetime-local"]] },
  certificates: { title: "Volunteer Certificates", endpoint: "/api/volunteer-certificates", key: "certificates", icon: Award, empty: { volunteerId: "", certificateType: "volunteer", certificateUrl: "" }, fields: [["volunteerId", "Volunteer", "volunteer"], ["certificateType", "Certificate Type"], ["certificateUrl", "Certificate URL"]] },
  announcements: { title: "Volunteer Announcements", endpoint: "/api/volunteer-announcements", key: "announcements", icon: Megaphone, empty: { title: "", message: "", departmentId: "", publishedAt: "" }, fields: [["title", "Title"], ["message", "Message", "textarea"], ["departmentId", "Department", "department"], ["publishedAt", "Publish At", "datetime-local"]] },
};

function VolunteerDirectory({ api, type = "departments" }) {
  const config = configs[type] || configs.departments;
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const requests = [api.get(config.endpoint), api.get("/api/volunteers"), api.get("/api/volunteer-departments")];
      const [mainResponse, volunteerResponse, departmentResponse] = await Promise.all(requests);
      setItems(mainResponse.data[config.key] || mainResponse.data.items || []);
      setVolunteers(volunteerResponse.data.volunteers || []);
      setDepartments(departmentResponse.data.departments || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.endpoint, config.key, config.title]);

  useEffect(() => { queueMicrotask(load); }, [load]);
  useEffect(() => { queueMicrotask(() => setForm(config.empty)); }, [config.empty]);

  const normalized = useMemo(() => items.map((item) => ({
    ...item,
    titleText: item.title || item.name || item.full_name || item.certificate_type || item.feedback || item.id,
    subtitle: item.description || item.message || item.email || item.location || departments.find((department) => department.id === item.department_id)?.name,
  })), [departments, items]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await api.post(config.endpoint, form);
      setMessage(`${config.title} saved.`);
      setForm(config.empty);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  return (
    <div className="admin-speakers-page volunteer-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Volunteer Workforce</p>
        <h1>{config.title}</h1>
        <p className="admin-muted">CMS-driven volunteer operations with no hardcoded departments.</p>
      </section>
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              {config.fields.map(([field, label, inputType, options]) => <label key={field}>{label}{renderField({ field, inputType, options, form, volunteers, departments, updateField })}</label>)}
            </div>
            {"isActive" in form && <div className="speaker-toggle-row"><label><input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => updateField("isActive", event.target.checked)} /> Active</label></div>}
            <div className="speaker-form-actions"><button type="submit"><Plus size={16} /> Save</button></div>
          </div>
        </form>
      </section>
      <section className="payment-card-grid">
        {normalized.map((item) => (
          <article className="payment-card" key={item.id}>
            <Icon size={20} />
            <strong>{item.titleText}</strong>
            <p>{item.subtitle || "Volunteer record"}</p>
            <dl>
              {item.application_status && <div><dt>Status</dt><dd>{item.application_status}</dd></div>}
              {item.status && <div><dt>Status</dt><dd>{item.status}</dd></div>}
              {item.capacity !== undefined && <div><dt>Capacity</dt><dd>{item.capacity}</dd></div>}
              {item.overall_score !== undefined && <div><dt>Score</dt><dd>{item.overall_score}</dd></div>}
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}

function renderField({ field, inputType, options = [], form, volunteers, departments, updateField }) {
  if (inputType === "volunteer") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}><option value="">Select volunteer</option>{volunteers.map((volunteer) => <option key={volunteer.id} value={volunteer.id}>{volunteer.full_name}</option>)}</select>;
  if (inputType === "department") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}><option value="">Select department</option>{departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}</select>;
  if (inputType === "select") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
  if (inputType === "textarea") return <textarea rows="3" value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} />;
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
}

export default VolunteerDirectory;
