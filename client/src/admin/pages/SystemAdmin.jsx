import { Activity, AlertTriangle, Database, Mail, RefreshCw, Server, ShieldAlert, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusClass = (value) => ["healthy", "configured"].includes(String(value).toLowerCase()) ? "paid" : "pending";

function SystemAdmin({ api, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.get("/api/system-admin/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load system dashboard."));
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

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
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">System Administration</p>
            <h1>Monitoring & Audit Center</h1>
            <p className="admin-muted">Super Admin command center for users, sessions, audit trails, backups, delivery health and security alerts.</p>
          </div>
          <button className="admin-primary-button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

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
    </div>
  );
}

export default SystemAdmin;
