import { BarChart3, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function FormAnalytics({ api }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.get("/api/forms/analytics")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load form analytics."));
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const summary = data?.summary || {};
  const conversionRate = Number(summary.views || 0) ? Math.round((Number(summary.submissions || 0) / Number(summary.views || 1)) * 100) : 0;

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Forms</p>
            <h1>Form Analytics</h1>
            <p className="admin-muted">Track views, submissions, conversion, approval rate, daily volume and most active forms.</p>
          </div>
          <button className="admin-primary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="ops-kpi-grid">
        {[["Forms", summary.forms || 0], ["Views", summary.views || 0], ["Submissions", summary.submissions || 0], ["Conversion", `${conversionRate}%`], ["Approval", `${Math.round(summary.approvalRate || 0)}%`]].map(([label, value]) => <article key={label}><BarChart3 size={20} /><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section className="settings-form-grid">
        <div className="admin-panel">
          <h2>Submissions by day</h2>
          <div className="speaker-table-wrap">
            <table className="speaker-table"><thead><tr><th>Date</th><th>Total</th></tr></thead><tbody>{(data?.byDay || []).map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.total}</td></tr>)}</tbody></table>
          </div>
        </div>
        <div className="admin-panel">
          <h2>Most active forms</h2>
          <div className="speaker-table-wrap">
            <table className="speaker-table"><thead><tr><th>Form</th><th>Views</th><th>Submissions</th></tr></thead><tbody>{(data?.activeForms || []).map((row) => <tr key={row.id}><td><strong>{row.title}</strong><br /><span className="admin-muted">{row.slug}</span></td><td>{row.view_count}</td><td>{row.submissions}</td></tr>)}</tbody></table>
          </div>
        </div>
      </section>
    </div>
  );
}

export default FormAnalytics;
