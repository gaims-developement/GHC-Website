import { Award, ClipboardCheck, FileText, Presentation, UserCheck } from "lucide-react";
import { useEffect, useState } from "react";

function Scientific({ api }) {
  const [data, setData] = useState({ stats: {}, recentActivity: [] });
  const [settings, setSettings] = useState({ reviewMode: "double_blind", maxAuthors: 6, maxFileSize: 10, allowedFileTypes: "pdf", guidelines: "", templateUrl: "", submissionStartDate: "", submissionEndDate: "" });

  useEffect(() => {
    api.get("/api/research/stats").then((response) => setData(response.data)).catch(() => {});
    api.get("/api/research/settings").then((response) => setSettings((current) => ({ ...current, ...(response.data.settings || {}) }))).catch(() => {});
  }, [api]);

  const saveSettings = async (event) => {
    event.preventDefault();
    await api.put("/api/research/settings", settings);
  };

  const stats = data.stats || {};
  const cards = [
    ["Total Abstracts", stats.total, FileText],
    ["Pending Reviews", stats.underReview, ClipboardCheck],
    ["Accepted Abstracts", stats.accepted, Award],
    ["Rejected Abstracts", stats.rejected, FileText],
    ["Poster Presentations", stats.posterPresentations, Presentation],
    ["Oral Presentations", stats.oralPresentations, Presentation],
    ["Assigned Reviewers", stats.assignedReviewers, UserCheck],
    ["Scientific Sessions", stats.upcomingScientificSessions, Presentation],
  ];

  return (
    <div className="admin-speakers-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Scientific Committee</p>
        <h1>Scientific Dashboard</h1>
        <p className="admin-muted">Abstracts, reviewers, presentations, posters, awards and scientific program control.</p>
      </section>
      <section className="admin-kpi-grid">
        {cards.map(([label, value, Icon]) => <article className="admin-kpi-card" key={label}><Icon size={20} /><strong>{value || 0}</strong><span>{label}</span></article>)}
      </section>
      <section className="admin-panel">
        <p className="admin-eyebrow">Recent Activity</p>
        <div className="admin-activity-list">
          {(data.recentActivity || []).map((item) => <div key={item.id}><strong>{item.action}</strong><span>{item.timestamp}</span></div>)}
        </div>
      </section>
      <section className="admin-panel">
        <p className="admin-eyebrow">Submission Settings</p>
        <form className="super-form-grid" onSubmit={saveSettings}>
          <label>Start Date<input type="date" value={settings.submissionStartDate || ""} onChange={(event) => setSettings({ ...settings, submissionStartDate: event.target.value })} /></label>
          <label>End Date<input type="date" value={settings.submissionEndDate || ""} onChange={(event) => setSettings({ ...settings, submissionEndDate: event.target.value })} /></label>
          <label>Maximum Authors<input type="number" value={settings.maxAuthors || 0} onChange={(event) => setSettings({ ...settings, maxAuthors: event.target.value })} /></label>
          <label>Max File Size MB<input type="number" value={settings.maxFileSize || 0} onChange={(event) => setSettings({ ...settings, maxFileSize: event.target.value })} /></label>
          <label>Allowed File Types<input value={settings.allowedFileTypes || ""} onChange={(event) => setSettings({ ...settings, allowedFileTypes: event.target.value })} /></label>
          <label>Review Mode<select value={settings.reviewMode || "double_blind"} onChange={(event) => setSettings({ ...settings, reviewMode: event.target.value })}><option value="double_blind">Double-Blind</option><option value="single_blind">Single-Blind</option><option value="open">Open</option></select></label>
          <label>Abstract Template<input value={settings.templateUrl || ""} onChange={(event) => setSettings({ ...settings, templateUrl: event.target.value })} /></label>
          <label>Guidelines<textarea value={settings.guidelines || ""} onChange={(event) => setSettings({ ...settings, guidelines: event.target.value })} /></label>
          <button className="admin-primary-button" type="submit">Save Settings</button>
        </form>
      </section>
    </div>
  );
}

export default Scientific;
