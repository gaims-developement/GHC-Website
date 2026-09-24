import { Activity, AlertTriangle, Archive, CheckCircle2, ChevronLeft, Database, Edit3, Eye, FileText, Handshake, Mail, RefreshCw, Server, ShieldAlert, ShieldCheck, Users, Save, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import AdminCollaboration from "./AdminCollaboration";

const statusClass = (value) => ["healthy", "configured"].includes(String(value).toLowerCase()) ? "paid" : "pending";
const boolValue = (value) => value === true || value === 1;

function DataTable({ columns, rows, empty = "No records found." }) {
  return (
    <div className="speaker-table-wrap">
      <table className="speaker-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || row.feature_name || row.name || row.path || index}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={columns.length}>{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SystemAdmin({ api, onNavigate, initialTab = "dashboard" }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  const [testEmailForm, setTestEmailForm] = useState({ email: "" });
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ subject: "", body: "", is_active: 1 });
  const [templateTestEmail, setTemplateTestEmail] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [testingTemplate, setTestingTemplate] = useState(false);
  const [templateTestResult, setTemplateTestResult] = useState(null);

  const load = useCallback(() => {
    setError("");
    setMessage("");
    if (activeTab === "collaboration") return;
    
    const endpoint = activeTab === "dashboard" 
      ? "/api/system-admin/dashboard" 
      : `/api/system-admin/${activeTab}`;

    api.get(endpoint)
      .then((response) => {
        setData(response.data);
        if (activeTab === "settings") {
          api.get("/api/system-admin/maintenance").then((maintenanceResponse) => {
            const next = maintenanceResponse.data.maintenance || {};
            setMaintenance({ enabled: boolValue(next.enabled), message: next.message || "" });
          });
        }
      })
      .catch((requestError) => setError(requestError.response?.data?.message || `Unable to load ${activeTab} data.`));
  }, [api, activeTab]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const createBackup = async () => {
    await api.post("/api/system-admin/backups", {});
    setMessage("Backup record created. Use SQL export for the current dump.");
    load();
  };

  const sendTestEmail = async (event) => {
    event.preventDefault();
    try {
      await api.post("/api/system-admin/email/test", { email: testEmailForm.email });
      setMessage(`Test email sent to ${testEmailForm.email}`);
      setTestEmailForm({ email: "" });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to send test email.");
    }
    load();
  };

  const saveMaintenance = async (event) => {
    event.preventDefault();
    await api.put("/api/system-admin/maintenance", maintenance);
    setMessage("Maintenance settings saved.");
    load();
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSelectedTemplate(null);
    setTemplateTestResult(null);
  };

  const saveTemplate = async (e) => {
    e?.preventDefault();
    if (!selectedTemplate) return;
    setSavingTemplate(true);
    setError("");
    setMessage("");
    try {
      const res = await api.put(`/api/system-admin/email-templates/${selectedTemplate.id}`, {
        subject: templateForm.subject,
        body: templateForm.body,
        isActive: boolValue(templateForm.is_active),
      });
      setMessage(`Template '${selectedTemplate.template_key}' saved successfully.`);
      setSelectedTemplate(res.data.template || { ...selectedTemplate, ...templateForm });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save email template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  const sendTemplateTest = async (e) => {
    e?.preventDefault();
    if (!selectedTemplate || !templateTestEmail) return;
    setTestingTemplate(true);
    setTemplateTestResult(null);
    try {
      const res = await api.post(`/api/system-admin/email-templates/${selectedTemplate.id}/test`, {
        email: templateTestEmail,
      });
      setTemplateTestResult({ success: true, message: res.data.message || "Test email sent successfully!" });
    } catch (err) {
      setTemplateTestResult({
        success: false,
        message: err.response?.data?.error || err.response?.data?.message || "Failed to send test email.",
      });
    } finally {
      setTestingTemplate(false);
    }
  };

  const renderDashboard = () => {
    const cards = [
      { label: "Total users", value: data?.totals?.users || 0, icon: Users },
      { label: "Active users", value: data?.totals?.activeUsers || 0, icon: Activity },
      { label: "Online users", value: data?.totals?.onlineUsers || 0, icon: Server },
      { label: "Failed logins", value: data?.totals?.failedLogins || 0, icon: ShieldAlert },
    ];
  
    const statuses = [
      { label: "Database", value: data?.statuses?.database || "checking", icon: Database },
      { label: "API", value: data?.statuses?.api || "checking", icon: Server },
      { label: "Cloudinary", value: data?.statuses?.cloudinary || "checking", icon: Activity },
      { label: "Email", value: data?.statuses?.email || "checking", icon: Mail },
    ];

    return (
      <>
        <section className="ops-kpi-grid">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label}>
                <Icon size={20} />
                <strong>{card.value}</strong>
                <span>{card.label}</span>
              </article>
            );
          })}
        </section>
  
        <section className="ops-kpi-grid">
          {statuses.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label}>
                <Icon size={20} />
                <strong className={`status-pill ${statusClass(item.value)}`}>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            );
          })}
          <article>
            <Activity size={20} />
            <strong>{data?.healthScore || 0}%</strong>
            <span>Health score</span>
          </article>
        </section>
  
        <section className="settings-form-grid">
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Security</p>
                <h2>Active alerts</h2>
              </div>
              <AlertTriangle size={20} />
            </div>
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead><tr><th>Type</th><th>Message</th><th>Created</th></tr></thead>
                <tbody>
                  {(data?.securityAlerts || []).map((alert) => (
                    <tr key={alert.id}>
                      <td><span className={`status-pill ${alert.type === "critical" ? "cancelled" : "pending"}`}>{alert.type}</span></td>
                      <td><strong>{alert.title}</strong><br /><span className="admin-muted">{alert.message}</span></td>
                      <td>{alert.created_at ? new Date(alert.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {!data?.securityAlerts?.length && <tr><td colSpan="3">No active security alerts.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
  
          <div className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="admin-eyebrow">Audit</p>
                <h2>Recent activity</h2>
              </div>
              <button className="admin-secondary-button" type="button" onClick={() => onNavigate("system-audit-logs")}>View all</button>
            </div>
            <div className="speaker-table-wrap">
              <table className="speaker-table">
                <thead><tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr></thead>
                <tbody>
                  {(data?.recentAuditLogs || []).map((log) => (
                    <tr key={log.id}>
                      <td>{log.user_name || "System"}</td>
                      <td><strong>{log.action}</strong></td>
                      <td>{log.module || "-"}</td>
                      <td>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</td>
                    </tr>
                  ))}
                  {!data?.recentAuditLogs?.length && <tr><td colSpan="4">No audit records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </>
    );
  };

  const renderContent = () => {
    if (activeTab === "collaboration") {
      return <AdminCollaboration api={api} />;
    }

    if (!data) return null;

    if (activeTab === "dashboard") return renderDashboard();

    if (activeTab === "api-monitoring") {
      return (
        <>
          <section className="ops-kpi-grid">
            <article><strong>{data.summary?.requests || 0}</strong><span>Requests 24h</span></article>
            <article><strong>{Math.round(data.summary?.average_ms || 0)}ms</strong><span>Average latency</span></article>
            <article><strong>{data.summary?.errors || 0}</strong><span>Errors</span></article>
          </section>
          <DataTable columns={[
            { key: "method", label: "Method" },
            { key: "path", label: "Path" },
            { key: "status_code", label: "Status" },
            { key: "duration_ms", label: "Duration", render: (row) => `${row.duration_ms || 0}ms` },
            { key: "created_at", label: "Time", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
          ]} rows={data.recent || []} />
        </>
      );
    }

    if (activeTab === "database") {
      return (
        <>
          <section className="ops-kpi-grid">
            <article><strong className="status-pill paid">{data.status || "healthy"}</strong><span>Status</span></article>
            <article><strong>{data.connections || 0}</strong><span>Connections</span></article>
          </section>
          <DataTable columns={[
            { key: "name", label: "Table" },
            { key: "rows_count", label: "Rows" },
            { key: "size_mb", label: "Size MB" },
          ]} rows={data.tables || []} />
        </>
      );
    }

    if (activeTab === "cloudinary") {
      return (
        <>
          <section className="ops-kpi-grid">
            <article><strong className={`status-pill ${data.configured ? "paid" : "pending"}`}>{data.configured ? "configured" : "not configured"}</strong><span>Cloudinary</span></article>
            <article><strong>{data.cloudName || "-"}</strong><span>Cloud name</span></article>
          </section>
          <DataTable columns={[
            { key: "resource_type", label: "Resource" },
            { key: "count", label: "Assets" },
            { key: "size_mb", label: "Size MB" },
          ]} rows={data.assets || []} />
        </>
      );
    }

    if (activeTab === "email") {
      return (
        <>
          <section className="ops-kpi-grid">
            <article><strong>{data.summary?.sent || 0}</strong><span>Sent</span></article>
            <article><strong>{data.summary?.failed || 0}</strong><span>Failed</span></article>
            <article><strong>{data.summary?.queued || 0}</strong><span>Queued</span></article>
          </section>
          
          <form className="admin-panel settings-section" onSubmit={sendTestEmail} style={{ marginBottom: "2rem" }}>
            <div className="admin-panel-heading"><h2>Send Test Email</h2></div>
            <label>Test recipient email<input type="email" value={testEmailForm.email} onChange={(event) => setTestEmailForm({ email: event.target.value })} required /></label>
            <button className="admin-primary-button" type="submit">Send Test Email</button>
          </form>

          <DataTable columns={[
            { key: "recipient", label: "Recipient" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status", render: (row) => <span className={`status-pill ${row.status === "failed" ? "cancelled" : row.status === "sent" ? "paid" : "pending"}`}>{row.status}</span> },
            { key: "error_message", label: "Error Message" },
            { key: "sent_at", label: "Sent at", render: (row) => row.sent_at ? new Date(row.sent_at).toLocaleString() : "-" },
          ]} rows={data.logs || []} />
        </>
      );
    }

    if (activeTab === "email-templates") {
      const templates = data?.templates || [];

      const sampleMap = {
        name: "Dr. Ayesha Sharma",
        fullName: "Dr. Ayesha Sharma",
        title: "Artificial Intelligence in Global Primary Care",
        link: "https://globalhealthconclave.netlify.app/abstracts/revision?id=DEMO",
        registrationId: "GHC-2026-REG-8492",
        applicationId: "VISA-GHC-2026-041",
        amount: "INR 6,500",
        ticketName: "Full Conference Delegate Pass",
        workshop: "Robotic Surgery Hands-on Workshop",
        venue: "GAIMS Main Auditorium",
        date: "October 14-16, 2026",
      };

      const renderPreview = (text) => {
        if (!text) return "";
        let rendered = text;
        Object.entries(sampleMap).forEach(([k, v]) => {
          rendered = rendered.replace(new RegExp(`{{${k}}}`, "g"), v);
        });
        return rendered;
      };

      if (selectedTemplate) {
        const previewSubject = renderPreview(templateForm.subject);
        const previewBody = renderPreview(templateForm.body);

        const insertVariable = (varName) => {
          setTemplateForm((prev) => ({
            ...prev,
            body: (prev.body || "") + `{{${varName}}}`,
          }));
        };

        return (
          <div className="email-template-editor-view">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setSelectedTemplate(null);
                    setTemplateTestResult(null);
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                >
                  <ChevronLeft size={16} /> All Templates
                </button>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>
                    Edit Template: <code style={{ color: "#3b82f6", background: "#eff6ff", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>{selectedTemplate.template_key}</code>
                  </h2>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
                  <input
                    type="checkbox"
                    checked={boolValue(templateForm.is_active)}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, is_active: e.target.checked ? 1 : 0 }))}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span>Active</span>
                </label>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={saveTemplate}
                  disabled={savingTemplate}
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  <Save size={16} /> {savingTemplate ? "Saving..." : "Save Template"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
              <div className="admin-panel" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="admin-panel-heading">
                  <div>
                    <p className="admin-eyebrow">Content Editor</p>
                    <h3 style={{ margin: 0, fontSize: "1.1rem" }}>Template Details</h3>
                  </div>
                  <Edit3 size={18} style={{ color: "#64748b" }} />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "0.4rem", fontWeight: "600", fontSize: "0.9rem" }}>
                    Subject Line
                  </label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, subject: e.target.value }))}
                    placeholder="Enter email subject line (e.g. Confirmation for {{name}})"
                    style={{ width: "100%", padding: "0.65rem 0.85rem", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem" }}
                    required
                  />
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                    <label style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Email Body (Plain Text or HTML)
                    </label>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Click chip to insert</span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.65rem" }}>
                    {Object.keys(sampleMap).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => insertVariable(k)}
                        style={{
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "14px",
                          padding: "0.2rem 0.55rem",
                          fontSize: "0.75rem",
                          color: "#334155",
                          cursor: "pointer",
                          fontFamily: "monospace",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e2e8f0")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#f1f5f9")}
                        title={`Insert {{${k}}}`}
                      >
                        + &#123;&#123;{k}&#125;&#125;
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={12}
                    value={templateForm.body}
                    onChange={(e) => setTemplateForm((prev) => ({ ...prev, body: e.target.value }))}
                    placeholder="Type template body with {{placeholders}}..."
                    style={{
                      width: "100%",
                      fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                      fontSize: "0.9rem",
                      lineHeight: "1.5",
                      padding: "0.75rem",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div className="admin-panel" style={{ border: "1px solid #bfdbfe", background: "#f8fafc" }}>
                  <div className="admin-panel-heading" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
                    <div>
                      <p className="admin-eyebrow" style={{ color: "#2563eb" }}>Preview</p>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Recipient Inbox View</h3>
                    </div>
                    <Eye size={18} style={{ color: "#2563eb" }} />
                  </div>

                  <div style={{ marginTop: "1rem", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                    <div style={{ background: "#f1f5f9", padding: "0.75rem 1rem", borderBottom: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                      <div style={{ marginBottom: "0.25rem", color: "#64748b" }}>
                        <strong>From: </strong>Global Healthcare Conclave &lt;itcellgaims@gmail.com&gt;
                      </div>
                      <div style={{ color: "#0f172a" }}>
                        <strong style={{ color: "#64748b" }}>Subject: </strong>
                        <span style={{ fontWeight: "600" }}>{previewSubject || "(No subject set)"}</span>
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "1.25rem",
                        color: "#1e293b",
                        fontSize: "0.95rem",
                        lineHeight: "1.6",
                        whiteSpace: "pre-wrap",
                        minHeight: "180px",
                        maxHeight: "360px",
                        overflowY: "auto",
                      }}
                    >
                      {previewBody || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No body content yet.</span>}
                    </div>
                  </div>
                </div>

                <div className="admin-panel" style={{ background: "#ffffff" }}>
                  <div className="admin-panel-heading">
                    <div>
                      <p className="admin-eyebrow">Delivery Verification</p>
                      <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Send Live Test Email</h3>
                    </div>
                    <Send size={18} style={{ color: "#10b981" }} />
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.5rem 0 1rem" }}>
                    Send this template with sample data to your inbox to verify formatting and SMTP delivery.
                  </p>

                  <form onSubmit={sendTemplateTest} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <input
                      type="email"
                      value={templateTestEmail}
                      onChange={(e) => setTemplateTestEmail(e.target.value)}
                      placeholder="Your recipient email (e.g. you@example.com)"
                      required
                      style={{ flex: "1", minWidth: "200px", padding: "0.55rem 0.75rem", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "0.9rem" }}
                    />
                    <button
                      type="submit"
                      className="admin-primary-button"
                      disabled={testingTemplate || !templateTestEmail}
                      style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}
                    >
                      <Send size={15} /> {testingTemplate ? "Sending..." : "Send Test"}
                    </button>
                  </form>

                  {templateTestResult && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.6rem 0.85rem",
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        background: templateTestResult.success ? "#ecfdf5" : "#fef2f2",
                        color: templateTestResult.success ? "#065f46" : "#991b1b",
                        border: `1px solid ${templateTestResult.success ? "#a7f3d0" : "#fecaca"}`,
                      }}
                    >
                      {templateTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{templateTestResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <>
          <section className="ops-kpi-grid">
            <article>
              <FileText size={20} />
              <strong>{templates.length}</strong>
              <span>Templates Configured</span>
            </article>
            <article>
              <CheckCircle2 size={20} />
              <strong>{templates.filter((t) => boolValue(t.is_active)).length}</strong>
              <span>Active Templates</span>
            </article>
          </section>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1.25rem", marginTop: "1rem" }}>
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className="admin-panel"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  padding: "1.25rem",
                  transition: "all 0.2s ease",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        background: "#eff6ff",
                        color: "#2563eb",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontWeight: "600",
                      }}
                    >
                      {tmpl.template_key}
                    </span>
                    <span className={`status-pill ${boolValue(tmpl.is_active) ? "paid" : "pending"}`}>
                      {boolValue(tmpl.is_active) ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 0.5rem", fontSize: "1.05rem", fontWeight: "600", color: "#0f172a" }}>
                    {tmpl.subject}
                  </h3>

                  <p
                    style={{
                      color: "#64748b",
                      fontSize: "0.85rem",
                      lineHeight: "1.45",
                      margin: "0 0 1rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {tmpl.body}
                  </p>
                </div>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                    Updated {tmpl.updated_at ? new Date(tmpl.updated_at).toLocaleDateString() : "recently"}
                  </span>
                  <button
                    type="button"
                    className="admin-primary-button"
                    onClick={() => {
                      setSelectedTemplate(tmpl);
                      setTemplateForm({
                        subject: tmpl.subject || "",
                        body: tmpl.body || "",
                        is_active: boolValue(tmpl.is_active) ? 1 : 0,
                      });
                      setTemplateTestResult(null);
                    }}
                    style={{ padding: "0.4rem 0.85rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <Edit3 size={14} /> Edit & Preview
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      );
    }

    if (activeTab === "backups") {
      return (
        <>
          <div className="export-button-row">
            <button className="admin-primary-button" type="button" onClick={createBackup}><Archive size={18} /> Create record</button>
            <a className="admin-secondary-button" href={`${api.defaults.baseURL}/api/system-admin/backup.sql`}>Download SQL</a>
            <a className="admin-secondary-button" href={`${api.defaults.baseURL}/api/system-admin/backup.csv`}>Download CSV</a>
          </div>
          <DataTable columns={[
            { key: "backup_name", label: "Name" },
            { key: "status", label: "Status" },
            { key: "file_location", label: "Location" },
            { key: "created_at", label: "Created", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
          ]} rows={data.backups || []} />
        </>
      );
    }

    if (activeTab === "security") {
      return (
        <>
          <h2>Failed logins</h2>
          <DataTable columns={[
            { key: "email", label: "Email" },
            { key: "ip_address", label: "IP" },
            { key: "device", label: "Device" },
            { key: "browser", label: "Browser" },
            { key: "created_at", label: "Time", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
          ]} rows={data.failedLogins || []} />
        </>
      );
    }

    if (activeTab === "settings") {
      return (
        <>
          <section className="ops-kpi-grid">
            {Object.entries(data.config || {}).map(([key, value]) => (
              <article key={key}><strong>{String(value || "-")}</strong><span>{key}</span></article>
            ))}
          </section>
          <form className="admin-panel settings-section" onSubmit={saveMaintenance}>
            <div className="admin-panel-heading"><h2>Maintenance mode</h2><ShieldCheck size={20} /></div>
            <label><input type="checkbox" checked={maintenance.enabled} onChange={(event) => setMaintenance({ ...maintenance, enabled: event.target.checked })} /> Enabled</label>
            <label>Message<input value={maintenance.message} onChange={(event) => setMaintenance({ ...maintenance, message: event.target.value })} /></label>
            <button className="admin-primary-button" type="submit"><Save size={18} /> Save maintenance</button>
          </form>
        </>
      );
    }

    return null;
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'collaboration', label: 'Collaboration' },
    { id: 'api-monitoring', label: 'API Monitoring' },
    { id: 'database', label: 'Database' },
    { id: 'cloudinary', label: 'Cloudinary' },
    { id: 'email', label: 'Email Delivery' },
    { id: 'email-templates', label: 'Email Templates' },
    { id: 'backups', label: 'Backups' },
    { id: 'security', label: 'Security Center' },
    { id: 'settings', label: 'Settings' }
  ];

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">System Administration</p>
            <h1>Monitoring & Audit Center</h1>
            <p className="admin-muted">Super Admin command center for configuration, API health, backups, delivery logs and security alerts.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="admin-secondary-button"
              type="button"
              onClick={() => handleTabChange('collaboration')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}
            >
              <Handshake size={18} /> Collaboration
            </button>
            <button className="admin-primary-button" onClick={load}><RefreshCw size={18} /> Refresh</button>
          </div>
        </div>
        
        <div className="admin-tabs" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              type="button" 
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.id)}
              style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === tab.id ? '#3b82f6' : '#64748b', fontWeight: activeTab === tab.id ? '600' : '400', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
      </section>

      {renderContent()}
    </div>
  );
}

export default SystemAdmin;
