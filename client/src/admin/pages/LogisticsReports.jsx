import { BarChart3, Bus, Hotel, PackageCheck, Users, BriefcaseBusiness } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function LogisticsReports({ api }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/logistics/reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load logistics reports.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  return (
    <div className="admin-speakers-page logistics-workspace">
      <section className="admin-panel">
        <p className="admin-eyebrow">Logistics Analytics</p>
        <h1>Logistics Reports</h1>
        <p className="admin-muted">Monitor accommodation, transport, vendors, inventory, volunteer coverage and hall utilization.</p>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="sponsor-report-grid">
        <Chart title="Accommodation Occupancy" rows={reports.accommodation || []} labelKey="label" valueKey="used" totalKey="total" icon={Hotel} />
        <Chart title="Transport Utilization" rows={reports.transport || []} labelKey="label" valueKey="used" totalKey="total" icon={Bus} />
        <Chart title="Vendor Contracts" rows={reports.vendors || []} labelKey="label" valueKey="value" icon={BriefcaseBusiness} />
        <Chart title="Inventory Usage" rows={reports.inventory || []} labelKey="label" valueKey="used" totalKey="total" icon={PackageCheck} />
        <Chart title="Volunteer Coverage" rows={reports.volunteers || []} labelKey="label" valueKey="total" icon={Users} />
        <Chart title="Hall Utilization" rows={reports.halls || []} labelKey="label" valueKey="total" icon={BarChart3} />
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

export default LogisticsReports;
