import { CheckCircle2, FileSignature, Layers3, ListChecks, Plus, ReceiptText, Store } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const configs = {
  "sponsor-tiers": {
    title: "Sponsor Tiers",
    endpoint: "/api/sponsor-tiers",
    key: "tiers",
    icon: Layers3,
    empty: { name: "", description: "", priorityOrder: 0, websiteVisibility: true, isActive: true },
    fields: [["name", "Name"], ["description", "Description"], ["priorityOrder", "Priority Order", "number"]],
  },
  deliverables: {
    title: "Deliverables",
    endpoint: "/api/deliverables",
    key: "deliverables",
    icon: ListChecks,
    empty: { name: "", description: "", category: "website", isActive: true },
    fields: [["name", "Name"], ["description", "Description"], ["category", "Category", "select", ["website", "stage", "social_media", "email", "exhibition", "branding"]]],
  },
  stalls: {
    title: "Exhibitor Stalls",
    endpoint: "/api/stalls",
    key: "stalls",
    icon: Store,
    empty: { stallNumber: "", location: "", size: "", status: "available", sponsorId: "" },
    fields: [["stallNumber", "Stall Number"], ["location", "Location"], ["size", "Size"], ["status", "Status", "select", ["available", "reserved", "occupied"]]],
  },
  contracts: {
    title: "Contracts",
    endpoint: "/api/contracts",
    key: "contracts",
    icon: FileSignature,
    empty: { sponsorId: "", contractName: "", fileUrl: "", signed: false, signedDate: "" },
    fields: [["sponsorId", "Sponsor", "sponsor"], ["contractName", "Contract Name"], ["fileUrl", "File URL"], ["signedDate", "Signed Date", "date"]],
  },
  invoices: {
    title: "Invoices",
    endpoint: "/api/invoices",
    key: "invoices",
    icon: ReceiptText,
    empty: { sponsorId: "", invoiceNumber: "", amount: 0, tax: 0, status: "pending", issueDate: "", dueDate: "", invoicePdf: "" },
    fields: [["sponsorId", "Sponsor", "sponsor"], ["invoiceNumber", "Invoice Number"], ["amount", "Amount", "number"], ["tax", "Tax", "number"], ["status", "Status", "select", ["pending", "paid", "overdue"]], ["issueDate", "Issue Date", "date"], ["dueDate", "Due Date", "date"], ["invoicePdf", "Invoice PDF URL"]],
  },
  exhibitors: {
    title: "Exhibitors",
    endpoint: "/api/exhibitors",
    key: "exhibitors",
    icon: Store,
    readonly: true,
    empty: {},
    fields: [],
  },
};

