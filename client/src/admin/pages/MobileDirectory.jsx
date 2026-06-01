import { BellRing, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const titles = {
  users: ["Mobile Users", "Delegate app profiles, registration links, visibility and last activity."],
  notifications: ["Push Notifications", "Send announcements, reminders, alerts, workshop updates and speaker changes."],
  analytics: ["Mobile Analytics", "Track session popularity, app retention, notification open rate and resource downloads."],
  settings: ["Mobile Settings", "Configure app flags for PWA, offline cache, QR check-in and push behavior."],
};

function DataTable({ columns, rows }) {
  return (
    <div className="speaker-table-wrap">
      <table className="speaker-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.id || row.label}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={columns.length}>No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function MobileDirectory({ api, type }) {
  const [data, setData] = useState({});
  const [form, setForm] = useState({ title: "", message: "", type: "announcement", targetAudience: "all", deepLink: "", sendNow: true });
  const [settingValue, setSettingValue] = useState(JSON.stringify({ offlineCache: ["agenda", "speakers", "venue", "resources", "certificates"], qrCheckin: true, push: true }, null, 2));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [title, subtitle] = titles[type] || titles.users;

  const endpoint = {
    users: "/api/mobile-admin/users",
    notifications: "/api/mobile-admin/notifications",
    analytics: "/api/mobile-admin/analytics",
    settings: "/api/mobile-admin/settings",
  }[type];

  const load = useCallback(() => {
    setError("");
    setMessage("");
    api.get(endpoint)
      .then((response) => {
        setData(response.data);
        if (type === "settings") {
          const config = (response.data.settings || []).find((item) => item.setting_key === "app_config");
          if (config) setSettingValue(JSON.stringify(config.setting_value || {}, null, 2));
        }
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load mobile app data."));
  }, [api, endpoint, type]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const submitNotification = async (event) => {
    event.preventDefault();
    await api.post("/api/mobile-admin/notifications", form);
    setForm({ title: "", message: "", type: "announcement", targetAudience: "all", deepLink: "", sendNow: true });
    setMessage("Notification queued.");
    load();
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    try {
      await api.put("/api/mobile-admin/settings", { key: "app_config", value: JSON.parse(settingValue || "{}") });
      setMessage("Mobile settings saved.");
      load();
    } catch {
      setError("Settings JSON is invalid.");
    }
  };

  const render = () => {
    if (type === "users") {
      return <DataTable rows={data.users || []} columns={[
        { key: "full_name", label: "Delegate", render: (row) => <strong>{row.full_name || "Unknown"}</strong> },
        { key: "registration_code", label: "Registration" },
        { key: "email", label: "Email" },
        { key: "institution", label: "Institution" },
        { key: "attendance_status", label: "Check-in" },
        { key: "last_active", label: "Last active", render: (row) => row.last_active ? new Date(row.last_active).toLocaleString() : "-" },
      ]} />;
    }

    if (type === "notifications") {
      return (
        <>
          <form className="super-form-grid" onSubmit={submitNotification}>
            <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
            <label>Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="announcement">Announcement</option><option value="reminder">Reminder</option><option value="alert">Alert</option><option value="workshop">Workshop</option><option value="speaker">Speaker</option></select></label>
            <label>Audience<select value={form.targetAudience} onChange={(event) => setForm({ ...form, targetAudience: event.target.value })}><option value="all">All</option><option value="delegates">Delegates</option><option value="speakers">Speakers</option><option value="volunteers">Volunteers</option></select></label>
            <label>Deep link<input value={form.deepLink} onChange={(event) => setForm({ ...form, deepLink: event.target.value })} /></label>
            <label>Message<textarea value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} required /></label>
            <label><input type="checkbox" checked={form.sendNow} onChange={(event) => setForm({ ...form, sendNow: event.target.checked })} /> Send now</label>
            <button className="admin-primary-button" type="submit"><BellRing size={18} /> Save notification</button>
          </form>
          <DataTable rows={data.notifications || []} columns={[
            { key: "title", label: "Title", render: (row) => <strong>{row.title}</strong> },
            { key: "type", label: "Type" },
            { key: "target_audience", label: "Audience" },
            { key: "sent_at", label: "Sent", render: (row) => row.sent_at ? new Date(row.sent_at).toLocaleString() : "Queued" },
            { key: "created_at", label: "Created", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
          ]} />
        </>
      );
    }

    if (type === "analytics") {
      return (
        <section className="settings-form-grid">
          {[
            ["Daily active users", data.dailyActiveUsers || []],
            ["Session popularity", data.sessionPopularity || []],
            ["Speaker popularity", data.speakerPopularity || []],
            ["Notification open rate", data.notificationOpenRate || []],
            ["Resource downloads", data.resourceDownloads || []],
          ].map(([heading, rows]) => (
            <div className="admin-panel" key={heading}>
              <h2>{heading}</h2>
              <DataTable rows={rows} columns={[{ key: "label", label: "Label" }, { key: "total", label: "Total", render: (row) => row.total || `${row.opened || 0}/${row.total || 0}` }]} />
            </div>
          ))}
        </section>
      );
    }

    return (
      <form className="admin-panel settings-section" onSubmit={saveSettings}>
        <label>App config JSON<textarea value={settingValue} onChange={(event) => setSettingValue(event.target.value)} rows={14} /></label>
        <button className="admin-primary-button" type="submit"><Save size={18} /> Save settings</button>
      </form>
    );
  };

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Mobile App</p>
            <h1>{title}</h1>
            <p className="admin-muted">{subtitle}</p>
          </div>
          <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
      </section>
      <section className={type === "analytics" ? "" : "admin-panel"}>{render()}</section>
    </div>
  );
}

export default MobileDirectory;
