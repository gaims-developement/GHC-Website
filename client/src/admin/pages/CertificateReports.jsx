import { BadgeCheck, ChartColumn, Download, GraduationCap, Mail, QrCode } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function CertificateReports({ api }) {
  const [reports, setReports] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await api.get("/api/certificates/reports");
      setReports(response.data || {});
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load certificate reports.");
    }
  }, [api]);

  useEffect(() => { queueMicrotask(load); }, [load]);

  return (
    <div className="admin-speakers-page cert-page">
      <section className="admin-panel">
        <p className="admin-eyebrow">Certificate Analytics</p>
        <h1>Certificate Reports</h1>
        <p className="admin-muted">Monitor category output, department generation, verification requests, downloads, email and CME credits.</p>
      </section>
      {error && <div className="admin-error">{error}</div>}
      <section className="sponsor-report-grid">
        <Chart title="Certificates by Category" rows={reports.byCategory || []} icon={BadgeCheck} />
        <Chart title="Certificates by Department" rows={reports.byDepartment || []} icon={ChartColumn} />
        <Chart title="Verification Requests" rows={reports.verifications || []} icon={QrCode} />
        <Chart title="Downloads" rows={reports.downloads || []} icon={Download} />
        <Chart title="Email Status" rows={reports.email || []} icon={Mail} />
        <Chart title="Credits Awarded" rows={reports.credits || []} icon={GraduationCap} />
      </section>
    </div>
  );
}

function Chart({ title, rows, icon: Icon }) {
  const max = Math.max(...rows.map((row) => Number(row.total || 0)), 1);
  return (
    <article className="admin-panel sponsor-chart">
      <h2><Icon size={18} /> {title}</h2>
      <div className="sponsor-chart-bars">
        {rows.map((row) => {
          const value = Number(row.total || 0);
          return <div className="sponsor-chart-row" key={`${row.label}-${value}`}><span>{row.label || "Unassigned"}</span><i><b style={{ width: `${Math.max((value / max) * 100, 4)}%` }} /></i><strong>{value.toLocaleString("en-IN")}</strong></div>;
        })}
        {!rows.length && <p className="admin-muted">No data yet.</p>}
      </div>
    </article>
  );
}

export default CertificateReports;
