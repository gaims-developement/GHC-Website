import { BarChart3, CalendarClock, ListChecks, Star, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function VolunteerReports({ api }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/volunteer-reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load volunteer reports.");
    }
  }, [api]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  return (
    <div className="admin-speakers-page volunteer-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Volunteer Analytics</p>
        <h1>Volunteer Reports</h1>
        <p className="admin-muted">Track department coverage, attendance trends, performance, shift capacity and volunteer hours.</p>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="sponsor-report-grid">
        <Chart title="Volunteers Per Department" rows={reports.departments || []} labelKey="label" valueKey="total" icon={Users} />
        <Chart title="Attendance Trends" rows={reports.attendance || []} labelKey="label" valueKey="total" icon={CalendarClock} />
        <Chart title="Top Performers" rows={reports.topPerformers || []} labelKey="label" valueKey="total" icon={Star} />
        <Chart title="Shift Coverage" rows={reports.coverage || []} labelKey="label" valueKey="assigned" totalKey="total" icon={BarChart3} />
        <Chart title="Volunteer Hours" rows={reports.hours || []} labelKey="label" valueKey="total" icon={CalendarClock} />
        <Chart title="Department Workload" rows={reports.workload || []} labelKey="label" valueKey="total" icon={ListChecks} />
      </section>
    </div>
  );
}

function Chart({ title, rows, labelKey, valueKey, totalKey, icon: Icon }) {
  const max = Math.max(...rows.map((row) => Number(totalKey ? row[totalKey] || row[valueKey] : row[valueKey] || 0)), 1);
  return (
    <article className="admin-panel sponsor-chart">
      <h2><Icon size={18} /> {title}</h2>
      <div className="sponsor-chart-bars">
        {rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          const total = Number(totalKey ? row[totalKey] || 0 : value);
          return <div className="sponsor-chart-row" key={`${row[labelKey]}-${value}`}><span>{row[labelKey] || "Unassigned"}</span><i><b style={{ width: `${Math.max(((totalKey ? value : total) / max) * 100, 4)}%` }} /></i><strong>{totalKey ? `${value}/${total}` : value.toLocaleString("en-IN")}</strong></div>;
        })}
        {!rows.length && <p className="admin-muted">No data yet.</p>}
      </div>
    </article>
  );
}

export default VolunteerReports;
