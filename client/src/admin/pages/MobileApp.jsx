import { BellRing, RefreshCw, Smartphone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function MobileApp({ api, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setError("");
    api.get("/api/mobile-admin/dashboard")
      .then((response) => setData(response.data))
      .catch((requestError) => setError(requestError.response?.data?.message || "Unable to load mobile dashboard."));
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
            <p className="admin-eyebrow">Mobile App</p>
            <h1>Attendee Experience Backend</h1>
            <p className="admin-muted">Secure APIs for agenda, speakers, workshops, QR check-in, notifications, certificates, resources and venue data.</p>
          </div>
          <div className="export-button-row">
            <button className="admin-secondary-button" type="button" onClick={load}><RefreshCw size={18} /> Refresh</button>
            <button className="admin-primary-button" type="button" onClick={() => onNavigate("mobile-notifications")}><BellRing size={18} /> Send notification</button>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
      </section>

      <section className="ops-kpi-grid">
        {[
          ["Total mobile users", metrics.totalMobileUsers || 0],
          ["Daily active users", metrics.dailyActiveUsers || 0],
          ["Push sent", metrics.pushNotificationsSent || 0],
          ["Engagement rate", `${metrics.engagementRate || 0}%`],
        ].map(([label, value]) => <article key={label}><Smartphone size={20} /><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <section className="settings-form-grid">
        <div className="admin-panel">
          <h2>Most viewed sessions</h2>
          <div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Session</th><th>Views</th></tr></thead><tbody>{(data?.mostViewedSessions || []).map((row) => <tr key={row.title || "unknown"}><td>{row.title || "Unknown"}</td><td>{row.total}</td></tr>)}</tbody></table></div>
        </div>
        <div className="admin-panel">
          <h2>Most saved sessions</h2>
          <div className="speaker-table-wrap"><table className="speaker-table"><thead><tr><th>Session</th><th>Saves</th></tr></thead><tbody>{(data?.mostSavedSessions || []).map((row) => <tr key={row.title || "unknown"}><td>{row.title || "Unknown"}</td><td>{row.total}</td></tr>)}</tbody></table></div>
        </div>
      </section>
    </div>
  );
}

export default MobileApp;
