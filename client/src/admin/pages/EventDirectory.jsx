import { CheckCircle2, CreditCard, FileCheck2, FolderUp, MessageSquareText, Plus, Ticket, MapPinned } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const configs = {
  "event-registrations": { title: "Event Registrations", endpoint: "/api/event-registrations", icon: Ticket, empty: { eventId: "", registrationId: "" }, fields: [["eventId", "Event", "event"], ["registrationId", "Registration ID"]] },
  "event-payments": { title: "Event Payments", endpoint: "/api/event-payments", icon: CreditCard, empty: { eventId: "", registrationId: "", amount: 0, paymentStatus: "pending", transactionId: "" }, fields: [["eventId", "Event", "event"], ["registrationId", "Registration ID"], ["amount", "Amount", "number"], ["paymentStatus", "Status", "select", ["pending", "paid", "refunded"]], ["transactionId", "Transaction ID"]] },
  "event-resources": { title: "Event Resources", endpoint: "/api/event-resources", icon: FolderUp, empty: { eventId: "", resourceName: "", resourceType: "pdf", resourceUrl: "" }, fields: [["eventId", "Event", "event"], ["resourceName", "Resource Name"], ["resourceType", "Type", "select", ["pdf", "ppt", "video", "link", "worksheet"]], ["resourceUrl", "Resource URL"]] },
  "event-feedback": { title: "Event Feedback", endpoint: "/api/event-feedback", icon: MessageSquareText, empty: { eventId: "", registrationId: "", rating: 5, npsScore: 0, feedback: "", suggestions: "" }, fields: [["eventId", "Event", "event"], ["registrationId", "Registration ID"], ["rating", "Rating", "number"], ["npsScore", "NPS Score", "number"], ["feedback", "Feedback", "textarea"], ["suggestions", "Suggestions", "textarea"]] },
  "event-certificates": { title: "Event Certificates", endpoint: "/api/event-certificates", icon: FileCheck2, empty: { eventId: "", registrationId: "", certificateType: "participation", certificateUrl: "" }, fields: [["eventId", "Event", "event"], ["registrationId", "Registration ID"], ["certificateType", "Certificate Type"], ["certificateUrl", "Certificate URL"]] },
  venues: {
    title: "Venues",
    endpoint: "/api/venues",
    key: "venues",
    icon: MapPinned,
    empty: { name: "", address: "", city: "", state: "", country: "", googleMapsLink: "", contactPerson: "", contactNumber: "", capacity: 0, description: "", status: "active", isActive: true },
    fields: [["name", "Name"], ["address", "Address"], ["city", "City"], ["state", "State"], ["country", "Country"], ["googleMapsLink", "Google Maps Link"], ["contactPerson", "Contact Person"], ["contactNumber", "Contact Number"], ["capacity", "Capacity", "number"], ["description", "Description", "textarea"], ["status", "Status", "select", ["active", "inactive"]]],
  },
};

function EventDirectory({ api, type = "event-registrations" }) {
  const config = configs[type] || configs["event-registrations"];
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const requests = [api.get(config.endpoint)];
      if (type !== "venues") requests.push(api.get("/api/events"));
      const [mainResponse, eventsResponse] = await Promise.all(requests);
      setItems(mainResponse.data[config.key || "items"] || []);
      setEvents(eventsResponse?.data?.events || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.endpoint, config.key, config.title, type]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  useEffect(() => {
    queueMicrotask(() => setForm(config.empty));
  }, [config.empty]);

  const normalized = useMemo(() => items.map((item) => ({
    ...item,
    eventName: events.find((event) => String(event.id) === String(item.event_id || item.eventId))?.title,
    titleText: item.name || item.resource_name || item.certificate_type || item.transaction_id || item.feedback || item.id,
  })), [events, items]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      let payload = form;
      if (type === "event-resources") {
        payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
        if (file) payload.append("file", file);
      }
      if (type === "event-registrations") await api.post(`/api/events/${form.eventId}/registrations`, form);
      else await api.post(config.endpoint, payload);
      setMessage(`${config.title} saved.`);
      setForm(config.empty);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  const checkIn = async (item) => {
    await api.patch(`/api/event-registrations/${item.id}/check-in`);
    setMessage("Attendee checked in.");
    await load();
  };

  return (
    <div className="admin-speakers-page event-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Events CMS</p>
        <h1>{config.title}</h1>
        <p className="admin-muted">Manage event operations with audit logging and permission-based access.</p>
      </section>
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              {config.fields.map(([field, label, inputType, options]) => <label key={field}>{label}{renderField({ field, inputType, options, form, events, updateField })}</label>)}
              {type === "event-resources" && <label>Upload File<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>}
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
            <p>{item.eventName || item.location || item.resource_type || "Event record"}</p>
            <dl>
              {item.attendance_status && <div><dt>Attendance</dt><dd>{item.attendance_status}</dd></div>}
              {item.payment_status && <div><dt>Payment</dt><dd>{item.payment_status}</dd></div>}
              {item.amount !== undefined && <div><dt>Amount</dt><dd>₹{Number(item.amount || 0).toLocaleString("en-IN")}</dd></div>}
              {item.rating !== undefined && <div><dt>Rating</dt><dd>{item.rating}</dd></div>}
              {item.capacity !== undefined && <div><dt>Capacity</dt><dd>{item.capacity}</dd></div>}
            </dl>
            {type === "event-registrations" && <div className="payment-card-actions"><button onClick={() => checkIn(item)}><CheckCircle2 size={16} /> Check in</button></div>}
          </article>
        ))}
      </section>
    </div>
  );
}

function renderField({ field, inputType, options = [], form, events, updateField }) {
  if (inputType === "event") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} required><option value="">Select event</option>{events.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select>;
  if (inputType === "select") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}>{options.map((item) => <option key={item} value={item}>{item}</option>)}</select>;
  if (inputType === "textarea") return <textarea rows="3" value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} />;
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
}

export default EventDirectory;
