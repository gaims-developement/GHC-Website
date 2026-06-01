import { Bell, FileText, Image, Megaphone, Newspaper, Share2, UploadCloud, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function Marketing({ api, onNavigate }) {
  const [dashboard, setDashboard] = useState({ metrics: {}, latestAnnouncements: [], recentUploads: [] });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/marketing/dashboard");
      setDashboard(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load marketing dashboard.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const metrics = dashboard.metrics || {};
  const cards = [
    ["Active Campaigns", metrics.activeCampaigns || 0, Share2, "campaigns"],
    ["Published Articles", metrics.publishedArticles || 0, Newspaper, "news"],
    ["Pending Content", metrics.pendingContent || 0, FileText, "announcements"],
    ["Scheduled Posts", metrics.scheduledPosts || 0, Megaphone, "campaigns"],
    ["Media Partners", metrics.mediaPartners || 0, Users, "media-partners"],
    ["Recent Uploads", dashboard.recentUploads?.length || 0, UploadCloud, "media-library"],
  ];

  return (
    <div className="admin-speakers-page marketing-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Marketing CMS</p>
        <h1>Marketing & Media Dashboard</h1>
        <p className="admin-muted">Manage public website content, campaigns, gallery media, SEO and publishing workflows.</p>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-kpi-grid">
        {cards.map(([label, value, Icon, page]) => (
          <button className="admin-kpi-card marketing-kpi-button" key={label} onClick={() => onNavigate(page)}>
            <Icon size={20} />
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <section className="payment-card-grid">
        <article className="admin-panel">
          <h2><Bell size={18} /> Latest Announcements</h2>
          <div className="activity-feed">
            {(dashboard.latestAnnouncements || []).map((item) => (
              <div key={item.id}><strong>{item.title}</strong><span>{item.status} · {item.publish_date ? new Date(item.publish_date).toLocaleDateString() : "Unscheduled"}</span></div>
            ))}
            {!dashboard.latestAnnouncements?.length && <p className="admin-muted">No announcements yet.</p>}
          </div>
        </article>
        <article className="admin-panel">
          <h2><Image size={18} /> Recent Uploads</h2>
          <div className="activity-feed">
            {(dashboard.recentUploads || []).map((item) => (
              <div key={item.id}><strong>{item.original_name || "Media asset"}</strong><span>{item.resource_type} · {new Date(item.created_at).toLocaleDateString()}</span></div>
            ))}
            {!dashboard.recentUploads?.length && <p className="admin-muted">No uploads yet.</p>}
          </div>
        </article>
      </section>
    </div>
  );
}

export default Marketing;
