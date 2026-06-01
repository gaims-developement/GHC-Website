import { Award, Download, FileCheck2, QrCode, RotateCcw, Search, Send, ShieldX } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

function Certificates({ api, onNavigate }) {
  const [dashboard, setDashboard] = useState({ metrics: {}, recentActivity: [] });
  const [certificates, setCertificates] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [form, setForm] = useState({ templateId: "", recipientName: "", recipientEmail: "", recipientType: "", referenceModule: "", referenceRecordId: "" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [dashboardResponse, certificatesResponse, templatesResponse] = await Promise.all([
        api.get("/api/certificates/dashboard"),
        api.get("/api/certificates"),
        api.get("/api/certificates/templates"),
      ]);
      setDashboard(dashboardResponse.data || {});
      setCertificates(certificatesResponse.data.certificates || []);
      setTemplates(templatesResponse.data.templates || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load certificates.");
    }
  }, [api]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  const filtered = useMemo(() => certificates.filter((certificate) => {
    const text = [certificate.certificateId, certificate.recipientName, certificate.recipientEmail, certificate.recipientType, certificate.referenceModule].join(" ").toLowerCase();
    return text.includes(search.toLowerCase()) && (status === "all" || certificate.status === status);
  }), [certificates, search, status]);

  const generate = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/certificates/generate", form);
      setForm({ templateId: "", recipientName: "", recipientEmail: "", recipientType: "", referenceModule: "", referenceRecordId: "" });
      setMessage("Certificate generated.");
      await load();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to generate certificate.");
    }
  };

  const action = async (path, success) => {
    if (path.method === "post") await api.post(path.url);
    else await api.patch(path.url || path);
    setMessage(success);
    await load();
  };

  const metrics = dashboard.metrics || {};
  return (
    <div className="admin-speakers-page cert-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Certificate Engine</p>
            <h1>Certificates & Accreditation</h1>
            <p className="admin-muted">Central certificate repository for delegates, speakers, workshops, volunteers, awards, CME and future categories.</p>
          </div>
          <Award size={28} />
        </div>
        <div className="admin-kpi-grid">
          <Kpi icon={FileCheck2} label="Generated" value={metrics.totalGenerated || 0} />
          <Kpi icon={Send} label="Issued Today" value={metrics.issuedToday || 0} />
          <Kpi icon={RotateCcw} label="Pending" value={metrics.pendingCertificates || 0} />
          <Kpi icon={ShieldX} label="Revoked" value={metrics.revokedCertificates || 0} />
          <Kpi icon={QrCode} label="Verifications" value={metrics.verificationRequests || 0} />
          <Kpi icon={Award} label="CME Credits" value={Number(metrics.cmeCreditsIssued || 0).toFixed(1)} />
        </div>
      </section>

      {message && <div className="admin-success">{message}</div>}
      {error && <div className="admin-error">{error}</div>}

      <section className="admin-panel certificate-form-panel">
        <form className="speaker-form" onSubmit={generate}>
          <div className="speaker-form-fields">
            <div className="speaker-form-grid">
              <label>Template<select value={form.templateId} onChange={(event) => setForm({ ...form, templateId: event.target.value })}><option value="">Auto-select active template</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name} {template.category ? `(${template.category})` : ""}</option>)}</select></label>
              <label>Recipient Name<input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} required /></label>
              <label>Recipient Email<input type="email" value={form.recipientEmail} onChange={(event) => setForm({ ...form, recipientEmail: event.target.value })} /></label>
              <label>Recipient Type<input value={form.recipientType} onChange={(event) => setForm({ ...form, recipientType: event.target.value })} placeholder="delegate, cme, volunteer..." /></label>
              <label>Reference Module<input value={form.referenceModule} onChange={(event) => setForm({ ...form, referenceModule: event.target.value })} /></label>
              <label>Reference Record ID<input value={form.referenceRecordId} onChange={(event) => setForm({ ...form, referenceRecordId: event.target.value })} /></label>
            </div>
            <div className="speaker-form-actions">
              <button type="submit"><FileCheck2 size={16} /> Generate</button>
              <button type="button" onClick={() => onNavigate("certificate-templates")}>Templates</button>
              <button type="button" onClick={() => onNavigate("certificate-reports")}>Reports</button>
            </div>
          </div>
        </form>
      </section>

      <section className="admin-panel">
        <div className="speaker-toolbar">
          <label className="speaker-search"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search certificates" /></label>
          <div className="speaker-filter-row">{["all", "generated", "sent", "revoked"].map((item) => <button key={item} className={status === item ? "active" : ""} onClick={() => setStatus(item)}>{item}</button>)}</div>
        </div>
      </section>

      <section className="payment-card-grid">
        {filtered.map((certificate) => (
          <article className="payment-card" key={certificate.id}>
            <span className={`status-pill ${certificate.status === "revoked" ? "closed" : "paid"}`}>{certificate.status}</span>
            <strong>{certificate.recipientName || "Recipient"}</strong>
            <p>{certificate.certificateId}</p>
            <dl>
              <div><dt>Type</dt><dd>{certificate.recipientType || "-"}</dd></div>
              <div><dt>Template</dt><dd>{certificate.templateName || "-"}</dd></div>
              <div><dt>Verification</dt><dd>{certificate.verificationCode}</dd></div>
            </dl>
            <div className="payment-card-actions">
              <a href={`${api.defaults.baseURL}/api/certificates/${certificate.certificateId || certificate.id}/pdf`} target="_blank" rel="noreferrer"><Download size={16} /> PDF</a>
              <button onClick={() => action({ method: "post", url: `/api/certificates/${certificate.id}/resend` }, "Certificate email marked sent.")}>Resend</button>
              {certificate.status !== "revoked" && <button onClick={() => action(`/api/certificates/${certificate.id}/revoke`, "Certificate revoked.")}>Revoke</button>}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }) {
  return <article className="admin-kpi-card"><Icon size={20} /><strong>{value}</strong><span>{label}</span></article>;
}

export default Certificates;
