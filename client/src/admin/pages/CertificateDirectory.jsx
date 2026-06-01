import { BadgeCheck, FileSpreadsheet, FileText, GraduationCap, PenLine, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const configs = {
  "certificate-templates": {
    title: "Certificate Templates",
    endpoint: "/api/certificates/templates",
    key: "templates",
    icon: FileText,
    multipart: true,
    empty: { name: "", category: "", orientation: "landscape", backgroundImage: "", templateData: "{}" },
    fields: [["name", "Name"], ["category", "Category"], ["orientation", "Orientation", "select", ["landscape", "portrait"]], ["backgroundImage", "Background URL"], ["templateData", "Template JSON", "textarea"]],
    file: "background",
  },
  "certificate-generate": {
    title: "Generate Certificate",
    endpoint: "/api/certificates/generate",
    icon: BadgeCheck,
    empty: { templateId: "", recipientName: "", recipientEmail: "", recipientType: "", referenceModule: "", referenceRecordId: "" },
    fields: [["templateId", "Template ID"], ["recipientName", "Recipient Name"], ["recipientEmail", "Recipient Email"], ["recipientType", "Recipient Type"], ["referenceModule", "Reference Module"], ["referenceRecordId", "Reference Record ID"]],
  },
  "certificate-bulk": {
    title: "Bulk Certificates",
    endpoint: "/api/certificates/bulk",
    icon: FileSpreadsheet,
    empty: { recipientJson: '[{"name":"Recipient Name","email":"person@example.com","recipientType":"delegate"}]' },
    fields: [["recipientJson", "Recipients JSON", "textarea"]],
    bulk: true,
  },
  "certificate-signatures": {
    title: "Digital Signatures",
    endpoint: "/api/certificates/signatures",
    key: "signatures",
    icon: PenLine,
    multipart: true,
    empty: { name: "", designation: "", signatureImage: "" },
    fields: [["name", "Name"], ["designation", "Designation"], ["signatureImage", "Signature URL"]],
    file: "signature",
  },
  "certificate-accreditation": {
    title: "Accreditation",
    endpoint: "/api/certificates/accreditation",
    key: "records",
    icon: GraduationCap,
    empty: { participantId: "", participantName: "", participantEmail: "", creditType: "cme", creditHours: 0 },
    fields: [["participantId", "Participant ID"], ["participantName", "Participant Name"], ["participantEmail", "Participant Email"], ["creditType", "Credit Type", "select", ["cme", "workshop", "training"]], ["creditHours", "Credit Hours", "number"]],
  },
};

function CertificateDirectory({ api, type = "certificate-templates" }) {
  const config = configs[type] || configs["certificate-templates"];
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!config.key) return;
    try {
      const response = await api.get(config.endpoint);
      setItems(response.data[config.key] || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.endpoint, config.key, config.title]);

  useEffect(() => { queueMicrotask(load); }, [load]);
  useEffect(() => { queueMicrotask(() => setForm(config.empty)); }, [config.empty]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      let payload = form;
      if (config.bulk) payload = { recipients: JSON.parse(form.recipientJson || "[]") };
      if (config.multipart) {
        payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
        if (file) payload.append(config.file, file);
      }
      await api.post(config.endpoint, payload);
      setMessage(`${config.title} saved.`);
      setForm(config.empty);
      setFile(null);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  return (
    <div className="admin-speakers-page cert-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Certificate Engine</p>
        <h1>{config.title}</h1>
        <p className="admin-muted">Database-driven certificate configuration with dynamic categories, templates and accreditation records.</p>
      </section>
      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}
      <section className="admin-panel">
        <form className="speaker-form" onSubmit={submit}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              {config.fields.map(([field, label, inputType, options]) => <label key={field}>{label}{renderField({ field, inputType, options, form, updateField })}</label>)}
              {config.multipart && <label>Upload<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>}
            </div>
            <div className="speaker-form-actions"><button type="submit"><Plus size={16} /> Save</button></div>
          </div>
        </form>
      </section>
      <section className="payment-card-grid">
        {items.map((item) => (
          <article className="payment-card" key={item.id}>
            <Icon size={20} />
            <strong>{item.name || item.participant_name || item.credit_type}</strong>
            <p>{item.category || item.designation || item.participant_email || "Certificate record"}</p>
            <dl>
              {item.orientation && <div><dt>Orientation</dt><dd>{item.orientation}</dd></div>}
              {item.credit_hours !== undefined && <div><dt>Credits</dt><dd>{item.credit_hours}</dd></div>}
              {item.is_active !== undefined && <div><dt>Status</dt><dd>{item.is_active ? "active" : "inactive"}</dd></div>}
            </dl>
          </article>
        ))}
      </section>
    </div>
  );
}

function renderField({ field, inputType, options = [], form, updateField }) {
  if (inputType === "textarea") return <textarea rows="5" value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)} />;
  if (inputType === "select") return <select value={form[field] || ""} onChange={(event) => updateField(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} />;
}

export default CertificateDirectory;
