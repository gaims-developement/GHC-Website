import { Plus, RefreshCw, Save, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const titles = {
  files: ["Universal Files", "Central file registry for every module and entity."],
  tasks: ["Task Engine", "Reusable task management across departments."],
  approvals: ["Approval Engine", "Reusable approval workflow for any module record."],
  search: ["Global Search", "Database-driven search source registry."],
  settings: ["Core Settings", "Platform settings, master events, languages, themes and integration flags."],
};

function Table({ columns, rows }) {
  return (
    <div className="speaker-table-wrap">
      <table className="speaker-table">
        <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>
          {rows.map((row) => <tr key={row.id || row.title || row.setting_key}>{columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key] || "-"}</td>)}</tr>)}
          {!rows.length && <tr><td colSpan={columns.length}>No records found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function CoreDirectory({ api, type }) {
  const [data, setData] = useState({});
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [title, subtitle] = titles[type] || titles.files;

  const load = useCallback(() => {
    setError("");
    setMessage("");
    const endpoint = type === "search" ? `/api/core/search?q=${encodeURIComponent(query)}` : `/api/core/${type}`;
    api.get(endpoint)
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load core data."));
  }, [api, query, type]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const saveTask = async (event) => {
    event.preventDefault();
    await api.post("/api/core/tasks", form);
    setForm({});
    setMessage("Task created.");
    load();
  };

  const saveApproval = async (event) => {
    event.preventDefault();
    await api.post("/api/core/approvals", form);
    setForm({});
    setMessage("Approval requested.");
    load();
  };

  const saveSetting = async (event) => {
    event.preventDefault();
    try {
      await api.put("/api/core/settings", { key: form.key, scope: form.scope || "global", value: JSON.parse(form.value || "{}") });
      setForm({});
      setMessage("Setting saved.");
      load();
    } catch {
      setError("Setting value must be valid JSON.");
    }
  };

  const decide = async (approval, status) => {
    await api.put(`/api/core/approvals/${approval.id}/decision`, { status });
    load();
  };

  const render = () => {
    if (type === "files") {
      return <Table rows={data.files || []} columns={[
        { key: "file_name", label: "File", render: (row) => <a href={row.file_url} target="_blank" rel="noreferrer"><strong>{row.file_name}</strong></a> },
        { key: "module", label: "Module" },
        { key: "entity_type", label: "Entity" },
        { key: "file_type", label: "Type" },
        { key: "created_at", label: "Uploaded", render: (row) => row.created_at ? new Date(row.created_at).toLocaleString() : "-" },
      ]} />;
    }
    if (type === "tasks") {
      return (
        <>
          <form className="super-form-grid" onSubmit={saveTask}>
            <label>Title<input value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label>
            <label>Department<input value={form.department || ""} onChange={(event) => setForm({ ...form, department: event.target.value })} /></label>
            <label>Module<input value={form.module || ""} onChange={(event) => setForm({ ...form, module: event.target.value })} /></label>
            <label>Priority<select value={form.priority || "medium"} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option>low</option><option>medium</option><option>high</option><option>critical</option></select></label>
            <button className="admin-primary-button" type="submit"><Plus size={18} /> Create task</button>
          </form>
          <Table rows={data.tasks || []} columns={[{ key: "title", label: "Task", render: (row) => <strong>{row.title}</strong> }, { key: "department", label: "Department" }, { key: "module", label: "Module" }, { key: "status", label: "Status" }, { key: "priority", label: "Priority" }, { key: "assigned_to_name", label: "Assigned" }]} />
        </>
      );
    }
    if (type === "approvals") {
      return (
        <>
          <form className="super-form-grid" onSubmit={saveApproval}>
            <label>Module<input value={form.module || ""} onChange={(event) => setForm({ ...form, module: event.target.value })} required /></label>
            <label>Record ID<input value={form.recordId || ""} onChange={(event) => setForm({ ...form, recordId: event.target.value })} required /></label>
            <button className="admin-primary-button" type="submit"><Plus size={18} /> Request approval</button>
          </form>
          <Table rows={data.approvals || []} columns={[
            { key: "module", label: "Module" },
            { key: "record_id", label: "Record" },
            { key: "status", label: "Status" },
            { key: "requested_by_name", label: "Requested by" },
            { key: "actions", label: "Actions", render: (row) => row.status === "pending" ? <div className="export-button-row"><button className="admin-secondary-button" type="button" onClick={() => decide(row, "approved")}>Approve</button><button className="admin-secondary-button" type="button" onClick={() => decide(row, "rejected")}>Reject</button></div> : "-" },
          ]} />
        </>
      );
    }
    if (type === "search") {
      return (
        <>
          <label className="admin-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users, speakers, sponsors, abstracts, workshops..." /></label>
          <Table rows={data.results || []} columns={[{ key: "module", label: "Module" }, { key: "title", label: "Title", render: (row) => <strong>{row.title}</strong> }, { key: "subtitle", label: "Detail" }, { key: "route", label: "Route" }]} />
        </>
      );
    }
    return (
      <>
        <form className="super-form-grid" onSubmit={saveSetting}>
          <label>Key<input value={form.key || ""} onChange={(event) => setForm({ ...form, key: event.target.value })} required /></label>
          <label>Scope<input value={form.scope || "global"} onChange={(event) => setForm({ ...form, scope: event.target.value })} /></label>
          <label>Value JSON<textarea value={form.value || "{}"} onChange={(event) => setForm({ ...form, value: event.target.value })} /></label>
          <button className="admin-primary-button" type="submit"><Save size={18} /> Save setting</button>
        </form>
        <Table rows={data.settings || []} columns={[{ key: "setting_key", label: "Key" }, { key: "scope", label: "Scope" }, { key: "updated_at", label: "Updated", render: (row) => row.updated_at ? new Date(row.updated_at).toLocaleString() : "-" }]} />
      </>
    );
  };

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Core Architecture</p>
            <h1>{title}</h1>
            <p className="admin-muted">{subtitle}</p>
          </div>
          <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {message && <div className="admin-success">{message}</div>}
      </section>
      <section className="admin-panel">{render()}</section>
    </div>
  );
}

export default CoreDirectory;
