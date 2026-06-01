import { Download, FileSpreadsheet } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

const LazyChart = lazy(() => Promise.resolve({ default: ChartCard }));

function ChartCard({ title, data = [] }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);
  return (
    <article className="ops-chart-card">
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

function RegistrationReports({ api }) {
  const [charts, setCharts] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);

  useEffect(() => {
    api.get("/api/register/reports").then((response) => {
      setCharts(response.data.charts || {});
      setPaymentMethods(response.data.paymentMethods || []);
    }).catch(() => {});
  }, [api]);

  return (
    <div className="admin-speakers-page ops-page">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-eyebrow">Registration Reports</p>
            <h1>Analytics & Exports</h1>
            <p className="admin-muted">Revenue, attendance, geography, category and institution reports for 10,000+ registrations.</p>
          </div>
          <div className="export-button-row">
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/register/export.csv`}><Download size={18} /> CSV</a>
            <a className="admin-primary-button" href={`${api.defaults.baseURL}/api/register/export.xls`}><FileSpreadsheet size={18} /> Excel</a>
          </div>
        </div>
      </section>
      <section className="admin-panel">
        <p className="admin-eyebrow">Payment Methods</p>
        <div className="admin-role-pills">
          {paymentMethods.map((method) => <span key={method.id}>{method.name}</span>)}
        </div>
      </section>
      <Suspense fallback={<div className="admin-panel">Loading charts...</div>}>
        <section className="ops-chart-grid">
          <LazyChart title="Registrations by Day" data={charts.registrationsByDay} />
          <LazyChart title="Revenue by Day" data={charts.revenueByDay} />
          <LazyChart title="Registrations by Category" data={charts.registrationsByCategory} />
          <LazyChart title="Institution Distribution" data={charts.institutionDistribution} />
          <LazyChart title="State Distribution" data={charts.stateDistribution} />
          <LazyChart title="Country Distribution" data={charts.countryDistribution} />
          <LazyChart title="Attendance Rate" data={charts.attendanceRate} />
        </section>
      </Suspense>
    </div>
  );
}

export default RegistrationReports;
