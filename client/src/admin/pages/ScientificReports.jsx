import { lazy, Suspense, useEffect, useState } from "react";

const LazyChart = lazy(() => Promise.resolve({ default: ChartCard }));

function ChartCard({ title, data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  return <article className="ops-chart-card"><h3>{title}</h3><div className="ops-chart-body">{data.map((item) => <div className="ops-chart-row" key={`${title}-${item.label}`}><span>{item.label}</span><div><i style={{ width: `${Math.max((Number(item.value || 0) / max) * 100, 4)}%` }} /></div><strong>{item.value}</strong></div>)}{!data.length && <p className="admin-muted">No data yet</p>}</div></article>;
}

function ScientificReports({ api }) {
  const [charts, setCharts] = useState({});
  useEffect(() => { api.get("/api/research/reports").then((response) => setCharts(response.data.charts || {})).catch(() => {}); }, [api]);
  return (
    <div className="admin-speakers-page">
      <section className="admin-panel"><p className="admin-eyebrow">Scientific Reports</p><h1>Analytics</h1><p className="admin-muted">Submissions, reviewer performance, institutions, awards and acceptance rates.</p></section>
      <Suspense fallback={<div className="admin-panel">Loading charts...</div>}>
        <section className="ops-chart-grid">
          {Object.entries(charts).map(([key, data]) => <LazyChart key={key} title={key.replace(/([A-Z])/g, " $1")} data={data} />)}
        </section>
      </Suspense>
    </div>
  );
}

export default ScientificReports;
