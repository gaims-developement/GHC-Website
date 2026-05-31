import { Activity, Archive, Clock, Database, Server } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusClass = (value) => ["healthy", "connected", "production"].includes(String(value).toLowerCase()) ? "paid" : "pending";

function SystemHealth({ api }) {
  const [health, setHealth] = useState(null);

  const load = useCallback(() => {
    api.get("/api/system/health").then((response) => setHealth(response.data)).catch((error) => setHealth(error.response?.data || null));
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: "API status", value: health?.status || "checking", icon: Server },
    { label: "DB status", value: health?.database || "checking", icon: Database },
    { label: "Environment", value: health?.environment || "checking", icon: Activity },
    { label: "Uptime", value: health?.uptime || "checking", icon: Clock },
  ];

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Monitoring</p>
            <h1>System Health</h1>
            <p className="admin-muted">Lightweight uptime monitor for API availability and database connectivity.</p>
          </div>
          <button className="admin-primary-button" onClick={load}>Refresh</button>
        </div>
      </section>

      <section className="ops-kpi-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label}>
              <Icon size={20} />
              <strong className={`status-pill ${statusClass(card.value)}`}>{card.value}</strong>
              <span>{card.label}</span>
            </article>
          );
        })}
      </section>

      <section className="admin-panel">
        <p className="admin-eyebrow">Backups</p>
        <h2>Export tools</h2>
        <div className="export-button-row">
          <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/system/backup.sql`}><Archive size={18} /> SQL</a>
          <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/system/backup.csv`}><Archive size={18} /> CSV</a>
          <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/register/export.xls`}><Archive size={18} /> Excel</a>
        </div>
      </section>
    </div>
  );
}

export default SystemHealth;