function SponsorshipDirectory({ api, type = "sponsor-tiers" }) {
  const config = configs[type] || configs["sponsor-tiers"];
  const Icon = config.icon;
  const [items, setItems] = useState([]);
  const [sponsors, setSponsors] = useState([]);
  const [form, setForm] = useState(config.empty);
  const [editing, setEditing] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const requests = [api.get(config.endpoint)];
      if (["stalls", "contracts", "invoices"].includes(type)) requests.push(api.get("/api/sponsors?includeInactive=1"));
      const [mainResponse, sponsorsResponse] = await Promise.all(requests);
      setItems(mainResponse.data[config.key] || []);
      setSponsors(sponsorsResponse?.data?.sponsors || []);
    } catch (err) {
      setError(err.response?.data?.message || `Unable to load ${config.title.toLowerCase()}.`);
    }
  }, [api, config.endpoint, config.key, config.title, type]);

  useEffect(() => {
    queueMicrotask(() => {
      setForm(config.empty);
      setEditing(null);
      load();
    });
  }, [config.empty, load]);

  const normalizedItems = useMemo(() => items.map((item) => ({
    ...item,
    name: item.name || item.contract_name || item.invoice_number || item.stall_number || item.company_name,
    sponsorName: item.company_name || sponsors.find((sponsor) => String(sponsor.id) === String(item.sponsor_id))?.companyName,
  })), [items, sponsors]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...config.empty,
      ...item,
      priorityOrder: item.priority_order ?? item.priorityOrder ?? 0,
      websiteVisibility: item.website_visibility ?? true,
      isActive: item.is_active ?? true,
      stallNumber: item.stall_number || "",
      contractName: item.contract_name || "",
      invoiceNumber: item.invoice_number || "",
      sponsorId: item.sponsor_id || "",
      issueDate: item.issue_date?.slice(0, 10) || "",
      dueDate: item.due_date?.slice(0, 10) || "",
      signedDate: item.signed_date?.slice(0, 10) || "",
      fileUrl: item.file_url || "",
      invoicePdf: item.invoice_pdf || "",
    });
    setMessage("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      let payload = form;
      const headers = {};
      if (["contracts", "invoices"].includes(type)) {
        payload = new FormData();
        Object.entries(form).forEach(([key, value]) => payload.append(key, value ?? ""));
        if (file) payload.append("file", file);
        headers["Content-Type"] = "multipart/form-data";
      }
      if (editing?.id) await api.put(`${config.endpoint}/${editing.id}`, payload, { headers });
      else await api.post(config.endpoint, payload, { headers });
      setForm(config.empty);
      setEditing(null);
      setFile(null);
      setMessage(`${config.title} saved.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || `Unable to save ${config.title.toLowerCase()}.`);
    }
  };

  const allocate = async (stall) => {
    if (!form.sponsorId) {
      setError("Select a sponsor before assigning a stall.");
      return;
    }
    await api.post(`/api/stalls/${stall.id}/allocate`, { sponsorId: form.sponsorId, status: form.status || "reserved" });
    setMessage("Stall assigned.");
    await load();
  };

  return (
    <div className="admin-speakers-page sponsor-workspace">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship CMS</p>
            <h1>{config.title}</h1>
            <p className="admin-muted">Database-driven sponsorship records with permission-aware access.</p>
          </div>
        </div>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      {!config.readonly && (
        <section className="admin-panel">
          <form className="speaker-form" onSubmit={submit}>
            <div className="speaker-form-fields">
              <p className="admin-eyebrow">{editing ? "Edit" : "Create"} {config.title}</p>
              <div className="speaker-form-grid">
                {config.fields.map(([field, label, inputType, options]) => (
                  <label key={field}>{label}{renderField({ field, inputType, options, form, sponsors, updateField })}</label>
                ))}
                {type === "stalls" && (
                  <label>Assign Sponsor<select value={form.sponsorId || ""} onChange={(event) => updateField("sponsorId", event.target.value)}><option value="">Select sponsor</option>{sponsors.map((sponsor) => <option key={sponsor.id} value={sponsor.id}>{sponsor.companyName}</option>)}</select></label>
                )}
                {["contracts", "invoices"].includes(type) && <label>Upload File<input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} /></label>}
              </div>
              {["sponsor-tiers", "deliverables"].includes(type) && (
                <div className="speaker-toggle-row">
                  <label><input type="checkbox" checked={Boolean(form.isActive)} onChange={(event) => updateField("isActive", event.target.checked)} /> Active</label>
                  {type === "sponsor-tiers" && <label><input type="checkbox" checked={Boolean(form.websiteVisibility)} onChange={(event) => updateField("websiteVisibility", event.target.checked)} /> Public website visibility</label>}
                </div>
              )}
              <div className="speaker-form-actions">
                <button type="submit"><Plus size={16} /> Save</button>
                {editing && <button type="button" onClick={() => { setEditing(null); setForm(config.empty); }}>Cancel</button>}
              </div>
            </div>
          </form>
        </section>
      )}

      <section className="payment-card-grid">
        {normalizedItems.map((item) => (
          <article className="payment-card" key={item.id}>
            <span className="status-pill">{item.status || (item.is_active === false ? "inactive" : "active")}</span>
            <Icon size={20} />
            <strong>{item.name}</strong>
            <p>{item.description || item.sponsorName || item.location || "No description"}</p>
            <dl>
              {item.category && <div><dt>Category</dt><dd>{item.category.replaceAll("_", " ")}</dd></div>}
              {item.priority_order !== undefined && <div><dt>Priority</dt><dd>{item.priority_order}</dd></div>}
              {item.amount !== undefined && <div><dt>Amount</dt><dd>₹{Number(item.amount || 0).toLocaleString("en-IN")}</dd></div>}
              {item.tax !== undefined && <div><dt>Tax</dt><dd>₹{Number(item.tax || 0).toLocaleString("en-IN")}</dd></div>}
              {item.stalls && <div><dt>Stalls</dt><dd>{item.stalls}</dd></div>}
              {item.company_name && <div><dt>Sponsor</dt><dd>{item.company_name}</dd></div>}
            </dl>
            {!config.readonly && (
              <div className="payment-card-actions">
                <button onClick={() => openEdit(item)}>Edit</button>
                {type === "stalls" && <button onClick={() => allocate(item)}><CheckCircle2 size={16} /> Assign</button>}
              </div>
            )}
          </article>
        ))}
        {!normalizedItems.length && <div className="admin-empty-state">No {config.title.toLowerCase()} found.</div>}
      </section>
    </div>
  );
}

function renderField({ field, inputType, options = [], form, sponsors, updateField }) {
  if (inputType === "select") {
    return <select value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option.replaceAll("_", " ")}</option>)}</select>;
  }
  if (inputType === "sponsor") {
    return <select value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value)} required><option value="">Select sponsor</option>{sponsors.map((sponsor) => <option key={sponsor.id} value={sponsor.id}>{sponsor.companyName}</option>)}</select>;
  }
  return <input type={inputType || "text"} value={form[field] ?? ""} onChange={(event) => updateField(field, inputType === "checkbox" ? event.target.checked : event.target.value)} />;
}

export default SponsorshipDirectory;
