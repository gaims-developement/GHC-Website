import { Activity, AlertTriangle, Archive, Database, Mail, RefreshCw, Server, ShieldAlert, ShieldCheck, Users, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

function SystemAdmin({ api, onNavigate }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  
  const [testEmailForm, setTestEmailForm] = useState({ email: "" });
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });

  const load = useCallback(() => {
    setError("");
    setMessage("");
    
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
    { id: 'api-monitoring', label: 'API Monitoring' },
    { id: 'database', label: 'Database' },
    { id: 'cloudinary', label: 'Cloudinary' },
    { id: 'email', label: 'Email Delivery' },
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
          <button className="admin-primary-button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        
        <div className="admin-tabs" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem', overflowX: 'auto' }}>
          {tabs.map(tab => (
            <button 
              key={tab.id}
              type="button" 
              className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
