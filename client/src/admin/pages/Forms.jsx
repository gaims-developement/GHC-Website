import { BarChart3, ClipboardList, ExternalLink, Plus, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusClass = (status) => status === "published" ? "paid" : status === "closed" ? "cancelled" : "pending";

function Forms({ api, onNavigate }) {
  const [dashboard, setDashboard] = useState(null);
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    Promise.all([
      api.get("/api/forms/dashboard"),
      api.get("/api/forms", { params: { search, status } }),
    ])
      .then(([dashboardResponse, formsResponse]) => {
        setDashboard(dashboardResponse.data);
        setForms(formsResponse.data.forms || []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load forms."));
  }, [api, search, status]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const metrics = [
    ["Total forms", dashboard?.totals?.totalForms || 0],
    ["Active forms", dashboard?.totals?.activeForms || 0],
    ["Submissions today", dashboard?.totals?.submissionsToday || 0],
    ["Pending reviews", dashboard?.totals?.pendingReviews || 0],
    ["Approval rate", `${Math.round(dashboard?.totals?.approvalRate || 0)}%`],
  ];

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Dynamic Forms</p>
            <h1>Forms & Applications Engine</h1>
            <p className="admin-muted">Create unlimited applications, surveys, feedback forms, registrations and nominations without code.</p>
          </div>
          <div className="export-button-row">
            <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
            <button className="admin-primary-button" type="button" onClick={() => onNavigate("forms-create")}><Plus size={18} /> New form</button>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="ops-kpi-grid">
        {metrics.map(([label, value]) => <article key={label}><BarChart3 size={20} /><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section className="admin-panel">
        <div className="super-form-grid">
          <label>Search<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, slug or category" /></label>
          <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All</option><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option></select></label>
        </div>
        <div className="speaker-table-wrap">
          <table className="speaker-table">
            <thead><tr><th>Form</th><th>Category</th><th>Status</th><th>Team</th><th>Submissions</th><th>Public URL</th><th>Actions</th></tr></thead>
            <tbody>
              {forms.map((form) => (
                <tr key={form.id}>
                  <td><strong>{form.title}</strong><br /><span className="admin-muted">{form.slug}</span></td>
                  <td>{form.category}</td>
                  <td><span className={`status-pill ${statusClass(form.status)}`}>{form.status}</span></td>
                  <td>{form.team_name || "Global"}</td>
                  <td>{form.submissions_count || 0}</td>
                  <td><a href={`/forms/${form.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open</a></td>
                  <td>
                    <div className="export-button-row">
                      <button className="admin-secondary-button" type="button" onClick={() => onNavigate(`form-${form.id}`)}>Builder</button>
                      <button className="admin-secondary-button" type="button" onClick={() => onNavigate(`form-${form.id}-submissions`)}><ClipboardList size={16} /> Review</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!forms.length && <tr><td colSpan="7">No forms created yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default Forms;
