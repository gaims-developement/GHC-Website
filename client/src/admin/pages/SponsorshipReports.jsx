import { BarChart3, CircleDollarSign, ListChecks, Store } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

function SponsorshipReports({ api }) {
  const [reports, setReports] = useState({ byStatus: [], revenueByTier: [], trends: [], deliverables: [], occupancy: [] });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/sponsorship/reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load sponsorship reports.");
    }
  }, [api]);

  useEffect(() => {
    queueMicrotask(load);
  }, [load]);

  const totalRevenue = useMemo(() => reports.revenueByTier?.reduce((sum, item) => sum + Number(item.contractValue || 0), 0) || 0, [reports.revenueByTier]);
  const received = useMemo(() => reports.revenueByTier?.reduce((sum, item) => sum + Number(item.received || 0), 0) || 0, [reports.revenueByTier]);
  const totalDeliverables = useMemo(() => reports.deliverables?.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0, [reports.deliverables]);
  const occupiedStalls = useMemo(() => reports.occupancy?.filter((item) => item.status !== "available").reduce((sum, item) => sum + Number(item.total || 0), 0) || 0, [reports.occupancy]);

  return (
    <div className="admin-speakers-page sponsor-workspace">
      <section className="admin-panel">
        <div className="speaker-page-top">
          <div>
            <p className="admin-eyebrow">Sponsorship Analytics</p>
            <h1>Sponsorship Reports</h1>
            <p className="admin-muted">Analyze pipeline conversion, revenue trends, deliverables and exhibition occupancy.</p>
          </div>
        </div>
      </section>

      {error && <div className="admin-error">{error}</div>}

      <section className="admin-kpi-grid">
        <article className="admin-kpi-card"><CircleDollarSign size={20} /><strong>{money(totalRevenue)}</strong><span>Contracted Revenue</span></article>
        <article className="admin-kpi-card"><CircleDollarSign size={20} /><strong>{money(received)}</strong><span>Received Revenue</span></article>
        <article className="admin-kpi-card"><ListChecks size={20} /><strong>{totalDeliverables}</strong><span>Deliverables</span></article>
        <article className="admin-kpi-card"><Store size={20} /><strong>{occupiedStalls}</strong><span>Allocated Stalls</span></article>
      </section>

      <section className="sponsor-report-grid">
        <Chart title="Pipeline by Status" rows={reports.byStatus || []} labelKey="status" valueKey="total" icon={BarChart3} />
        <Chart title="Revenue by Tier" rows={reports.revenueByTier || []} labelKey="tier" valueKey="contractValue" format={money} icon={CircleDollarSign} />
        <Chart title="Monthly Sponsor Growth" rows={reports.trends || []} labelKey="month" valueKey="sponsors" icon={BarChart3} />
        <Chart title="Revenue Trend" rows={reports.trends || []} labelKey="month" valueKey="revenue" format={money} icon={CircleDollarSign} />
        <Chart title="Deliverable Status" rows={reports.deliverables || []} labelKey="status" valueKey="total" icon={ListChecks} />
        <Chart title="Stall Occupancy" rows={reports.occupancy || []} labelKey="status" valueKey="total" icon={Store} />
      </section>
    </div>
  );
}

function Chart({ title, rows, labelKey, valueKey, format = (value) => value, icon: Icon }) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1);
  return (
    <article className="admin-panel sponsor-chart">
      <h2><Icon size={18} /> {title}</h2>
      <div className="sponsor-chart-bars">
        {rows.map((row) => {
          const value = Number(row[valueKey] || 0);
          return (
            <div className="sponsor-chart-row" key={`${row[labelKey]}-${value}`}>
              <span>{String(row[labelKey] || "Unassigned").replaceAll("_", " ")}</span>
              <i><b style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></i>
              <strong>{format(value)}</strong>
            </div>
          );
        })}
        {!rows.length && <p className="admin-muted">No data yet.</p>}
      </div>
    </article>
  );
}

export default SponsorshipReports;
