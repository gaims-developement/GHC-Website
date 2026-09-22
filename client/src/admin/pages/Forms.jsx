import { BarChart3, ClipboardList, ExternalLink, Plus, RefreshCw, Layers3 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusClass = (status) => status === "published" ? "paid" : status === "closed" ? "cancelled" : "pending";

function Forms({ api, onNavigate }) {
  const [activeTab, setActiveTab] = useState("forms");
  
  const [dashboard, setDashboard] = useState(null);
  const [forms, setForms] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const [templates, setTemplates] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  const load = useCallback(() => {
    setError("");
    if (activeTab === "forms") {
      Promise.all([
        api.get("/api/forms/dashboard"),
        api.get("/api/forms", { params: { search, status } }),
      ])
        .then(([dashboardResponse, formsResponse]) => {
          setDashboard(dashboardResponse.data);
          setForms(formsResponse.data.forms || []);
        })
        .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load forms."));
    } else if (activeTab === "templates") {
      api.get("/api/forms/metadata")
        .then((response) => setTemplates(response.data.templates || []))
        .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load templates."));
    } else if (activeTab === "analytics") {
      api.get("/api/forms/analytics")
        .then((response) => setAnalyticsData(response.data))
        .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load analytics."));
    }
  }, [api, search, status, activeTab]);

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

  const renderForms = () => (
    <>
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
              {/* Hardcoded Special Forms */}
              <tr>
                <td><strong>Abstract Form</strong><br /><span className="admin-muted">research/abstracts</span></td>
                <td>Scientific</td>
                <td><span className="status-pill paid">Active</span></td>
                <td>Research</td>
                <td>-</td>
                <td><a href="/research/submit" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open</a></td>
                <td>
                  <div className="export-button-row">
                    <button className="admin-secondary-button" type="button" onClick={() => onNavigate("scientific")}><ClipboardList size={16} /> Manage</button>
                  </div>
                </td>
              </tr>
              <tr>
                <td><strong>Nomination Form</strong><br /><span className="admin-muted">awards/nominate</span></td>
                <td>Awards</td>
                <td><span className="status-pill paid">Active</span></td>
                <td>Core</td>
                <td>-</td>
                <td><a href="/awards/nominate" target="_blank" rel="noreferrer"><ExternalLink size={16} /> Open</a></td>
                <td>
                  <div className="export-button-row">
                    <button className="admin-secondary-button" type="button" onClick={() => onNavigate("dashboard")}><ClipboardList size={16} /> Manage</button>
                  </div>
                </td>
              </tr>
              {/* Dynamic Forms */}
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
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const renderTemplates = () => (
    <section className="super-role-grid">
      {templates.map((template) => (
        <article key={template.id}>
          <Layers3 size={20} />
          <strong>{template.title}</strong>
          <span className="admin-muted">{template.category || "Template"}</span>
          <p>{template.description}</p>
        </article>
      ))}
      {!templates.length && <article><strong>No templates yet</strong><p className="admin-muted">Templates are database-driven and can be seeded or added through the CMS API.</p></article>}
    </section>
  );

  const renderAnalytics = () => {
    const summary = analyticsData?.summary || {};
    const conversionRate = Number(summary.views || 0) ? Math.round((Number(summary.submissions || 0) / Number(summary.views || 1)) * 100) : 0;
    
    return (
      <>
        <section className="ops-kpi-grid">
          {[["Forms", summary.forms || 0], ["Views", summary.views || 0], ["Submissions", summary.submissions || 0], ["Conversion", `${conversionRate}%`], ["Approval", `${Math.round(summary.approvalRate || 0)}%`]].map(([label, value]) => <article key={label}><BarChart3 size={20} /><strong>{value}</strong><span>{label}</span></article>)}
        </section>

        <section className="settings-form-grid">
          <div className="admin-panel">
            <h2>Submissions by day</h2>
            <div className="speaker-table-wrap">
              <table className="speaker-table"><thead><tr><th>Date</th><th>Total</th></tr></thead><tbody>{(analyticsData?.byDay || []).map((row) => <tr key={row.label}><td>{row.label}</td><td>{row.total}</td></tr>)}</tbody></table>
            </div>
          </div>
          <div className="admin-panel">
            <h2>Most active forms</h2>
            <div className="speaker-table-wrap">
              <table className="speaker-table"><thead><tr><th>Form</th><th>Views</th><th>Submissions</th></tr></thead><tbody>{(analyticsData?.activeForms || []).map((row) => <tr key={row.id}><td><strong>{row.title}</strong><br /><span className="admin-muted">{row.slug}</span></td><td>{row.view_count}</td><td>{row.submissions}</td></tr>)}</tbody></table>
            </div>
          </div>
        </section>
      </>
    );
  };

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Forms Hub</p>
            <h1>Forms & Applications Engine</h1>
            <p className="admin-muted">Create unlimited applications, surveys, feedback forms, registrations and nominations without code.</p>
          </div>
          <div className="export-button-row">
            <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
            <button className="admin-primary-button" type="button" onClick={() => onNavigate("forms-create")}><Plus size={18} /> New form</button>
          </div>
        </div>
        
        <div className="admin-tabs" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
          <button 
            type="button" 
            className={`admin-tab ${activeTab === 'forms' ? 'active' : ''}`}
            onClick={() => setActiveTab('forms')}
            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'forms' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'forms' ? '#3b82f6' : '#64748b', fontWeight: activeTab === 'forms' ? '600' : '400', cursor: 'pointer' }}
          >
            All Forms
          </button>
          <button 
            type="button" 
            className={`admin-tab ${activeTab === 'templates' ? 'active' : ''}`}
            onClick={() => setActiveTab('templates')}
            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'templates' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'templates' ? '#3b82f6' : '#64748b', fontWeight: activeTab === 'templates' ? '600' : '400', cursor: 'pointer' }}
          >
            Form Templates
          </button>
          <button 
            type="button" 
            className={`admin-tab ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'analytics' ? '#3b82f6' : '#64748b', fontWeight: activeTab === 'analytics' ? '600' : '400', cursor: 'pointer' }}
          >
            Analytics
          </button>
        </div>
        
        {error && <div className="admin-error">{error}</div>}
      </section>

      {activeTab === 'forms' && renderForms()}
      {activeTab === 'templates' && renderTemplates()}
      {activeTab === 'analytics' && renderAnalytics()}
      
    </div>
  );
}

export default Forms;
