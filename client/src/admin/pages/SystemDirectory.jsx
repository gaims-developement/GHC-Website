import { Archive, Plus, RefreshCw, Save, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const titles = {
  "audit-logs": ["Audit Logs", "Full trace of login, CRUD, permission, impersonation, export and system actions."],
  users: ["System Users", "Review user security state and force account controls."],
  roles: ["Roles & Permissions", "Database-driven roles with dynamic permission assignment."],
  sessions: ["Active Sessions", "Monitor online administrators and terminate sessions."],
  "api-monitoring": ["API Monitoring", "Recent request volume, errors and response timing."],
  database: ["Database", "Database health, connections and table sizes."],
  cloudinary: ["Cloudinary", "Cloudinary configuration and media storage usage."],
  email: ["Email Delivery", "Sent, failed and queued email delivery logs."],
  backups: ["Backups", "Create backup records and jump to SQL export tools."],
  security: ["Security Center", "Failed logins and active warning or critical alerts."],
  "feature-flags": ["Feature Flags", "Enable or disable CMS capabilities without code changes."],
  settings: ["System Settings", "Runtime configuration and maintenance mode controls."],
};

const boolValue = (value) => value === true || value === 1;

function DataTable({ columns, rows, empty = "No records found." }) {
  return (
    <div className="speaker-table-wrap">
      <table className="speaker-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id || row.feature_name || row.name || row.path}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>)}
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={columns.length}>{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SystemDirectory({ api, type }) {
  const [data, setData] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [flagForm, setFlagForm] = useState({ featureName: "", description: "", isEnabled: false });
  const [roleForm, setRoleForm] = useState({ name: "" });
  const [maintenance, setMaintenance] = useState({ enabled: false, message: "" });

  const [title, subtitle] = titles[type] || ["System", "System administration tools."];

  const endpoint = useMemo(() => ({
    "audit-logs": "/api/system-admin/audit-logs",
    users: "/api/system-admin/users",
    roles: "/api/system-admin/roles",
    sessions: "/api/system-admin/sessions",
    "api-monitoring": "/api/system-admin/api-monitoring",
    database: "/api/system-admin/database",
    cloudinary: "/api/system-admin/cloudinary",
    email: "/api/system-admin/email",
    backups: "/api/system-admin/backups",
    security: "/api/system-admin/security",
    "feature-flags": "/api/system-admin/feature-flags",
    settings: "/api/system-admin/settings",
  }[type]), [type]);

  const load = useCallback(() => {
    setError("");
    setMessage("");
    api.get(endpoint)
      .then((response) => {
        setData(response.data);
        if (type === "settings") {
          api.get("/api/system-admin/maintenance").then((maintenanceResponse) => {
            const next = maintenanceResponse.data.maintenance || {};
            setMaintenance({ enabled: boolValue(next.enabled), message: next.message || "" });
          });
        }
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load system data."));
  }, [api, endpoint, type]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const updateUser = async (user, changes) => {
    await api.put(`/api/system-admin/users/${user.id}`, {
      isActive: boolValue(user.is_active),
      isLocked: boolValue(user.is_locked),
      forcePasswordReset: boolValue(user.force_password_reset),
      ...changes,
    });
    load();
  };

  const terminateSession = async (session) => {
    await api.delete(`/api/system-admin/sessions/${session.id}`);
    load();
  };

  const createBackup = async () => {
    await api.post("/api/system-admin/backups", {});
    setMessage("Backup record created. Use SQL export for the current dump.");
    load();
  };

  const saveFlag = async (event) => {
    event.preventDefault();
    await api.post("/api/system-admin/feature-flags", flagForm);
    setFlagForm({ featureName: "", description: "", isEnabled: false });
    load();
  };

  const createRole = async (event) => {
    event.preventDefault();
    await api.post("/api/system-admin/roles", roleForm);
    setRoleForm({ name: "" });
    load();
  };

  const toggleRolePermission = async (role, permissionKey) => {
    const permissions = new Set(role.permissions || []);
    if (permissions.has(permissionKey)) permissions.delete(permissionKey);
    else permissions.add(permissionKey);
    await api.put(`/api/system-admin/roles/${role.id}/permissions`, { permissions: Array.from(permissions) });
    load();
  };

  const saveMaintenance = async (event) => {
    event.preventDefault();
    await api.put("/api/system-admin/maintenance", maintenance);
    setMessage("Maintenance settings saved.");
    load();
  };

  const renderContent = () => {
    if (type === "audit-logs") {
      return <DataTable columns={[
        { key: "user_name", label: "User", render: (row) => row.user_name || row.user_email || "System" },
        { key: "action", label: "Action" },
        { key: "module", label: "Module" },
        { key: "record_type", label: "Record" },
        { key: "ip_address", label: "IP" },
        { key: "created_at", label: "Time", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
      ]} rows={data.logs || []} />;
    }

    if (type === "users") {
      return <DataTable columns={[
        { key: "name", label: "Name", render: (row) => <strong>{row.name}</strong> },
        { key: "email", label: "Email" },
        { key: "role", label: "Role", render: (row) => <span className="status-pill">{row.role || "Unassigned"}</span> },
        { key: "is_active", label: "Active", render: (row) => <input type="checkbox" checked={boolValue(row.is_active)} onChange={(event) => updateUser(row, { isActive: event.target.checked })} /> },
        { key: "is_locked", label: "Locked", render: (row) => <input type="checkbox" checked={boolValue(row.is_locked)} onChange={(event) => updateUser(row, { isLocked: event.target.checked })} /> },
        { key: "force_password_reset", label: "Reset", render: (row) => <input type="checkbox" checked={boolValue(row.force_password_reset)} onChange={(event) => updateUser(row, { forcePasswordReset: event.target.checked })} /> },
      ]} rows={data.users || []} />;
    }

    if (type === "roles") {
      return (
        <>
          <form className="super-form-grid" onSubmit={createRole}>
            <label>Role name<input value={roleForm.name} onChange={(event) => setRoleForm({ name: event.target.value })} required /></label>
            <button className="admin-primary-button" type="submit"><Plus size={18} /> Create role</button>
          </form>
          <div className="super-role-grid">
            {(data.roles || []).map((role) => (
              <article key={role.id}>
                <strong>{role.name}</strong>
                <div>
                  {(data.permissions || []).map((permission) => (
                    <label key={permission.key}>
                      <input
                        type="checkbox"
                        checked={(role.permissions || []).includes(permission.key)}
                        disabled={role.name === "SUPER_ADMIN"}
                        onChange={() => toggleRolePermission(role, permission.key)}
                      />
                      <span>{permission.key}</span>
                    </label>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </>
      );
    }

    if (type === "sessions") {
      return <DataTable columns={[
        { key: "user_name", label: "User", render: (row) => <strong>{row.user_name}</strong> },
        { key: "email", label: "Email" },
        { key: "device", label: "Device" },
        { key: "ip_address", label: "IP" },
        { key: "last_activity", label: "Last activity", render: (row) => row.last_activity ? new Date(row.last_activity).toLocaleString() : "-" },
        { key: "actions", label: "Actions", render: (row) => <button className="admin-secondary-button" type="button" onClick={() => terminateSession(row)}><Trash2 size={16} /> Terminate</button> },
      ]} rows={data.sessions || []} />;
    }

    if (type === "api-monitoring") {
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

    if (type === "database") {
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

    if (type === "cloudinary") {
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

    if (type === "email") {
      return (
        <>
          <section className="ops-kpi-grid">
            <article><strong>{data.summary?.sent || 0}</strong><span>Sent</span></article>
            <article><strong>{data.summary?.failed || 0}</strong><span>Failed</span></article>
            <article><strong>{data.summary?.queued || 0}</strong><span>Queued</span></article>
          </section>
          <DataTable columns={[
            { key: "recipient", label: "Recipient" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status", render: (row) => <span className={`status-pill ${row.status === "failed" ? "cancelled" : row.status === "sent" ? "paid" : "pending"}`}>{row.status}</span> },
            { key: "sent_at", label: "Sent at", render: (row) => row.sent_at ? new Date(row.sent_at).toLocaleString() : "-" },
          ]} rows={data.logs || []} />
        </>
      );
    }

    if (type === "backups") {
      return (
        <>
          <div className="export-button-row">
            <button className="admin-primary-button" type="button" onClick={createBackup}><Archive size={18} /> Create record</button>
            <a className="admin-secondary-button" href={`${api.defaults.baseURL}/api/system/backup.sql`}>Download SQL</a>
            <a className="admin-secondary-button" href={`${api.defaults.baseURL}/api/system/backup.csv`}>Download CSV</a>
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

    if (type === "security") {
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

    if (type === "feature-flags") {
      return (
        <>
          <form className="super-form-grid" onSubmit={saveFlag}>
            <label>Feature name<input value={flagForm.featureName} onChange={(event) => setFlagForm({ ...flagForm, featureName: event.target.value })} required /></label>
            <label>Description<input value={flagForm.description} onChange={(event) => setFlagForm({ ...flagForm, description: event.target.value })} /></label>
            <label><input type="checkbox" checked={flagForm.isEnabled} onChange={(event) => setFlagForm({ ...flagForm, isEnabled: event.target.checked })} /> Enabled</label>
            <button className="admin-primary-button" type="submit"><Save size={18} /> Save flag</button>
          </form>
          <DataTable columns={[
            { key: "feature_name", label: "Feature" },
            { key: "description", label: "Description" },
            { key: "is_enabled", label: "Enabled", render: (row) => <span className={`status-pill ${boolValue(row.is_enabled) ? "paid" : "pending"}`}>{boolValue(row.is_enabled) ? "enabled" : "disabled"}</span> },
          ]} rows={data.flags || []} />
        </>
      );
    }

    if (type === "settings") {
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

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">System Administration</p>
            <h1>{title}</h1>
            <p className="admin-muted">{subtitle}</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
      </section>

      <section className="admin-panel">
        {renderContent()}
      </section>
    </div>
  );
}

export default SystemDirectory;
