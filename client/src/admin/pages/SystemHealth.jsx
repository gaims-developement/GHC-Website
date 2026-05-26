import { Activity, Archive, Cpu, Database, HardDrive, Mail, Server, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const statusClass = (value) => String(value).includes("ok") || String(value).includes("configured") ? "paid" : "pending";

function SystemHealth({ api }) {
  const [health, setHealth] = useState(null);

  const load = useCallback(() => {
    api.get("/api/system/health").then((response) => setHealth(response.data)).catch(() => {});
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = [
    { label: "DB status", value: health?.db || "checking", icon: Database },
    { label: "API status", value: health?.api || "checking", icon: Server },
    { label: "Payment status", value: health?.payment || "checking", icon: ShieldCheck },
    { label: "SMTP status", value: health?.smtp || "checking", icon: Mail },
    { label: "Storage", value: health?.storage || "checking", icon: HardDrive },
    { label: "Memory", value: health ? `${health.memory.usedMb} MB` : "checking", icon: Activity },
    { label: "CPU", value: health ? `${health.cpu.cores} cores` : "checking", icon: Cpu },
  ];

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Monitoring</p>
            <h1>System Health</h1>
            <p className="admin-muted">Production readiness checks for API, database, payments, SMTP, storage and server resources.</p>
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
