import { Download, Network, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function CorePlatform({ api, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.get("/api/core/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load platform core."));
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const metrics = data?.metrics || {};
  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Core Architecture</p>
            <h1>GHC Platform Core</h1>
            <p className="admin-muted">Central services for files, notifications, activity, search, tagging, comments, tasks, approvals, events, reports, languages and themes.</p>
          </div>
          <div className="export-button-row">
            <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/core/reports.csv`}><Download size={18} /> Core report</a>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="ops-kpi-grid">
        {[
          ["Files", metrics.files || 0],
          ["Open tasks", metrics.openTasks || 0],
          ["Approvals", metrics.approvalRequests || 0],
          ["Pending approvals", metrics.pendingApprovals || 0],
        ].map(([label, value]) => <article key={label}><Network size={20} /><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section className="settings-form-grid">
        <div className="admin-panel">
          <h2>Architecture services</h2>
          <div className="export-button-row">
            {["core-files", "core-tasks", "core-approvals", "core-search", "core-settings"].map((page) => <button key={page} className="admin-secondary-button" type="button" onClick={() => onNavigate(page)}>{page.replace("core-", "").replace("-", " ")}</button>)}
          </div>
        </div>
        <div className="admin-panel">
          <h2>Activity feed</h2>
          <div className="speaker-table-wrap">
            <table className="speaker-table"><thead><tr><th>User</th><th>Action</th><th>Module</th><th>Time</th></tr></thead><tbody>{(data?.activity || []).map((item) => <tr key={item.id}><td>{item.user_name || "System"}</td><td>{item.action}</td><td>{item.module || "-"}</td><td>{item.timestamp ? new Date(item.timestamp).toLocaleString() : "-"}</td></tr>)}</tbody></table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default CorePlatform;
