import { BarChart3, CreditCard, FileCheck2, Star, Ticket, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function EventReports({ api }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/event-reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load event reports.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return (
    <div className="admin-speakers-page event-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Event Analytics</p>
        <h1>Event Reports</h1>
        <p className="admin-muted">Track registrations, revenue, attendance, certificate completion and feedback scores.</p>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="sponsor-report-grid">
        <Chart title="Registrations Per Event" rows={reports.registrations || []} labelKey="title" valueKey="total" icon={Ticket} />
        <Chart title="Revenue Per Event" rows={reports.revenue || []} labelKey="title" valueKey="total" icon={CreditCard} format={money} />
        <Chart title="Attendance Rate" rows={(reports.attendance || []).map((item) => ({ ...item, rate: item.registered ? Math.round((Number(item.checkedIn || 0) / Number(item.registered || 1)) * 100) : 0 }))} labelKey="title" valueKey="rate" icon={Users} suffix="%" />
        <Chart title="Certificates Generated" rows={reports.certificates || []} labelKey="title" valueKey="total" icon={FileCheck2} />
        <Chart title="Feedback Scores" rows={reports.feedback || []} labelKey="title" valueKey="rating" icon={Star} />
        <Chart title="Most Popular Events" rows={reports.popular || []} labelKey="title" valueKey="registeredCount" icon={BarChart3} />
      </section>
    </div>
  );
}

function Chart({ title, rows, labelKey, valueKey, icon: Icon, format = (value) => value, suffix = "" }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <article className="admin-panel sponsor-chart">
      <h2><Icon size={18} /> {title}</h2>
      <div className="sponsor-chart-bars">
        {rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          return <div className="sponsor-chart-row" key={`${row[labelKey]}-${value}`}><span>{row[labelKey] || "Untitled"}</span><i><b style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></i><strong>{format(value)}{suffix}</strong></div>;
        })}
        {!rows.length && <p className="admin-muted">No data yet.</p>}
      </div>
    </article>
  );
}

export default EventReports;
