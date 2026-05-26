import { Award, Banknote, FileText, Gauge, QrCode, Smartphone, TicketCheck, Users, Wrench } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

const LazyChart = lazy(() => Promise.resolve({ default: ChartCard }));

const fallbackKpis = {
  totalDelegates: 0,
  revenue: 0,
  workshopsFilled: 0,
  attendancePercent: 0,
  researchSubmissions: 0,
  certificatesIssued: 0,
};

const emptyCharts = {
  registrationsOverTime: [],
  revenueTrend: [],
  ticketDistribution: [],
  workshopOccupancy: [],
  attendanceHeatmap: [],
  deviceSplit: [],
};

function ChartCard({ title, data, type = "bar" }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <article className={`ops-chart-card ${type}`}>
      <h3>{title}</h3>
      <div className="ops-chart-body">
        {data.map((item) => (
          <div className="ops-chart-row" key={`${title}-${item.label}`}>
            <span>{item.label}</span>
            <div><i style={{ width: `${Math.max((Number(item.value || 0) / max) * 100, 4)}%` }} /></div>
            <strong>{item.value}</strong>
          </div>
        ))}
        {!data.length && <p className="admin-muted">No data yet</p>}
      </div>
    </article>
  );
}

function Analytics({ api }) {
  const [kpis, setKpis] = useState(fallbackKpis);
  const [charts, setCharts] = useState(emptyCharts);

  useEffect(() => {
    api.get("/api/analytics").then((response) => {
      setKpis(response.data.kpis || fallbackKpis);
      setCharts(response.data.charts || emptyCharts);
    }).catch(() => {});
  }, [api]);

  const kpiCards = useMemo(() => [
    { label: "Total delegates", value: kpis.totalDelegates, icon: Users },
    { label: "Revenue", value: `INR ${Number(kpis.revenue || 0).toLocaleString("en-IN")}`, icon: Banknote },
    { label: "Workshops filled", value: `${kpis.workshopsFilled || 0}%`, icon: Wrench },
    { label: "Attendance", value: `${kpis.attendancePercent || 0}%`, icon: TicketCheck },
    { label: "Research submissions", value: kpis.researchSubmissions, icon: FileText },
    { label: "Certificates issued", value: kpis.certificatesIssued, icon: Award },
  ], [kpis]);

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Analytics</p>
        <h1>Conference Command Center</h1>
        <p className="admin-muted">Live delegate, revenue, attendance, research and certificate signals for GHC operations.</p>
      </section>

      <section className="ops-kpi-grid">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label}>
              <Icon size={20} />
              <strong>{card.value}</strong>
              <span>{card.label}</span>
            </article>
          );
        })}
      </section>

      <Suspense fallback={<div className="admin-panel">Loading charts...</div>}>
        <section className="ops-chart-grid">
          <LazyChart title="Registrations over time" data={charts.registrationsOverTime} />
          <LazyChart title="Revenue trend" data={charts.revenueTrend} />
          <LazyChart title="Ticket distribution" data={charts.ticketDistribution} />
          <LazyChart title="Workshop occupancy" data={charts.workshopOccupancy} />
          <LazyChart title="Attendance heatmap" data={charts.attendanceHeatmap} type="heatmap" />
          <LazyChart title="Device split" data={charts.deviceSplit} type="device" />
        </section>
      </Suspense>

      <section className="ops-mobile-control">
        <button><Gauge size={18} /> Refresh</button>
        <button><QrCode size={18} /> Check-in</button>
        <button><Smartphone size={18} /> Mobile</button>
      </section>
    </div>
  );
}

export default Analytics;
