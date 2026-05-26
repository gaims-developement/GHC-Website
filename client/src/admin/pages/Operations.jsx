import { Bell, ClipboardList, Clock3, FileCheck2, QrCode, RefreshCcw, ShieldCheck, TicketCheck, Users, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function Operations({ api, user }) {
  const [analytics, setAnalytics] = useState({ kpis: {} });
  const [checkin, setCheckin] = useState({ stats: {}, logs: [] });
  const [payments, setPayments] = useState({ payments: [], stats: {} });
  const [registrations, setRegistrations] = useState([]);

  const load = useCallback(() => {
    api.get("/api/analytics").then((response) => setAnalytics(response.data)).catch(() => {});
    api.get("/api/checkin").then((response) => setCheckin(response.data)).catch(() => {});
    api.get("/api/payments").then((response) => setPayments(response.data)).catch(() => {});
    api.get("/api/register?limit=8&offset=0").then((response) => setRegistrations(response.data.registrations || [])).catch(() => {});
  }, [api]);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const widgets = [
    { label: "Delegates checked in", value: checkin.stats?.checkedIn || 0, icon: TicketCheck },
    { label: "Pending arrivals", value: checkin.stats?.pendingArrivals || 0, icon: Clock3 },
    { label: "Workshop occupancy", value: `${analytics.kpis?.workshopsFilled || 0}%`, icon: Wrench },
    { label: "Certificates pending", value: analytics.kpis?.certificatesPending || 0, icon: FileCheck2 },
    { label: "Payments pending", value: analytics.kpis?.paymentsPending || payments.stats?.pending || 0, icon: Bell },
  ];

  const volunteerTools = [
    { label: "QR scan only", icon: QrCode },
    { label: "Attendance", icon: ClipboardList },
    { label: "View schedules", icon: Wrench },
    { label: "No financial access", icon: ShieldCheck },
  ];

  return (
    <div className="admin-speakers-page ops-page operations-page">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Operations</p>
            <h1>Live Dashboard</h1>
            <p className="admin-muted">One-hand command center for registration desk, check-in, volunteers, certificates and arrivals.</p>
          </div>
          <button className="admin-primary-button" onClick={load}><RefreshCcw size={18} /> Refresh</button>
        </div>
      </section>

      <section className="ops-kpi-grid">
        {widgets.map((widget) => {
          const Icon = widget.icon;
          return (
            <article key={widget.label}>
              <Icon size={20} />
              <strong>{widget.value}</strong>
              <span>{widget.label}</span>
            </article>
          );
        })}
      </section>

      <section className="ops-command-grid">
        <article className="admin-panel">
          <p className="admin-eyebrow">Recent registrations</p>
          <div className="ops-list">
            {registrations.map((registration) => (
              <div key={registration.id}>
                <strong>{registration.fullName}</strong>
                <span>{registration.registrationId} · {registration.ticketName}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-panel">
          <p className="admin-eyebrow">Volunteer control</p>
          <h2>{user.role}</h2>
          <div className="ops-tool-grid">
            {volunteerTools.map((tool) => {
              const Icon = tool.icon;
              return <span key={tool.label}><Icon size={17} /> {tool.label}</span>;
            })}
          </div>
        </article>

        <article className="admin-panel">
          <p className="admin-eyebrow">Admin alerts</p>
          <div className="ops-list">
            <div><strong>Payments</strong><span>{analytics.kpis?.paymentsPending || 0} pending payment states</span></div>
            <div><strong>Certificates</strong><span>{analytics.kpis?.certificatesPending || 0} certificates pending issue</span></div>
            <div><strong>Check-in</strong><span>{checkin.stats?.pendingArrivals || 0} arrivals still pending</span></div>
          </div>
        </article>
      </section>

      <nav className="volunteer-action-bar">
        <button><QrCode size={18} /> Scan</button>
        <button><Users size={18} /> Arrivals</button>
      </nav>
    </div>
  );
}

export default Operations;
